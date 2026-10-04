import { createHash } from "node:crypto";

export const REPOSITORY = "mantis-landscaping";

export function resolveToken(env) {
  const token = env.PRISMIC_TOKEN_MANTIS_LANDSCAPING || env.MANTIS_LANDSCAPING_PRISMIC;
  if (!token)
    throw new Error(
      "seed: set PRISMIC_TOKEN_MANTIS_LANDSCAPING (or MANTIS_LANDSCAPING_PRISMIC). " +
        "PRISMIC_WRITE_TOKEN is never read: in the cloud environment it belongs to another repository.",
    );
  return token;
}

const RESIZED = /\/w:\d+\//;

export function planAssets(files, manifest) {
  const byName = new Map();
  for (const entry of manifest.files) {
    const name = entry.url.split("/").pop();
    byName.set(name, [...(byName.get(name) ?? []), entry]);
  }
  const missing = files.filter((file) => !byName.has(file));
  if (missing.length) throw new Error(`seed: not in the capture manifest: ${missing.join(", ")}`);
  return files.map((file) => {
    const entries = byName.get(file);
    const originals = entries.filter((entry) => !RESIZED.test(entry.url));
    if (originals.length !== 1)
      throw new Error(
        `seed: ${file} has ${originals.length} original entries in the manifest ` +
          `(${entries.map((entry) => entry.url).join(", ")})`,
      );
    const [entry] = originals;
    return { file, url: entry.url, sha256: entry.sha256, bytes: entry.bytes };
  });
}

export function verifySha(bytes, expected, file) {
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected)
    throw new Error(`seed: ${file} has sha256 ${actual}, the manifest says ${expected}`);
}

export function uploadName(file) {
  return file.replace(/\.gif$/i, ".jpg");
}

export const HEADER_LIMIT = 58268;

export async function uploadable(file, bytes, sharp) {
  if (/\.gif$/i.test(file)) {
    const jpeg = await sharp(bytes)
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 90 })
      .toBuffer();
    return { name: uploadName(file), bytes: jpeg };
  }
  if (!/\.jpe?g$/i.test(file)) throw new Error(`seed: ${file} is neither a JPEG nor a GIF`);
  const stripped = stripXmp(bytes);
  const header = metadataBytes(stripped);
  if (header > HEADER_LIMIT)
    throw new Error(
      `seed: ${file} carries ${header} bytes before its image data; ` +
        `the largest Prismic has been seen to size is ${HEADER_LIMIT}`,
    );
  return { name: file, bytes: stripped };
}

export async function listAssets(getJson) {
  const byName = new Map();
  let cursor = "";
  for (;;) {
    const page = await getJson(`https://asset-api.prismic.io/assets?limit=500${cursor}`);
    for (const item of page.items ?? []) {
      const sized = Boolean(item.width && item.height);
      const entry = { id: item.id, sized };
      const known = byName.get(item.filename);
      if (!known) byName.set(item.filename, { ...entry, all: [entry] });
      else {
        known.all.push(entry);
        if (sized && !known.sized) Object.assign(known, entry);
      }
    }
    if (!page.cursor || !page.items?.length) return byName;
    cursor = `&cursor=${encodeURIComponent(page.cursor)}`;
  }
}

export function splitReused(assets, existing) {
  const reuse = new Map();
  const fetch = [];
  for (const asset of assets) {
    const known = existing.get(uploadName(asset.file));
    if (known?.sized) reuse.set(asset.file, known.id);
    else fetch.push(asset);
  }
  return { reuse, fetch };
}

export function unsized(existing) {
  return [...existing].flatMap(([name, asset]) =>
    (asset.all ?? [asset]).filter((copy) => !copy.sized).map((copy) => ({ name, id: copy.id })),
  );
}

export function modelsUsed(docs) {
  const types = new Set();
  const slices = new Set();
  for (const doc of docs) {
    types.add(doc.type);
    for (const slice of doc.data.slices ?? []) slices.add(slice.slice_type);
  }
  return { types: [...types].sort(), slices: [...slices].sort() };
}

export function missingModels(used, remote) {
  const types = new Set(remote.types.map((model) => model.id));
  const slices = new Set(remote.slices.map((model) => model.id));
  return [
    ...used.types.filter((id) => !types.has(id)).map((id) => `custom type ${id}`),
    ...used.slices.filter((id) => !slices.has(id)).map((id) => `slice ${id}`),
  ];
}

export function makeLink(created) {
  return (target) => () => {
    const doc = created.get(target);
    if (!doc) throw new Error(`seed: a link points at ${target}, which the seed does not create`);
    return doc;
  };
}

