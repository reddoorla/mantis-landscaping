import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { compile } from "tailwindcss";

/**
 * WCAG contrast for unit tests, computed from the stylesheet the site really
 * ships, so a test can hold AA without pinning WHICH colour a designer picked.
 *
 * jsdom applies no CSS, so this does the browser's job for the part a test
 * needs. It compiles app.css with Tailwind (the same `@theme` tokens, the same
 * default palette, the same utility order the build emits) for every class in
 * the rendered document, then runs the cascade: a rule applies when jsdom's
 * own `Element.matches` says its selector matches and its media query holds,
 * and the winner is decided by `!important`, then layer (theme < base <
 * components < utilities < unlayered), then specificity, then source order.
 * Custom properties inherit, so `var(--color-*)` resolves the way it does in
 * the page. The approach is vida-legacy-foundation's `src/test/theme-contrast.ts`,
 * extended to states.
 *
 * States. `hover`, `focus`, `focusVisible` and `active` are passed in, because
 * jsdom cannot hover: the selector's pseudo-class is rewritten to a marker
 * attribute this helper sets for the call. `disabled`, `aria-*` and every
 * other attribute state come from the DOM itself, so a test puts the element
 * in that state (`button.disabled = true`) and measures. The viewport is
 * `width`; `viewportWidths()` gives one width in every range the compiled
 * sheet's media queries distinguish.
 *
 * It fails closed. A class Tailwind does not know produces no CSS, exactly as
 * in the browser. But a colour value this file cannot read throws; a rule
 * that names the element's class through a selector jsdom cannot evaluate
 * throws when it sets the property asked for; and a width-dependent rule
 * throws unless the caller passed `width`. An earlier version read class
 * names against the `@theme` block and silently skipped Tailwind's palette,
 * alpha, arbitrary values and every variant (review round 1 of #62).
 *
 * What it does not model: Svelte's scoped component styles (vitest does not
 * load them), pseudo-elements, and `@supports` (taken as supported, except the
 * `properties` layer, which only browsers without `@property` use). Out-of-
 * gamut oklch is clipped to sRGB.
 */

const root = process.cwd();
const require = createRequire(resolve(root, "package.json"));
const twDir = dirname(require.resolve("tailwindcss/package.json"));

const appCss = readFileSync(resolve(root, "src/app.css"), "utf8");
const themeVars = (css: string) =>
  [...css.slice(css.indexOf("@theme")).matchAll(/(--color-[\w-]+):\s*([^;]+);/g)].map(
    ([, name, value]) => [name, value.trim()] as [string, string],
  );
// Every colour token Tailwind's palette and app.css declare, used or not (the
// build emits only the used ones); app.css's own win, as they do in the build.
const sourceVars = new Map([
  ...themeVars(readFileSync(resolve(twDir, "theme.css"), "utf8")),
  ...themeVars(appCss),
]);

const compiler = await compile(appCss, {
  base: resolve(root, "src"),
  loadStylesheet: async (id: string, base: string) => {
    const path = id === "tailwindcss" ? resolve(twDir, "index.css") : resolve(base, id);
    return { path, base: dirname(path), content: readFileSync(path, "utf8") };
  },
});

// ---------------------------------------------------------------- the sheet

interface Decl {
  prop: string;
  value: string;
  important: boolean;
}
interface Node {
  prelude: string;
  decls: Decl[];
  children: Node[];
}

