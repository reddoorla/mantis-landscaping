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

export const HEADER_LIMIT = 60000;

export async function uploadable(file, bytes, sharp) {
  if (/\.gif$/i.test(file)) {
    const jpeg = await sharp(bytes)
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 90 })
      .toBuffer();
    return { name: uploadName(file), bytes: jpeg };
  }
  const stripped = stripXmp(bytes);
  const header = metadataBytes(stripped);
  if (header > HEADER_LIMIT)
    throw new Error(
      `seed: ${file} still carries ${header} bytes of metadata before its image data; ` +
        `Prismic reads no dimensions past about 64 KB`,
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
      if (!byName.has(item.filename) || (sized && !byName.get(item.filename).sized))
        byName.set(item.filename, { id: item.id, sized });
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
  return [...existing]
    .filter(([, asset]) => !asset.sized)
    .map(([name, asset]) => ({ name, id: asset.id }));
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

export function metadataBytes(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 0;
  let at = 2;
  while (at + 4 <= bytes.length && bytes[at] === 0xff && bytes[at + 1] !== 0xda)
    at += 2 + ((bytes[at + 2] << 8) | bytes[at + 3]);
  return at;
}

export function stripXmp(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const kept = [bytes.subarray(0, 2)];
  let at = 2;
  while (at + 4 <= bytes.length && bytes[at] === 0xff && bytes[at + 1] !== 0xda) {
    const end = at + 2 + ((bytes[at + 2] << 8) | bytes[at + 3]);
    const head = Buffer.from(bytes.subarray(at + 4, at + 4 + EXTENDED_XMP.length)).toString(
      "latin1",
    );
    const xmp = bytes[at + 1] === 0xe1 && (head.startsWith(XMP) || head.startsWith(EXTENDED_XMP));
    if (!xmp) kept.push(bytes.subarray(at, end));
    at = end;
  }
  kept.push(bytes.subarray(at));
  return Buffer.concat(kept);
}

export function makeIdLink(ids) {
  return (target) => {
    const id = ids[target];
    if (!id) throw new Error(`seed: no document id for ${target}`);
    return { link_type: "Document", id };
  };
}
