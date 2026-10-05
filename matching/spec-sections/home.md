## home

Reference `https://mantislandscaping.com/`, candidate `/` on the dev server
(see the LEDGER entry of 2026-10-05: the `/dev/match/home` twin 500s).
Sources: `matching/spec/export/index.html` (inline CSS and script), and
probes after a settled scroll at 1440, 834 and 390. Phase 1 only: nothing in
this file has been matched yet.

### Section census (coverage denominator)

Measured y/h at 1440 · 834 · 390. The anchor column is the `--sections` list
in `matching/harness.json`, in order; every anchor resolves exactly once, in
the same order, on both pages at all three widths (probe
`matching/p1-anchors.mjs`, 2026-10-05).

| #   | Reference element      | Content                                           | y (1440·834·390) | h (1440·834·390)      | Anchor                            |
| --- | ---------------------- | ------------------------------------------------- | ---------------- | --------------------- | --------------------------------- |
| 1   | `nav#navigation0`      | logo, Projects, Contact Us                        | 0·0·0            | 70·70·70              | — (region `top`)                  |
| 2   | `#page-block-0`        | hero: photo left, h1 + "Contact Us +" right       | 69·69·69         | 600·686·1048          | `Creating green spaces`           |
| 3   | `#page-block-1`        | three pillars on gold                             | 669·755·1117     | 162·200·174           | `Professionally`                  |
| 4   | `#page-block-2`        | full-width photo band, no text                    | 831·955·1291     | 450·450·450           | merged into 3 (no text to anchor) |
| 5   | `#page-block-3` item 0 | OUR MISSION + body + two buttons                  | 1281·1405·1741   | —                     | `our Mission`                     |
| 6   | `#page-block-3` item 1 | "Select a Service…" + four service cards          | 1875·2053·2490   | (5+6) 1135·1198·1385  | `Select a Service`                |
| 7   | `#page-block-4`        | THE DIFFERENCE on photo                           | 2416·2603·3126   | 624·693·600           | `The Difference`                  |
| 8   | `#page-block-7`        | "Ready to save on water…" + three steps + button  | 3040·3296·3726   | 670·956·957           | `ready to save on water`          |
| 9   | `#page-block-8`        | projects slider (2 slides)                        | 3709·4251·4683   | 811·721·721           | merged into 8 (see below)         |
| 10  | `#page-block-9` item 0 | THE TAKEAWAY + body + button                      | 4520·4972·5404   | —                     | `The Takeaway`                    |
| 11  | `#page-block-9` item 1 | four value icons                                  | 5043·5495·5741   | (10+11) 1024·1364·612 | `Thoughtfully Designed`           |
| 12  | `#page-block-10`       | "It's time for your garden to flourish." on photo | 5544·6336·6016   | 700·700·700           | `It's time for your garden`       |
| 13  | `footer#footer0`       | logo, links, Instagram                            | 6244·7036·6716   | 232·232·299           | merged into 12 (no unique text)   |

Three census rows have no anchor of their own, and say so here so the
merged regions are not read as one section:

- **4 (photo band)** has no text; it is inside region 3.
- **9 (projects)** has no text both pages share and that starts a
  section: the reference opens "PROJECTS / EDIBLE GARDENS + MAINTENANCE"
  (a slide), the candidate "Projects / Design + Installation…" (a stacked
  list), and "Projects" alone resolves to the nav link first. It is inside
  region 8, and region 8 is therefore not a pass for the projects band on
  its own. The two are also built differently (a two-slide fading carousel
  against a stacked list): a structural deviation that needs a LEDGER line
  and an operator decision before any geometry round treats it as a defect.
- **13 (footer)** has only "Contact Us", which the nav owns; it is inside
  region 12. Shared chrome is specified in `## shared chrome`.

### Containers (every section)

From the inline CSS; the ≤700px column is `@media (max-width:700px)`.

| Class               | Desktop                                    | ≤700px                  |
| ------------------- | ------------------------------------------ | ----------------------- |
| `.blocks0container` | `max-width:1280px; padding:80px 4% 100px`  | `padding:20px 4%`       |
| `.blocks1container` | `max-width:1280px; padding:40px 4%`        | `padding:20px 4%`       |
| `.blocks2container` | `max-width:1280px; padding:160px 4% 240px` | `padding:20px 4%`       |
| `.blocks3container` | `max-width:1280px; padding:0 4%`           | `padding:0 10% 20px 8%` |

Inline `style` overrides on individual blocks take precedence, and are
quoted per section below.

### Typography ladder (classes used on this page)

