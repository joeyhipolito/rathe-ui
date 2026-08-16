/* =========================================================================
   Scene contrast check
   =========================================================================

   axe cannot judge contrast for text sitting over a WebGL canvas. It has no
   way to know what colour is behind the glyphs, so it reports the element as
   "incomplete" rather than pass or fail. On the scene page that is 37
   elements, which means the automated pass was silent about most of the text
   on the page.

   Silence is not a pass. This measures it instead:

     1. Make every text glyph transparent, so a screenshot shows only what is
        actually behind the text: canvas, scrims, gradients, all composited.
     2. Screenshot, then read that image back into the page as pixels.
     3. For each visible text run, sample every pixel inside its box and keep
        the one that gives the WORST contrast against the text colour.
     4. Fail if any text falls below its WCAG 2.2 threshold.

   Sampling the worst pixel rather than the average is the point. An average
   hides the case that actually matters, which is a bright moon passing behind
   one corner of a paragraph.

   Usage:  node scripts/check-scene-contrast.mjs [url]
   ========================================================================= */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = fileURLToPath(new URL(".", import.meta.url));
const SCENE = resolve(here, "../scene");
const EXPLICIT_URL = process.argv[2];

/* The scene is a fixed camera path driven by scroll, so these are the
   compositions a reader actually stops on. Each is sampled separately because
   what sits behind a paragraph changes completely between them. */
const STOPS = [
  { name: "hero", scroll: 0 },
  { name: "chapter I", selector: "#game" },
  { name: "chapter II", selector: "#armory" },
  { name: "chapter III", selector: "#ascent" },
  { name: "chapter IV", selector: "#arena" },
  { name: "legacy", selector: "#legacy" },
  { name: "footer", selector: "footer" },
];

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };

async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let path = join(SCENE, decodeURIComponent(url.pathname));
      const info = await stat(path).catch(() => null);
      if (info?.isDirectory()) path = join(path, "index.html");
      res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
      res.end(await readFile(path));
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return server;
}

let server = null;
let base = EXPLICIT_URL;
if (!base) {
  server = await serve();
  base = `http://127.0.0.1:${server.address().port}/index.html`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(base, { waitUntil: "networkidle" });
await page.waitForSelector("#pre.done", { timeout: 20000 });

/* Injected rather than applied per element: setting colour to transparent on a
   stylesheet rule leaves layout, scrims, and the canvas exactly as they are,
   so the screenshot is the true background and nothing reflows. */
const HIDE_TEXT = `*, *::before, *::after { color: transparent !important;
  text-shadow: none !important; -webkit-text-fill-color: transparent !important; }`;

const failures = [];
let measured = 0;

for (const stop of STOPS) {
  if (stop.selector) {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView(), stop.selector);
  } else {
    await page.evaluate((y) => window.scrollTo(0, y), stop.scroll ?? 0);
  }
  // The camera eases toward its waypoint, so wait for it to settle before the
  // background is sampled; measuring mid-transition measures a frame no
  // reader ever stops on.
  await page.waitForTimeout(1800);

  const targets = await page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (!text) continue;
      const el = node.parentElement;
      if (!el || seen.has(el)) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      if (parseFloat(cs.opacity) < 0.15) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      // WCAG large text: 24px, or 18.66px when bold.
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      out.push({
        text: text.slice(0, 40),
        color: cs.color,
        required: large ? 3 : 4.5,
        rect: { x: Math.max(0, r.left), y: Math.max(0, r.top), w: r.width, h: r.height },
      });
    }
    return out;
  });

  await page.addStyleTag({ content: HIDE_TEXT });
  await page.waitForTimeout(120);
  const shot = (await page.screenshot({ type: "png" })).toString("base64");
  await page.evaluate(() => {
    const tags = [...document.querySelectorAll("style")];
    const last = tags[tags.length - 1];
    if (last && last.textContent?.includes("-webkit-text-fill-color")) last.remove();
  });

  const results = await page.evaluate(
    async ({ shot, targets }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + shot;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const dpr = img.width / window.innerWidth;

      const lin = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      const lum = (r, gg, b) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
      const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const parseRGB = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);

      return targets.map((t) => {
        const [tr, tg, tb] = parseRGB(t.color);
        const fg = lum(tr, tg, tb);
        const x = Math.round(t.rect.x * dpr);
        const y = Math.round(t.rect.y * dpr);
        const w = Math.max(1, Math.round(t.rect.w * dpr));
        const h = Math.max(1, Math.round(t.rect.h * dpr));
        const data = g.getImageData(x, y, Math.min(w, c.width - x), Math.min(h, c.height - y)).data;

        let worst = Infinity;
        let worstPx = null;
        // Step through the box rather than every pixel: a 4px lattice is dense
        // enough to catch a moon edge and keeps a full page under a second.
        for (let i = 0; i < data.length; i += 4 * 4) {
          const r = ratio(fg, lum(data[i], data[i + 1], data[i + 2]));
          if (r < worst) {
            worst = r;
            worstPx = [data[i], data[i + 1], data[i + 2]];
          }
        }
        return { ...t, worst, worstPx };
      });
    },
    { shot, targets },
  );

  for (const r of results) {
    measured++;
    if (r.worst < r.required) {
      failures.push({ stop: stop.name, ...r });
    }
  }
}

await browser.close();
server?.close();

console.log(`${measured} text runs measured against composited pixels across ${STOPS.length} stops.`);

if (failures.length === 0) {
  console.log("Every text run clears its WCAG 2.2 threshold at its worst pixel.");
  process.exit(0);
}

console.error(`\n${failures.length} text run(s) below threshold:\n`);
for (const f of failures) {
  console.error(
    `  ${f.stop.padEnd(12)} ${f.worst.toFixed(2)}:1 (needs ${f.required})  ` +
      `text ${f.color} over rgb(${f.worstPx?.join(",")})`,
  );
  console.error(`    "${f.text}"`);
}
process.exit(1);
