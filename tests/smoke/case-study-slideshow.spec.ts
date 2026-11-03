import { test, expect } from "@playwright/test";
import { hydrated, HYDRATION_TEST_TIMEOUT_MS } from "./hydration";

test.describe.configure({ timeout: HYDRATION_TEST_TIMEOUT_MS });

for (const path of ["/projects/edible-gardens", "/projects/water-wise-gardens"])
  for (const width of [1440, 834, 390, 320]) {
    test(
      `${path}: each case-study photo stays clear of the text, its controls are not clipped, and no line of its text is cut off sideways or clamped at ${width}px`,
      { tag: "@smoke" },
      async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        // The dots and arrows are drawn by the slideshow's own script, and an
        // overflow its onMount makes is not on screen until the client has run.
        await hydrated(page);
        const cards = await page.evaluate(() => {
          // An element is clipped when an ancestor that clips its overflow does
          // not wholly contain it. A control stops at its card; text walks on to
          // the page (card null), so a card the page clips is caught too.
          const clipped = (el: Element, card: Element | null) => {
            const r0 = el.getBoundingClientRect();
            const pos = getComputedStyle(el).position;
            // An absolute or fixed element is cut only by ancestors that hold its
            // containing block, and neither scrolls with nor is cut by the others.
            // The containing block is read from offsetParent, so it misses a
            // transform, filter or contain on an unpositioned ancestor; and the
            // escape is read on the element itself, not on a positioned wrapper.
            const escapes = (p: Element) =>
              (pos === "absolute" || pos === "fixed") &&
              !p.contains((el as HTMLElement).offsetParent);
            // How far a scroller can still move back and forward on an axis. Its
            // origin is not always the top left: it is on the right in RTL and at
            // the far end of a reversed flex box, so the range is measured.
            const span = (p: Element, k: "scrollLeft" | "scrollTop") => {
              const v = p[k];
              p[k] = -1e9;
              const lo = p[k];
              p[k] = 1e9;
              const hi = p[k];
              p[k] = v;
              return [v - lo, hi - v];
            };
            // The extent still to be shown: past a scroller, the content is
            // reachable only inside the scroller's own box, so on that axis the
            // scroller's box is what the next ancestor must not cut.
            const r = { left: r0.left, right: r0.right, top: r0.top, bottom: r0.bottom };
            for (let p = el.parentElement; p; p = p.parentElement) {
              const s = getComputedStyle(p);
              // Only hidden or clip cuts: a scroller (auto, scroll) keeps its
              // content reachable, and each axis is read on its own.
              const cuts = (v: string) => v === "hidden" || v === "clip";
              const scrolls = (v: string) => v === "auto" || v === "scroll";
              const c = p.getBoundingClientRect();
              if (escapes(p)) {
                if (p === card) break;
                continue;
              }
              if (
                (cuts(s.overflowX) && (r.left < c.left - 0.5 || r.right > c.right + 0.5)) ||
                (cuts(s.overflowY) && (r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5))
              )
                return true;
              // Past a scroller the content is reachable on that axis only as far
              // as it scrolls: content pushed before its origin (a negative margin,
              // a translate) is cut, on whichever side the origin sits.
              const inX = c.left + p.clientLeft;
              const inY = c.top + p.clientTop;
              if (scrolls(s.overflowX)) {
                const [back, fwd] = span(p, "scrollLeft");
                if (r.left < inX - back - 0.5 || r.right > inX + p.clientWidth + fwd + 0.5)
                  return true;
                [r.left, r.right] = [c.left, c.right];
              }
              if (scrolls(s.overflowY)) {
                const [back, fwd] = span(p, "scrollTop");
                if (r.top < inY - back - 0.5 || r.bottom > inY + p.clientHeight + fwd + 0.5)
                  return true;
                [r.top, r.bottom] = [c.top, c.bottom];
              }
              if (p === card) break;
            }
            return false;
          };
          return [...document.querySelectorAll("article")].map((a) => {
            const text = a.lastElementChild!.getBoundingClientRect();
            const img = a.querySelector("img")!.getBoundingClientRect();
            const controls = [
              ...a.querySelectorAll('[aria-label^="Go to slide"], [aria-label$="slide"]'),
            ];
            return {
              hasDots: !!a.querySelector('[aria-label="Go to slide 1"]'),
              // The photo covers the text only where the two boxes intersect on
              // both axes. Where the card stacks the text under the photo, the
              // boxes share no rows, so this holds at any width and names no
              // breakpoint.
              overlapsText:
                img.right > text.left + 0.5 &&
                img.left < text.right - 0.5 &&
                img.bottom > text.top + 0.5 &&
                img.top < text.bottom - 0.5,
              clippedControls: controls
                .filter((c) => clipped(c, a))
                .map((c) => c.getAttribute("aria-label")),
              // Text the page cuts off. An element that holds its own text is
              // flagged when its content is wider than its box (a line that does
              // not wrap, with or without an ellipsis), when its content is taller
              // than its box by more than 4px (a title clamped to fewer lines;
              // descenders add about 1px per line, measured 1px on a one-line
              // title and 2px on a two-line one), or when its box leaves a clipping
              // ancestor up to the page. Inline elements have no box to measure
              // for overflow, so only their rect is checked. Out-of-flow decoration
              // hung outside a title's box (a pseudo-element, say) counts too, since
              // scrollWidth includes it.
              clippedText: [a.lastElementChild!, ...a.lastElementChild!.querySelectorAll("*")]
                .filter((el) =>
                  [...el.childNodes].some(
                    (n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim() !== "",
                  ),
                )
                .filter((el) => {
                  const s = getComputedStyle(el);
                  // Visually-hidden text (sr-only) is meant to be clipped.
                  if (s.clipPath === "inset(50%)" || s.clip === "rect(0px, 0px, 0px, 0px)")
                    return false;
                  return (
                    (s.display !== "inline" &&
                      ((s.overflowX !== "auto" &&
                        s.overflowX !== "scroll" &&
                        el.scrollWidth > el.clientWidth + 0.5) ||
                        ((s.overflowY === "hidden" || s.overflowY === "clip") &&
                          el.scrollHeight > el.clientHeight + 4))) ||
                    clipped(el, null)
                  );
                })
                .map((el) => el.textContent!.trim().slice(0, 40)),
            };
          });
        });
        expect(cards.length).toBeGreaterThan(0);
        expect(cards.some((card) => card.hasDots)).toBe(true);
        for (const { hasDots: _, ...card } of cards)
          expect(card).toEqual({
            overlapsText: false,
            clippedControls: [],
            clippedText: [],
          });
      },
    );
  }