| Class    | Desktop                                                                                | ≤700px    |
| -------- | -------------------------------------------------------------------------------------- | --------- |
| `.text0` | Nunito 300 **50px**/normal, `margin:10px 0; padding:10px`                              | 30px/36px |
| `.text1` | Nunito 300 **20px**, `padding:10px`                                                    | 18px      |
| `.text2` | Nunito 700 **20px/24px**, `ls:1px`, uppercase, `#dfb726`, `margin:4px 0; padding:10px` | 15px      |
| `.text4` | Nunito 300 **30px**, `margin:10px 0; padding:10px`                                     | 24px/28px |
| `.text5` | Nunito 700 **30px**, `ls:1px`, uppercase, `#dfb726`, `margin:10px 0; padding:10px`     | 20px      |
| `.text7` | Nunito 700 **15px**, uppercase, `margin:10px 0; padding:10px`                          | 10px      |

### Buttons (four patterns; hover and active from the CSS)

| Class       | Box                                    | Type                          | Colour              | `:hover`     | `:active`    |
| ----------- | -------------------------------------- | ----------------------------- | ------------------- | ------------ | ------------ |
| `.buttons0` | text link, `padding:10px 0`            | 700 15px, `ls:1px`, uppercase | `#dfb726`           | `#cda71f`    | `#ae8e1a`    |
| `.buttons3` | `padding:10px 15px; border-radius:8px` | 700 12px, `ls:1px`, uppercase | `#fff` on `#dfb726` | bg `#cda71f` | bg `#ae8e1a` |
| `.buttons4` | `padding:10px 15px; border-radius:8px` | 700 12px, `ls:1px`, uppercase | `#ae8e1a` on `#fff` | bg `#f5f5f5` | bg `#ededed` |
| `.buttons2` | not used on this page                  |                               |                     |              |              |

`buttons3` carries `ef-a-ripple3` and `buttons4` carries `ef-a-ripple4`: a
click spawns a `rgba(0,0,0,.3)` circle at the pointer that fades over 3s
(script `ripple`). Every button label ends with " +".

### Per section

**2 · Hero (`#page-block-0`).** Two `grid-2` columns, `cagridFlexHeight`
(equal heights). Left: a background photo `ec8acb1b-…aacd94bb5cc2.jpg`
(1920px source), `background-size:cover; position:center top`,
`min-height:600px`, 720px wide at 1440. Right: `.blocks0container` with
inline `max-width:920px; padding:120px 4%`, vertically centred. h1
`.text0`: 300 **50px**/normal `#fff` at 1440 (30px/36px at 390); "Contact
Us +" `.buttons0`. At ≤600px the columns stack (`grid-2` → 100%), which is
why the hero is 1048px tall at 390. **The reference hero text is white on a
column with no background of its own**; read the column's computed
background on both pages before matching it.

**3 · Pillars (`#page-block-1`) + 4 · photo band (`#page-block-2`).**
Pillars: `background-color: rgb(223,183,38)` (`#dfb726`),
`.blocks1container` with inline `padding:20px 4%`, three `grid-3` columns,
centred h3 `.text4`: 300 **30px** `#fff` (24px/28px at 390). Below
**900px** the grid becomes a slider (`sliderAt width:"900"`: Fade 250ms,
Circles dots Under, 8px dots `#ededed`/active `#fff`, 12px spacing, no
arrows, **no autoplay**); so at 834 and 390 the reference shows one pillar
at a time with dots, not three columns. Photo band: background photo
`a6b32564-…e540b966ea45.jpg`, `min-height:50vh` (450px at a 900px-tall
viewport), cover, centred.

**5 · Mission (`#page-block-3` item 0).** Section background `#232d1b`.
`.blocks1container`, inline `max-width:920px`, centred. h3 "our Mission"
`.text2` (700 20px/24px `ls:1px` uppercase `#dfb726`; 15px at 390); body
`.text1` (300 20px `#fff`; 18px at 390), three paragraphs separated by
`<br><br>`; two `.buttons3` side by side (`margin:5px` each, row margin
`0 -5px`): "Contact Us +" → `/contact-us`, "Join Newsletter +" →
`http://eepurl.com/h0T-cP` (the candidate links `/contact-us`; ledger).

