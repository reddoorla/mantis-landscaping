import { chromium } from "@playwright/test";
const ANCHORS = ["Creating green spaces", "Professionally", "our Mission", "Select a Service", "The Difference", "ready to save on water", "The Takeaway", "Thoughtfully Designed", "It's time for your garden"];
const b = await chromium.launch();
try {
  for (const w of [1440, 834, 390]) {
    for (const [side, url] of [["ref", "https://mantislandscaping.com/"], ["cand", "http://localhost:5173/"]]) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      const rows = await p.evaluate((anchors) => {
        const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
        const all = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,li,span,div,section,button")];
        return anchors.map((a) => {
          const hits = all.filter((e) => norm(e.textContent).startsWith(norm(a)));
          const el = hits[0];
          const outer = hits.filter((e) => !hits.some((o) => o !== e && o.contains(e)));
          return { a, y: el ? Math.round(el.getBoundingClientRect().top + scrollY) : null, el: el ? `${el.tagName.toLowerCase()}#${el.id || ""}.${String(el.className).split(" ")[0].slice(0, 18)}` : "-", distinct: outer.length };
        });
      }, ANCHORS);
      const ys = rows.map((r) => r.y);
      const ordered = ys.every((y, i) => y !== null && (i === 0 || y > ys[i - 1]));
      console.log(`${w} ${side.padEnd(4)} ordered=${ordered} ` + rows.map((r) => `${r.y}${r.distinct > 1 ? "(x" + r.distinct + ")" : ""}`).join(" "));
      if (w === 1440) for (const r of rows) console.log(`      ${r.a.padEnd(26)} -> ${r.el}`);
      await p.close();
    }
  }
} finally { await b.close(); }