const XMP = "http://ns.adobe.com/xap/1.0/\0";
const EXTENDED_XMP = "http://ns.adobe.com/xmp/extension/\0";
const STANDALONE = new Set([0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7]);

function segments(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const out = [];
  let at = 2;
  for (;;) {
    if (at >= bytes.length || bytes[at] !== 0xff) return null;
    let marker = at + 1;
    while (marker < bytes.length && bytes[marker] === 0xff) marker++;
    if (marker >= bytes.length) return null;
    const code = bytes[marker];
    if (code === 0xda) return { segments: out, sos: marker - 1 };
    if (STANDALONE.has(code)) {
      out.push({ start: at, end: marker + 1, code });
      at = marker + 1;
      continue;
    }
    if (marker + 2 >= bytes.length) return null;
    const length = (bytes[marker + 1] << 8) | bytes[marker + 2];
    const end = marker + 1 + length;
    if (length < 2 || end > bytes.length) return null;
    out.push({ start: at, end, code, payload: marker + 3 });
    at = end;
  }
}

export function metadataBytes(bytes) {
  const walk = segments(bytes);
  return walk ? walk.sos : Infinity;
}

export function stripXmp(bytes) {
  const walk = segments(bytes);
  if (!walk) return bytes;
  const kept = [bytes.subarray(0, 2)];
  for (const segment of walk.segments) {
    const head =
      segment.code === 0xe1
        ? Buffer.from(
            bytes.subarray(segment.payload, segment.payload + EXTENDED_XMP.length),
          ).toString("latin1")
        : "";
    if (!head.startsWith(XMP) && !head.startsWith(EXTENDED_XMP))
      kept.push(bytes.subarray(segment.start, segment.end));
  }
  kept.push(bytes.subarray(walk.sos));
  return Buffer.concat(kept);
}

export function readIds(argv) {
  const at = argv.indexOf("--update");
  if (at < 0) return null;
  const file = argv[at + 1];
  if (!file || file.startsWith("--"))
    throw new Error('seed: --update needs a JSON file mapping "type:uid" to document ids');
  return file;
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function send(fetchImpl, url, init, { tries = 4, wait = 1200, sleep = pause } = {}) {
  for (let attempt = 1; ; attempt++) {
    const response = await fetchImpl(url, init);
    if (response.status !== 429 || attempt >= tries) return response;
    const after = Number(response.headers?.get?.("retry-after"));
    await sleep(Number.isFinite(after) && after > 0 ? after * 1000 : wait * attempt);
  }
}

export async function updateRelease({
  docs,
  files,
  alts,
  ids,
  headers,
  fetch: fetchImpl,
  sleep = pause,
  log = () => {},
}) {
  for (const [file, entry] of files) {
    if (entry.id) continue;
    const form = new FormData();
    form.append("file", new Blob([entry.bytes]), entry.name);
    if (alts.get(file)) form.append("alt", alts.get(file));
    const response = await send(
      fetchImpl,
      "https://asset-api.prismic.io/assets",
      { method: "POST", headers, body: form },
      { sleep },
    );
    if (!response.ok) throw new Error(`seed: upload ${entry.name} answered ${response.status}`);
    const created = await response.json();
    if (!created.width || !created.height)
      throw new Error(`seed: Prismic read no dimensions for ${entry.name} (${created.id})`);
    files.set(file, { id: created.id });
    log(`seed: uploaded ${entry.name} ${created.width}x${created.height}`);
    await sleep(1200);
  }
  const img = (file, alt) => ({ id: files.get(file).id, alt: alt ?? null });
  for (const doc of docs(img, makeIdLink(ids))) {
    const id = ids[`${doc.type}:${doc.uid}`];
    if (!id) throw new Error(`seed: no document id for ${doc.type}:${doc.uid}`);
    const response = await send(
      fetchImpl,
      `https://migration.prismic.io/documents/${id}`,
      {
        method: "PUT",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ uid: doc.uid, title: doc.title, data: doc.data }),
      },
      { sleep },
    );
    if (!response.ok)
      throw new Error(
        `seed: update ${doc.uid} answered ${response.status} ${await response.text()}`,
      );
    log(`seed: updated ${doc.type}:${doc.uid}`);
    await sleep(1200);
  }
}

export function makeIdLink(ids) {
  return (target) => {
    const id = ids[target];
    if (!id) throw new Error(`seed: no document id for ${target}`);
    return { link_type: "Document", id };
  };
}
