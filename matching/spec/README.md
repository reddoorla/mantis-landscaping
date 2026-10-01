# The Blux reference for mantislandscaping.com

The site this repo replaces was served by Blux (site id
`6e0b52ee-9bb9-4c5a-b1ee-653009e3b572`, which is `refMark` in
`matching/harness.json`). This directory keeps the reference, so it outlives
the Blux account. The plan is `docs/mantis-landscaping-plan-2026-10.md` in
reddoorla/reddoor-maintenance (#1107).

## `export/`: the Blux dashboard export (2026-10-01)

- Each page's rendered `index.html`.
- `site.json`: pages, the `projects` collection (6 items, 3 of them disabled
  drafts: Urban Farming, Vertical Gardens, Wood Work), styles, and the media
  library (228 entries).
- `sitemap.xml`, `projects.xml`, `search.json`.

**`site.json` is redacted, because this repo is public.** The export's
original was 370,018 bytes, sha256
`6031ef8a714444341d150d31071009ada00977a9600634c73449473c1d01e4cf`. Three
things were changed:

- every email address is replaced with `redacted@example.invalid` (6
  distinct addresses);
- `owner` is removed;
- `settings.collaborators` is removed.

It was then re-serialized with 2-space indentation. Nothing else changed:
re-applying the same redaction to the parsed original gives the same JSON.

The repo's Blux pipeline reads this directory:

```sh
reddoor-maint blux convert matching/spec/export --out /tmp/blux-out
```

On 2026-10-01 it converted 3 pages (17 bands, every page "FAITHFUL") and
raised 229 diagnostics:

- 5 low-confidence blocks;
- 224 unresolved assets.

It does not read `content.projects`, and it resolved only 2 of the 89
images the live pages use, even with `--probe`. The images come from
`capture/` instead.

## `capture/`: the live site (2026-10-01T17:31:44Z)

- `pages/`: the 6 pages as served, byte for byte.
- `sitemap.xml`.
- `files/`: every asset fetched except the photo originals and Blux's
  `__analytics.js`. That script was removed after Netlify's secret scan
  failed the first production build on the Google API key (`AIza…`) at its
  line 41. The key is Blux's own browser key, served publicly by the live
  site. The matching gate does not need an analytics script, and a third
  party's key does not belong in this public repo. The file's sha256 is
  still in `manifest.json`.

`manifest.json` lists every page and file with its URL, bytes and sha256,
**including the 89 original uploads** (242.3 MB, under
`dv4tl7yyk1zlp.cloudfront.net`). Those are not committed: 242 MB would ride
every clone and every Netlify build. They stay on Blux's CDN until the seed
uploads them to Prismic. The seed checks each download against its manifest
sha256. Blux is cancelled only after launch.
