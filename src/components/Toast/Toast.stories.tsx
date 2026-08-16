import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, useToast } from "./Toast";
import type { ToastPlacement } from "./Toast";

const meta = {
  title: "Feedback/Toast",
  component: ToastProvider,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "`ToastProvider` mounts **two** live regions at startup and never moves a",
          "toast between them: a `role=\"status\" aria-live=\"polite\"` region for normal",
          "messages, and a `role=\"alert\" aria-live=\"assertive\"` region for `danger`.",
          "There are two because a live region's politeness is fixed at the moment it",
          "is announced. A single container that flipped its `aria-live` value would",
          "announce with the previous setting. Both containers also sit there empty",
          "from mount rather than appearing with the first toast, because a region",
          "created in the same tick as its first child is usually not announced at",
          "all. Auto-dismiss pauses on hover and on focus within a toast and picks up",
          "where it stopped, which is WCAG 2.2 \"Enough Time\". `danger` toasts have no",
          "timer at all.",
        ].join(" "),
      },
    },
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

const buttonStyle: React.CSSProperties = {
  font: "inherit",
  padding: "var(--rathe-space-2) var(--rathe-space-4)",
  borderRadius: "var(--rathe-radius-md)",
  border: "1px solid var(--rathe-rule-strong)",
  background: "var(--rathe-surface)",
  color: "var(--rathe-ink)",
  cursor: "pointer",
};

function Console() {
  const toast = useToast();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--rathe-space-3)" }}>
      <button
        type="button"
        style={buttonStyle}
        onClick={() =>
          toast({
            variant: "success",
            title: "Result recorded",
            description: "Table 12: Kayo 2-1 Dorinthea.",
          })
        }
      >
        Record result
      </button>
      <button
        type="button"
        style={buttonStyle}
        onClick={() =>
          toast({
            variant: "info",
            title: "Round 4 pairings posted",
            description: "62 players seated across 31 tables.",
            action: { label: "View", onClick: () => undefined },
          })
        }
      >
        Post pairings
      </button>
      <button
        type="button"
        style={buttonStyle}
        onClick={() =>
          toast({
            variant: "warning",
            title: "Round timer under 5 minutes",
            description: "Three tables have not reported.",
          })
        }
      >
        Timer warning
      </button>
      <button
        type="button"
        style={buttonStyle}
        onClick={() =>
          toast({
            variant: "danger",
            title: "Could not sync to GEM",
            description: "Round 3 results are held locally. Retry before starting Round 4.",
            action: { label: "Retry", onClick: () => undefined },
          })
        }
      >
        Fail a sync
      </button>
      <button type="button" style={buttonStyle} onClick={() => toast.dismissAll()}>
        Dismiss all
      </button>
    </div>
  );
}

function Demo(props: { placement?: ToastPlacement; duration?: number; max?: number }) {
  return (
    <ToastProvider
      placement={props.placement}
      duration={props.duration}
      max={props.max}
    >
      <p style={{ marginTop: 0, color: "var(--rathe-ink-muted)" }}>
        Hover a toast, or Tab into it, to hold the countdown. The danger toast has no
        countdown at all.
      </p>
      <Console />
    </ToastProvider>
  );
}

export const Default: Story = {
  render: () => <Demo />,
};

export const BottomCentre: Story = {
  name: "Bottom centre placement",
  render: () => <Demo placement="bottom-center" />,
};

export const ShortDuration: Story = {
  name: "Short duration (2s), hover to hold",
  render: () => <Demo duration={2000} />,
};

export const Overflow: Story = {
  name: "Overflow cap (max 2)",
  render: () => <Demo max={2} duration={20000} />,
};
