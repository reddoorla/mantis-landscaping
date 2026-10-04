import { readFileSync } from "node:fs";
import * as prismic from "@prismicio/client";
import sharp from "sharp";

import { documents, lang } from "../../src/lib/site-pages.js";
import {
  REPOSITORY,
  listAssets,
  makeLink,
  missingModels,
  modelsUsed,
  planAssets,
  makeIdLink,
  resolveToken,
  splitReused,
  unsized,
  uploadable,
  verifySha,
} from "./lib.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const publish = args.has("--publish");
const updateAt = process.argv.indexOf("--update");
const updateIds =
  updateAt > 0 ? JSON.parse(readFileSync(process.argv[updateAt + 1], "utf8")) : null;

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
const headers = { repository: REPOSITORY, authorization: `Bearer ${writeToken}` };
const getJson = async (url) => {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`seed: ${url} answered ${response.status}`);
  return response.json();
};
const client = prismic.createWriteClient(REPOSITORY, { writeToken });

if (publish) {
  const result = await client.publishMigrationRelease();
  console.log(`seed: published the migration release (${JSON.stringify(result)})`);
  process.exit(0);
}

const missing = missingModels(modelsUsed(plan), {
  types: await getJson("https://customtypes.prismic.io/customtypes"),
  slices: await getJson("https://customtypes.prismic.io/slices"),
});
if (missing.length) {
  console.error(`seed: Prismic does not have ${missing.join(", ")}. Push the models first.`);
  process.exit(1);
}

const existing = await listAssets(getJson);
const { reuse, fetch: toFetch } = splitReused(assets, existing);
const files = new Map([...reuse].map(([file, id]) => [file, { id }]));
for (const asset of toFetch) {
  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`seed: ${asset.url} answered ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  verifySha(bytes, asset.sha256, asset.file);
  files.set(asset.file, await uploadable(asset.file, bytes, sharp));
}
console.log(
  `seed: ${toFetch.length} originals fetched, every sha256 matches the manifest; ` +
    `${reuse.size} already in the media library are reused`,
);

if (updateIds) {
  for (const [file, entry] of files) {
    if (entry.id) continue;
    const form = new FormData();
    form.append("file", new Blob([entry.bytes]), entry.name);
    if (used.get(file)) form.append("alt", used.get(file));
    const response = await fetch("https://asset-api.prismic.io/assets", {
      method: "POST",
      headers,
      body: form,
    });
    if (!response.ok) throw new Error(`seed: upload ${entry.name} answered ${response.status}`);
    const created = await response.json();
    if (!created.width || !created.height)
      throw new Error(`seed: Prismic read no dimensions for ${entry.name} (${created.id})`);
    files.set(file, { id: created.id });
    console.log(`seed: uploaded ${entry.name} ${created.width}x${created.height}`);
  }
  const img = (file, alt) => ({ id: files.get(file).id, alt: alt ?? null });
  for (const doc of documents(img, makeIdLink(updateIds))) {
    const id = updateIds[`${doc.type}:${doc.uid}`];
    if (!id) throw new Error(`seed: no document id for ${doc.type}:${doc.uid}`);
    const response = await fetch(`https://migration.prismic.io/documents/${id}`, {
      method: "PUT",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ uid: doc.uid, title: doc.title, data: doc.data }),
    });
    if (!response.ok)
      throw new Error(
        `seed: update ${doc.uid} answered ${response.status} ${await response.text()}`,
      );
    console.log(`seed: updated ${doc.type}:${doc.uid}`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  for (const stale of unsized(existing))
    console.log(`seed: unsized asset no document uses any more: ${stale.name} ${stale.id}`);
  process.exit(0);
}

const migration = prismic.createMigration();
const migrated = new Map();
const img = (file, alt) => {
  if (!migrated.has(file)) {
    const entry = files.get(file);
    migrated.set(
      file,
      entry.id
        ? { id: entry.id, alt: alt ?? null }
        : migration.createAsset(new File([entry.bytes], entry.name), entry.name, {
            alt: alt ?? "",
          }),
    );
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
console.log(
  "seed: if migrate() failed after creating documents, run again with --update <ids.json> " +
    '(a map of "type:uid" to the document ids in the release). Assets are reused either way.',
);
