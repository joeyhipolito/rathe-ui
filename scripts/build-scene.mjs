/* Inlines the scene into a single self-contained HTML file.

   The scene ships as one file on purpose: no build step, no external
   requests, no CDN. This script is the only thing between the readable
   source in scene/ and that artifact, so it stays boring on purpose. */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const scene = (f) => resolve(here, "../scene", f);
const out = process.argv[2] ?? resolve(here, "../scene/dist.html");

let html = await readFile(scene("index.html"), "utf8");

const inlines = [
  ['<link rel="stylesheet" href="fonts.css">', "fonts.css", (s) => `<style>\n${s}</style>`],
  ['<script src="three.min.js"></script>', "three.min.js", (s) => `<script>\n${s}\n</script>`],
  ['<script src="app.js"></script>', "app.js", (s) => `<script>\n${s}</script>`],
];

for (const [tag, file, wrap] of inlines) {
  if (!html.includes(tag)) throw new Error(`build-scene: could not find ${tag} in index.html`);
  const content = wrap(await readFile(scene(file), "utf8"));
  // Replacer function, not a replacement string. A string replacement treats
  // $$ as an escape for a literal $, which silently rewrote the source's
  // `const $$ = ...` helper to `const $ = ...` and made the bundle throw
  // "Identifier '$' has already been declared" at parse time.
  html = html.replace(tag, () => content);
}

const external = [...html.matchAll(/(?:src|href)="(?!#|data:|https:\/\/)([^"]+)"/g)];
if (external.length) {
  throw new Error(`build-scene: unresolved local reference(s): ${external.map((m) => m[1]).join(", ")}`);
}

await writeFile(out, html);
const bytes = Buffer.byteLength(html);
console.log(`${out}  ${(bytes / 1024).toFixed(0)} KB`);
