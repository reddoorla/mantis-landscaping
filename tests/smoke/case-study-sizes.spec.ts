import { test, expect } from "@playwright/test";
import { SINGLE_PHOTO_SIZES } from "../../src/lib/slices/CaseStudies/sizes";

function slotFor(sizes: string) {
  for (const entry of sizes.split(",").reduce<string[]>((acc, part) => {
    const last = acc.length ? acc[acc.length - 1] : "";
    if (last && (last.match(/\(/g) ?? []).length > (last.match(/\)/g) ?? []).length)
      acc[acc.length - 1] = `${last},${part}`;
    else acc.push(part);
    return acc;
  }, [])) {
    const trimmed = entry.trim();
    const media = trimmed.match(/^(\([^)]*\))\s+(.*)$/);
    if (!media) return trimmed;
    if (window.matchMedia(media[1]).matches) return media[2];
  }
  return "100vw";
}

for (const width of [390, 834, 1440]) {
  test(`the single-photo sizes matches the laid-out slot at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projects/water-wise-gardens");
    const { slot, described } = await page.evaluate(
      ({ sizes, pick }) => {
        const region = document.querySelector('article [role="region"]') as HTMLElement;
        const slot = region.getBoundingClientRect().width;
        const probe = document.createElement("div");
        probe.style.width = new Function("sizes", `return (${pick})(sizes)`)(sizes);
        document.body.append(probe);
        const described = probe.getBoundingClientRect().width;
        probe.remove();
        return { slot, described };
      },
      { sizes: SINGLE_PHOTO_SIZES, pick: slotFor.toString() },
    );
    expect(described).toBeGreaterThanOrEqual(slot - 2);
    expect(described).toBeLessThanOrEqual(slot + 2);
  });
}
