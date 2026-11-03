import { test, expect, type Page } from "@playwright/test";

// No page may be wider than the screen, and no text a visitor can see
// may run past the right edge. Ported from composition-hospitality
// tests/smoke/mobile-overflow.spec.ts (reddoorla/composition-hospitality#47, as
// of 2d70e53), which came from williamson-construction-co
// (reddoorla/williamson-construction-co#46) by way of beachfront-dentistry
// (reddoorla/beachfront-dentistry#120), for P1-90
// (reddoorla/reddoor-maintenance#1876). The P1-90 census found `/contact-us`
// 613px wide at 320 on the Blux production site (its form embed); the rebuild
// had no overflow on 2026-11-03, so the spec is here to keep it that way.
//
// A plain desktop context at the device width, because Chromium's mobile
// emulation zooms the page out to fit and hides the overflow. Only text that
// straddles the edge counts: text wholly past it is a closed menu or a carousel
// slide parked off-screen, not a cut. Text the browser does not paint (hidden,
// or opacity 0), text inside an inert subtree (a carousel's peeking slide), and
// a line the ancestors that clip it leave nothing of (the sr-only pattern, a
// slider's parked slides) are skipped. A box the visitor can scroll (overflow
// auto or scroll) hides nothing they can scroll to.

// Every visitor page the rebuild serves, all five Prismic documents published
// on 2026-11-03, each answering 200 on the dev server. They cover the four
// page templates:
// - `/`, the home page (SplitHero, FeatureTrio, Hero, ServiceCards, Steps,
//   ProjectList, TextBlock): the route `[[preview=preview]]/+page.svelte`;
// - `/projects`, a Prismic page (PageTitle, ProjectList): `[uid]/+page.svelte`;
// - `/contact-us`, its own route (`contact-us/+page.svelte`): the form, and the
//   page the census found scrolling sideways on the Blux site. This spec cannot
//   see its Turnstile widget: the widget renders only when
//   PUBLIC_TURNSTILE_SITE_KEY is set, which it is not here, and it draws into a
//   closed shadow root. A normal-size widget is 300px in a 272px column at 320
//   (reddoorla/mantis-landscaping#71), so re-check this page when the key goes on;
// - `/projects/water-wise-gardens` and `/projects/edible-gardens`, both projects
//   (SplitHero, IconRow, Steps, CaseStudies, TextBlock):
//   `projects/[uid]/+page.svelte`.
// Add each new page or project here once it publishes.
const ROUTES = [
  "/",
  "/projects",
  "/contact-us",
  "/projects/water-wise-gardens",
  "/projects/edible-gardens",
];
// The fleet's six widths, plus each width where a layout on these pages changes
// columns:
// - 601, where the footer turns to two columns (`min-[601px]:grid-cols-2`);
// - 640, where ServiceCards turns to two (`sm:grid-cols-2`) and the footer's
//   bottom row to a row (`sm:flex-row`);
// - 649 and 949, where the home page's two FeatureTrios (IconRow) turn from a
//   carousel to a grid. Those switch on container queries, not breakpoints
//   (`[@container(width<=600px)]`, `(width<=900px)`), on a content box of
//   min(width, 1152) - 48, so the "600" trio's two-column grid shows only from
//   649 to 767 and the "900" trio's grid only from 949. That assumes no
//   scrollbar, true headless; a headed run's scrollbar narrows the box.
// 768 (SplitHero, IconRow, Steps, CaseStudies, the Slider) and 1024
// (ServiceCards in one row, the desktop nav) are already in.
const WIDTHS = [320, 390, 601, 640, 649, 768, 820, 949, 1024, 1280];

