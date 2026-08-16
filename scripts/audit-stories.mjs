/* =========================================================================
   Story accessibility audit
   =========================================================================

   The per-component vitest axe tests check each component in isolation. That
   is not the same as checking what a consumer actually renders: a story is a
   composition, and compositions introduce their own failures, duplicate ids
   across repeated instances, heading order inside a grid, contrast that only
   appears once a variant is placed on a coloured ground.

   This walks every story in the built Storybook, runs axe against the
   rendered preview, and exits non-zero on any violation. It is the check the
   Storybook a11y addon performs interactively, made executable.

   Usage:
     bun run build-storybook
     node scripts/audit-stories.mjs [--theme dark]
   ========================================================================= */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(here, "../storybook-static");
const THEME = process.argv.includes("--theme")
  ? process.argv[process.argv.indexOf("--theme") + 1]
  : "light";

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".map": "application/json",
};

async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let path = join(ROOT, decodeURIComponent(url.pathname));
      const info = await stat(path).catch(() => null);
      if (info?.isDirectory()) path = join(path, "index.html");
      const body = await readFile(path);
      res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, port: server.address().port };
}

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;

const index = JSON.parse(await readFile(join(ROOT, "index.json"), "utf8"));
const entries = Object.values(index.entries ?? index.stories ?? {});
// Docs pages render every story of a component at once and re-report the same
// node many times; the individual stories already cover those nodes.
const stories = entries.filter((e) => e.type !== "docs");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });

const axeSource = await readFile(
  resolve(here, "../node_modules/axe-core/axe.min.js"),
  "utf8",
);

const failures = [];
let checked = 0;

for (const story of stories) {
  const url = `${base}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story&globals=theme:${THEME}`;
  await page.goto(url, { waitUntil: "networkidle" });
  // Stories that mount a portal or run an entrance transition need a beat
  // before the tree is final.
  await page.waitForTimeout(120);

  await page.evaluate(axeSource);
  const result = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document.body, {
      resultTypes: ["violations"],
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    });
  });

  checked++;
  for (const v of result.violations) {
    failures.push({
      story: story.id,
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => n.html.slice(0, 120)),
    });
  }
}

await browser.close();
server.close();

console.log(`${checked} stories audited in the ${THEME} theme.`);

if (failures.length === 0) {
  console.log("No accessibility violations.");
  process.exit(0);
}

const byRule = new Map();
for (const f of failures) {
  if (!byRule.has(f.id)) byRule.set(f.id, []);
  byRule.get(f.id).push(f);
}

console.error(`\n${failures.length} violation(s) across ${byRule.size} rule(s):\n`);
for (const [rule, list] of byRule) {
  console.error(`  ${rule} (${list[0].impact}) — ${list[0].help}`);
  for (const f of list.slice(0, 6)) {
    console.error(`    ${f.story}`);
    for (const n of f.nodes.slice(0, 2)) console.error(`      ${n}`);
  }
  if (list.length > 6) console.error(`    ...and ${list.length - 6} more stories`);
  console.error("");
}
process.exit(1);
