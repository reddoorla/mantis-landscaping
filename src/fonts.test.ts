import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const PINNED: Record<string, string> = {
  "/fonts/nunito-latin.woff2": "ba344451eab25b217a165363b1982048a5e5830a0daf36577973955a04cac793",
  "/fonts/nunito-latin-ext.woff2":
    "2c8d792869818ecb253a46bc3c63c7013df7aac2f69291c3c85e5cdc94160960",
};

const html = readFileSync("src/app.html", "utf8");
const css = readFileSync("src/app.css", "utf8");

describe("the self-hosted Nunito", () => {
  it("no font is fetched from a third party", () => {
    for (const text of [html, css]) {
      expect(text).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    }
  });

  it("every @font-face source ships, sha256-pinned", () => {
    const sources = [...css.matchAll(/@font-face\s*{[^}]*?url\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(sources.sort()).toEqual(Object.keys(PINNED).sort());
    for (const src of sources) {
      const file = `static${src}`;
      expect(existsSync(file)).toBe(true);
      const sha = createHash("sha256").update(readFileSync(file)).digest("hex");
      expect(sha).toBe(PINNED[src]);
    }
  });

  it("the latin face is preloaded", () => {
    expect(html).toMatch(
      /<link\s+rel="preload"\s+href="%sveltekit\.assets%\/fonts\/nunito-latin\.woff2"\s+as="font"\s+type="font\/woff2"\s+crossorigin="anonymous"/,
    );
  });
});
