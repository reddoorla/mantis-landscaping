import { chromium } from "@playwright/test";
const [url, sel] = [process.argv[2], process.argv[3]];
const b = await chromium.launch();
try {
  for (const w of [1440, 834, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 200) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1200)); });
    const rows = await p.evaluate((sel) => [...document.querySelectorAll(sel)].map((s) => {
      const r = s.getBoundingClientRect();
      const t = (s.innerText || "").replace(/\s+/g, " ").trim();
      return `${(s.id || s.tagName.toLowerCase() + "." + String(s.className).split(" ")[0]).padEnd(28)} y=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} "${t.slice(0, 60)}"`;
    }), sel);
    console.log(`== ${w}`); for (const r of rows) console.log("  " + r);
    await p.close();
  }
} finally { await b.close(); }
