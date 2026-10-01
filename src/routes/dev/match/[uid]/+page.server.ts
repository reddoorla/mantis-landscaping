import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { documents } from "$lib/site-pages.js";

// Local matching surface: renders the assemblies in $lib/site-pages.js — the
// same module a Prismic Migration API script publishes from (start from the
// starter's scripts/import/migrate.example.ts; no `reddoor-maint` command does
// this, the seed is per-site work) — so a fix made to pass a gate is a fix to
// what ships. Not prerendered, SSR-on-demand, dev-only.
export const prerender = false;

// A migration script resolves images to asset ids (migration.createAsset);
// here they only need a URL. Dimensions are nominal — slices size their own
// image boxes in CSS.
const devImg = (u: string) => ({
  url: u,
  alt: null,
  copyright: null,
  dimensions: { width: 1600, height: 1067 },
  edit: { x: 0, y: 0, zoom: 1, background: "transparent" },
  id: u,
});

export async function load({ params }) {
  // FIRST statement: everything below reads fixtures that must not be reachable
  // from a production build. The launch recipe asserts this route 404s on the
  // deployed URL, with /dev/a11y-fixtures as the 200 control.
  if (!dev) error(404, { message: "Not found" });

  const docs = documents(devImg) as Array<{ uid: string; data: { slices?: unknown[] } }>;
  const doc = docs.find((d) => d.uid === params.uid);
  // The leading token is a MACHINE tell for the launch recipe's dev-guard. This
  // 404 renders through the site's own +error.svelte exactly like a guarded
  // route's does, so on a site whose uids lack "home" an UNGUARDED twin would
  // pass the deployed check forever; the token is what tells the two apart.
  // Reword the prose freely — the token is the contract (#719).
  if (!doc)
    error(404, {
      message: `reddoor-match-twin:no-assembly: no assembly for "${params.uid}" (have: ${docs.map((d) => d.uid).join(", ") || "none"})`,
    });

  return { uid: params.uid, slices: doc.data.slices ?? [] };
}
