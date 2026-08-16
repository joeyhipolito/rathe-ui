import type { Meta, StoryObj } from "@storybook/react";
import { TierBadge } from "./TierBadge";

const meta = {
  title: "Domain/TierBadge",
  component: TierBadge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "Organised play in Flesh and Blood runs on a four-tier ladder, and the tier is the",
          "single most load-bearing fact in an event listing, because it tells a player how",
          "far they have to travel, how much it costs, and what they win:",
          "",
          "| Tier | Events |",
          "| --- | --- |",
          "| I | Armory, Skirmish, Prerelease |",
          "| II | Road to Nationals, ProQuest, Battlegrounds |",
          "| III | Nationals, The Calling |",
          "| IV | Pro Tour, World Championship |",
          "",
          "Two decisions worth knowing about. First, the numeral renders as a Roman numeral",
          "because that is how LSS sets it. The badge still names itself in plain words,",
          "because `IV` read aloud is ambiguous and a screen reader will say \"eye vee\". The",
          'accessible name is always expanded: "Tier 4, Pro Tour and World Championship".',
          "Second, Tier 4 is the visual apex and uses the gold tokens as **ground and rule,",
          "never as type**, because `--rathe-gold` sits at 0.70L in light and 0.78L in dark,",
          "so gold text fails contrast on both papers.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof TierBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tier 1, a weekly Armory. Quietest in the ladder, because it should not shout in a listing of fifty. */
export const TierOne: Story = { args: { tier: 1 } };

/** Tier 2, Road to Nationals and ProQuest season. */
export const TierTwo: Story = { args: { tier: 2 } };

/** Tier 3, Nationals and The Calling. */
export const TierThree: Story = { args: { tier: 3 } };

/** Tier 4, Pro Tour and World Championship. The gold tier. */
export const TierFour: Story = { args: { tier: 4 } };

export const WithLabel: Story = { args: { tier: 4, showLabel: true } };

/** The full ladder, showing the emphasis step-down from Worlds to a Wednesday Armory. */
export const Ladder: Story = {
  args: { tier: 1 },
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--rathe-space-3)" }}>
      <TierBadge tier={1} />
      <TierBadge tier={2} />
      <TierBadge tier={3} />
      <TierBadge tier={4} />
    </div>
  ),
};

/** Labelled ladder, as it appears in the store-locator sidebar. */
export const LabelledLadder: Story = {
  args: { tier: 1 },
  render: () => (
    <div style={{ display: "grid", gap: "var(--rathe-space-2)", justifyItems: "start" }}>
      <TierBadge tier={1} showLabel />
      <TierBadge tier={2} showLabel />
      <TierBadge tier={3} showLabel />
      <TierBadge tier={4} showLabel />
    </div>
  ),
};
