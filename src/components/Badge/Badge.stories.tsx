import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Data/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Checked in",
    variant: "success",
    size: "md",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["neutral", "info", "success", "warning", "danger", "brand"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "**Status is never carried by colour alone.** Every variant renders a shape glyph beside the text label: `○ ℹ ✓ ▲ ✕ ◆`. The glyph is `aria-hidden` because the label already says the thing to a screen reader. Its job is the visual side, the channel that survives greyscale, a projector at the back of a store, and every form of colour vision deficiency. Roughly one in twelve men cannot separate the success green from the warning amber, and a scorekeeper reading a drop column at a live event does not get to hover for a tooltip.",
          "",
          "The label sits at `--rathe-ink` rather than the variant hue, because tinted text on a tinted ground is how status pills usually end up at 2.5:1. The hue lives in the ground, the border and the glyph instead.",
          "",
          "`brand` is the blood vermilion. `danger` is a separate, browner red. They are different tokens on purpose, because reusing the identity colour for errors would make every destructive dialog look on-brand and every brand pill look like a warning.",
          "",
          "Set `glyph={false}` only where the label itself names the status and every value in that column is a badge. The escape hatch exists, and justifying it is the consumer's job.",
        ].join("\n"),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** All six variants. Read this story in greyscale. The glyphs still separate the states. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--rathe-space-2)" }}>
      <Badge variant="neutral">Dropped</Badge>
      <Badge variant="info">Deck check</Badge>
      <Badge variant="success">Checked in</Badge>
      <Badge variant="warning">Game loss</Badge>
      <Badge variant="danger">Disqualified</Badge>
      <Badge variant="brand">Living Legend</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--rathe-space-2)" }}>
      <Badge size="sm" variant="info">
        Round 7
      </Badge>
      <Badge size="md" variant="info">
        Round 7
      </Badge>
    </div>
  ),
};

/** The dot adds a "right now" reading for states that change during an event. */
export const WithDot: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--rathe-space-2)" }}>
      <Badge dot variant="success">
        Round in progress
      </Badge>
      <Badge dot variant="warning">
        Time called
      </Badge>
      <Badge dot variant="neutral">
        Not started
      </Badge>
    </div>
  ),
};

/** In a real column the badges stack, which is where the glyph matters most. */
export const InAStandingsColumn: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "var(--rathe-space-2)",
      }}
    >
      <Badge size="sm" variant="success">
        Checked in
      </Badge>
      <Badge size="sm" variant="success">
        Checked in
      </Badge>
      <Badge size="sm" variant="warning">
        Game loss
      </Badge>
      <Badge size="sm" variant="neutral">
        Dropped
      </Badge>
      <Badge size="sm" variant="danger">
        Disqualified
      </Badge>
    </div>
  ),
};
