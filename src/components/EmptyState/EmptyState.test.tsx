import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { EmptyState } from "./EmptyState";
import type { HeadingLevel } from "./EmptyState";

const LEVELS: HeadingLevel[] = ["h1", "h2", "h3", "h4", "h5", "h6"];

describe("EmptyState behaviour", () => {
  it("renders the action node and keeps it interactive", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <EmptyState
        title="No events yet"
        action={
          <button type="button" onClick={onClick}>
            Create an event
          </button>
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create an event" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("omits the description, icon and action slots when they are not provided", () => {
    const { container } = render(<EmptyState title="No events yet" />);

    expect(container.querySelector(".rathe-empty__description")).toBeNull();
    expect(container.querySelector(".rathe-empty__icon")).toBeNull();
    expect(container.querySelector(".rathe-empty__action")).toBeNull();
  });

  it("applies the variant modifier and merges className and rest props", () => {
    render(
      <EmptyState
        title="No pairings yet"
        variant="compact"
        className="pairings-empty"
        data-testid="empty"
      />,
    );

    const root = screen.getByTestId("empty");
    expect(root).toHaveClass("rathe-empty", "rathe-empty--compact", "pairings-empty");
  });
});

describe("EmptyState semantics", () => {
  it("defaults the title to a level-two heading", () => {
    render(<EmptyState title="No events yet" />);
    expect(screen.getByRole("heading", { level: 2, name: "No events yet" })).toBeInTheDocument();
  });

  it.each(LEVELS)("renders the title at %s when asked", (level) => {
    render(<EmptyState as={level} title="No events yet" />);

    const expectedLevel = Number(level.slice(1));
    expect(
      screen.getByRole("heading", { level: expectedLevel, name: "No events yet" }),
    ).toBeInTheDocument();
  });

  it("hides the icon from assistive technology so it is not read before the title", () => {
    const { container } = render(
      <EmptyState title="No players match this filter" icon={<span>⌕</span>} />,
    );

    expect(container.querySelector(".rathe-empty__icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("places the description after the heading in reading order", () => {
    render(
      <EmptyState
        title="No events yet"
        description="Events you create for this store will appear here."
      />,
    );

    const heading = screen.getByRole("heading", { name: "No events yet" });
    const description = screen.getByText("Events you create for this store will appear here.");
    expect(
      heading.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("EmptyState accessibility", () => {
  it("has no a11y violations", async () => {
    const { container } = render(
      <EmptyState
        title="No players match this filter"
        description="Clear the filter to see all 412 players."
        icon={<span>⌕</span>}
        action={<button type="button">Clear filters</button>}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
