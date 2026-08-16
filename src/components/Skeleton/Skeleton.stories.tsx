import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonText } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Feedback/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: { width: "16rem", height: "1rem", lines: 1 },
  parameters: {
    docs: {
      description: {
        component: [
          "Loading placeholders sized to the content they stand in for. A skeleton that does not match the eventual layout is worse than a spinner, because it promises a shape and then reflows the page out from under the reader.",
          "",
          "**The skeleton is `aria-hidden`.** Announcing a row of placeholder bars is noise; a screen reader user needs one polite \"Loading standings\" and then the real content. The live region is therefore a separate node — either supplied by the consumer, or by `SkeletonText`, which renders a `.rathe-sr-only` `role=\"status\"` beside the bars. It sits *outside* the hidden subtree, because nesting it inside would hide the only thing meant to be heard.",
          "",
          "**The shimmer stops under `prefers-reduced-motion`.** It is a large-area repeating motion in central vision, which is the pattern that triggers vestibular symptoms, and it repeats for as long as the request is in flight — on a game store's wifi mid-tournament, that is not a fraction of a second. The token layer's global guard only collapses animation duration, which would freeze this gradient half-painted, so the component removes the animation outright and falls back to a flat token fill.",
        ].join("\n"),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const MultiLine: Story = {
  args: { lines: 3, width: "24rem", height: "0.875rem" },
};

/** SkeletonText carries its own live region, so the consumer cannot forget it. */
export const WithLiveRegion: Story = {
  render: () => (
    <SkeletonText
      lines={3}
      width="24rem"
      height="0.875rem"
      loadingLabel="Loading round 7 standings"
    />
  ),
};

/** Sized to the real thing: a standings row is an avatar, a name, and figures. */
export const StandingsRows: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--rathe-space-3)", maxWidth: "34rem" }}>
      <span className="rathe-sr-only" role="status" aria-live="polite">
        Loading standings
      </span>
      {[0, 1, 2, 3, 4].map((row) => (
        <div
          key={row}
          style={{
            display: "grid",
            gridTemplateColumns: "2rem 2rem 1fr 4rem",
            alignItems: "center",
            gap: "var(--rathe-space-3)",
          }}
        >
          <Skeleton width="1.5rem" height="0.875rem" />
          <Skeleton width="2rem" height="2rem" radius="var(--rathe-radius-full)" />
          <Skeleton height="0.875rem" />
          <Skeleton width="2.5rem" height="0.875rem" />
        </div>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--rathe-space-4)" }}>
      <Skeleton width="3rem" height="3rem" radius="var(--rathe-radius-full)" />
      <Skeleton width="5.5rem" height="7.7rem" radius="var(--rathe-radius-card)" />
      <Skeleton width="12rem" height="1.25rem" />
    </div>
  ),
};
