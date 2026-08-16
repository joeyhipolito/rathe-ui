# Rathe UI

A component system for a trading card game estate, built as a study of [Legend Story Studios](https://legendstory.com/) and Flesh and Blood.

Not affiliated with Legend Story Studios and not made for them. Flesh and Blood and all related names belong to them. The game and tournament facts referenced here come from their public rules and product pages.

## Why it is shaped this way

The estate is not one app:

| Surface | What it is | What that rules out |
|---|---|---|
| Tournament tool | Server rendered Django, Bootstrap 4.6, jQuery | Cannot read a React theme object |
| Card database | React single page app | Wants typed components |
| Marketing site | WordPress with a custom theme | Wants tokens with no build step |

A design system that only works in React solves a third of that and needs a rewrite for the rest. So the base layer here is **CSS custom properties**, because that is the one thing all three can read today. The React components sit on top of that layer instead of beside it, so a Django template and a React component that both ask for the danger colour get the same value.

## What is in it

Eighteen components. I picked them because each one has an accessibility problem that is actually hard, not to get to a round number.

**Form primitives** Button, Field, Select, Checkbox, RadioGroup
**Overlay and navigation** Dialog, Tabs, Toast
**Data display** DataTable, Badge, Pagination, EmptyState, Skeleton
**Domain** PitchChip, CardTile, HeroPanel, EventRow, TierBadge

The domain ones encode real game rules. Pitch is the clearest case. In Flesh and Blood the pitch value is printed as a coloured strip, red for one resource, yellow for two and blue for three, so it is data rather than decoration and it lives in the token layer. Every pitch chip also renders the numeral and carries a name like `Pitch 1 (red)`, because roughly one in twelve men has some colour vision deficiency and pitch is the most basic fact about a card.

## The checks

Three of them, and each one found something real on its first run.

**Token contrast.** `bun run contrast` reads the token file, resolves every declared pair in light and dark, and exits non zero if a pair misses its WCAG 2.2 target. First run:

```
 FAIL  light  1.95:1 (needs 3)  input borders (SC 1.4.11)
 FAIL  dark   2.25:1 (needs 3)  input borders (SC 1.4.11)
```

The border colour on text inputs was well under the 3:1 that WCAG 2.2 asks for on non text contrast. It is 3.27:1 and 3.46:1 now.

**Every story, both themes.** `bun run audit:stories` walks all 113 stories in the built Storybook and runs axe on each rendered preview, because checking a component on its own is not the same as checking what a consumer renders. It found a token I had exempted myself. The faintest ink was held to the large text threshold on my own note that it was only used for display sized timestamps, and it was being used at 12px for card class and stat labels. It is held to 4.5:1 now like everything else.

**Text over the canvas.** `bun run audit:scene` is the one I did not expect to need. The scene passed its accessibility tests and that did not mean much, because axe cannot see what is behind text when it sits on a WebGL canvas. It marks those as incomplete rather than failing them, and I was only checking failures. 37 elements were in that state, which was most of the text on the page.

So it measures instead. It makes every glyph transparent, screenshots the page so the image holds only what is behind the text, reads that back in as pixels, and for each text run keeps the pixel that gives the worst contrast. Worst rather than average, because the average hides the moon passing behind one corner of a paragraph. First run put 77 of 233 runs under threshold, with the footer at 2.78:1 and the chapter rail at 1.03:1. All 233 clear now.

## Running it

```bash
bun install
bun run storybook        # component workshop on :6008
bun run test             # unit and accessibility tests
bun run contrast         # WCAG 2.2 token gate
bun run audit:stories    # axe over every story
bun run build:scene      # inline the scene into one HTML file
bun run audit:scene      # contrast over the composited scene
bun run type-check
```

## Decisions a reviewer might question

**The select is a native `<select>`.** A custom listbox is one of the biggest accessibility liabilities a design system can take on, and the native control is better on mobile and with screen readers. The cost is that the option list cannot be styled, which I think is worth it here.

**Dialog is built on the native `<dialog>` element.** `showModal()` gives the top layer, an inert background and Escape handling without reimplementing any of it. What it does not give is focus restoration, so the component stores the active element before opening and puts focus back on close.

**Toasts use two live regions, both created at mount.** A live region cannot change politeness after it has been announced, so polite and assertive need separate containers, and screen readers do not reliably announce content that arrives at the same moment its live region does.

**Brand red and error red are different tokens.** If error states borrow the identity colour then every destructive dialog looks on brand and every primary button looks like a warning.

**No branch allowlist on the CI trigger.** An allowlist that drifts from the default branch name is how a pipeline quietly stops running, and green and never ran look the same in a repository list.

## What is missing

- No visual regression testing. Storybook plus a snapshot runner would catch what the contrast gates cannot see.
- Tokens are not published as a versioned package, so a Django consumer would be copying a CSS file rather than depending on one.
- The set covers primitives and a few domain pieces. A real estate system would want forms at scale, denser data patterns, and print styles for tournament sheets.

## How this was built

I used AI heavily. I am saying that up front because you would probably notice anyway, and because the part worth judging is not the typing. It is which problem to pick, what the work had to pass before I kept it, and reading back what came out against that. The three checks above are the clearest version of it, since each one failed first and found something real in my own work.

## Licence

Code is MIT. The Flesh and Blood name, setting and game concepts referenced here belong to Legend Story Studios and are used only to describe the domain this study models.
