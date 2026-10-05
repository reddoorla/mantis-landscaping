# Deviations / masks / floors ledger

Append-only, and written at the moment a decision is made — not reconstructed at
the end of a round, when the reason has already been lost. An entry is never
edited to be right: a later entry corrects an earlier one and says which.

Every entry in `matching/floors.mjs` and `matching/census-deviations.mjs`, and
every mask in `matching/harness.json`, needs a line here. Without one the gate
has been quietly widened and nothing records who widened it, or why.

- [deviation | floor | mask | a11y] `<region or selector>` — what differs, why
  it is accepted, and the evidence: a spec citation, a census row, a gate run.

## 2026-10-05 — home, Phase 1 (cloud session; reddoor-maintenance P1-30, Operator decisions 78)

- [deviation] harness candidate for `home` is `/`, not `/dev/match/home` — the
  twin 500s on every request: `src/routes/dev/match/[uid]/+page.server.ts`'s
  `devImg` passes the seed's photo FILENAMES (`$lib/site-pages.js` `photo()`)
  to `PrismicImage` as URLs, and `asImageWidthSrcSet` throws `Invalid URL`. It
  has been broken since P2b moved photos to Prismic assets. `/` on the dev
  server renders the published Prismic page, which is what ships. A gate run
  before this change measured the twin's 500 page against the reference (a
  "baseline" whose 4 candidate regions were an error page) — that run is not
  evidence of anything. Tracked as mantis-landscaping#27.
- [deviation] census rows 4 (photo band), 9 (projects) and 13 (footer) have no
  anchor of their own; they are measured inside regions 3, 8 and 12. Why: SPEC
  `## home`, census notes. Region 8 is therefore not a pass for the projects
  band by itself.
- [ACK-REQUIRED: structural] projects band (census 9): the reference is a
  two-slide fading carousel (`slider` config in SPEC); the candidate is a
  stacked list of project cards. Not a geometry defect until the operator
  chooses: match the carousel, or accept the list.
- [ACK-REQUIRED: structural] pillars (census 3) below 900px and values (census 11) below 600px become carousels on the reference (`sliderAt`); the
  candidate keeps grids. Same choice.
- [ACK-REQUIRED: matrix] the reference CSS has rules in the 901–1200px band
  that 1440·834·390 never samples; adding 1024 is the operator's call.
- [deviation] links the candidate fixed on purpose, to be kept: the
  services cards point at real pages (three 404 on the reference), "Join
  Newsletter +" goes to `/contact-us` (the native signup, P4b; the
  `#newsletter` anchor is a pending Prismic content change) instead of
  Mailchimp, and the footer has no empty "Projects" link (plan §4, OD 62).
- [finding, not yet a deviation] gate r0 (2026-10-05 20:29Z, the first run with
  SPEC and anchors): every anchor resolved on both pages at 1440/834/390, but
  the run is TRUNCATED (ref 10 regions, cand 9) and counts for nothing. The
  candidate's `top` region is empty: its nav is `position:fixed` from load and
  the hero starts at y=0, while the reference nav is in flow at load (static,
  70px; the hero starts at y=69/70) and only turns fixed after `scrollTop > 1`
  (SPEC `## shared chrome`, Nav). This is the first geometry item for the next
  round; nothing was changed in this one.

## 2026-10-05 — home, round 1 (carousels, census 3 and 11)

- [correction] SPEC's "below 900px" / "below 600px" read as viewport widths
  is wrong. `sliderAt` compares the grid's own `offsetWidth` to the config
  width (`if(calcWidth<=self.config.width)`, `matching/spec/export/index.html`;
  calls `{id:"page-block-1",from:"grid",width:"900"}` and
  `{id:"page-block-9-item-1",from:"grid",width:"600"}`). Measured on the live
  reference, fresh load and resize agreeing: pillars switch at viewport
  ≤978 (grid 900 wide), values at ≤652 (grid 600). The candidate uses
  container queries on the IconRow content box (`@container`,
  `[@container(width<=900px)]`), so it switches on the same quantity.
- [finding, not a deviation] the candidate's content box is `vw − 63` (max 1104) against the reference's 92% of vw, so today it switches at ≤963 and
  ≤663. This closes when the section box is matched; no matrix viewport sits
  between the two (1024 grid/grid, 834 carousel/grid, 390 carousel/carousel
  on both).
- [a11y] the values carousel autoplays (2000ms), so the candidate shows a
  "Pause slides" control the reference lacks (WCAG 2.2.2), and both
  carousels show dots: `Slider` always renders dots when arrows are hidden.
  The reference's pillars carousel has dots; its values carousel has none.
