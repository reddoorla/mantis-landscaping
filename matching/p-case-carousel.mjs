import { chromium } from "@playwright/test";
const URL = process.argv[2] ?? "http://localhost:4993/projects/edible-gardens";
const b = await chromium.launch();
try {
  for (const w of [1440, 834, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(URL, { waitUntil: "networkidle" });
    const r = await p.evaluate(() => {
      const arts = [...document.querySelectorAll("article")];
      return arts.map((a) => {
        const c = a.querySelector('[aria-roledescription="carousel"]');
        const slides = c ? [...c.querySelectorAll('[aria-roledescription="slide"]')] : [];
        const vis = slides.filter((s) => getComputedStyle(s).opacity === "1").length;
        const img = a.querySelector("img").getBoundingClientRect();
        return `${c ? "carousel" : "single"} slides=${slides.length} visible=${vis} img=${Math.round(img.width)}x${Math.round(img.height)} art=${Math.round(a.getBoundingClientRect().height)}`;
      });
    });
    const next = p.locator('article [aria-label="Next slide"]').first();
    let moved = "n/a";
    if (await next.count()) {
      await next.click();
      await p.waitForTimeout(700);
      moved = await p.evaluate(() => [...document.querySelector('article [aria-roledescription="carousel"]').querySelectorAll('[aria-roledescription="slide"]')].findIndex((s) => getComputedStyle(s).opacity === "1"));
    }
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(w, JSON.stringify(r), "afterNext:", moved, "overflowX:", overflow, "errors:", errors.length);
    await p.close();
  }
} finally { await b.close(); }
