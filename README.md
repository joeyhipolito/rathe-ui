# Rathe UI

An accessible component system for a trading card game estate, built as a study of how [Legend Story Studios](https://legendstory.com/) ships Flesh and Blood across several very different front ends at once.

Not affiliated with, endorsed by, or produced for Legend Story Studios. Flesh and Blood and all related names are their property. Game and tournament facts referenced here come from their public rules and product pages.

## The problem this is shaped around

The estate is not one application:

| Surface | What it is | Constraint it imposes |
|---|---|---|
| Tournament tool | Server rendered Django, Bootstrap 4.6, jQuery | Cannot consume a React theme object |
| Card database | React single page app | Wants typed components |
| Marketing site | WordPress with a custom theme | Wants tokens without a build step |

A design system that only works in React solves one third of that and forces a rewrite for the rest. So the primitive here is **CSS custom properties**, and the React components are built on top of that layer rather than beside it. A Django template and a React component that both ask for the danger colour resolve to the same value.

## What is in it

Twelve components, chosen because each one carries a hard accessibility problem worth solving rather than to reach a round number.

**Form primitives** Button, Field, Select, Checkbox, RadioGroup
**Overlay and navigation** Dialog, Tabs, Toast
**Data display** DataTable, Badge, Pagination, EmptyState, Skeleton
**Domain** PitchChip, CardTile, HeroPanel, EventRow, TierBadge

The domain components encode real game concepts. Pitch values are the clearest case: in Flesh and Blood a card's pitch value is printed as a coloured strip, red for one resource, yellow for two, blue for three. That is data, so it lives in the token layer, and every pitch chip renders its numeral and carries an accessible name like `Pitch 1 (red)` rather than relying on colour.

## Accessibility is a build step, not a claim

```bash
bun run contrast
```

Parses `src/styles/tokens.css`, resolves every declared colour pair in **both** light and dark, and exits non zero if any pair misses its WCAG 2.2 target. On its first run it failed:

```
 FAIL  light  1.95:1 (needs 3)  input borders (SC 1.4.11)
 FAIL  dark   2.25:1 (needs 3)  input borders (SC 1.4.11)
```

The border colour used for text inputs was well under the 3:1 that WCAG 2.2 requires for non text contrast. It is now 3.27:1 light and 3.46:1 dark, and the gate runs in CI so it cannot drift back.

Alongside it, every component ships an axe check in its test file, and Storybook runs the accessibility addon in error mode.

## Running it

```bash
bun install
bun run storybook      # component workshop on :6008
bun run test           # unit and accessibility tests
bun run contrast       # WCAG 2.2 token gate
bun run type-check
bun run build-storybook
```

## Decisions a reviewer might question

**The select is a native `<select>`.** A custom listbox is one of the largest accessibility liabilities a design system can take on, and the native control is better on mobile and with screen readers. Styled with `appearance: none` and a CSS drawn chevron.

**Dialog is built on the native `<dialog>` element.** `showModal()` gives the top layer, an inert background, and Escape handling for free. What the platform does not give is focus restoration, so the component captures the active element before opening and returns focus on close.

**Toasts use two live regions, both created at mount.** A live region's politeness cannot be changed after it has been announced, so polite and assertive need separate containers, and screen readers do not reliably announce content injected at the same moment its live region is created. Dismiss timers pause on hover and focus; a danger toast never auto dismisses.

**Brand red and error red are different colours.** Vermilion is the game's identity colour. If error states borrow it, every destructive confirmation looks on brand and every primary button looks like a warning.

**No branch allowlist on the CI trigger.** An allowlist that drifts from the default branch name is how a pipeline silently stops running, and green and never ran look identical in a repository list.

## What is missing

- No visual regression testing. Storybook plus a snapshot runner would catch what the contrast gate cannot see.
- Tokens are not published as a versioned package, so a Django consumer would be copying a CSS file.
- The set covers primitives and a handful of domain pieces. A real estate system would need forms at scale, denser data patterns, and print styles for tournament sheets.

## How this was built

With heavy AI assistance, stated plainly rather than left to be inferred. The parts worth judging are the problem selection, the standards the work had to meet, and the review against them. The contrast gate is the clearest example: it exists because the accessibility claim had to be executable rather than asserted, and on its first run it caught a real defect in this palette.

## Licence

Code is MIT. The Flesh and Blood name, setting, and game concepts referenced are the property of Legend Story Studios and are used here only to describe the domain this study models.
