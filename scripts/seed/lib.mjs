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

export async function uploadable(file, bytes, sharp) {
  if (!/\.gif$/i.test(file)) return { name: file, bytes };
  const jpeg = await sharp(bytes)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90 })
    .toBuffer();
  return { name: uploadName(file), bytes: jpeg };
}

export async function listAssets(getJson) {
  const byName = new Map();
  let cursor = "";
  for (;;) {
    const page = await getJson(`https://asset-api.prismic.io/assets?limit=500${cursor}`);
    for (const item of page.items ?? []) byName.set(item.filename, item.id);
    if (!page.cursor || !page.items?.length) return byName;
    cursor = `&cursor=${encodeURIComponent(page.cursor)}`;
  }
}

export function splitReused(assets, existing) {
  const reuse = new Map();
  const fetch = [];
  for (const asset of assets) {
    const id = existing.get(uploadName(asset.file));
    if (id) reuse.set(asset.file, id);
    else fetch.push(asset);
  }
  return { reuse, fetch };
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