function parse(css: string): Node[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  function block(): { decls: Decl[]; children: Node[] } {
    const decls: Decl[] = [];
    const children: Node[] = [];
    let buf = "";
    let quote = "";
    let depth = 0;
    while (i < src.length) {
      const ch = src[i++];
      if (quote) {
        buf += ch;
        if (ch === quote && src[i - 2] !== "\\") quote = "";
      } else if (ch === '"' || ch === "'") {
        quote = ch;
        buf += ch;
      } else if (ch === "(") {
        depth++;
        buf += ch;
      } else if (ch === ")") {
        depth--;
        buf += ch;
      } else if (ch === "{" && depth === 0) {
        const prelude = buf.trim();
        buf = "";
        children.push({ prelude, ...block() });
      } else if (ch === "}" && depth === 0) {
        break;
      } else if (ch === ";" && depth === 0) {
        pushDecl(buf, decls, children);
        buf = "";
      } else {
        buf += ch;
      }
    }
    pushDecl(buf, decls, children);
    return { decls, children };
  }
  function pushDecl(text: string, decls: Decl[], children: Node[]) {
    const t = text.trim();
    if (!t) return;
    if (t.startsWith("@")) {
      children.push({ prelude: t, decls: [], children: [] });
      return;
    }
    const colon = t.indexOf(":");
    if (colon < 0) return;
    let value = t.slice(colon + 1).trim();
    const important = /!important$/.test(value);
    if (important) value = value.replace(/\s*!important$/, "");
    decls.push({ prop: t.slice(0, colon).trim(), value, important });
  }
  return block().children;
}

const LAYERS = ["theme", "base", "components", "utilities"];
const UNLAYERED = LAYERS.length;

interface Rule {
  /** The selector as written, and as handed to `matches` (state pseudo-classes
   *  rewritten to marker attributes). Null `test` when jsdom cannot parse it. */
  selector: string;
  test: string | null;
  specificity: number;
  layer: number;
  order: number;
  media: string[];
  decls: Decl[];
}

const STATE_PSEUDO = /:(hover|focus-visible|focus-within|focus|active)(?![\w-])/g;
const marker = (state: string) => `data-tc-${state}`;

/** Split on top-level commas (not inside parens or brackets). */
function splitList(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function specificity(sel: string): number {
  // `:where()` weighs nothing; `:is()`/`:not()`/`:has()` weigh their argument.
  let s = sel;
  for (let prev = ""; prev !== s;) {
    prev = s;
    s = s.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, "");
  }
  s = s.replace(/:(is|not|has)\(/g, " (");
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const classes =
    (s.match(/\.(?:\\.|[\w-])+/g) ?? []).length +
    (s.match(/\[[^\]]*\]/g) ?? []).length +
    (s.match(/(?<!:):[\w-]+/g) ?? []).length;
  const tags = (s.replace(/\[[^\]]*\]/g, "").match(/(?:^|[\s>+~(])([a-z][a-z0-9-]*)/g) ?? [])
    .length;
  return ids * 100 + classes * 10 + tags;
}

function collect(nodes: Node[], layer: number, media: string[], out: Rule[]) {
  for (const n of nodes) {
    const layerAt = /^@layer\s+([\w-]+)$/.exec(n.prelude);
    if (layerAt) {
      if (layerAt[1] === "properties") continue;
      collect(n.children, LAYERS.indexOf(layerAt[1]), media, out);
      continue;
    }
    if (n.prelude.startsWith("@media")) {
      collect(n.children, layer, [...media, n.prelude.slice(6).trim()], out);
      continue;
    }
    if (n.prelude.startsWith("@supports")) {
      collect(n.children, layer, media, out);
      continue;
    }
    if (n.prelude.startsWith("@")) continue;
    styleRule(splitList(n.prelude), n, layer, media, out);
  }
}

/** A style rule, and the conditional blocks nested in it (`&:hover`, a
 *  forced-colors fallback), each under its parent's selectors. */
