import { readFileSync } from "node:fs";
import * as prismic from "@prismicio/client";
import sharp from "sharp";

import { documents, lang } from "../../src/lib/site-pages.js";
import {
  REPOSITORY,
  assetConflicts,
  makeLink,
  planAssets,
  resolveToken,
  uploadable,
  verifySha,
} from "./lib.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const publish = args.has("--publish");
const allowExisting = args.has("--allow-existing-assets");

const manifest = JSON.parse(readFileSync("matching/spec/capture/manifest.json", "utf8"));

const used = new Map();
const plan = documents((file, alt) => {
  used.set(file, alt);
  return {};
});
const assets = planAssets([...used.keys()], manifest);
const megabytes = (assets.reduce((n, a) => n + a.bytes, 0) / 1e6).toFixed(1);
console.log(
  `seed plan: ${plan.filter((d) => d.type === "page").length} pages, ` +
    `${plan.filter((d) => d.type === "project").length} projects, ` +
    `${assets.length} images (${megabytes} MB) into ${REPOSITORY}`,
);
if (dryRun) process.exit(0);

const writeToken = resolveToken(process.env);
const client = prismic.createWriteClient(REPOSITORY, { writeToken });

if (publish) {
  const result = await client.publishMigrationRelease();
  console.log(`seed: published the migration release (${JSON.stringify(result)})`);
  process.exit(0);
}

const listed = await fetch("https://asset-api.prismic.io/assets?limit=1000", {
  headers: { repository: REPOSITORY, authorization: `Bearer ${writeToken}` },
});
if (!listed.ok) throw new Error(`seed: the asset list answered ${listed.status}`);
const existing = ((await listed.json()).items ?? []).map((item) => item.filename);

const files = new Map();
for (const asset of assets) {
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`seed: ${asset.url} answered ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  verifySha(bytes, asset.sha256, asset.file);
  files.set(asset.file, await uploadable(asset.file, bytes, sharp));
}
console.log(`seed: ${files.size} originals fetched, every sha256 matches the manifest`);

const conflicts = assetConflicts(
  [...files.values()].map((f) => f.name),
  existing,
);
if (conflicts.length && !allowExisting) {
  console.error(
    `seed: the media library already holds ${conflicts.length} of these files ` +
      `(${conflicts.slice(0, 3).join(", ")}…). migrate() does not dedupe, so a re-run would ` +
      "upload every photo again. Refusing; pass --allow-existing-assets to override.",
  );
  process.exit(1);
}

const migration = prismic.createMigration();
const migrated = new Map();
const img = (file, alt) => {
  if (!migrated.has(file)) {
    const { name, bytes } = files.get(file);
    migrated.set(file, migration.createAsset(new File([bytes], name), name, { alt: alt ?? "" }));
  }
  return migrated.get(file);
};
const created = new Map();
const link = makeLink(created);
for (const doc of documents(img, link))
  created.set(
    `${doc.type}:${doc.uid}`,
    migration.createDocument({ type: doc.type, uid: doc.uid, lang, data: doc.data }, doc.title),
  );

await client.migrate(migration, {
  reporter: (event) => console.log(event.type, event.data?.current ?? "", event.data?.total ?? ""),
});
console.log("seed: done. Review the migration release in Prismic, then run again with --publish.");