async function gotoLoaded(page: Page, path: string) {
  // Reduced motion, so scroll reveals do not hold below-the-fold text at
  // opacity 0 at load (the visibility check would skip it, and a cut there
  // would pass). The shared base config already sets
  // `contextOptions.reducedMotion`; this call is a redundant safeguard.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const res = await page.goto(path, { waitUntil: "load" });
  // An unpublished page would otherwise measure the error page and pass.
  expect(res?.ok(), `${path} answered ${res?.status()}`).toBe(true);
  // Measure the hydrated page, which is what a visitor sees. On the dev server,
  // which the shared base config serves unless REDDOOR_GATE_SERVER or
  // package.json `reddoor.gateServer` is "preview" (this repo sets neither), `load` comes before hydration, so a layout chosen at hydration
  // went unmeasured. SvelteKit sets `history.scrollRestoration` to "manual" in
  // `_start_router()`, which runs only once `_hydrate()` has returned (kit
  // 3.1.0, client.js `start`). On a fresh load nothing sets it earlier:
  // `restore_reload_scroll` sets it before hydration only on a reload with a
  // saved scroll position. Two frames then let the effects that hydration
  // scheduled render.
  // A page with `csr = false`, or whose client never starts, never gets there:
  // fail with that, not with the bare test timeout. (A throw inside a child's
  // onMount does not stop `_start_router()`, so this signal still arrives.)
  // The wait is 30s inside a 60s test limit, because a cold dev server can
  // take that long to hydrate.
  await page
    .waitForFunction(() => history.scrollRestoration === "manual", undefined, {
      timeout: 30_000,
    })
    .catch((e: Error) => {
      throw new Error(
        `${path} never hydrated: history.scrollRestoration is not "manual" (${e.message})`,
      );
    });
  // Fonts after hydration, so a face that hydrated text needs is loaded too.
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
}

