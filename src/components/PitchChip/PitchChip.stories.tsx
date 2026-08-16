import type { Meta, StoryObj } from "@storybook/react";
import { PitchChip } from "./PitchChip";

const meta = {
  title: "Domain/PitchChip",
  component: PitchChip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "Every non-hero card in Flesh and Blood carries a pitch value, printed as a",
          "colour strip along the top edge: **red pitches for 1** resource, **yellow for 2**,",
          "**blue for 3**. Pitch is the central tension of the game — a red card is the",
          "strongest version of itself but the worst resource, and the blue is the reverse —",
          "so the value is data, not decoration.",
          "",
          "**Pitch is never conveyed by colour alone.** Colour vision deficiency runs at",
          "roughly 1 in 12 men, and trading card games skew heavily male, so a red/blue",
          "distinction shown only as a hue is unreadable for a meaningful share of players —",
          "and unreadable in a deck list printed in greyscale for a judge. This chip",
          "therefore always renders the numeral, and always carries a deliberate accessible",
          "name (`Pitch 3 (blue)`) from a visually hidden span. `showValue` adds a visible",
          "resource caption; it does **not** and cannot hide the numeral.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof PitchChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Red — pitches for 1. The pitch of Wounding Blow and Head Jab in their strongest printing. */
export const Red: Story = { args: { pitch: 1 } };

/** Yellow — pitches for 2. The middle printing, e.g. Scar for a Scar (yellow). */
export const Yellow: Story = { args: { pitch: 2 } };

/** Blue — pitches for 3. The pitch of Sink Below and most defence reactions worth blocking with. */
export const Blue: Story = { args: { pitch: 3 } };

/** The caption spells the resource count out for players learning the pitch system. */
export const WithResourceCaption: Story = {
  args: { pitch: 2, showValue: true },
};

export const Small: Story = { args: { pitch: 3, size: "sm" } };

/**
 * All three pitches together, as they appear in a deck list. Desaturate this
 * story in your browser's accessibility simulator: the numerals still carry
 * the value.
 */
export const AllPitches: Story = {
  args: { pitch: 1 },
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--rathe-space-3)" }}>
      <PitchChip pitch={1} />
      <PitchChip pitch={2} />
      <PitchChip pitch={3} />
    </div>
  ),
};

/** The full ladder with captions, for documentation and onboarding surfaces. */
export const LadderWithCaptions: Story = {
  args: { pitch: 1 },
  render: () => (
    <div style={{ display: "grid", gap: "var(--rathe-space-2)", justifyItems: "start" }}>
      <PitchChip pitch={1} showValue />
      <PitchChip pitch={2} showValue />
      <PitchChip pitch={3} showValue />
    </div>
  ),
};
