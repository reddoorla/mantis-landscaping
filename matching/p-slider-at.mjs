import { chromium } from "@playwright/test";
const b = await chromium.launch();
try {
  const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await p.goto("https://mantislandscaping.com/", { waitUntil: "networkidle", timeout: 60000 });
  for (const w of [1200, 1100, 1000, 990, 980, 979, 978, 977, 976, 970, 960, 940, 920, 900, 700, 660, 655, 652, 651, 650, 649, 640, 620, 600]) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.evaluate(() => window.dispatchEvent(new Event("resize")));
    await p.waitForTimeout(400);
    const r = await p.evaluate(() =>
      ["page-block-1", "page-block-9-item-1"].map((id) => {
        const g = document.getElementById(id)?.querySelector(".cagrid");
        if (!g) return id + ":none";
        let par = g, cw = par.offsetWidth, i = 0;
        while (!par.offsetWidth && i++ < 10) { par = par.parentNode; cw = par.offsetWidth; }
        return `${g.classList.contains("caslider") ? "SLIDER" : "grid"}@${cw}`;
      }),
    );
    console.log(w, r.join("  "));
  }
} finally { await b.close(); }
