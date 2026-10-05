import { chromium } from "@playwright/test";
const URL = process.argv[2] ?? "http://localhost:4992/dev/match/home";
const b = await chromium.launch();
try {
  for (const w of [964, 963, 664, 663]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(URL, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() =>
      [...document.querySelectorAll("section")].filter((s) => /Professionally|Thoughtfully/i.test(s.textContent)).map((s) => {
        const shown = (el) => getComputedStyle(el).display !== "none" && el.getClientRects().length > 0;
        const grids = [...s.querySelectorAll("*")].filter((e) => /@container\(width<=(900|600)px\)\]:hidden/.test(e.className?.baseVal ?? e.className));
        const car = [...s.querySelectorAll("*")].filter((e) => /@container\(width>(900|600)px\)\]:hidden/.test(e.className?.baseVal ?? e.className));
        const slides = car[0] ? [...car[0].querySelectorAll("[aria-roledescription=slide], li")].map((li) => getComputedStyle(li).opacity).join(",") : "";
        return { h: Math.round(s.getBoundingClientRect().height), grid: grids.map(shown), car: car.map(shown), slides, btns: [...s.querySelectorAll("button")].filter(shown).map((x) => x.getAttribute("aria-label")).join("|") };
      }),
    );
    console.log(w, JSON.stringify(r));
    await p.close();
  }
} finally { await b.close(); }