function styleRule(sels: string[], n: Node, layer: number, media: string[], out: Rule[]) {
  for (const sel of sels) {
    if (sel.includes("::")) continue; // a pseudo-element is another box
    const rewritten = sel.replace(STATE_PSEUDO, (_, s: string) => `[${marker(s)}]`);
    let test: string | null = rewritten;
    try {
      document.documentElement.matches(rewritten);
    } catch {
      test = null;
    }
    out.push({
      selector: sel,
      test,
      specificity: specificity(sel),
      layer: layer < 0 ? UNLAYERED : layer,
      order: out.length,
      media,
      decls: n.decls,
    });
  }
  for (const c of n.children) {
    if (c.prelude.startsWith("@media"))
      styleRule(sels, c, layer, [...media, c.prelude.slice(6).trim()], out);
    else if (c.prelude.startsWith("@supports")) styleRule(sels, c, layer, media, out);
    else if (c.prelude.startsWith("&"))
      styleRule(
        sels.flatMap((p) => splitList(c.prelude).map((x) => x.replace(/&/g, p))),
        c,
        layer,
        media,
        out,
      );
    else if (!c.prelude.startsWith("@"))
      styleRule(
        sels.flatMap((p) => splitList(c.prelude).map((x) => `${p} ${x}`)),
        c,
        layer,
        media,
        out,
      );
  }
}

let cached: { size: number; rules: Rule[] } | undefined;
const seen = new Set<string>();

function sheet(): Rule[] {
  for (const el of document.querySelectorAll("[class]")) {
    for (const c of el.classList) seen.add(c);
  }
  if (cached && cached.size === seen.size) return cached.rules;
  const rules: Rule[] = [];
  collect(parse(compiler.build([...seen])), UNLAYERED, [], rules);
  cached = { size: seen.size, rules };
  return rules;
}

const escapeClass = (c: string) => c.replace(/[^\w-]/g, (ch) => `\\${ch}`);

// ---------------------------------------------------------------- state

export interface State {
  hover?: boolean;
  focus?: boolean;
  focusVisible?: boolean;
  active?: boolean;
  /** Viewport width in CSS px. Required when a width query decides the value. */
  width?: number;
  forcedColors?: boolean;
  dark?: boolean;
  reducedMotion?: boolean;
}

/** Set the marker attributes for `state` around `fn`. Hover and active reach
 *  the ancestors too, as they do in the browser; focus is the element's own. */
function withState<T>(el: Element, state: State, fn: () => T): T {
  const set: [Element, string][] = [];
  const mark = (n: Element, s: string) => {
    if (!n.hasAttribute(marker(s))) {
      n.setAttribute(marker(s), "");
      set.push([n, s]);
    }
  };
  for (let n: Element | null = el; n; n = n.parentElement) {
    if (state.hover) mark(n, "hover");
    if (state.active) mark(n, "active");
    if ((state.focus || state.focusVisible) && n !== el) mark(n, "focus-within");
  }
  if (state.focus || state.focusVisible) mark(el, "focus");
  if (state.focusVisible) mark(el, "focus-visible");
  if (state.focus || state.focusVisible) mark(el, "focus-within");
  try {
    return fn();
  } finally {
    for (const [n, s] of set) n.removeAttribute(marker(s));
  }
}

/** True, false, or the reason the query cannot be decided for this state. */
function mediaHolds(query: string, state: State): boolean | string {
  return query.split(/\s*,\s*/).some((q) => {
    const r = featureHolds(q.trim(), state);
    if (typeof r === "string") throw new Error(r);
    return r;
  });
  function featureHolds(q: string, s: State): boolean | string {
    const not = /^not\s+(?:all\s+and\s+)?(.*)$/.exec(q);
    if (not) {
      const r = featureHolds(not[1], s);
      return typeof r === "string" ? r : !r;
    }
    const parts = q.split(/\s+and\s+/);
    if (parts.length > 1) {
      for (const p of parts) {
        const r = featureHolds(p, s);
        if (r !== true) return r;
      }
      return true;
    }
    if (q === "screen" || q === "all") return true;
    if (q === "print") return false;
    const width = /^\(width\s*(>=|<=|<|>)\s*([\d.]+)(rem|px|em)\)$/.exec(q);
    if (width) {
      if (s.width === undefined)
        return `the value depends on a viewport width query "${q}"; pass { width } (see viewportWidths())`;
      const px = Number(width[2]) * (width[3] === "px" ? 1 : 16);
      return { ">=": s.width >= px, "<=": s.width <= px, "<": s.width < px, ">": s.width > px }[
        width[1]
      ]!;
    }
    const feature = /^\(([\w-]+)\s*:\s*([\w-]+)\)$/.exec(q);
    if (feature) {
      const [, name, value] = feature;
      if (name === "hover" || name === "any-hover") return value === "hover";
      if (name === "pointer" || name === "any-pointer") return value === "fine";
      if (name === "forced-colors") return (value === "active") === !!s.forcedColors;
      if (name === "prefers-color-scheme") return (value === "dark") === !!s.dark;
      if (name === "prefers-reduced-motion") return (value === "reduce") === !!s.reducedMotion;
      if (name === "prefers-contrast") return value === "no-preference";
    }
    return `theme-colors cannot evaluate the media query "${q}"`;
  }
}

