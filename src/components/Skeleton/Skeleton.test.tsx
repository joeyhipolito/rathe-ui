import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Skeleton, SkeletonText } from "./Skeleton";

describe("Skeleton behaviour", () => {
  it("renders one bar by default and one bar per line when lines is set", () => {
    const { container, rerender } = render(<Skeleton />);
    expect(container.querySelectorAll(".rathe-skeleton__bar")).toHaveLength(1);

    rerender(<Skeleton lines={4} />);
    expect(container.querySelectorAll(".rathe-skeleton__bar")).toHaveLength(4);
  });

  it("shortens the last line of a stack so the block does not read as a box", () => {
    const { container } = render(<Skeleton lines={3} lastLineWidth="40%" />);

    const bars = Array.from(container.querySelectorAll<HTMLElement>(".rathe-skeleton__bar"));
    const last = bars[bars.length - 1];
    expect(last?.style.width).toBe("40%");
    expect(bars[0]?.style.width).toBe("");
  });

  it("converts numeric sizes to pixels and passes strings through untouched", () => {
    const { container } = render(<Skeleton width={240} height="1.25rem" radius="9px" />);

    const root = container.querySelector<HTMLElement>(".rathe-skeleton");
    expect(root?.style.getPropertyValue("--rathe-skeleton-w")).toBe("240px");
    expect(root?.style.getPropertyValue("--rathe-skeleton-h")).toBe("1.25rem");
    expect(root?.style.getPropertyValue("--rathe-skeleton-r")).toBe("9px");
  });

  it("treats a lines value below one as a single bar", () => {
    const { container } = render(<Skeleton lines={0} />);
    expect(container.querySelectorAll(".rathe-skeleton__bar")).toHaveLength(1);
  });

  it("merges className and spreads rest props", () => {
    render(<Skeleton className="row-placeholder" data-testid="skeleton" />);

    const root = screen.getByTestId("skeleton");
    expect(root).toHaveClass("rathe-skeleton", "row-placeholder");
  });
});

describe("Skeleton semantics", () => {
  it("hides the placeholder from assistive technology", () => {
    const { container } = render(<Skeleton lines={3} />);
    expect(container.querySelector(".rathe-skeleton")).toHaveAttribute("aria-hidden", "true");
  });

  it("puts SkeletonText's live region outside the hidden subtree", () => {
    const { container } = render(<SkeletonText loadingLabel="Loading standings" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading standings");
    expect(status).toHaveClass("rathe-sr-only");
    // If the announcement were nested inside the aria-hidden bars it would
    // never be read, which is the whole failure this convenience exists to stop.
    expect(status.closest("[aria-hidden='true']")).toBeNull();
    expect(container.querySelector(".rathe-skeleton")).toHaveAttribute("aria-hidden", "true");
  });

  it("defaults SkeletonText to a generic but non-empty announcement", () => {
    render(<SkeletonText />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});

describe("Skeleton accessibility", () => {
  it("has no a11y violations", async () => {
    const { container } = render(<Skeleton lines={3} width="24rem" height="0.875rem" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations for SkeletonText", async () => {
    const { container } = render(<SkeletonText loadingLabel="Loading standings" lines={3} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
