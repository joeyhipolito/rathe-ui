import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabList, Tab, TabPanel } from "./Tabs";

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "The WAI-ARIA tabs pattern implemented directly, roving tabindex included:",
          "only the selected tab carries `tabIndex={0}`, so Tab moves past the whole",
          "tablist instead of stepping through nine rounds of an event before reaching",
          "the panel. Arrow keys move between tabs and wrap, Home/End jump to the ends.",
          "Activation defaults to `automatic` (selection follows focus) per the APG's",
          "recommendation for panels that are cheap to render; pass `activation=\"manual\"`",
          "when a panel does real work on mount, so arrowing past it does not fire that",
          "work. Panels stay mounted and `hidden` rather than unmounting, which keeps",
          "every tab's `aria-controls` pointing at a node that exists.",
        ].join(" "),
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const panelStyle: React.CSSProperties = {
  minHeight: "6rem",
};

const rows: Record<string, Array<[string, string]>> = {
  "round-1": [
    ["Table 1", "Kayo vs Prism — 2-0"],
    ["Table 2", "Dorinthea vs Rhinar — 2-1"],
  ],
  "round-2": [
    ["Table 1", "Kayo vs Dorinthea — in progress"],
    ["Table 2", "Prism vs Rhinar — 1-1"],
  ],
  "round-3": [
    ["Table 1", "Not yet paired"],
    ["Table 2", "Not yet paired"],
  ],
};

function RoundTabs(props: { activation?: "automatic" | "manual" }) {
  const [round, setRound] = React.useState("round-1");

  return (
    <Tabs
      value={round}
      onValueChange={setRound}
      activation={props.activation}
      style={{ maxWidth: "34rem" }}
    >
      <TabList aria-label="Tournament rounds">
        <Tab value="round-1">Round 1</Tab>
        <Tab value="round-2">Round 2</Tab>
        <Tab value="round-3">Round 3</Tab>
        <Tab value="round-4" disabled>
          Round 4
        </Tab>
      </TabList>
      {["round-1", "round-2", "round-3"].map((value) => (
        <TabPanel key={value} value={value} style={panelStyle}>
          <dl style={{ margin: 0 }}>
            {(rows[value] ?? []).map(([table, result]) => (
              <div key={table} style={{ display: "flex", gap: "var(--rathe-space-3)" }}>
                <dt style={{ fontWeight: 600, minWidth: "5rem" }}>{table}</dt>
                <dd style={{ margin: 0, color: "var(--rathe-ink-muted)" }}>{result}</dd>
              </div>
            ))}
          </dl>
        </TabPanel>
      ))}
      <TabPanel value="round-4" style={panelStyle}>
        Pairings open once Round 3 is fully reported.
      </TabPanel>
    </Tabs>
  );
}

export const Default: Story = {
  name: "Automatic activation",
  render: () => <RoundTabs />,
};

export const ManualActivation: Story = {
  name: "Manual activation (Enter or Space selects)",
  render: () => <RoundTabs activation="manual" />,
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="standings" orientation="vertical" style={{ maxWidth: "40rem" }}>
      <TabList aria-label="Event views">
        <Tab value="standings">Standings</Tab>
        <Tab value="pairings">Pairings</Tab>
        <Tab value="drops">Drops</Tab>
      </TabList>
      <TabPanel value="standings" style={panelStyle}>
        62 players, 4 rounds of Swiss, cut to top 8.
      </TabPanel>
      <TabPanel value="pairings" style={panelStyle}>
        Pairings are regenerated whenever a drop is recorded.
      </TabPanel>
      <TabPanel value="drops" style={panelStyle}>
        Two players dropped after Round 2.
      </TabPanel>
    </Tabs>
  ),
};

export const Uncontrolled: Story = {
  name: "Uncontrolled (no defaultValue)",
  render: () => (
    <Tabs style={{ maxWidth: "34rem" }}>
      <TabList aria-label="Deck sections">
        <Tab value="hero">Hero</Tab>
        <Tab value="weapons">Weapons</Tab>
        <Tab value="deck">Deck</Tab>
      </TabList>
      <TabPanel value="hero" style={panelStyle}>
        Kayo, Berserker Prodigy
      </TabPanel>
      <TabPanel value="weapons" style={panelStyle}>
        Romping Club, Mandible Claw
      </TabPanel>
      <TabPanel value="deck" style={panelStyle}>
        60 cards, legal for Classic Constructed.
      </TabPanel>
    </Tabs>
  ),
};