/** One width in every range the compiled sheet's width queries distinguish. */
export function viewportWidths(): number[] {
  const edges = new Set<number>();
  for (const r of sheet())
    for (const m of r.media)
      for (const [, n, unit] of m.matchAll(/width\s*(?:>=|<=|<|>)\s*([\d.]+)(rem|px|em)/g))
        edges.add(Number(n) * (unit === "px" ? 1 : 16));
  const sorted = [...edges].sort((a, b) => a - b);
  return [...sorted.map((e) => e - 1), (sorted.at(-1) ?? 1279) + 1].filter((w) => w > 0);
}

// ---------------------------------------------------------------- cascade

interface Win {
  value: string;
  key: number[];
}

function compareKeys(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function namesClassOf(rule: Rule, el: Element): boolean {
  return [...el.classList].some((c) => {
    const at = rule.selector.indexOf(`.${escapeClass(c)}`);
    if (at < 0) return false;
    const next = rule.selector[at + 1 + escapeClass(c).length];
    return next === undefined || !/[\w-]/.test(next);
  });
}

/** The winning declaration of `prop` on `el` itself (no inheritance). */
function winner(el: Element, prop: string, state: State): Win | undefined {
  let best: Win | undefined;
  const consider = (value: string, key: number[]) => {
    if (!best || compareKeys(key, best.key) > 0) best = { value, key };
  };
  for (const r of sheet()) {
    const decls = r.decls.filter((d) => d.prop === prop);
    if (!decls.length) continue;
    if (r.test === null) {
      if (namesClassOf(r, el))
        throw new Error(
          `"${r.selector}" sets ${prop} on a class of this element, and theme-colors cannot evaluate that selector`,
        );
      continue;
    }
    if (!el.matches(r.test)) continue;
    if (!r.media.every((m) => mediaHolds(m, state) === true)) continue;
    for (const d of decls) {
      const layer = d.important ? UNLAYERED - r.layer : r.layer;
      consider(d.value, [d.important ? 1 : 0, 0, layer, r.specificity, r.order]);
    }
  }
  const style = (el as HTMLElement).style;
  const inline = style?.getPropertyValue(prop);
  if (inline) {
    const important = style.getPropertyPriority(prop) === "important";
    consider(inline, [important ? 1 : 0, 1, 0, 0, 0]);
  }
  return best;
}

/**
 * The value the cascade gives `prop` on `el` in `state`; undefined when no
 * rule sets it. Custom properties inherit; other properties do not here (see
 * `textColour` for `color`).
 */
export function computed(el: Element, prop: string, state: State = {}): string | undefined {
  return withState(el, state, () => {
    if (!prop.startsWith("--")) return winner(el, prop, state)?.value;
    for (let n: Element | null = el; n; n = n.parentElement) {
      const v = winner(n, prop, state)?.value;
      if (v !== undefined && v !== "inherit") return v;
    }
    return sourceVars.get(prop);
  });
}

/**
 * Which of several properties that set the same thing (a shorthand and its
 * longhands: `outline` and `outline-style`) wins on `el` in `state`, and its
 * value. Undefined when none is set.
 */
export function cascadeWinner(
  el: Element,
  props: string[],
  state: State = {},
): { prop: string; value: string } | undefined {
  return withState(el, state, () => {
    let best: { prop: string; value: string; key: number[] } | undefined;
    for (const prop of props) {
      const w = winner(el, prop, state);
      if (w && (!best || compareKeys(w.key, best.key) > 0)) best = { prop, ...w };
    }
    return best && { prop: best.prop, value: best.value };
  });
}

/**
 * Every value any rule for `el` declares for `prop`, in any state, at any
 * width or under any media query: what "every colour it can take" means. A
 * rule naming one of `el`'s classes through a selector jsdom cannot evaluate
 * counts too.
 */
export function declaredAnywhere(el: Element, prop: string): string[] {
  const all: State = { hover: true, focusVisible: true, active: true };
  return withState(el, all, () =>
    sheet()
      .filter((r) => namesClassOf(r, el) || (r.test !== null && el.matches(r.test)))
      .flatMap((r) => r.decls.filter((d) => d.prop === prop).map((d) => d.value)),
  );
}

// ---------------------------------------------------------------- colour

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED: Record<string, Rgba> = {
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
};

const num = (s: string, scale = 1) => (s.endsWith("%") ? (parseFloat(s) / 100) * scale : +s);

function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((c) => {
    const x = Math.min(1, Math.max(0, c));
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  }) as [number, number, number];
}

