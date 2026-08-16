import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./Pagination";

const meta: Meta<typeof Pagination> = {
  title: "Navigation/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: [
          "Page navigation for long operational lists — a 400-player event's standings, an organiser's event history, a card database result set.",
          "",
          "- The root is a `<nav aria-label=\"Pagination\">` so it is reachable from a landmark rotor, and the label is configurable because a page with a list *and* a table has two of these.",
          "- Every control is a real `<button>`. Previous and Next are `disabled` at the bounds rather than looping, and their accessible names carry context (\"Previous page\"), because \"Previous\" alone is meaningless read out of order in a controls list.",
          "- The ellipsis is `aria-hidden` and is not a button. It has no destination, so a tab stop there only adds keystrokes between the controls that do.",
          "- A visually hidden `role=\"status\"` region announces \"Page 4 of 12\" **on change only**. It starts empty deliberately — populating it during the first commit makes some screen readers announce the page number on load, over the top of whatever the view was already saying.",
          "",
          "Truncation is exported as `buildPageItems` and unit-tested separately: a range that flickers between five and seven controls as you page through it moves the Next button under the user's pointer, and that class of bug is invisible in a screenshot.",
        ].join("\n"),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function Interactive(props: {
  initialPage?: number;
  pageCount: number;
  siblingCount?: number;
  boundaryCount?: number;
  label?: string;
}) {
  const [page, setPage] = React.useState(props.initialPage ?? 1);
  return (
    <div style={{ display: "grid", gap: "var(--rathe-space-3)" }}>
      <p style={{ margin: 0, color: "var(--rathe-ink-muted)", fontSize: "var(--rathe-text-sm)" }}>
        Showing players {(page - 1) * 25 + 1}–{Math.min(page * 25, props.pageCount * 25)} of{" "}
        {props.pageCount * 25}
      </p>
      <Pagination
        page={page}
        pageCount={props.pageCount}
        onPageChange={setPage}
        siblingCount={props.siblingCount}
        boundaryCount={props.boundaryCount}
        label={props.label}
      />
    </div>
  );
}

/** A 412-player Calling: sixteen pages of standings at 25 rows a page. */
export const Standings: Story = {
  render: () => <Interactive pageCount={17} initialPage={6} label="Standings pages" />,
};

/** At page one, Previous is disabled — not hidden. A control that disappears moves the row. */
export const AtFirstPage: Story = {
  render: () => <Interactive pageCount={17} initialPage={1} />,
};

export const AtLastPage: Story = {
  render: () => <Interactive pageCount={17} initialPage={17} />,
};

/** Short ranges render every page; the ellipsis only appears when it saves width. */
export const ShortRange: Story = {
  render: () => <Interactive pageCount={5} initialPage={3} />,
};

export const SinglePage: Story = {
  render: () => <Interactive pageCount={1} initialPage={1} />,
};

/** Wider sibling and boundary counts for a desktop scorekeeping console. */
export const WideRange: Story = {
  render: () => <Interactive pageCount={40} initialPage={20} siblingCount={2} boundaryCount={2} />,
};
