import { test, expect } from "@playwright/test";

for (const width of [1440, 834, 390]) {
  test(`each case-study photo is full bleed with its controls over it at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projects/edible-gardens");
    const cards = await page.evaluate((w) => {
      return [...document.querySelectorAll("article")].map((a) => {
        const A = a.getBoundingClientRect();
        const text = a.lastElementChild!.getBoundingClientRect();
        const img = a.querySelector("img")!.getBoundingClientRect();
        const col = a.firstElementChild!.getBoundingClientRect();
        const dot = a.querySelector('[aria-label="Go to slide 1"]')?.getBoundingClientRect();
        const next = a.querySelector('[aria-label="Next slide"]')?.getBoundingClientRect();
        const inside = (r?: DOMRect) =>
          !!r &&
          r.top >= img.top &&
          r.bottom <= img.bottom &&
          r.left >= img.left &&
          r.right <= img.right;
        return {
          top: Math.round(img.top - A.top),
          bottom: w >= 768 ? Math.round(A.bottom - img.bottom) : 0,
          colBottom: Math.round(col.bottom - img.bottom),
          hasDots: !!dot,
          overlapsText: w >= 768 && img.right > text.left + 0.5,
          dotInside: dot ? inside(dot) : true,
          nextInside: next ? inside(next) : true,
        };
      });
    }, width);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some((card) => card.hasDots)).toBe(true);
    for (const { hasDots: _, ...card } of cards)
      expect(card).toEqual({
        top: 0,
        bottom: 0,
        colBottom: 0,
        overlapsText: false,
        dotInside: true,
        nextInside: true,
      });
  });
}