function parseColour(raw: string, el: Element | null, state: State): Rgba {
  const v = raw.trim();
  const named = NAMED[v.toLowerCase()];
  if (named) return named;
  if (/^currentcolor$/i.test(v)) {
    if (!el) throw new Error("currentColor outside an element");
    return textColour(el, state);
  }
  if (v === "inherit") {
    if (!el?.parentElement) return NAMED.black;
    return textColour(el.parentElement, state);
  }
  const variable = /^var\((--[\w-]+)(?:,\s*(.+))?\)$/.exec(v);
  if (variable) {
    const value = (el && computed(el, variable[1], state)) ?? sourceVars.get(variable[1]);
    const chosen = value === undefined || value === "initial" ? variable[2] : value;
    if (chosen === undefined)
      throw new Error(`${variable[1]} is not defined in the compiled theme`);
    return parseColour(chosen, el, state);
  }
  const hex = /^#([0-9a-f]{3,8})$/i.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  const rgb =
    /^rgba?\(\s*([\d.%]+)[\s,]+([\d.%]+)[\s,]+([\d.%]+)\s*(?:[/,]\s*([\d.%]+)\s*)?\)$/.exec(v);
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((c) => num(c, 255));
    return { r, g, b, a: rgb[4] === undefined ? 1 : num(rgb[4]) };
  }
  const mix = /^color-mix\(in (?:srgb|oklab|oklch), (.+?) ([\d.]+)%, transparent\)$/.exec(v);
  if (mix) {
    const c = parseColour(mix[1], el, state);
    return { ...c, a: c.a * (Number(mix[2]) / 100) };
  }
  const lch =
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+(-?[\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?)\s*)?\)$/.exec(v);
  if (lch) {
    const [r, g, b] = oklchToRgb(num(lch[1]), num(lch[2], 0.4), Number(lch[3]));
    return { r, g, b, a: lch[4] === undefined ? 1 : num(lch[4]) };
  }
  throw new Error(`theme-colors cannot read the colour "${v}"`);
}

/** A theme token (`gold-deep`), a Tailwind palette name, or any CSS colour
 *  this file reads. */
export function themeColour(tokenOrColour: string): Rgba {
  const v =
    /^[a-z][\w-]*$/i.test(tokenOrColour) && !NAMED[tokenOrColour]
      ? `var(--color-${tokenOrColour})`
      : tokenOrColour;
  return parseColour(v, document.documentElement, {});
}

/** A CSS colour value as `el` would resolve it (`var()`, `currentColor`). */
export function readColour(value: string, el: Element, state: State = {}): Rgba {
  return parseColour(value, el, state);
}

