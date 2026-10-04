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

export function planAssets(files, manifest) {
  const byName = new Map(manifest.files.map((entry) => [entry.url.split("/").pop(), entry]));
  const missing = files.filter((file) => !byName.has(file));
  if (missing.length) throw new Error(`seed: not in the capture manifest: ${missing.join(", ")}`);
  return files.map((file) => {
    const entry = byName.get(file);
    return { file, url: entry.url, sha256: entry.sha256, bytes: entry.bytes };
  });
}

export function verifySha(bytes, expected, file) {
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected)
    throw new Error(`seed: ${file} has sha256 ${actual}, the manifest says ${expected}`);
}

export async function uploadable(file, bytes, sharp) {
  if (!file.toLowerCase().endsWith(".gif")) return { name: file, bytes };
  const jpeg = await sharp(bytes)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 90 })
    .toBuffer();
  return { name: file.replace(/\.gif$/i, ".jpg"), bytes: jpeg };
}

export function assetConflicts(plannedNames, existingNames) {
  const existing = new Set(existingNames);
  return plannedNames.filter((name) => existing.has(name));
}

export function makeLink(created) {
  return (target) => () => {
    const doc = created.get(target);
    if (!doc) throw new Error(`seed: a link points at ${target}, which the seed does not create`);
    return doc;
  };
}
