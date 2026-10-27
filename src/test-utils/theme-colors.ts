import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Test-only: resolve a Tailwind colour token through app.css's @theme block and
 * measure WCAG contrast, so a unit test can assert a computed property
 * (`contrast >= 4.5`) instead of pinning a token name. The same parse as
 * theme-contrast.test.ts.
 */

export type Rgb = [number, number, number];

const NAMED: Record<string, string> = { white: "#ffffff", black: "#000000" };

function parseThemeColors(css: string): Record<string, string> {
  const block = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  if (!block) throw new Error("app.css has no @theme block");
  const out: Record<string, string> = {};
  for (const m of block[1].matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

function toRgb(value: string, token: string): Rgb {
  const grey = /^oklch\(\s*([\d.]+)(%?)\s+0(?:\.0+)?%?\s+-?[\d.]+(?:deg)?\s*\)$/i.exec(value);
  if (grey) {
    const linear = (Number(grey[1]) / (grey[2] ? 100 : 1)) ** 3;
    const enc = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
    const c = Math.round(Math.min(1, Math.max(0, enc)) * 255);
    return [c, c, c];
  }
  const v = NAMED[value] ?? value;
  if (!v.startsWith("#"))
    throw new Error(`--color-${token} is "${value}", which cannot be measured`);
  const h = v.slice(1).length === 3 ? v.slice(1).replace(/./g, (c) => c + c) : v.slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// cwd-relative: suites run under jsdom, where import.meta.url is not a file: URL.
const colors = parseThemeColors(readFileSync(resolve(process.cwd(), "src/app.css"), "utf8"));

export function resolveToken(token: string): Rgb {
  const raw = colors[token] ?? NAMED[token];
  if (raw === undefined) throw new Error(`No --color-${token} in app.css @theme`);
  return toRgb(raw, token);
}

export function contrast(a: Rgb | string, b: Rgb | string): number {
  const [la, lb] = [a, b].map((x) => luminance(typeof x === "string" ? resolveToken(x) : x));
  const [hi, lo] = [la, lb].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The theme token behind the first unprefixed `<utility>-<token>` class in a
 * class string (`bg-`, `text-`, `border-`), skipping variants like `hover:`
 * and non-colour utilities such as `text-sm`. Null when none resolves.
 */
export function tokenOf(cls: string, utility: "bg" | "text" | "border"): string | null {
  for (const c of cls.split(/\s+/)) {
    if (c.includes(":")) continue;
    const m = new RegExp(`^${utility}-([a-z0-9-]+)$`).exec(c);
    if (m && (colors[m[1]] !== undefined || NAMED[m[1]] !== undefined)) return m[1];
  }
  return null;
}

/**
 * The text token in force on `el` (its own or the nearest ancestor's
 * `text-<token>`) and the ground behind it (the nearest `bg-<token>` on it or
 * an ancestor), as they cascade in the rendered DOM.
 */
export function textAndGround(el: Element): { text: string | null; ground: string | null } {
  let text: string | null = null;
  let ground: string | null = null;
  for (let n: Element | null = el; n && (!text || !ground); n = n.parentElement) {
    const cls = n.getAttribute("class") ?? "";
    text ??= tokenOf(cls, "text");
    ground ??= tokenOf(cls, "bg");
  }
  return { text, ground };
}

/** A theme colour class found in a class string: its variant prefix (`hover:`,
 *  `focus:`, `disabled:`; empty when none), the token, and its `/NN` alpha. */
export interface ColourClass {
  variant: string;
  token: string;
  alpha: number;
}

/**
 * Every `<utility>-<token>[/NN]` class in a class string whose token is in the
 * @theme block, variants included, so a check can cover the hover and focus
 * states as well as the resting one. Classes naming no theme token (`text-sm`,
 * Tailwind's own palette) are skipped.
 */
export function colourClasses(
  cls: string,
  utility: "bg" | "text" | "border" | "outline" | "ring",
): ColourClass[] {
  const out: ColourClass[] = [];
  for (const c of cls.split(/\s+/)) {
    const m = new RegExp(`^((?:[a-z0-9-]+:)*)${utility}-([a-z0-9-]+)(?:/(\\d+))?$`).exec(c);
    if (!m || (colors[m[2]] === undefined && NAMED[m[2]] === undefined)) continue;
    out.push({ variant: m[1], token: m[2], alpha: m[3] === undefined ? 1 : Number(m[3]) / 100 });
  }
  return out;
}

/** The unprefixed (resting-state) `<utility>-<token>[/NN]` class, or null. */
export function restingColour(cls: string, utility: "bg" | "text" | "border"): ColourClass | null {
  return colourClasses(cls, utility).find((c) => c.variant === "") ?? null;
}

/** `top` at `alpha` composited over an opaque `bottom`. */
export function over(top: Rgb | string, alpha: number, bottom: Rgb | string): Rgb {
  const [t, b] = [top, bottom].map((x) => (typeof x === "string" ? resolveToken(x) : x));
  return t.map((c, i) => Math.round(alpha * c + (1 - alpha) * b[i])) as Rgb;
}
