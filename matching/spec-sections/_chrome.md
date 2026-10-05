## shared chrome

Site-wide furniture: the nav and the footer. Read 2026-10-05 from
`matching/spec/export/index.html` (inline `<style>`, 14,774 bytes, and the
inline script), and probed on https://mantislandscaping.com/ after a settled
scroll (200px steps, 120ms apart, then 1.2s). The live page's sha256 is
`78dc5181…`, the same as the 2026-10-01 capture (`capture/manifest.json`), so
the reference had not moved.

### Page frame

- Root font-size **16px** at 1440, 834 and 390 (no scaled root). Every px
  below is a px; there is no rem ladder to follow.
- `body.clientWidth` = viewport at every matrix width: **no scrollbar gutter**.
  The candidate reserves one (1425 at 1440, 819 at 834, 375 at 390).
- `.page0`: `color:#2e1e15; background:#fff`, flex column, `min-height:100vh`.
  Links default to `a{color:#F58736}`.
- Fonts: Google Fonts `Nunito:300,700` only (`<link rel=preload …family=Nunito:300,700>`).
  Computed weights 600 (footer links) and 900 (`<b>` inside 700 headings) have
  no face of their own and render with the 700 face. The candidate self-hosts
  the same two weights.

### Nav — `nav#navigation0`

- Config (inline script): `{id:"navigation0", height:60, pad:10, type:"",
textColor:"#2e1e15", textColorMobile:"#ffffff", closedMenuIconColor:"#2e1e15"}`.
- `.navigation0{background-color:#f5f5f5; padding:5px 4%; text-align:right;
z-index:10}`, `.navigation0h{max-width:1280px; margin:0 auto}`, a 60px
  `:before` strut. Measured box: **70px** tall at every matrix width.
- **In flow at load** (`position: static`, page content starts at y=69/70),
  and switched to `position: fixed` by `checkYoScroll` once
  `scrollTop > 1`. The candidate's nav is fixed from the start and overlays
  the hero (candidate content starts at y=0; nav 83px at 1440, 76px below).
- Logo: `a.navigation0logobox`, absolutely positioned left, image
  `159e861e-7395-4dea-8072-5ff6af26a117.png` at **width 260px**,
  `mediaRatio 11.1111%` (260×28.9), `background-size: contain`.
- Links (`.navigation0ullia`): Nunito **300 16px**, line-height normal,
  `#2e1e15`, `padding:10px`, right-aligned; no `:hover` rule.
- Mobile (script `goMobile`, when the links do not fit; at 390 they do not,
  at 834 they do): a 30×20 three-bar icon (`.navigation0-menuicon`, 2px
  bars `#2e1e15`, radius 2px, `transition: all .25s`), driven by a hidden
  checkbox `#navigation0-menuicon`; checked → bars cross
  (`translate(3px,-3px) rotate(45deg)` / width 0 / `translate(2px,4px)
rotate(-45deg)`). Open menu items: `.navigation0ullia-m` Nunito **700 20px**
  `#fff`, `padding:10px 10px 10px 4%`; the menu panel is
  `.navigation0ul-m{background-color:#f5f5f5}` and the open panel is
  `position:fixed; top:0; bottom:0` with `overflow-y:auto`.

### Footer — `footer#footer0`

- `.footer0{background-color:#ededed; padding:40px 4%}`,
  `.footer0h/.footer0ul{max-width:1280px; margin:0 auto}`, a 60px `:before`
  strut (`display:none` at ≤700px). Measured box: **232px** at 1440 and 834,
  **299px** at 390.
- Two columns (`grid-2`, 50% each; 100% stacked at ≤600px):
  1. the logo, same file as the nav, at **width 280px** (280×31.1), not linked;
  2. links: an **empty** `<a href="/projects">` (no text — a reference
     defect, not copied), "Contact Us", and an Instagram icon link
     (`http://www.instagram.com/mantis_landscaping`, 32×32 svg,
     `fill:#444D33`).
- Link type: `.footer0ullia` Nunito **600** (renders as the 700 face)
  **16px**, `#444d33`, `padding:10px`.
- The candidate footer adds the phone number (`424-264-8944`), which the
  reference footer does not carry (the reference shows it only in body copy).
  Ledger before matching.