/** The text colour `el` renders in: its own `color`, else its parent's. */
export function textColour(el: Element, state: State = {}): Rgba {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const v = computed(n, "color", state);
    if (v !== undefined && v !== "inherit") return parseColour(v, n, state);
  }
  return NAMED.black;
}

/** `prop`'s colour on `el` (a border, a fill), or undefined when unset. */
export function colourOf(el: Element, prop: string, state: State = {}): Rgba | undefined {
  const v = computed(el, prop, state);
  return v === undefined ? undefined : parseColour(v, el, state);
}

/** Every colour `prop` can take on `el` (see `declaredAnywhere`), each read
 *  in the element's resting context. Throws on any it cannot read. */
export function everyColour(el: Element, prop: string): Rgba[] {
  return declaredAnywhere(el, prop).map((v) => parseColour(v, el, {}));
}

/** `el`'s opacity times every ancestor's: how much of it reaches the page. */
export function opacityOf(el: Element, state: State = {}): number {
  let o = 1;
  for (let n: Element | null = el; n; n = n.parentElement) {
    const v = computed(n, "opacity", n === el ? state : { ...state, focus: false });
    if (v !== undefined) o *= num(v);
  }
  return o;
}

/** `top` laid over `bottom`, with `top`'s alpha (times `alpha`, for a faded
 *  layer). */
export function over(top: Rgba | string, bottom: Rgba | string, alpha = 1): Rgba {
  const t = typeof top === "string" ? themeColour(top) : top;
  const b = typeof bottom === "string" ? themeColour(bottom) : bottom;
  const ta = t.a * alpha;
  const a = ta + b.a * (1 - ta);
  if (a === 0) return NAMED.transparent;
  const ch = (k: "r" | "g" | "b") => (t[k] * ta + b[k] * b.a * (1 - ta)) / a;
  return { r: ch("r"), g: ch("g"), b: ch("b"), a };
}

/**
 * The ground `el` is drawn on: every background from `el` outwards,
 * composited, until one is opaque. `within` stops the walk at that ancestor
 * (inclusive) and lays what was found over `under`: for a control floating
 * over a photo, whose real ground is the photo, not its DOM parent.
 */
export function groundOf(
  el: Element,
  opts: { within?: Element; under?: Rgba | string; state?: State } = {},
): Rgba {
  const layers: Rgba[] = [];
  for (let n: Element | null = el; n; n = n.parentElement) {
    const bg = colourOf(n, "background-color", opts.state);
    if (bg && bg.a > 0) layers.push(bg);
    if (bg?.a === 1 || n === opts.within) break;
  }
  let base: Rgba;
  if (layers.at(-1)?.a === 1) {
    base = layers.pop()!;
  } else if (opts.under !== undefined) {
    base = typeof opts.under === "string" ? themeColour(opts.under) : opts.under;
  } else {
    throw new Error("no opaque ground found; pass `under`");
  }
  return layers.reduceRight((acc, layer) => over(layer, acc), base);
}

function luminance({ r, g, b }: Rgba): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** WCAG contrast. Strings are theme tokens or CSS colours. A translucent
 *  foreground is laid over the ground first. */
export function contrast(fg: Rgba | string, bg: Rgba | string): number {
  const ground = typeof bg === "string" ? themeColour(bg) : bg;
  const ink = over(typeof fg === "string" ? themeColour(fg) : fg, ground);
  const [a, b] = [luminance(ink), luminance(ground)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * What a visitor sees of `el`'s text: its colour on its own ground, with the
 * whole element faded by its opacity onto what lies behind it.
 */
export function shownText(el: Element, state: State = {}): { ink: Rgba; ground: Rgba } {
  const ground = groundOf(el, { state });
  const behind = el.parentElement ? groundOf(el.parentElement, { state }) : ground;
  const opacity = opacityOf(el, state);
  const ink = over(textColour(el, state), ground);
  return { ink: over(ink, behind, opacity), ground: over(ground, behind, opacity) };
}