function measure(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const cut: string[] = [];
    // Whether a box forms a containing block for absolute and fixed
    // descendants other than by `position`: a transform in any of its forms,
    // filter or backdrop-filter, preserve-3d, paint/layout containment
    // (content-visibility: auto applies both), or will-change naming one.
    const formsBlock = (cs: CSSStyleDeclaration) =>
      cs.transform !== "none" ||
      cs.translate !== "none" ||
      cs.rotate !== "none" ||
      cs.scale !== "none" ||
      cs.perspective !== "none" ||
      cs.filter !== "none" ||
      cs.backdropFilter !== "none" ||
      cs.transformStyle === "preserve-3d" ||
      cs.contentVisibility === "auto" ||
      /paint|layout|strict|content/.test(cs.contain) ||
      /transform|translate|rotate|scale|perspective|filter/.test(cs.willChange);
    // The next box up in the flat tree: a slotted node climbs into its slot, and
    // a shadow tree's top climbs out to its host. (A closed shadow root hides
    // its slots from page script, so its clips are not seen.)
    const up = (a: Element): Element | null =>
      a.assignedSlot ??
      a.parentElement ??
      (a.parentNode instanceof ShadowRoot ? a.parentNode.host : null);
    // clip-path and mask-image clip whatever they paint, out-of-flow boxes
    // included, so they apply on every ancestor. Both are taken at the border
    // box: a mask paints nothing outside it, and clip-path is narrowed only for
    // an inset() with no negative inset (`inset(0 -100vmax)` reaches past the
    // box); any other shape leaves the line as it is.
    const clipsToBorderBox = (cs: CSSStyleDeclaration) =>
      cs.maskImage !== "none" || (/^inset\(/.test(cs.clipPath) && !cs.clipPath.includes("-"));
    // How far right a line box can be seen, or null when none of it can be seen
    // on the screen. Each ancestor that clips narrows the line, axis by axis:
    // overflow hidden and clip and paint containment show only the ancestor's
    // padding box, which leaves nothing of the sr-only pattern's 1px box or of a
    // slider's parked slides. auto and scroll let the visitor scroll anything in
    // the box's scrollable extent into view, so past one of those the line can
    // sit anywhere in its box. Overflow and containment do not apply to plain
    // inline boxes. A clipping ancestor only clips boxes whose containing block
    // it is or contains. display: contents boxes have no rect. The returned edge
    // is the line's own right edge, so text cut by a full-width clipping section
    // still fails, except where the line's own block container ends it in an
    // ellipsis (text-overflow, Tailwind's `truncate`): there the text ends where
    // the clip does.
    const seen = (start: Element, line: DOMRect): number | null => {
      let [x0, x1, y0, y1] = [line.left, line.right, line.top, line.bottom];
      let end = line.right;
      // The block container whose inline content the line is: the only box
      // whose text-overflow draws an ellipsis on it.
      let blockOf: Element | null = start;
      while (blockOf && /^(inline|contents)$/.test(getComputedStyle(blockOf).display)) {
        blockOf = up(blockOf);
      }
      // An absolute box skips static ancestors up to its containing block; a
      // fixed box skips everything up to an ancestor that forms one by
      // transform, filter or containment (usually none: then nothing clips it).
      let escaped: "" | "absolute" | "fixed" = "";
      for (let a: Element | null = start; a && a !== document.body; a = up(a)) {
        const cs = getComputedStyle(a);
        if (cs.display === "contents") continue;
        const b = a.getBoundingClientRect();
        if (clipsToBorderBox(cs)) {
          [x0, x1] = [Math.max(x0, b.left), Math.min(x1, b.right)];
          [y0, y1] = [Math.max(y0, b.top), Math.min(y1, b.bottom)];
        }
        const block = formsBlock(cs);
        const containing =
          escaped === "fixed"
            ? block
            : escaped === "absolute"
              ? cs.position !== "static" || block
              : true;
        if (containing && cs.display !== "inline") {
          escaped = "";
          // The padding box, which overflow and paint containment clip to.
          const pl = b.left + a.clientLeft;
          const pt = b.top + a.clientTop;
          const [pr, pb] = [pl + a.clientWidth, pt + a.clientHeight];
          const scrolls = (o: string) => o === "auto" || o === "scroll";
          const paint = /paint|strict|content/.test(cs.contain) || cs.contentVisibility === "auto";
          const xBefore = x1;
          if (scrolls(cs.overflowX)) {
            const l = pl - a.scrollLeft;
            if (Math.min(x1, l + a.scrollWidth) - Math.max(x0, l) <= 1) return null;
            [x0, x1] = [pl, pr];
          } else if (cs.overflowX !== "visible" || paint) {
            [x0, x1] = [Math.max(x0, pl), Math.min(x1, pr)];
          }
          if (scrolls(cs.overflowY)) {
            const t = pt - a.scrollTop;
            if (Math.min(y1, t + a.scrollHeight) - Math.max(y0, t) <= 1) return null;
            [y0, y1] = [pt, pb];
          } else if (cs.overflowY !== "visible" || paint) {
            [y0, y1] = [Math.max(y0, pt), Math.min(y1, pb)];
          }
          if (
            a === blockOf &&
            cs.textOverflow !== "clip" &&
            cs.overflowX !== "visible" &&
            x1 < xBefore - 1
          ) {
            end = Math.min(end, x1);
          }
        } else if (containing) {
          escaped = "";
        }
        if (x1 - x0 <= 1 || y1 - y0 <= 1) return null;
        if (cs.position === "fixed") escaped = "fixed";
        else if (cs.position === "absolute") escaped = "absolute";
      }
      // What the ancestors leave of it must also be on the screen.
      return x0 < vw - 1 && x1 > 1 ? end : null;
    };
    // Every text node, inside open shadow roots too.
    const texts: Text[] = [];
    const collect = (root: Node) => {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      );
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n instanceof Text) texts.push(n);
        else if (n instanceof Element && n.shadowRoot) collect(n.shadowRoot);
      }
    };
    collect(document.body);
    for (const n of texts) {
      if (!n.textContent?.trim()) continue;
      const el = n.parentElement ?? (n.parentNode instanceof ShadowRoot ? n.parentNode.host : null);
      if (!el || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      // Text the page marks inert is out of use: a carousel's peeking
      // next slide (a designed peek, not a cut), or a parked panel.
      if (el.closest("[inert]")) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      // A slotted text node is laid out inside its slot, so its clips start there.
      const start = n.assignedSlot ?? el;
      // A line counts when some of it can be seen on the screen and it
      // straddles the right edge.
      const cuts = [...range.getClientRects()].some((r) => {
        const end = seen(start, r);
        return end !== null && end > vw + 1 && r.left < vw - 1;
      });
      if (cuts) cut.push(`<${el.tagName.toLowerCase()}> "${n.textContent.trim().slice(0, 60)}"`);
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: vw,
      cut,
    };
  });
}

test.describe.configure({ timeout: 60_000 });

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const path of ROUTES) {
      test(`${path} has no horizontal overflow`, { tag: "@smoke" }, async ({ page }) => {
        await gotoLoaded(page, path);
        const { scrollWidth, clientWidth, cut } = await measure(page);
        expect(scrollWidth, `page is wider than ${clientWidth}px`).toBeLessThanOrEqual(clientWidth);
        expect(cut, `text cut off at the ${clientWidth}px edge`).toEqual([]);
      });
    }
  });
}
