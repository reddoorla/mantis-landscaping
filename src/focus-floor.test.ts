import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Focus styling in this template is opt-in per component: the buttons on the
// fixtures page carry their own rings and everything else falls back to the
// UA's 1px hairline, which is invisible on a dark nav or over a photo hero
// (WCAG 2.4.7). There was no floor at all — `grep -a "focus-visible" src/app.css`
// returned nothing. This asserts the floor exists, since a CSS cascade rule is
// not reachable from jsdom, which resolves no stylesheets.
// Resolved from the project root, not `import.meta.url`: under the jsdom
// environment vite serves this module over http, so `new URL(..., import.meta.url)`
// is not a file: URL and readFileSync rejects it.
const css = readFileSync(resolve(process.cwd(), "src/app.css"), "utf-8");

const FLOOR_SELECTOR = ':where(a, button, summary, [tabindex]:not([tabindex="-1"])):focus-visible';

describe("the keyboard-focus floor", () => {
  it("gives every interactive element a visible outline on :focus-visible", () => {
    // Located by string, then sliced to the closing brace. A regex for the
    // selector is a trap here: `[^)]*` stops at the nested `)` inside
    // `:not([tabindex="-1"])`, so it matches nothing however good the CSS is —
    // which is exactly how a check that can only ever fail gets written.
    const at = css.indexOf(FLOOR_SELECTOR);
    expect(at, "no :focus-visible floor rule in app.css").toBeGreaterThan(-1);
    const rule = css.slice(at, css.indexOf("}", at) + 1);
    expect(rule).toMatch(/outline:\s*2px solid/);
  });

  // `:where()` contributes ZERO specificity, so the floor weighs one
  // pseudo-class and every authored `focus-visible:ring-*` still wins twice
  // over — higher specificity AND a later cascade layer. Written as a bare
  // selector it would outrank the utilities it is meant to sit under.
  it("is written with :where() so authored rings still win", () => {
    expect(css).toContain(
      ':where(a, button, summary, [tabindex]:not([tabindex="-1"])):focus-visible',
    );
  });
});

describe("the photo-strip focus ring", () => {
  const FRAME = ":where(.scroll-strip-frame):has(> .scroll-strip:focus-visible)::after";

  const tokens = Object.fromEntries(
    [...css.matchAll(/--color-([a-z-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
  const hex = (value: string) => {
    const named: Record<string, string> = { white: "#ffffff", black: "#000000" };
    const v = named[value] ?? value;
    if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`unparsed colour ${value}`);
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  };
  const lum = (rgb: number[]) => {
    const [r, g, b] = rgb.map((c) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  it("is two-tone, so one band always contrasts with the photo under it", () => {
    const at = css.indexOf(FRAME);
    expect(at, "no frame rule for the photo-strip ring in app.css").toBeGreaterThan(-1);
    const rule = css.slice(at, css.indexOf("}", at) + 1);
    expect(rule).toMatch(/position:\s*absolute/);
    expect(rule).toMatch(/pointer-events:\s*none/);
    const bands = [...rule.matchAll(/inset 0 0 0 (\d+)px var\(--color-([a-z-]+)\)/g)].map((m) => ({
      width: Number(m[1]),
      colour: hex(tokens[m[2]]),
    }));
    expect(bands).toHaveLength(2);
    expect(bands[1].width - bands[0].width).toBeGreaterThanOrEqual(2);
    const [a, b] = bands.map((band) => lum(band.colour)).sort((x, y) => y - x);
    expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(7);
  });
});

describe("the photo-strip ring in forced colors", () => {
  it("hides the strip's outline with a transparent colour, never outline: none", () => {
    const at = css.indexOf(":where(.scroll-strip-frame) > :where(.scroll-strip):focus-visible");
    expect(at, "no rule hiding the strip's own outline").toBeGreaterThan(-1);
    const rule = css.slice(at, css.indexOf("}", at) + 1);
    expect(rule).toMatch(/outline-color:\s*transparent/);
    expect(rule).not.toMatch(/outline(-style)?:\s*none/);
  });

  it("rounds the ring to the card's corners so it is not clipped there", () => {
    const at = css.indexOf(":where(.scroll-strip-frame):has(> .scroll-strip:focus-visible)::after");
    const rule = css.slice(at, css.indexOf("}", at) + 1);
    expect(rule).toMatch(/border-radius:\s*0\.5rem/);
  });
});
