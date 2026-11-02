import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  audit,
  colourOf,
  computed,
  contrast,
  everyColour,
  groundOf,
  opacityOf,
  shownText,
  containerWidths,
  textColour,
  themeColour,
  unmodelled,
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
    // The pointer can rest on the button and not the dot: the group's state
    // is the caller's to give, unless the dot's own hover implies it.
    expect(() => colourOf(dot, "background-color")).toThrow(/group: \{ hover \}/);
    expect(colourOf(dot, "background-color", { group: {} })).toEqual(themeColour("gray-500"));
    expect(colourOf(dot, "background-color", { group: { hover: true } })).toEqual(
      themeColour("gray-700"),
    );
    expect(colourOf(dot, "background-color", { hover: true })).toEqual(themeColour("gray-700"));
    expect(() =>
      colourOf(dot, "background-color", { hover: true, group: { hover: false } }),
    ).toThrow(/cannot hold/);
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

  // Review round 2 of #62: each of these was dropped without an error, and
  // the helper measured a colour the visitor is not shown.
  it("refuses to guess a container query, and answers at a given container size", () => {
    const h = el(
      '<div class="@container bg-gold-deep"><h1 data-probe class="text-white @md:text-gold">x</h1></div>',
    );
    expect(() => textColour(h)).toThrow(/container query/);
    expect(() => textColour(h, { width: 1280 })).toThrow(/container query/);
    const sizes = containerWidths();
    expect(sizes.some((w) => w < 448) && sizes.some((w) => w >= 448)).toBe(true);
    expect(textColour(h, { containerWidth: 300 })).toEqual(themeColour("white"));
    expect(textColour(h, { containerWidth: 640 })).toEqual(themeColour("gold"));
    const arbitrary = el(
      '<div class="@container bg-dark"><p data-probe class="text-white [@container(min-width:20rem)]:text-dark">x</p></div>',
    );
    expect(() => textColour(arbitrary)).toThrow(/container query/);
    expect(textColour(arbitrary, { containerWidth: 400 })).toEqual(themeColour("dark"));
  });

  it("refuses to guess the colour scheme when dark: decides the value", () => {
    const band = el('<div data-probe class="bg-dark dark:bg-white text-white"></div>');
    expect(() => groundOf(band)).toThrow(/prefers-color-scheme/);
    expect(groundOf(band, { state: { dark: false } })).toEqual(themeColour("dark"));
    expect(groundOf(band, { state: { dark: true } })).toEqual(themeColour("white"));
    // A scheme query that does not touch the property asked for is no reason to throw.
    expect(textColour(band)).toEqual(themeColour("white"));
  });

  it("refuses to measure a ground painted by a gradient, an image or the background shorthand", () => {
    for (const paint of [
      "bg-linear-to-b from-white to-light",
      "bg-[url(/photo.jpg)]",
      "bg-[linear-gradient(white,white)]",
      "[background:url(/photo.jpg)_white]",
    ]) {
      const p = el(`<div class="bg-dark ${paint}"><p data-probe class="text-white">x</p></div>`);
      expect(() => groundOf(p), paint).toThrow(/paints over|background shorthand/);
    }
    // A bare colour in the shorthand is read, and a caller who names the
    // ground under a photo may still measure over it.
    const plain = el('<div class="[background:white]"><p data-probe>x</p></div>');
    expect(groundOf(plain)).toEqual(themeColour("white"));
    const photo = el(
      '<div class="bg-[url(/photo.jpg)]"><span data-probe class="bg-black/70"></span></div>',
    );
    expect(groundOf(photo, { under: "white" }).a).toBe(1);
  });

  // vida-legacy-foundation#127 round 3: a hand-written query reader answered
  // "does not hold" for queries it could not parse, and each was a false green.
  it("evaluates negated, ranged, listed and nested queries, or throws; it never guesses", () => {
    const at = (cls: string, width?: number) => {
      const h = el(`<div class="bg-dark"><p data-probe class="text-white ${cls}">x</p></div>`);
      return textColour(h, width === undefined ? {} : { width });
    };
    const gold = themeColour("gold");
    const white = themeColour("white");
    // not-lg: is `not (width >= 64rem)`; not-max-lg: is `not (width < 64rem)`.
    expect(() => at("not-lg:text-gold")).toThrow(/viewport width/);
    expect(at("not-lg:text-gold", 800)).toEqual(gold);
    expect(at("not-lg:text-gold", 1280)).toEqual(white);
    expect(at("not-max-lg:text-gold", 800)).toEqual(white);
    expect(at("not-max-lg:text-gold", 1280)).toEqual(gold);
    // `screen and`, and the legacy min-width form.
    expect(at("[@media_screen_and_(min-width:40rem)]:text-gold", 800)).toEqual(gold);
    expect(at("[@media_screen_and_(min-width:40rem)]:text-gold", 375)).toEqual(white);
    // A comma list holds when any member does.
    expect(at("[@media(width>=40rem),print]:text-gold", 800)).toEqual(gold);
    expect(at("[@media(width>=40rem),print]:text-gold", 375)).toEqual(white);
    // Nested media: both must hold.
    expect(at("md:max-lg:text-gold", 800)).toEqual(gold);
    expect(at("md:max-lg:text-gold", 1280)).toEqual(white);
    expect(at("md:max-lg:text-gold", 375)).toEqual(white);
    // Reversed and two-sided ranges are not parsed, so they throw at any width.
    expect(() => at("[@media(64rem<=width)]:text-gold", 1280)).toThrow(/cannot evaluate/);
    expect(() => at("[@media(40rem<=width<64rem)]:text-gold", 800)).toThrow(/cannot evaluate/);
    expect(() => at("[@media_only_screen]:text-gold", 800)).toThrow(/cannot evaluate/);
    // An exact width, and a prefix mixed with a range operator, are not read either.
    expect(() => at("[@media(width:640px)]:text-gold", 640)).toThrow(/cannot evaluate/);
    expect(() => at("[@media(min-width>=40rem)]:text-gold", 800)).toThrow(/cannot evaluate/);
    // Container queries take the same reader: not-@md: is `not (width >= 28rem)`.
    const c = el(
      '<div class="@container bg-dark"><p data-probe class="text-white not-@md:text-gold">x</p></div>',
    );
    expect(textColour(c, { containerWidth: 300 })).toEqual(gold);
    expect(textColour(c, { containerWidth: 640 })).toEqual(white);
  });

  it("lets a conditional block nested in a rule beat that rule's own base declaration", () => {
    // bg-linear-to-b sets --tw-gradient-position, then overrides it inside a
    // nested @supports, which (taken as supported) must win.
    const g = el('<div data-probe class="bg-linear-to-b"></div>');
    expect(computed(g, "--tw-gradient-position")).toBe("to bottom in oklab");
  });

  it("throws on a rule under an at-rule it has no model for", () => {
    const p = el('<p data-probe class="text-white [@scope(main)]:text-dark">x</p>');
    expect(() => textColour(p)).toThrow(/does not model/);
  });

  // Review round 3 of #62: each of these was a silent guess.
  it("parses a sheet holding quoted arbitrary values without losing step", () => {
    const alone = el(
      '<div class="bg-white"><p data-probe class="text-stone-300 hover:text-dark">x</p></div>',
    );
    const ratio = contrast(textColour(alone), groundOf(alone));
    expect(ratio).toBeLessThan(2);
    for (const neighbour of [
      "font-['Nunito']",
      "bg-[url('/a.jpg')]",
      "content-['x']",
      'content-["a}b"]',
    ]) {
      document.body.innerHTML = `<span class="${neighbour.replace(/"/g, "&quot;")}"></span><div class="bg-white"><p data-probe class="text-stone-300 hover:text-dark">x</p></div>`;
      const p = document.querySelector("[data-probe]")!;
      expect(contrast(textColour(p), groundOf(p)), neighbour).toBeCloseTo(ratio, 5);
      expect(textColour(p, { hover: true }), neighbour).toEqual(themeColour("dark"));
    }
  });

  it("refuses to guess pointer, hover capability, reduced motion or forced colours", () => {
    const probe = (cls: string) =>
      el(`<div class="bg-dark"><p data-probe class="text-white ${cls}">x</p></div>`);
    const dark = themeColour("dark");
    const white = themeColour("white");
    for (const [cls, given, shown] of [
      ["pointer-coarse:text-dark", { pointer: "coarse" }, dark],
      ["pointer-coarse:text-dark", { pointer: "fine" }, white],
      ["any-pointer-coarse:text-dark", { pointer: "coarse" }, dark],
      ["pointer-none:text-dark", { pointer: "none" }, dark],
      ["[@media(hover:none)]:text-dark", { canHover: false }, dark],
      ["[@media(hover:none)]:text-dark", { canHover: true }, white],
      ["motion-reduce:text-dark", { reducedMotion: true }, dark],
      ["motion-safe:text-dark", { reducedMotion: true }, white],
      ["forced-colors:text-dark", { forcedColors: true }, dark],
    ] as const) {
      const p = probe(cls);
      expect(() => textColour(p), cls).toThrow(/depends on/);
      expect(textColour(p, given), `${cls} ${JSON.stringify(given)}`).toEqual(shown);
    }
    // Tailwind's own hover: is `:hover` inside `(hover: hover)`; hovering
    // implies a device that can, so it needs no canHover.
    expect(textColour(probe("hover:text-dark"), { hover: true })).toEqual(dark);
    expect(textColour(probe("hover:text-dark"))).toEqual(white);
  });

  it("evaluates the @supports conditions it models and throws on any other", () => {
    const probe = (cls: string) =>
      el(`<div class="bg-dark"><p data-probe class="text-white ${cls}">x</p></div>`);
    expect(() => textColour(probe("not-supports-[display:grid]:text-dark"))).toThrow(
      /does not model/,
    );
    expect(() => textColour(probe("supports-[foo:bar]:text-dark"))).toThrow(/does not model/);
    // Tailwind's colour-mix upgrade is modelled: its negation never applies.
    expect(textColour(probe("not-supports-[color:color-mix(in_lab,red,red)]:text-dark"))).toEqual(
      themeColour("white"),
    );
    expect(textColour(probe("supports-[color:color-mix(in_lab,red,red)]:text-dark"))).toEqual(
      themeColour("dark"),
    );
  });

  it("models :visited and :target as states, and lists them among every colour", () => {
    for (const [cls, state] of [
      ["visited:text-dark", { visited: true }],
      ["target:text-dark", { target: true }],
    ] as const) {
      const a = el(
        `<div class="bg-dark"><a data-probe href="#x" class="text-white ${cls}">x</a></div>`,
      );
      expect(textColour(a), cls).toEqual(themeColour("white"));
      expect(textColour(a, state), cls).toEqual(themeColour("dark"));
    }
    const input = el(
      '<input data-probe class="border-dark visited:border-light target:border-gold" />',
    );
    const all = everyColour(input, "border-color");
    expect(all).toContainEqual(themeColour("light"));
    expect(all).toContainEqual(themeColour("gold"));
  });

  it("throws on a pseudo-class it does not model that could match", () => {
    const p = el('<input data-probe class="text-white invalid:text-dark" />');
    expect(() => textColour(p)).toThrow(/does not model :invalid/);
    const lang = el('<p data-probe class="text-white [&:lang(en)]:text-dark">x</p>');
    expect(() => textColour(lang)).toThrow(/does not model :lang/);
  });

  it("applies a container query only under a container, and refuses em", () => {
    const bare = el(
      '<div class="bg-dark"><p data-probe class="text-white @md:text-dark">x</p></div>',
    );
    expect(textColour(bare, { containerWidth: 640 })).toEqual(themeColour("white"));
    const em = el(
      '<div class="@container bg-dark text-[10px]"><p data-probe class="text-white @min-[30em]:text-dark">x</p></div>',
    );
    expect(() => textColour(em, { containerWidth: 400 })).toThrow(/em container query/);
  });

  // Review round 4 of #62: a state on another element never applied, and
  // effects repainted the text with no colour class; each was a false green.
  it("models a state on another element (peer, group, in, arbitrary), and throws without it", () => {
    const dark = themeColour("dark");
    const white = themeColour("white");
    const cases = [
      [
        '<div class="peer">h</div><a data-probe class="text-white peer-hover:text-dark">x</a>',
        { peer: { hover: true } },
        /peer: \{ hover \}/,
      ],
      [
        '<input class="peer" /><a data-probe class="text-white peer-focus:text-dark">x</a>',
        { peer: { focus: true } },
        /peer: \{ focus \}/,
      ],
      [
        '<input class="peer" /><a data-probe class="text-white peer-focus-visible:text-dark">x</a>',
        { peer: { focusVisible: true } },
        /peer: \{ focusVisible \}/,
      ],
      [
        '<a class="group"><span data-probe class="text-white group-focus-visible:text-dark">x</span></a>',
        { group: { focusVisible: true } },
        /group: \{ focusVisible \}/,
      ],
      [
        '<a class="group"><span data-probe class="text-white group-focus:text-dark">x</span></a>',
        { group: { focus: true } },
        /group: \{ focus \}/,
      ],
      [
        '<a class="group/card"><span data-probe class="text-white group-hover/card:text-dark">x</span></a>',
        { group: { hover: true } },
        /group: \{ hover \}/,
      ],
      [
        '<a><span data-probe class="text-white in-focus:text-dark">x</span></a>',
        { group: { focus: true } },
        /group: \{ focus \}/,
      ],
      [
        '<a class="card"><span data-probe class="text-white [.card:focus_&]:text-dark">x</span></a>',
        { group: { focus: true } },
        /group: \{ focus \}/,
      ],
    ] as const;
    for (const [html, given, hint] of cases) {
      document.body.innerHTML = `<div class="bg-dark">${html}</div>`;
      const p = document.querySelector("[data-probe]")!;
      expect(() => textColour(p), html).toThrow(hint);
      expect(textColour(p, given), html).toEqual(dark);
      const off = Object.fromEntries(Object.keys(given).map((k) => [k, {}]));
      expect(textColour(p, off), html).toEqual(white);
    }
    // A selector that names no other element's state needs nothing passed.
    expect(
      textColour(el('<div class="bg-dark"><p data-probe class="text-white">x</p></div>')),
    ).toEqual(white);
  });

  it("throws on a pseudo-element that recolours the element's own text", () => {
    for (const cls of [
      "first-line:text-dark",
      "first-letter:text-dark",
      "selection:text-dark",
      "details-content:text-dark",
    ]) {
      const p = el(`<div class="bg-dark"><p data-probe class="text-white ${cls}">x</p></div>`);
      expect(() => textColour(p), cls).toThrow(/does not model ::/);
    }
    // On an ancestor, it reaches the element's text too.
    const inner = el(
      '<div class="bg-dark text-white first-line:text-dark"><span data-probe>x</span></div>',
    );
    expect(() => textColour(inner)).toThrow(/::first-line/);
    // Another box is not this element's text.
    const before = el(
      '<div class="bg-dark"><p data-probe class="text-white before:text-dark">x</p></div>',
    );
    expect(textColour(before)).toEqual(themeColour("white"));
  });

  it("throws on an effect that repaints the colour without a colour class", () => {
    for (const cls of [
      "brightness-0",
      "invert",
      "contrast-200",
      "grayscale",
      "drop-shadow-lg",
      "mix-blend-difference",
      "bg-blend-multiply",
      "backdrop-invert",
      "bg-clip-text",
      "[-webkit-text-fill-color:#232d1b]",
      "[-webkit-text-stroke:2px_black]",
      "mask-[url(/m.svg)]",
      "animate-pulse",
      "hover:brightness-0",
    ]) {
      const p = el(`<div class="bg-dark"><p data-probe class="text-white ${cls}">x</p></div>`);
      const state = cls.startsWith("hover:") ? { hover: true } : {};
      expect(() => textColour(p, state), cls).toThrow(/does not measure through/);
      expect(() => groundOf(p, { state }), cls).toThrow(/does not measure through/);
      expect(() => opacityOf(p, state), cls).toThrow(/does not measure through/);
      expect(() => everyColour(p, "color"), cls).toThrow(/does not measure through/);
    }
    // On an ancestor too.
    const deep = el('<div class="bg-dark invert"><p data-probe class="text-white">x</p></div>');
    expect(() => textColour(deep)).toThrow(/filter/);
    // Neutral values are read as what they are.
    for (const cls of [
      "filter-none",
      "filter",
      "mix-blend-normal",
      "animate-spin",
      "hover:invert",
    ]) {
      const p = el(`<div class="bg-dark"><p data-probe class="text-white ${cls}">x</p></div>`);
      expect(textColour(p), cls).toEqual(themeColour("white"));
    }
  });

  it("refuses a fill painted over the ground by an inset shadow, an outline, or a ::before or ::after, and reads no outer shadow", () => {
    // The sliding fills of a hover state: hovered, the label is white on a
    // white fill (the CtaBanner mutants of review round 5).
    const known: [string, RegExp][] = [
      ["border-white text-white hover:shadow-[inset_20rem_0_0_0_var(--color-white)]", /inset/],
      [
        "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:bg-white",
        /::before/,
      ],
      [
        "relative isolate border-white text-white after:absolute after:inset-0 after:-z-10 hover:after:bg-white",
        /::after/,
      ],
      ["border-white text-white hover:inset-ring-[20rem] hover:inset-ring-white", /inset/],
      // The review's round-6 mutants: a gradient or an image on a ::before, a border on an
      // ::after, and an outline whose negative offset lays it across the label.
      [
        "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:bg-linear-to-r hover:before:from-white hover:before:to-white",
        /::before/,
      ],
      [
        "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:[background-image:linear-gradient(white,white)]",
        /::before/,
      ],
      [
        "relative isolate overflow-hidden border-white text-white after:absolute after:inset-0 after:-z-10 hover:after:border-[20rem] hover:after:border-white",
        /::after/,
      ],
      [
        "border-white text-white hover:outline-[20rem] hover:outline-white hover:-outline-offset-[20rem]",
        /outline/,
      ],
      // A Tailwind ring whose width is 20rem is an inset shadow; the throw names it.
      ["border-white text-white hover:ring-inset hover:ring-[20rem] hover:ring-white", /inset/],
      // Review round 7. A length in a unit this file cannot size throws, rather than reading as
      // zero (vmax, dvh), and a negative offset written as a sum or a min() is read or refused.
      ["border-white text-white hover:shadow-[inset_0_0_0_20vmax_white]", /vmax/],
      ["border-white text-white hover:inset-ring-[20dvh] hover:inset-ring-white", /dvh/],
      [
        "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:shadow-[inset_0_0_0_20vmax_white]",
        /::before/,
      ],
      [
        "border-white text-white hover:outline-[20rem] hover:outline-white hover:outline-offset-[-20vmax]",
        /vmax/,
      ],
      [
        "border-white text-white hover:outline-[20rem] hover:outline-white hover:outline-offset-[calc(0px-20rem)]",
        /outline/,
      ],
      [
        "border-white text-white hover:outline-[20rem] hover:outline-white hover:outline-offset-[min(-20rem,0px)]",
        /cannot read the length "min/,
      ],
      // A ::after whose border-image paints, with a transparent border colour.
      [
        "relative isolate overflow-hidden border-white text-white after:absolute after:inset-0 after:-z-10 hover:after:border-[20rem] hover:after:border-transparent hover:after:[border-image:linear-gradient(white,white)_1]",
        /::after/,
      ],
      // A ::before whose backdrop filter inverts what lies behind the button.
      [
        "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:backdrop-invert",
        /backdrop-filter/,
      ],
    ];
    for (const [cls, why] of known) {
      const p = el(`<div class="bg-dark"><a data-probe class="${cls}">x</a></div>`);
      expect(() => groundOf(p, { state: { hover: true } }), cls).toThrow(why);
      expect(() => groundOf(p, { state: { hover: true } }), cls).toThrow(`class="${cls}"`);
      // Resting, the fill is not painted, so the ground is the band's.
      expect(groundOf(p), cls).toEqual(themeColour("dark"));
    }
    // An outer shadow paints outside the box and is not read.
    const outer = el(
      '<div class="bg-dark"><a data-probe class="text-white hover:shadow-[0_0_0_20rem_var(--color-white)]">x</a></div>',
    );
    expect(groundOf(outer, { state: { hover: true } })).toEqual(themeColour("dark"));
    // A ::before that sets no fill (transparent) is not refused.
    const clear = el(
      '<div class="bg-dark"><a data-probe class="relative text-white before:bg-transparent hover:before:bg-transparent">x</a></div>',
    );
    expect(groundOf(clear, { state: { hover: true } })).toEqual(themeColour("dark"));
  });

  it("reads an inward ring or outline that stops short of the content, refuses one that reaches it, and skips a decoration away from the text", () => {
    // A 2px inward focus ring on a padded link stays inside the padding, so it is measured as
    // no threat (the review round 7 known-good): 2px + 2px reach, 16px of padding.
    const ring = el(
      '<div class="bg-dark"><a data-probe class="px-10 py-4 text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white">x</a></div>',
    );
    expect(groundOf(ring, { state: { focusVisible: true } })).toEqual(themeColour("dark"));
    // A decorative underline below the button, drawn by a border, is not under the label.
    const underline = el(
      '<div class="bg-dark"><a data-probe class="relative border-white text-white hover:bg-white hover:text-dark after:absolute after:inset-x-0 after:-bottom-2 after:border-b-2 after:border-white">x</a></div>',
    );
    // The link's own hover fill is the ground here (white); the underline is not part of it.
    expect(groundOf(underline, { state: { hover: true } })).toEqual(themeColour("white"));
    // A list bullet sits in the item's padding, not over its text.
    const bullet = el(
      '<div class="bg-dark"><li data-probe class="relative pl-4 text-white before:absolute before:left-0 before:top-2 before:size-2 before:rounded-full before:border before:border-gold">x</li></div>',
    );
    expect(groundOf(bullet)).toEqual(themeColour("dark"));
    // A ::before that generates no box (content none, or no content rule at all) paints nothing.
    for (const cls of [
      "relative text-white before:content-none before:bg-white",
      "relative text-white [&::before]:bg-white",
    ]) {
      const p = el(`<div class="bg-dark"><a data-probe class="${cls}">x</a></div>`);
      expect(groundOf(p), cls).toEqual(themeColour("dark"));
    }
  });

  it("refuses a ::before or ::after that may lie under the text, and reads one proved away from it (review round 8)", () => {
    // Known-bad. Hovered over the white label, each paints white where the label is, and the
    // helper cannot prove the box clear of the text: an inset or a 101% width covers it on one
    // axis, a half-height box and a 100% height are not sized in px, and a fixed box is the
    // viewport's. The controls (inset-0, inset-[-0.5rem], size-full, left-0 w-1/2) stay refused.
    const bad = [
      "relative isolate border-white text-white before:absolute before:inset-1 before:-z-10 hover:before:bg-white",
      "relative isolate border-white text-white before:absolute before:inset-px before:-z-10 hover:before:bg-white",
      "relative isolate overflow-hidden border-white text-white before:absolute before:top-0 before:left-0 before:h-full before:w-0 before:-z-10 before:bg-white hover:before:w-[101%]",
      "relative isolate border-white text-white after:absolute after:inset-x-0 after:bottom-0 after:h-1/2 after:-z-10 hover:after:bg-white",
      "relative isolate border-white text-white before:absolute before:inset-x-1 before:inset-y-0 before:-z-10 hover:before:bg-white",
      "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:bg-white",
      "relative isolate border-white text-white before:absolute before:inset-[-0.5rem] before:-z-10 hover:before:bg-white",
      "relative isolate border-white text-white before:absolute before:left-0 before:top-0 before:size-full before:-z-10 hover:before:bg-white",
      "relative isolate border-white text-white before:absolute before:left-0 before:w-1/2 before:h-full before:-z-10 hover:before:bg-white",
      "relative isolate border-white text-white before:fixed before:inset-0 before:-z-10 hover:before:bg-white",
      "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:scale-y-[20] hover:before:bg-white",
      // An auto height is its text's line when the content is text, which this file does not size,
      // so a filled box with text content hanging up into the label is refused.
      "relative pl-4 text-white before:absolute before:-bottom-2 before:content-['x'] before:bg-white hover:before:bg-white",
      // A pseudo's box is sized from its containing block's padding edge, so a 3px box at the top
      // edge of a 4px border with no padding reaches the label.
      "relative border-[4px] border-white p-0 text-white before:absolute before:top-0 before:h-[3px] before:content-[''] hover:before:bg-white",
    ];
    for (const cls of bad) {
      const p = el(`<div class="bg-dark"><a data-probe class="${cls}">x</a></div>`);
      expect(() => groundOf(p, { state: { hover: true } }), cls).toThrow(/::(before|after)/);
    }
    // Known-good. Proved away from the label, or no fill at all, so the ground is the band's. An
    // underline below the link, a bullet in the padding, and a box clear of the label at the
    // padding edge are read as away; the arrow and the required-field asterisk set text properties
    // on the pseudo (colour, weight, size), which paint no box.
    const good = [
      "relative text-white before:absolute before:-bottom-2 before:h-0.5 before:bg-gold",
      "relative pl-4 text-white before:absolute before:left-0 before:top-2 before:size-2 before:rounded-full before:bg-gold",
      "relative pt-[4px] text-white before:absolute before:top-0 before:h-[3px] before:content-[''] hover:before:bg-white",
      "relative text-white after:ml-2 after:inline-block after:font-bold after:content-['→']",
      "relative text-white after:ml-2 after:text-sm after:content-['→']",
      "relative text-white after:ml-0.5 after:text-red-500 after:content-['*']",
    ];
    for (const cls of good) {
      const p = el(`<div class="bg-dark"><a data-probe class="${cls}">x</a></div>`);
      expect(groundOf(p, { state: { hover: true } }), cls).toEqual(themeColour("dark"));
    }
    // A positive outline offset in em: the ring sits outside the box, so it is not read at all.
    const focus = el(
      '<div class="bg-dark"><a data-probe class="border-white text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[0.25em]">x</a></div>',
    );
    expect(groundOf(focus, { state: { focusVisible: true } })).toEqual(themeColour("dark"));
    // An inset shadow starts inside the padding edge: 23px of inset spread on a 24px border with
    // no padding reaches the content.
    const shadow = el(
      '<div class="bg-dark"><a data-probe class="border-[24px] border-transparent p-0 text-white hover:shadow-[inset_0_0_0_23px_white]">x</a></div>',
    );
    expect(() => groundOf(shadow, { state: { hover: true } })).toThrow(/inset/);
  });

  it("refuses a positioned pseudo that is not plain, naming the property that defeats the proof (review round 9)", () => {
    // Known-bad. The review's six mutants on the CtaBanner's inverse skin, hovered over the white
    // label. Each paints white where the label is, and each names the property that makes its box
    // unprovable: an outer shadow, a painting outline, a margin, an overconstrained inset, an
    // aspect ratio, and a translate beside `transform: none`.
    const bad: [string, RegExp][] = [
      [
        "relative isolate border-white text-white after:absolute after:inset-x-0 after:-bottom-2 after:h-0.5 after:-z-10 hover:after:shadow-[0_0_0_24px_white]",
        /box-shadow "0 0 0 24px white" is an outer shadow/,
      ],
      [
        "relative isolate border-white text-white after:absolute after:inset-x-0 after:-bottom-2 after:h-0.5 after:-z-10 hover:after:outline-[24px] hover:after:outline-solid hover:after:outline-white",
        /outline "24px solid white" paints past the box/,
      ],
      [
        "relative isolate border-white text-white before:absolute before:inset-x-0 before:top-0 before:h-3 before:mt-4 before:-z-10 hover:before:bg-white",
        /margin-top "[^"]*" moves the box/,
      ],
      [
        "relative isolate border-white text-white before:absolute before:inset-x-0 before:top-4 before:bottom-0 before:h-3 before:-z-10 hover:before:bg-white",
        /height "[^"]*" is set with both top and bottom set/,
      ],
      [
        "relative isolate border-white text-white before:absolute before:top-0 before:left-0 before:w-full before:aspect-[2/1] before:-z-10 hover:before:bg-white",
        /aspect-ratio "2\/1" sizes the box/,
      ],
      [
        "relative isolate border-white text-white before:absolute before:inset-x-0 before:-top-3 before:h-2 before:translate-y-7 before:transform-none before:-z-10 hover:before:bg-white",
        /translate "/,
      ],
    ];
    for (const [cls, why] of bad) {
      const p = el(`<div class="bg-dark"><a data-probe class="${cls}">x</a></div>`);
      expect(() => groundOf(p, { state: { hover: true } }), cls).toThrow(why);
      expect(() => groundOf(p, { state: { hover: true } }), cls).toThrow(`class="${cls}"`);
    }
    // Known-bad, named refusals (review round 9, major 2). A grow-in underline below the label and a
    // centred bullet in the padding both paint clear of the text, and both are refused by name
    // rather than measured: the transform that moves each is read, and the throw says so.
    const named: [string, RegExp][] = [
      [
        "relative border-white text-white hover:bg-white hover:text-dark after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100",
        /scale "/,
      ],
      [
        "relative border-white text-white hover:bg-white hover:text-dark before:absolute before:left-4 before:top-1/2 before:-translate-y-1/2 before:size-2 before:rounded-full before:bg-current",
        /translate "/,
      ],
    ];
    for (const [cls, why] of named) {
      const p = el(`<div class="bg-dark"><a data-probe class="${cls}">x</a></div>`);
      expect(() => groundOf(p, { state: { hover: true } }), cls).toThrow(why);
    }
    // Known-bad, nits (review round 9). An inherited outline offset is read from the parent: a
    // ring whose parent sets -20rem reaches the label.
    const inherited = el(
      '<div class="bg-dark"><span class="-outline-offset-[20rem]"><a data-probe class="text-white [outline-offset:inherit] focus-visible:outline-2 focus-visible:outline-white">x</a></span></div>',
    );
    expect(() => groundOf(inherited, { state: { focusVisible: true } })).toThrow(/outline/);
    // Known-good, nits. The same inherited offset, shallow, is read and clears the padding; and a
    // negative spread pulls the shadow's edge in, so it reaches nothing its blur and offsets do not.
    const shallow = el(
      '<div class="bg-dark"><span class="-outline-offset-[2px]"><a data-probe class="px-10 py-4 text-white [outline-offset:inherit] focus-visible:outline-2 focus-visible:outline-white">x</a></span></div>',
    );
    expect(groundOf(shallow, { state: { focusVisible: true } })).toEqual(themeColour("dark"));
    const spread = el(
      '<div class="bg-dark"><a data-probe class="border-white px-3 py-1.5 text-white shadow-[inset_0_0_0_-30px_white]">x</a></div>',
    );
    expect(groundOf(spread)).toEqual(themeColour("dark"));
    // Known-good, review round 9 major 3. A chip's stock inset focus ring stops 2px short of its
    // 4px padding, and Tailwind's stock inset input shadow (6px reach) stops at a 6px padding.
    const chip = el(
      '<div class="bg-dark"><a data-probe class="px-3 py-1 text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:-outline-offset-2">x</a></div>',
    );
    expect(groundOf(chip, { state: { focusVisible: true } })).toEqual(themeColour("dark"));
    const input = el(
      '<div class="bg-dark"><input data-probe class="border border-white px-3 py-1.5 text-white inset-shadow-sm"></div>',
    );
    expect(groundOf(input)).toEqual(themeColour("dark"));
    // The boundary, review round 9 major 3, at a 16px clearance and a 6px padding. An outline whose
    // deepest point sits at the clearance is read as clear (`>`); one 1px deeper reaches the label.
    const ringAt = (px: number) =>
      el(
        `<div class="bg-dark"><a data-probe class="px-10 py-4 text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:-outline-offset-[${px}px]">x</a></div>`,
      );
    expect(groundOf(ringAt(16), { state: { focusVisible: true } })).toEqual(themeColour("dark"));
    expect(() => groundOf(ringAt(17), { state: { focusVisible: true } })).toThrow(/outline/);
    // The same for an inset shadow against a 6px padding: its spread reaching 6px is clear, 7px is not.
    const shadowAt = (px: number) =>
      el(
        `<div class="bg-dark"><a data-probe class="border-white px-3 py-1.5 text-white shadow-[inset_0_0_0_${px}px_white]">x</a></div>`,
      );
    expect(groundOf(shadowAt(6))).toEqual(themeColour("dark"));
    expect(() => groundOf(shadowAt(7))).toThrow(/inset/);
    // Review round 9 check, major 1. The plain underline with a neutral Tailwind filter chain
    // (`blur-none` and `drop-shadow-none` expand to an empty chain) paints nothing under the label,
    // so it is read as clear; a real blur is refused, and the throw names the filter.
    const underline =
      "relative px-10 py-4 text-white after:absolute after:inset-x-0 after:-bottom-2 after:h-0.5 after:bg-white";
    for (const extra of [
      "after:blur-none",
      "after:drop-shadow-none",
      "after:blur-sm hover:after:blur-none",
      "after:[zoom:1] after:[offset-path:none] after:[border-image-outset:0]",
      "after:[zoom:normal]",
    ]) {
      const p = el(`<div class="bg-dark"><a data-probe class="${underline} ${extra}">x</a></div>`);
      expect(groundOf(p, { state: { hover: true } }), extra).toEqual(themeColour("dark"));
    }
    const blurred = el(
      `<div class="bg-dark"><a data-probe class="${underline} after:blur-[40px]">x</a></div>`,
    );
    expect(() => groundOf(blurred, { state: { hover: true } })).toThrow(
      /filter ".*" can paint past the box/,
    );
    // Review round 9 check, major 5. A `zoom` other than 1, a motion path and a border-image outset
    // each move or grow a box that the proof does not read, so each is refused by name. The dot is
    // in the padding, and the underline has a border image that paints 40px past its border box.
    const dot =
      "relative px-10 py-4 text-white before:absolute before:left-0 before:top-0 before:size-2 before:bg-white";
    const outsetLine =
      "relative px-10 py-4 text-white after:absolute after:inset-x-0 after:-bottom-2 after:h-0.5 after:border-b-2 after:border-solid after:border-white";
    const moved: [string, RegExp][] = [
      [`${dot} before:[zoom:10]`, /zoom "10" scales the box/],
      [
        `${dot} before:[offset-path:ray(90deg)] before:[offset-distance:80px]`,
        /offset-path "ray\(90deg\)" moves the box/,
      ],
      [
        `${outsetLine} after:[border-image:linear-gradient(white,white)_1] after:[border-image-outset:40px]`,
        /border-image-outset "40px" paints past the border box/,
      ],
    ];
    for (const [cls, why] of moved) {
      const p = el(`<div class="bg-dark"><a data-probe class="${cls}">x</a></div>`);
      expect(() => groundOf(p, { state: { hover: true } }), cls).toThrow(why);
    }
    // Review round 9 check, finding 4. A transparent outline on a plain pseudo is read for its
    // forced-colours demand, and the demand names the pseudo and its element.
    const hidden = el(
      `<div class="bg-dark"><a data-probe class="${underline} after:outline-hidden">x</a></div>`,
    );
    expect(() => groundOf(hidden, { state: { hover: true } })).toThrow(/::after outline on <a/);
  });

  it("reads a fill that paints nothing as unpainted, whatever spelling gives it", () => {
    // Each is a known-good for the fill check: transparent, zero-alpha, zero-width or
    // not-a-box-shadow forms of "no fill" that a designer writes instead of `transparent`.
    const clear = [
      "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:bg-white/0",
      "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:bg-[rgb(0_0_0/0)]",
      "relative isolate border-white text-white before:absolute before:inset-0 before:-z-10 hover:before:shadow-none",
      "border-white text-white hover:inset-shadow-[0_0_0_20rem] hover:inset-shadow-white/0",
      "border-white text-white ring-inset ring-0 ring-white",
      // An outline with no width, or a transparent colour, paints nothing, even inward.
      "border-white text-white hover:-outline-offset-[20rem]",
      "border-white text-white hover:outline-[20rem] hover:outline-transparent hover:-outline-offset-[20rem]",
    ];
    for (const cls of clear) {
      const p = el(`<div class="bg-dark"><a data-probe class="${cls}">x</a></div>`);
      expect(groundOf(p, { state: { hover: true } }), cls).toEqual(themeColour("dark"));
    }
    // A Tailwind shadow on an ancestor is not the child's: `--tw-*` does not inherit, so a
    // focus-ringed link inside `shadow-inner` has no inset layer of its own.
    const inner = el(
      '<div class="shadow-inner"><div class="bg-dark"><a data-probe class="text-white focus-visible:ring-2 focus-visible:ring-gold">x</a></div></div>',
    );
    expect(groundOf(inner, { state: { focusVisible: true } })).toEqual(themeColour("dark"));
    // An outward outline sits outside the box, so it is not read.
    const outward = el(
      '<div class="bg-dark"><a data-probe class="text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">x</a></div>',
    );
    expect(groundOf(outward, { state: { focusVisible: true } })).toEqual(themeColour("dark"));
  });

  it("reads (hover: hover) only for a rule that needs :hover, and never on a device that cannot", () => {
    const p = el(
      '<div class="bg-dark"><p data-probe class="text-dark [@media(hover:hover)]:[&:not(:hover)]:text-white">x</p></div>',
    );
    expect(() => textColour(p)).toThrow(/canHover/);
    expect(textColour(p, { canHover: false })).toEqual(themeColour("dark"));
    expect(textColour(p, { canHover: true })).toEqual(themeColour("white"));
    const h = el(
      '<div class="bg-dark"><p data-probe class="text-white hover:text-dark">x</p></div>',
    );
    expect(() => textColour(h, { hover: true, canHover: false })).toThrow(/cannot hover/);
    expect(textColour(h, { hover: true, canHover: true })).toEqual(themeColour("dark"));
  });

  // The allowlist is exactly what the site uses: every class in its own
  // components and routes compiles to rules this file models.
  it("models every rule the site's own classes compile to", async () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, f.name);
        if (f.isDirectory()) walk(path);
        else if (
          /\.(svelte|ts|js|html)$/.test(f.name) &&
          !/\.test\.ts$/.test(f.name) &&
          !path.includes("test-utils")
        )
          files.push(path);
      }
    };
    walk(join(process.cwd(), "src"));
    const tokens = (f: string) =>
      readFileSync(f, "utf8")
        .split(/[\s"'`{}<>]+/)
        .filter(Boolean);
    // The audit is not vacuous: it read every slice that exists (from the
    // file glob, not a count), and each one that writes a class attribute
    // gives tokens that compile to real rules (FeatureTrio only delegates).
    const slices = Object.keys(import.meta.glob("/src/lib/slices/*/index.svelte"));
    expect(slices.length).toBeGreaterThan(0);
    const scanned = new Set(files.map((f) => "/" + relative(process.cwd(), f)));
    let styled = 0;
    for (const slice of slices) {
      expect(scanned.has(slice), slice).toBe(true);
      const path = join(process.cwd(), slice);
      if (!/\bclass="/.test(readFileSync(path, "utf8"))) continue;
      styled++;
      const { rules } = await audit(tokens(path));
      expect(rules, `${slice} compiles to no rule`).toBeGreaterThan(0);
    }
    expect(styled).toBeGreaterThan(0);
    const classes = new Set(files.flatMap(tokens));
    const site = await audit([...classes]);
    expect(site.rules).toBeGreaterThan(0);
    // The sheet those classes give holds the forms the allowlist was cut to.
    expect(site.unmodelled).toEqual([]);
    // And the audit itself is live: a form outside the allowlist is reported,
    // and junk compiles to nothing.
    expect(
      await unmodelled([
        "invalid:text-dark",
        "supports-[foo:bar]:text-dark",
        "first-line:text-dark",
        "user-invalid:brightness-0",
      ]),
    ).toHaveLength(4);
    expect((await audit(["not-a-class", "<div", "{x}"])).rules).toBe(0);
  });

  it("throws on a colour it cannot read rather than skipping it", () => {
    expect(() => themeColour("hsl(10 20% 30%)")).toThrow(/cannot read/);
    expect(() => themeColour("not-a-token")).toThrow(/not defined/);
  });
});
