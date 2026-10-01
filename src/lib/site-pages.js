// The page assemblies for this site — the SINGLE source of truth for both
// consumers: a Prismic Migration API script, which publishes them (start from
// the starter's scripts/import/migrate.example.ts — no `reddoor-maint` command
// does this; the seed is per-site work), and src/routes/dev/match/[uid], the
// local matching surface. Because both read from here, any fix made to pass a
// gate is a fix to what ships.
//
// THE MIGRATION API DROPS SILENTLY. It validates against the slice models
// registered in Prismic and discards every field the model does not declare —
// HTTP 200, no warning. A fixture field with no model behind it renders here and
// vanishes on the published route. src/lib/site-pages.test.ts is the mechanical
// check; run it before every seed.
//
// PURE by contract: no node:*, no fetch, no token, no side effects at import,
// so Vite can bundle it into the dev route and node can import it into the seed.

export const lang = "en-us";

/**
 * @param {(url: string) => unknown} img resolves an image URL to whatever the
 *   caller needs — an asset `{id}` for the seed, a `{url}` for the dev route.
 * @returns {Array<{type: string, uid: string, title: string, data: Record<string, unknown>}>}
 */
export function documents(img) {
  void img;
  return [];
}
