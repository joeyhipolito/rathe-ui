import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Pagination, buildPageItems } from "./Pagination";

function Controlled(props: { initialPage: number; pageCount: number }) {
  const [page, setPage] = React.useState(props.initialPage);
  return <Pagination page={page} pageCount={props.pageCount} onPageChange={setPage} />;
}

describe("Pagination behaviour", () => {
  it("disables Previous at the first page and Next at the last", () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={17} onPageChange={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    rerender(<Pagination page={17} pageCount={17} onPageChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("disables both controls when there is a single page", () => {
    render(<Pagination page={1} pageCount={1} onPageChange={() => undefined} />);

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("moves one page at a time from the Previous and Next controls", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={6} pageCount={17} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(7);

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(5);
  });

  it("jumps to the page a numbered control names", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={6} pageCount={17} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Page 17" }));
    expect(onPageChange).toHaveBeenCalledWith(17);
  });

  it("does not fire a change when the current page is re-activated", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={6} pageCount={17} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "Page 6" }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("clamps an out-of-range page instead of rendering a broken sequence", () => {
    render(<Pagination page={99} pageCount={5} onPageChange={() => undefined} />);

    expect(screen.getByRole("button", { name: "Page 5" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("announces the new page in a live region only after a change", async () => {
    const user = userEvent.setup();
    render(<Controlled initialPage={6} pageCount={17} />);

    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(status).toHaveTextContent("Page 7 of 17");
  });
});

describe("Pagination semantics", () => {
  it("is a navigation landmark with an accessible name", () => {
    render(<Pagination page={1} pageCount={5} onPageChange={() => undefined} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("marks exactly one control with aria-current=page", () => {
    render(<Pagination page={3} pageCount={17} onPageChange={() => undefined} />);

    const nav = screen.getByRole("navigation", { name: "Pagination" });
    const current = within(nav)
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-current") === "page");

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Page 3");
  });

  it("hides the ellipsis from assistive technology and gives it no tab stop", () => {
    const { container } = render(
      <Pagination page={9} pageCount={40} onPageChange={() => undefined} />,
    );

    const ellipses = container.querySelectorAll(".rathe-pagination__ellipsis");
    expect(ellipses.length).toBeGreaterThan(0);
    for (const node of ellipses) {
      expect(node).toHaveAttribute("aria-hidden", "true");
      expect(node.querySelector("button, a, [tabindex]")).toBeNull();
    }
  });

  it("gives page buttons an accessible name that contains the visible number", () => {
    render(<Pagination page={1} pageCount={5} onPageChange={() => undefined} />);

    const button = screen.getByRole("button", { name: "Page 4" });
    expect(button).toHaveTextContent("4");
  });

  it("accepts a custom landmark label so two paginators on one page stay distinct", () => {
    render(
      <Pagination
        page={1}
        pageCount={5}
        onPageChange={() => undefined}
        label="Standings pages"
        className="standings-pager"
        data-testid="pager"
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Standings pages" });
    expect(nav).toHaveClass("rathe-pagination", "standings-pager");
    expect(nav).toHaveAttribute("data-testid", "pager");
  });
});

describe("buildPageItems", () => {
  it("renders every page when the range is short enough not to need truncation", () => {
    expect(buildPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("truncates on both sides in the middle of a long range", () => {
    expect(buildPageItems(6, 17)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 17]);
  });

  it("keeps the control count stable across a long range so targets do not shift", () => {
    const widths = [1, 2, 6, 9, 12, 16, 17].map((page) => buildPageItems(page, 17).length);
    expect(new Set(widths).size).toBe(1);
  });

  it("substitutes the hidden page for an ellipsis that would hide exactly one", () => {
    // At page 1 of 17 the gap after the boundary is a single page, so it is
    // shown rather than replaced by an ellipsis of the same width.
    expect(buildPageItems(1, 17)).toEqual([1, 2, 3, 4, 5, "ellipsis", 17]);
  });

  it("handles degenerate counts", () => {
    expect(buildPageItems(1, 1)).toEqual([1]);
    expect(buildPageItems(1, 0)).toEqual([]);
  });
});

describe("Pagination accessibility", () => {
  it("has no a11y violations", async () => {
    const { container } = render(
      <Pagination page={6} pageCount={17} onPageChange={() => undefined} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations at the bounds", async () => {
    const { container } = render(
      <Pagination page={1} pageCount={1} onPageChange={() => undefined} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
