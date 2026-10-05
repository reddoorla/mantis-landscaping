import { chromium } from "@playwright/test";
const b = await chromium.launch();
try {
  for (const w of [1440, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto("https://mantislandscaping.com/", { waitUntil: "networkidle", timeout: 60000 });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 200) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1500)); });
    const out = await p.evaluate(() => {
      const secs = ["navigation0", "page-block-0", "page-block-1", "page-block-2", "page-block-3", "page-block-4", "page-block-7", "page-block-8", "page-block-9", "page-block-10", "footer0"];
      const res = {};
      for (const id of secs) {
        const root = document.getElementById(id);
        const cs0 = getComputedStyle(root);
        const styles = new Map();
        for (const el of root.querySelectorAll("*")) {
          if (![...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) continue;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          const k = `${cs.fontFamily.split(",")[0].replace(/"/g, "")} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls=${cs.letterSpacing} ${cs.color} ${cs.textTransform}`;
          if (!styles.has(k)) styles.set(k, `<${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}> "${el.textContent.trim().replace(/\s+/g, " ").slice(0, 34)}"`);
        }
        const imgs = [...root.querySelectorAll("[data-media]")].map((e) => `${e.dataset.media}${e.dataset.bgmedia ? "(bg)" : ""} w=${Math.round(e.getBoundingClientRect().width)}`);
        if (root.dataset.media) imgs.unshift(`${root.dataset.media}(bg,self)`);
        res[id] = { pos: cs0.position, bg: cs0.backgroundColor, styles: [...styles].map(([k, v]) => `${k} ${v}`), imgs, reveals: root.querySelectorAll(".block-effects").length, links: root.querySelectorAll("a,button,[data-link],label").length };
      }
      return res;
    });
    console.log(`######## ${w}`);
    for (const [id, r] of Object.entries(out)) {
      console.log(`== ${id} pos=${r.pos} bg=${r.bg} reveals=${r.reveals} interactive=${r.links}`);
      for (const s of r.styles) console.log("   T " + s);
      if (w === 1440) for (const i of r.imgs) console.log("   I " + i);
    }
    await p.close();
  }
} finally { await b.close(); }
