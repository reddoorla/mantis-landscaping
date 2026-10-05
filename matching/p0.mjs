import { chromium } from "@playwright/test";
const b = await chromium.launch();
try {
  for (const [side, url] of [["ref", "https://mantislandscaping.com/"], ["cand", "http://localhost:5173/dev/match/home"]]) {
    for (const w of [1440, 834, 390]) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      const r = await p.evaluate(async () => {
        await document.fonts.ready;
        const fams = new Set([...document.querySelectorAll("body *")].map((e) => { const s = getComputedStyle(e); return `${s.fontFamily.split(",")[0].replace(/"/g, "")} ${s.fontWeight}`; }));
        return { root: getComputedStyle(document.documentElement).fontSize, body: document.body.clientWidth, inner: innerWidth, used: [...fams].sort(), check300: document.fonts.check("300 1em Nunito"), check700: document.fonts.check("700 1em Nunito") };
      });
      console.log(side, w, JSON.stringify(r));
      await p.close();
    }
  }
} finally { await b.close(); }
