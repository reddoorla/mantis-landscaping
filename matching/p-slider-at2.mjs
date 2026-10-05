import { chromium } from "@playwright/test";
const b = await chromium.launch();
try {
  for (const w of [979, 978, 653, 652]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto("https://mantislandscaping.com/", { waitUntil: "networkidle", timeout: 60000 });
    await p.waitForTimeout(800);
    console.log("ref fresh", w, await p.evaluate(() => ["page-block-1", "page-block-9-item-1"].map((id) => { const g = document.getElementById(id).querySelector(".cagrid"); return (g.classList.contains("caslider") ? "SLIDER" : "grid") + "@" + g.offsetWidth; }).join(" ")));
    await p.close();
  }
  for (const w of [1440, 1024, 979, 978, 834, 653, 652, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto("http://localhost:4992/dev/match/home", { waitUntil: "networkidle" });
    console.log("cand", w, await p.evaluate(() => [...document.querySelectorAll("section")].filter((s) => /Professionally|Thoughtfully/i.test(s.textContent)).map((s) => { const g = [...s.querySelectorAll("*")].find((e) => /max-\[(899|599)px\]:hidden/.test(e.className)); return `${Math.round(g.parentElement.getBoundingClientRect().width)}/${Math.round(g.getBoundingClientRect().width)}`; }).join(" ")));
    await p.close();
  }
} finally { await b.close(); }
