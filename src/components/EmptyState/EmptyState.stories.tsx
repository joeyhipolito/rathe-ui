import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";

/* Inline because Button is a separate workstream; these stories only need
   something button-shaped to sit in the action slot. */
const buttonStyle: CSSProperties = {
  minHeight: "2.25rem",
  padding: "0 var(--rathe-space-4)",
  border: "1px solid var(--rathe-blood)",
  borderRadius: "var(--rathe-radius-md)",
  background: "var(--rathe-blood)",
  color: "var(--rathe-blood-ink)",
  font: "inherit",
  fontSize: "var(--rathe-text-sm)",
  fontWeight: 600,
  cursor: "pointer",
};

const meta: Meta<typeof EmptyState> = {
  title: "Feedback/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    title: "No events yet",
    description:
      "Events you create for this store will appear here, with their standings and pairings.",
    as: "h2",
    variant: "panel",
  },
  argTypes: {
    as: { control: "inline-radio", options: ["h1", "h2", "h3", "h4", "h5", "h6"] },
    variant: { control: "inline-radio", options: ["panel", "compact"] },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "Zero-result and first-run states. Two states that look the same and are not: *nothing exists yet* wants an action, *your filter matched nothing* wants a way back. The component takes both; the copy is the consumer's job.",
          "",
          "**The heading level is a prop with no hardcoded default beyond `h2`.** The same empty state sits directly under an `<h1>` on a standalone page and under an `<h3>` inside a dashboard card. A fixed level is correct in exactly one of those places and silently corrupts the document outline in the other. That is how heading navigation stops working for screen reader users.",
          "",
          "The icon is `aria-hidden`, because it is a mood rather than information. The title carries the meaning, so an empty state with no icon loses nothing but decoration.",
        ].join("\n"),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstRun: Story = {
  args: {
    icon: <span>⚔</span>,
    action: (
      <button type="button" className="rathe-focusable" style={buttonStyle}>
        Create an event
      </button>
    ),
  },
};

/** A filter that matched nothing needs a way back, not a way forward. */
export const NoResults: Story = {
  args: {
    title: "No players match this filter",
    description:
      "Nobody in this event is playing Classic Constructed with a Guardian hero. Clear the filter to see all 412 players.",
    icon: <span>⌕</span>,
    action: (
      <button type="button" className="rathe-focusable" style={buttonStyle}>
        Clear filters
      </button>
    ),
  },
};

/** Compact fits inside a table body or a sidebar card without a second frame. */
export const Compact: Story = {
  args: {
    variant: "compact",
    as: "h3",
    title: "No pairings yet",
    description: "Pairings appear once round 8 is started.",
    icon: undefined,
    action: undefined,
  },
};

/** Heading level is controlled by the surrounding outline, never by the component. */
export const InsideACard: Story = {
  render: () => (
    <section
      style={{
        maxWidth: "34rem",
        padding: "var(--rathe-space-5)",
        background: "var(--rathe-paper)",
        border: "1px solid var(--rathe-rule)",
        borderRadius: "var(--rathe-radius-card)",
      }}
    >
      <h2 style={{ margin: "0 0 var(--rathe-space-4)", fontSize: "var(--rathe-text-md)" }}>
        Recent events
      </h2>
      <EmptyState
        as="h3"
        variant="compact"
        title="Nothing in the last 30 days"
        description="Widen the date range to see older events for this store."
      />
    </section>
  ),
};
