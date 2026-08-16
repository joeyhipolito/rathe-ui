import type { Meta, StoryObj } from "@storybook/react";
import { HeroPanel } from "./HeroPanel";

const meta = {
  title: "Domain/HeroPanel",
  component: HeroPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "Every player in Flesh and Blood is a hero, and the hero card is the one card that",
          "never leaves the table. It sets the class the deck may be built from, the talents",
          "that widen that pool, the intellect the player draws back up to each turn, and the",
          "life total the whole game is spent taking away. This panel is the deck header and",
          "the player profile.",
          "",
          "Two decisions worth knowing about:",
          "",
          "- **The stats are a `<dl>`, and every number is labelled.** A bare `4` beside a bare",
          "  `40` is meaningless to a new player and reads as two loose numbers to a screen",
          "  reader. Each term also carries a plain-language hint — intellect is *cards drawn",
          "  to*, life is a *starting total* — because the words themselves are jargon.",
          "- **`headingLevel` is a prop.** The panel heads a deck in one surface and a profile",
          "  in another; hard-coding an `h3` would ship a heading outline that lies.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof HeroPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dorinthea Ironsong — the adult Warrior, Classic Constructed legal. */
export const Default: Story = {
  args: {
    name: "Dorinthea Ironsong",
    heroClass: "Warrior",
    intellect: 4,
    life: 40,
    ability:
      "Once per Turn Action — [1 Resource]: The next Dawnblade attack this turn gets go again.",
  },
};

/** Bravo, Showstopper — a Guardian, and Guardians draw to three, not four. */
export const Guardian: Story = {
  args: {
    name: "Bravo, Showstopper",
    heroClass: "Guardian",
    intellect: 3,
    life: 40,
  },
};

/**
 * Katsu, the Wanderer as a young hero — the reduced-life printing used in
 * Blitz. The Young chip is a word, not a colour, because it changes which
 * formats the deck is legal in.
 */
export const YoungHero: Story = {
  args: {
    name: "Katsu, the Wanderer",
    heroClass: "Ninja",
    intellect: 4,
    life: 20,
    young: true,
  },
};

/** Prism, Sculptor of Arc Light — a Light Illusionist. One talent, one chip. */
export const WithTalent: Story = {
  args: {
    name: "Prism, Sculptor of Arc Light",
    heroClass: "Illusionist",
    talents: ["Light"],
    intellect: 4,
    life: 40,
  },
};

/** Viserai, Rune Blood — Shadow Runeblade. */
export const ShadowRuneblade: Story = {
  args: {
    name: "Viserai, Rune Blood",
    heroClass: "Runeblade",
    talents: ["Shadow"],
    intellect: 4,
    life: 40,
  },
};

/**
 * Briar, Warden of Thorns. Her card pool spans both the Elemental talent and
 * the Earth element, so the deck header shows both chips — the chips wrap and
 * each is written out, so a third or fourth talent costs nothing.
 */
export const MultipleTalents: Story = {
  args: {
    name: "Briar, Warden of Thorns",
    heroClass: "Runeblade",
    talents: ["Elemental", "Earth"],
    intellect: 4,
    life: 40,
  },
};

/** Inside a deck page the panel usually sits under the page title, so it drops to h3. */
export const InsideADeckPage: Story = {
  args: {
    name: "Dorinthea Ironsong",
    heroClass: "Warrior",
    intellect: 4,
    life: 40,
    headingLevel: 3,
  },
};