**6 · Services (`#page-block-3` item 1).** `.blocks0container`, inline
`padding:0 0% 40px`, `data-reveal-effect="fadeIn"`. h3 "Select a Service to
learn more below:" `.text7` 700 **15px** uppercase, colour
`rgb(174,142,26)` (`#ae8e1a`; 10px at 390). Four cards, `grid-4-120-s40`
(`calc(25% - 30px)`, `margin:0 40px 40px 0`; 3 per row 479–599, 2 per row
359–479, 1 below 359), each `background-color:rgb(50,59,33)`,
`border-radius:20px`, `cursor:pointer`, `data-link` (click navigates),
`data-reveal-effect="fadeInUpShort"`. Card: an icon at **width 160px**
(`d91028b1…`, `8a32c3e9…`, `42be8b29…`, `2bb6e4f1…`; `data-media-padding`
10px or 30px) and an h4 `.text7` (700 15px uppercase `#fff`; 10px at 390).
Card links: water wise → `/projects/landscaping`, edible →
`/projects/urban-farming`, pest control → `/projects/urban-farming#4`,
consulting → `/contact-us`. The first three 404 on the reference (plan §2);
the candidate points them at real pages (ledger).

**7 · The Difference (`#page-block-4`).** `background-color:#232d1b` under
a cover photo `f8a75409-…f33970145195.jpg`. `.blocks1container`, inline
`padding:100px 8% 100px 4%`, vertically centred, left-aligned. h2 `.text2`;
body `.text0` (300 50px `#fff`; 30px/36px at 390) with
`.pd_0-0-80px-0` (`padding:0 0 80px`).

**8 · Steps (`#page-block-7`) + 9 · Projects (`#page-block-8`).**
Steps: `background-color: rgb(205,167,31)` (`#cda71f`), outer
`.blocks0container` inline `max-width:none`, item `padding:0 0 40px`. h3
`.text5` 700 **30px** `ls:1px` uppercase `#fff` (20px at 390) with
`.pd_0-0-60px-0`. Three `grid-3-s40` columns (`calc(33.3% - 26.67px)`,
`margin:0 40px 40px 0`; two per row at ≤900px, stacked at ≤600px), each a
40px icon (`484b70e4…`, `7279c951…`, `39097e48…`) above an h4 `.text2`
(white; "schedule a consultation" is wrapped in `<b>`, computed 900) and a
`.text1` body. Below, centred: "Contact Us +" `.buttons4`.
Projects: a slider (`slider({id:"page-block-8", transition:"Fade",
speed:500, dots:"Circles", dotsPosition:"Over", dotsize:8, dotspacing:"4px",
dotcolor:"#ededed", activedotcolor:"#ffffff", arrows:"Overlay",
arrowColor:"#dfb726", lrpadding:32, autoplay:0})`). Section overlay
`rgba(35,45,27,.83)`; each slide `block-ratio-56_25-80vh` (56.25% aspect,
`min-height:80vh`) with its own photo (`31478c85…`, 3033px source;
`c574afe5…`) under `rgba(0,0,0,.2)`. Slide 1: h4 `.text2` "PROJECTS /
EDIBLE GARDENS + MAINTENANCE" (the "PROJECTS /" span white, the rest
`#dfb726`), subtitle `.text0` "Edible Gardens", "Learn More +" `.buttons3`
→ `/ediblegardens`. Slide 2's eyebrow reads "schedule a consultation" (a
reference content defect), subtitle "Water Wise Gardens" →
`/projects/water-wise-gardens`. Arrows: 32px `.icon-arrows` buttons
(`aria-label` "left arrow"/"right arrow"), `ef-h-grow-s` (hover
`scale(1.1)`), `transition150` (`all .15s ease-in-out`).

**10 · Takeaway (`#page-block-9` item 0) + 11 · values.** Section
`background-color:#232d1b`, `.blocks2container` (160px 4% 240px; 20px 4%
at ≤700). Item 0: `.blocks1container` inline `max-width:600px`, centred:
h3 `.text2` "the takeaway", body `.text4` (300 30px `#fff`; 24px/28px at 390) with a `<br>`, "Let's Get Planting +" `.buttons0` inside a `.text4`
holder. Item 1: `border-radius:43px` wrapper, four `grid-4-s40` cards
(`calc(25% - 30px)`; 3 per row at ≤1200px, 2 per row at ≤900px), each
`border-radius:20px`, a 120px icon (`d91028b1…`, `3ce289d6…`, `8a32c3e9…`,
`2d026842…`) and an h4 `.text7` (white; 10px at 390). Below **600px** the
grid becomes a slider (`sliderAt width:"600"`: Fade 500ms, **autoplay
2000ms**, no dots, no arrows), which is why the section is 612px at 390
against 1364px at 834.

**12 · Flourish (`#page-block-10`) + 13 · footer.** A cover photo
`33aa34a6-…737a265b4b6f.jpg` under `rgba(24,26,15,.37)`, `min-height:700px`,
`.blocks1container` vertically centred, centred text: `.text0` "It's time
for your garden to flourish." (300 50px `#fff`; 30px/36px at 390) and
"Contact Us +" `.buttons0`. Footer: `## shared chrome`.

