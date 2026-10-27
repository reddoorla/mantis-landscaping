import { afterEach, describe, expect, it } from "vitest";
import {
  colourOf,
  computed,
  contrast,
  everyColour,
  groundOf,
  opacityOf,
  shownText,
  textColour,
  themeColour,
  viewportWidths,
} from "./theme-colors";

// The instrument's own known-good and known-bad inputs. Every contrast check
// in the suite trusts these answers, so they are proved here first, against
// values app.css's comment block measured independently.

afterEach(() => {
  document.body.innerHTML = "";
});

function el(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.querySelector("[data-probe]")! as HTMLElement;
}

describe("theme-colors", () => {
  it("reproduces the ratios app.css records", () => {
    expect(contrast("gold", "dark")).toBeCloseTo(7.48, 1);
    expect(contrast("white", "gold-deep")).toBeCloseTo(5.21, 1);
    expect(contrast("gold-deep", "light")).toBeCloseTo(4.77, 1);
    expect(contrast("white", "gold")).toBeCloseTo(1.91, 1);
  });

  it("reads Tailwind's own palette, which app.css does not redeclare", () => {
    // stone-400 is oklch(70.9% 0.01 56.259), about #a6a09b.
    const stone = themeColour("stone-400");
    expect(stone.r).toBeGreaterThan(stone.b);
    expect(contrast(stone, "white")).toBeGreaterThan(2);
    expect(contrast(stone, "white")).toBeLessThan(3);
    const p = el('<p data-probe class="text-stone-400">x</p>');
    expect(textColour(p)).toEqual(stone);
  });

  it("reads alpha and arbitrary values instead of skipping them", () => {
    const faded = el('<div class="bg-dark"><p data-probe class="text-white/40">x</p></div>');
    expect(textColour(faded).a).toBeCloseTo(0.4, 5);
    expect(contrast(textColour(faded), groundOf(faded))).toBeLessThan(4.5);
    const hex = el('<p data-probe class="text-[#ccc]">x</p>');
    expect(textColour(hex)).toEqual(themeColour("#cccccc"));
    const dim = el('<p data-probe class="opacity-[0.4]">x</p>');
    expect(opacityOf(dim)).toBeCloseTo(0.4, 5);
  });

  it("inherits text colour and walks out to the first opaque ground", () => {
    const span = el('<div class="bg-dark text-white"><p><span data-probe>x</span></p></div>');
    expect(textColour(span)).toEqual(themeColour("white"));
    expect(groundOf(span)).toEqual(themeColour("dark"));
  });

  it("reads the body's own ground and text colour when nothing else sets either", () => {
    const p = el("<p data-probe>x</p>");
    expect(groundOf(p)).toEqual(themeColour("background"));
    expect(textColour(p)).toEqual(themeColour("primary"));
  });

  it("resolves two utilities on one element by the built stylesheet's order", () => {
    const plain = el('<div data-probe class="bg-white bg-dark"></div>');
    const reversed = el('<div data-probe class="bg-dark bg-white"></div>');
    expect(groundOf(plain)).toEqual(groundOf(reversed));
    const important = el('<div data-probe class="bg-white bg-dark!"></div>');
    expect(groundOf(important)).toEqual(themeColour("dark"));
  });

  it("applies hover, focus and attribute states only when they hold", () => {
    const btn = el(
      '<button data-probe class="bg-white text-white hover:bg-dark disabled:bg-light aria-busy:opacity-50 focus-visible:outline-gold">x</button>',
    );
    expect(groundOf(btn)).toEqual(themeColour("white"));
    expect(groundOf(btn, { state: { hover: true } })).toEqual(themeColour("dark"));
    expect(colourOf(btn, "outline-color")).toBeUndefined();
    expect(colourOf(btn, "outline-color", { focusVisible: true })).toEqual(themeColour("gold"));
    (btn as HTMLButtonElement).disabled = true;
    expect(groundOf(btn)).toEqual(themeColour("light"));
    expect(opacityOf(btn)).toBe(1);
    btn.setAttribute("aria-busy", "true");
    expect(opacityOf(btn)).toBeCloseTo(0.5, 5);
    // Faded onto the white page, white text on light measures lower still.
    const { ink, ground } = shownText(btn);
    expect(contrast(ink, ground)).toBeLessThan(1.5);
  });

  it("reads group-hover through the ancestor that carries `group`", () => {
    const dot = el(
      '<button class="group"><span data-probe class="bg-gray-500 group-hover:bg-gray-700"></span></button>',
    );
    expect(colourOf(dot, "background-color")).toEqual(themeColour("gray-500"));
    expect(colourOf(dot, "background-color", { hover: true })).toEqual(themeColour("gray-700"));
  });

  it("refuses to guess a width-dependent value, and answers at a given width", () => {
    const h = el(
      '<div class="bg-gold-deep"><h1 data-probe class="text-white md:text-gold">x</h1></div>',
    );
    expect(() => textColour(h)).toThrow(/viewport width/);
    const widths = viewportWidths();
    expect(widths.some((w) => w < 768) && widths.some((w) => w >= 768)).toBe(true);
    expect(textColour(h, { width: 375 })).toEqual(themeColour("white"));
    expect(textColour(h, { width: 1280 })).toEqual(themeColour("gold"));
  });

  it("lists every colour a property can take, across states and widths", () => {
    const input = el(
      '<input data-probe class="border-secondary hover:border-stone-200 focus:border-primary aria-invalid:border-red-600 md:border-dark" />',
    );
    const all = everyColour(input, "border-color");
    for (const t of ["secondary", "stone-200", "primary", "red-600", "dark"])
      expect(all).toContainEqual(themeColour(t));
  });

  it("models the forced-colors focus fallback", () => {
    const input = el('<input data-probe class="focus:outline-hidden" />');
    expect(computed(input, "outline-style", { focus: true })).toBe("none");
    expect(computed(input, "outline", { focus: true, forcedColors: true })).toMatch(/solid/);
  });

  it("throws on a colour it cannot read rather than skipping it", () => {
    expect(() => themeColour("hsl(10 20% 30%)")).toThrow(/cannot read/);
    expect(() => themeColour("not-a-token")).toThrow(/not defined/);
  });
});
