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

## 2026-10-05 — home, round 1 (chrome)

- [answer] Operator, 2026-10-05: **keep the projects list** (census 9 is an
  accepted structural deviation; region 8 is judged by its chrome and the
  list's own geometry, not against the carousel), **match the carousels**
  (census 3 below 900px, census 11 below 600px; next batch), **add 1024**
  (`harness.json` matrix is now 1440·1024·834·390).
- [deviation] the footer keeps the phone link (`424-264-8944`), which the
  reference footer lacks; it was in the P2a chrome brief. The empty "Projects"
  footer link of the reference is not copied.
- r1 (2026-10-05 21:19Z, after nav sticky/70px/1280 inner, scroll-padding,
  no gutter): countable; `top` PASS 1.9/2.7/2.9/5.8% at 1440/1024/834/390.
  census 111 mismatches.
- r2 (after nav links `leading-[normal]` + 10px padding + nowrap, and the
  footer box: `#ededed`, `40px 4%`, 1280 inner, two columns, 600 `#444d33`
  links, Instagram restored): `top` PASS 1.3/1.8/2.9/5.8%. census 105. The
  flourish+footer composite region moved 40.3→45.8% at 1440 while its Δh
  improved 35.3→28.8%: the footer now matches (element-level smoke
  assertions), but it sits under a flourish band that is still 448px against
  the reference's 700, so the grey box lands on the reference's photo. Region
  number is the wrong instrument for the footer until the band is matched.
- [a11y] in-page anchors land 70px below the sticky nav (`main [id] {
scroll-margin-top: 70px }`). The reference lands them under its nav:
  `scrollPageToTarget` keeps `navH=0` unless the nav's `data-type` contains
  "sticky", and `<nav id="navigation0" ... data-nav-height="60px">` has no
  `data-type` (`matching/spec/export/index.html`). A heading hidden under the
  nav fails WCAG 2.4.11. r1 first did this with `html { scroll-padding-top }`,
  which made every `focus()` inside the stuck nav scroll the page up by
  ~420px (review of #29: 1500 → 1078 at 390); the per-target margin does not.
  Guard: `tests/smoke/chrome-geometry.spec.ts` "focusing a nav control does
  not scroll the page" and "an in-page anchor lands below the sticky nav".
- [deviation] `scrollbar-gutter: auto` (the starter reserves `stable`). The r1
  evidence for it, `body.clientWidth` equal to the viewport, was a headless
  artifact: Chromium headless hides scrollbars. With real 15px scrollbars at
  1440 both builds read 1425 on `/`; on a page too short to scroll this build
  reads 1440 and the starter 1425. So on classic-scrollbar desktops this
  brings back a 15px sideways shift between short and long pages, and it
  changes nothing on long ones. Kept because the gate's headless captures
  are what is being matched, and the reference reserves no gutter.
- [a11y, correction] the 70px margin also covers `main` itself
  (`main, main [id]`). The site's only real in-page anchor is the skip link to
  `<main id="main-content">`, which `main [id]` did not match: after the r1
  fix, Enter on it left main's top 70px under the nav (round-2 review of
  #29). Guard: "the skip link lands main below the sticky nav" (1440, 390).
