import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadSiteConfig } from "./site-config";

function pngSize(path: string) {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("the configured logo sizes", () => {
  it("match the shipped file, for the nav and every footer logo", () => {
    const config = loadSiteConfig();
    const logos = [
      config.nav.logo,
      ...(config.footer.columns ?? []).flatMap((col) =>
        col.items.flatMap((item) => ("image" in item ? [item.image] : [])),
      ),
    ].filter((logo) => logo !== undefined);
    expect(logos.length).toBeGreaterThan(0);
    for (const logo of logos) {
      expect(logo.url.startsWith("/")).toBe(true);
      const real = pngSize(`static${logo.url}`);
      expect({ width: logo.width, height: logo.height }).toEqual(real);
    }
  });
});
