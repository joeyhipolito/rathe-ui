/* =========================================================================
   Contrast gate
   =========================================================================

   Accessibility claims are worth nothing if nobody checks them, and a token
   file is exactly the place where a contrast regression hides: someone nudges
   a colour to look better in one theme and silently breaks the other.

   This parses tokens.css, resolves every declared pair below in BOTH themes,
   and exits non-zero if any pair misses its WCAG 2.2 target. It runs in CI,
   so the palette cannot drift without the build failing.

   The pairs are declared explicitly rather than inferred. Inferring "every
   foreground against every background" produces hundreds of combinations the
   system never actually renders, and a gate that reports false failures is a
   gate people learn to skip.
   ========================================================================= */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parse, wcagContrast } from "culori";

const here = dirname(fileURLToPath(import.meta.url));
const TOKENS = resolve(here, "../src/styles/tokens.css");

type Level = "AA-normal" | "AA-large" | "AA-ui";

/** WCAG 2.2 thresholds. UI covers non-text contrast (SC 1.4.11): borders,
 *  focus indicators, and the boundary of a control against its background. */
const THRESHOLD: Record<Level, number> = {
  "AA-normal": 4.5,
  "AA-large": 3,
  "AA-ui": 3,
};

interface Pair {
  fg: string;
  bg: string;
  level: Level;
  note: string;
}

const PAIRS: Pair[] = [
  { fg: "--rathe-ink", bg: "--rathe-paper", level: "AA-normal", note: "body text on page" },
  { fg: "--rathe-ink", bg: "--rathe-surface", level: "AA-normal", note: "body text on raised surface" },
  { fg: "--rathe-ink", bg: "--rathe-surface-sunk", level: "AA-normal", note: "body text on sunken surface" },
  { fg: "--rathe-ink-muted", bg: "--rathe-paper", level: "AA-normal", note: "metadata and captions" },
  { fg: "--rathe-ink-muted", bg: "--rathe-surface", level: "AA-normal", note: "metadata on surface" },

  // Originally held to the large-text threshold on the assumption it was only
  // used for display-size timestamps. The story audit disproved that: it is
  // used at 12px for card class and stat labels. Now held to AA-normal, which
  // is the only safe rule for a token with this many call sites.
  { fg: "--rathe-ink-faint", bg: "--rathe-paper", level: "AA-normal", note: "faint labels" },
  { fg: "--rathe-ink-faint", bg: "--rathe-surface", level: "AA-normal", note: "faint labels on surface" },

  { fg: "--rathe-blood-ink", bg: "--rathe-blood", level: "AA-normal", note: "label on primary button" },
  { fg: "--rathe-danger-ink", bg: "--rathe-danger", level: "AA-normal", note: "label on destructive button" },

  { fg: "--rathe-blood", bg: "--rathe-paper", level: "AA-normal", note: "accent text and links" },
  { fg: "--rathe-danger", bg: "--rathe-paper", level: "AA-normal", note: "inline error text" },
  { fg: "--rathe-success", bg: "--rathe-paper", level: "AA-normal", note: "success text" },
  { fg: "--rathe-info", bg: "--rathe-paper", level: "AA-normal", note: "info text" },

  // Pitch chips carry a numeral, so they are text contrast, not UI contrast.
  { fg: "--rathe-pitch-red-ink", bg: "--rathe-pitch-red", level: "AA-normal", note: "pitch 1 numeral" },
  { fg: "--rathe-pitch-yellow-ink", bg: "--rathe-pitch-yellow", level: "AA-normal", note: "pitch 2 numeral" },
  { fg: "--rathe-pitch-blue-ink", bg: "--rathe-pitch-blue", level: "AA-normal", note: "pitch 3 numeral" },

  { fg: "--rathe-rule-strong", bg: "--rathe-paper", level: "AA-ui", note: "input borders (SC 1.4.11)" },
  { fg: "--rathe-focus", bg: "--rathe-paper", level: "AA-ui", note: "focus ring on page" },
  { fg: "--rathe-focus", bg: "--rathe-surface", level: "AA-ui", note: "focus ring on surface" },
];

/** Pull custom-property declarations out of one CSS block. */
function readBlock(css: string, startIndex: number): Map<string, string> {
  const out = new Map<string, string>();
  const open = css.indexOf("{", startIndex);
  if (open === -1) return out;

  let depth = 1;
  let i = open + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  const body = css.slice(open + 1, i - 1);

  for (const line of body.split("\n")) {
    const m = /^\s*(--[\w-]+)\s*:\s*([^;]+);/.exec(line);
    if (m && m[1] && m[2]) out.set(m[1], m[2].trim());
  }
  return out;
}

function resolveVar(name: string, scope: Map<string, string>): string | null {
  const seen = new Set<string>();
  let value = scope.get(name);
  while (value && value.startsWith("var(")) {
    const inner = /var\(\s*(--[\w-]+)/.exec(value)?.[1];
    if (!inner || seen.has(inner)) return null;
    seen.add(inner);
    value = scope.get(inner);
  }
  return value ?? null;
}

const css = readFileSync(TOKENS, "utf8");

const lightStart = css.indexOf(":root {");
const darkStart = css.indexOf(':root[data-theme="dark"]');
if (lightStart === -1 || darkStart === -1) {
  console.error("check-contrast: could not locate :root and :root[data-theme=\"dark\"] blocks");
  process.exit(2);
}

const light = readBlock(css, lightStart);
const darkOverrides = readBlock(css, darkStart);
// Dark inherits everything the dark block does not override.
const dark = new Map(light);
for (const [k, v] of darkOverrides) dark.set(k, v);

interface Failure {
  theme: string;
  pair: Pair;
  ratio: number;
  required: number;
}

const failures: Failure[] = [];
const rows: string[] = [];
let checked = 0;

for (const [themeName, scope] of [
  ["light", light],
  ["dark", dark],
] as const) {
  for (const pair of PAIRS) {
    const fgRaw = resolveVar(pair.fg, scope);
    const bgRaw = resolveVar(pair.bg, scope);
    if (!fgRaw || !bgRaw) {
      console.error(`check-contrast: unresolved token in ${themeName}: ${pair.fg} / ${pair.bg}`);
      process.exit(2);
    }
    const fg = parse(fgRaw);
    const bg = parse(bgRaw);
    if (!fg || !bg) {
      console.error(`check-contrast: unparseable colour in ${themeName}: ${fgRaw} / ${bgRaw}`);
      process.exit(2);
    }

    const ratio = wcagContrast(fg, bg);
    const required = THRESHOLD[pair.level];
    checked++;

    const ok = ratio >= required;
    if (!ok) failures.push({ theme: themeName, pair, ratio, required });

    rows.push(
      `${ok ? "  ok  " : " FAIL "} ${themeName.padEnd(5)} ${ratio.toFixed(2).padStart(5)}:1 ` +
        `(needs ${required})  ${pair.note}`,
    );
  }
}

console.log(rows.join("\n"));
console.log(`\n${checked} pairs checked across 2 themes.`);

if (failures.length > 0) {
  console.error(`\n${failures.length} contrast failure(s):`);
  for (const f of failures) {
    console.error(
      `  ${f.theme}: ${f.pair.fg} on ${f.pair.bg} = ${f.ratio.toFixed(2)}:1, needs ${f.required}:1 (${f.pair.note})`,
    );
  }
  process.exit(1);
}

console.log("All token pairs meet their WCAG 2.2 target in both themes.");
