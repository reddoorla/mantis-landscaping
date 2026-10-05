import { test, expect } from "@playwright/test";

for (const width of [1440, 1024, 834, 390]) {
  test(`the nav is 70px tall, in flow at load, and sticks after scroll at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const atLoad = await page.evaluate(() => {
      const nav = document.querySelector("nav")!.getBoundingClientRect();
      const first = document.querySelector("main section")!.getBoundingClientRect();
      return { navH: nav.height, navBottom: nav.bottom, firstTop: first.top };
    });
    expect(atLoad.navH).toBe(70);
    expect(atLoad.firstTop).toBe(atLoad.navBottom);
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect
      .poll(() => page.evaluate(() => document.querySelector("nav")!.getBoundingClientRect().top))
      .toBe(0);
  });

  test(`no scrollbar gutter at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await page.evaluate(() => document.body.clientWidth)).toBe(width);
  });

  test(`the logo sits at the 1280px container edge at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const left = await page.evaluate(
      () => document.querySelector('nav img[src="/logo.png"]')!.getBoundingClientRect().left,
    );
    const padded = width * 0.04;
    const expected = Math.max(padded, (width - 1280) / 2);
    expect(Math.abs(left - expected)).toBeLessThanOrEqual(1);
  });
}

test("an in-page anchor lands below the sticky nav", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const gap = await page.evaluate(async () => {
    const target = document.querySelectorAll("main section")[3] as HTMLElement;
    target.id = "probe-anchor";
    document.documentElement.style.scrollBehavior = "auto";
    location.hash = "#probe-anchor";
    await new Promise((r) => setTimeout(r, 300));
    const room = document.documentElement.scrollHeight - innerHeight - scrollY;
    return {
      gap: Math.round(
        target.getBoundingClientRect().top -
          document.querySelector("nav")!.getBoundingClientRect().bottom,
      ),
      room,
    };
  });
  expect(gap.room).toBeGreaterThan(0);
  expect(gap.gap).toBeGreaterThanOrEqual(0);
});

const style = (sel: string) =>
  `(() => { const s = getComputedStyle(document.querySelector(${JSON.stringify(sel)})); return [s.fontWeight, s.fontSize, s.lineHeight, s.color, s.paddingTop, s.backgroundColor].join(" "); })()`;

test("nav links are Nunito 300 16px/normal with 10px padding", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  expect(await page.evaluate(style('nav a[href="/projects"]'))).toBe(
    "300 16px normal rgb(46, 30, 21) 10px rgba(0, 0, 0, 0)",
  );
});

test("the footer is #ededed with 40px 4% padding and a 1280px inner width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const f = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector("footer")!);
    const inner = document.querySelector("footer > div")!.getBoundingClientRect().width;
    return [
      s.backgroundColor,
      s.paddingTop,
      Math.round(parseFloat(s.paddingLeft) * 10) / 10,
      inner,
    ].join(" ");
  });
  expect(f).toBe("rgb(237, 237, 237) 40px 57.6 1280");
});

test("footer links are 600 16px #444d33 with 10px padding", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  expect(await page.evaluate(style('footer a[href="/contact-us"]'))).toBe(
    "600 16px normal rgb(68, 77, 51) 10px rgba(0, 0, 0, 0)",
  );
});