### Asset manifest

Every image is a Blux CDN file under
`d3syaxnfm3oj0e.cloudfront.net/6e0b52ee-…/<media>`; the downloaded copies
and their sha256 are in `matching/spec/capture/manifest.json`. The
candidate serves the same photos from Prismic: the P2b seed uploaded these
files with their XMP metadata stripped losslessly (same pixels, different
bytes; mantis-landscaping#8), and Prismic's imgix re-encodes them. So photo
regions are the "same photo, different pipeline" floor class, to be
confirmed per region before it is claimed.

| Section     | Files (`data-media`)                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| nav, footer | `159e861e-7395-4dea-8072-5ff6af26a117.png` (logo, 1377×153)                                                      |
| 2           | `ec8acb1b-5a28-4420-b095-aacd94bb5cc2.jpg`                                                                       |
| 4           | `a6b32564-5dc8-4149-9d72-e540b966ea45.jpg`                                                                       |
| 6           | `d91028b1-…`, `8a32c3e9-…`, `42be8b29-…`, `2bb6e4f1-…` (PNG icons; the candidate uses Lucide icons, P2a, ledger) |
| 7           | `f8a75409-c8c5-454c-8e7c-787af1f7a7fd.jpg`                                                                       |
| 8           | `484b70e4-…`, `7279c951-…`, `39097e48-…` (40px PNG icons; Lucide in the candidate)                               |
| 9           | `31478c85-ceb9-4d3a-a733-1b45cbfa5d04.jpg`, `c574afe5-489c-4826-8a07-ee39f85b1176.jpg`                           |
| 11          | `d91028b1-…`, `3ce289d6-…`, `8a32c3e9-…`, `2d026842-…` (PNG icons; Lucide in the candidate)                      |
| 12          | `33aa34a6-890c-4faf-b2e8-737a265b4b6f.jpg`                                                                       |

### Interaction inventory — 17 entries

Phase 5 verifies exactly these, at every matrix width where each exists.

1. Nav sticks (`position:fixed`) after `scrollTop > 1`.
2. Mobile menu toggle (≤ the fit width; present at 390): open, close, bar
   animation, panel.
3. Nav links (2): no hover rule.
4. Hero "Contact Us +" (`buttons0`): hover, active colours.
5. Pillars slider below 900px: dots, fade 250ms.
6. Mission "Contact Us +" (`buttons3`): hover, active, ripple.
7. Mission "Join Newsletter +" (`buttons3`): hover, active, ripple.
8. Service cards (4): click navigates (`data-link`), `cursor:pointer`.
9. Steps "Contact Us +" (`buttons4`): hover, active, ripple.
10. Projects slider arrows (2): hover `scale(1.1)`, click changes slide.
11. Projects slider dots: click changes slide, fade 500ms.
12. Slide 1 "Learn More +" (`buttons3`): hover, active, ripple.
13. Slide 2 "Learn More +" (`buttons3`): hover, active, ripple.
14. Takeaway "Let's Get Planting +" (`buttons0`): hover, active.
15. Values slider below 600px: autoplay 2000ms, fade 500ms.
16. Flourish "Contact Us +" (`buttons0`): hover, active.
17. Footer links: Contact Us, Instagram (no hover rule); the empty Projects link.

### Animation census

- `blockEffects(true)` (inline script) reveals `.block-effects` elements as
  they enter the viewport: `opacity:0` until applied, then the
  `data-reveal-effect` animation, **1s**, `cubic-bezier(.2,.55,.88,.95)`,
  `fill-mode:both`.
- On this page: one `fadeIn` (section 6's container) and four
  `fadeInUpShort` (the service cards; `translate3d(0,25px,0)` → none).
- Sliders restart their slides' effects on each transition
  (`restartSlideEffects`).
- No other motion: no parallax, no video, no marquee.

### Open questions for the operator (none blocks Phase 1)

- **Matrix.** The CSS has its own rules in the 901–1200px band
  (`grid-4-s40` three per row, margin resets), which no matrix width
  (1440·834·390) samples. Adding 1024 to `harness.json`'s matrix is the
  operator's call (matching rule 4).
- **Projects band (9).** A two-slide carousel against a stacked list:
  match the carousel, or ledger the list as a deliberate deviation.
- **Pillars and values carousels (5, 15).** Below 900px and 600px the
  reference turns these grids into carousels; the candidate keeps grids.
  Same choice as above.
