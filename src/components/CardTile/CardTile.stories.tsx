import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CardTile } from "./CardTile";
import type { CardTileProps } from "./CardTile";

const meta = {
  title: "Domain/CardTile",
  component: CardTile,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "A compact card, for deck lists and card search. A card in hand has four competing",
          "uses — play it, pitch it for resources, defend with it, or arsenal it face down —",
          "and three of those four are decided from the numbers on this tile, so pitch, cost,",
          "power and defence are all first-class here rather than hidden behind a detail view.",
          "",
          "Three decisions worth knowing about:",
          "",
          "- **Selectable means `<button>`.** When `onSelect` is passed the root is a real",
          "  button with `aria-pressed`, never a `div` with a click handler. That also",
          "  constrains the internals to phrasing content only — every child is a `span`,",
          "  because a `div` or `dl` inside a button is invalid and gets reparented.",
          "- **`power` and `defence` are nullable, not zero.** Sigil of Solace has no attack",
          "  power; rendering `0` would say something false about the card. Null renders as an",
          "  em dash and is omitted from the accessible name.",
          "- **No art is licensed into this system.** The art slot is a typographic plate —",
          "  the class initial in the display face over a sunk ground — not a grey box.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof CardTile>;

export default meta;
type Story = StoryObj<typeof meta>;

const sinkBelow: CardTileProps = {
  name: "Sink Below",
  pitch: 3,
  cost: 0,
  power: null,
  defence: 3,
  type: "Defence Reaction",
  cardClass: "Generic",
};

/** Sink Below — the blue defence reaction every deck plays. No attack power at all. */
export const DefenceReaction: Story = { args: sinkBelow };

/** Wounding Blow — a red Warrior attack. Strongest printing, worst pitch. */
export const RedAttack: Story = {
  args: {
    name: "Wounding Blow",
    pitch: 1,
    cost: 1,
    power: 4,
    defence: 3,
    type: "Action",
    cardClass: "Warrior",
  },
};

/** Scar for a Scar in yellow — one less power than the red, one more resource. */
export const YellowAttack: Story = {
  args: {
    name: "Scar for a Scar",
    pitch: 2,
    cost: 2,
    power: 4,
    defence: 3,
    type: "Action",
    cardClass: "Warrior",
  },
};

/** Sigil of Solace — an Aura. Nothing to attack with, so power reads as an em dash. */
export const Aura: Story = {
  args: {
    name: "Sigil of Solace",
    pitch: 3,
    cost: 0,
    power: null,
    defence: 3,
    type: "Aura",
    cardClass: "Generic",
  },
};

/** A talented card carries both the talent and the class: "Shadow Runeblade". */
export const WithTalent: Story = {
  args: {
    name: "Rift Bind",
    pitch: 2,
    cost: 1,
    power: 4,
    defence: 3,
    type: "Action",
    cardClass: "Runeblade",
    talent: "Shadow",
  },
};

export const Selected: Story = {
  args: { ...sinkBelow, selected: true, onSelect: () => undefined },
};

const searchPool: CardTileProps[] = [
  sinkBelow,
  {
    name: "Head Jab",
    pitch: 1,
    cost: 0,
    power: 2,
    defence: 3,
    type: "Action",
    cardClass: "Ninja",
  },
  {
    name: "Wounding Blow",
    pitch: 1,
    cost: 1,
    power: 4,
    defence: 3,
    type: "Action",
    cardClass: "Warrior",
  },
  {
    name: "Scar for a Scar",
    pitch: 2,
    cost: 2,
    power: 4,
    defence: 3,
    type: "Action",
    cardClass: "Warrior",
  },
  {
    name: "Sigil of Solace",
    pitch: 3,
    cost: 0,
    power: null,
    defence: 3,
    type: "Aura",
    cardClass: "Generic",
  },
  {
    name: "Dawnblade",
    pitch: 2,
    cost: 0,
    power: 3,
    defence: null,
    type: "Weapon",
    cardClass: "Warrior",
    talent: "Light",
  },
];

function DeckBuilderPool() {
  const [picked, setPicked] = useState<string[]>(["Head Jab"]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
        gap: "var(--rathe-space-3)",
      }}
    >
      {searchPool.map((card) => (
        <CardTile
          key={card.name}
          {...card}
          selected={picked.includes(card.name)}
          onSelect={() =>
            setPicked((current) =>
              current.includes(card.name)
                ? current.filter((entry) => entry !== card.name)
                : [...current, card.name],
            )
          }
        />
      ))}
    </div>
  );
}

/** The deck-builder case: a grid of selectable tiles with real toggle state. */
export const SelectableGrid: Story = {
  args: sinkBelow,
  render: () => <DeckBuilderPool />,
};

/** All three pitch strips side by side, as they read down a deck list. */
export const PitchLadder: Story = {
  args: sinkBelow,
  render: () => (
    <div style={{ display: "grid", gap: "var(--rathe-space-3)", maxWidth: "20rem" }}>
      <CardTile
        name="Head Jab"
        pitch={1}
        cost={0}
        power={2}
        defence={3}
        type="Action"
        cardClass="Ninja"
      />
      <CardTile
        name="Scar for a Scar"
        pitch={2}
        cost={2}
        power={4}
        defence={3}
        type="Action"
        cardClass="Warrior"
      />
      <CardTile {...sinkBelow} />
    </div>
  ),
};
