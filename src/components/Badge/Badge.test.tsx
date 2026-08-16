import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Badge } from "./Badge";
import type { BadgeVariant } from "./Badge";

const VARIANTS: BadgeVariant[] = ["neutral", "info", "success", "warning", "danger", "brand"];

describe("Badge behaviour", () => {
  it("applies variant and size modifier classes and merges className", () => {
    render(
      <Badge variant="warning" size="sm" className="standings-cell">
        Game loss
      </Badge>,
    );

    const badge = screen.getByText("Game loss").closest(".rathe-badge");
    expect(badge).toHaveClass("rathe-badge--warning");
    expect(badge).toHaveClass("rathe-badge--sm");
    expect(badge).toHaveClass("standings-cell");
  });

  it("spreads rest props so consumers can pass data-* and aria-*", () => {
    render(
      <Badge data-testid="status" aria-describedby="penalty-note">
        Dropped
      </Badge>,
    );

    const badge = screen.getByTestId("status");
    expect(badge).toHaveAttribute("aria-describedby", "penalty-note");
  });

  it("renders a dot only when asked", () => {
    const { container, rerender } = render(<Badge>Dropped</Badge>);
    expect(container.querySelector(".rathe-badge__dot")).toBeNull();

    rerender(<Badge dot>Dropped</Badge>);
    expect(container.querySelector(".rathe-badge__dot")).not.toBeNull();
  });

  it("omits the glyph when glyph is explicitly disabled", () => {
    const { container } = render(<Badge glyph={false}>Dropped</Badge>);
    expect(container.querySelector(".rathe-badge__glyph")).toBeNull();
  });
});

describe("Badge semantics", () => {
  it.each(VARIANTS)("renders a non-colour glyph plus the text label for %s", (variant) => {
    const { container } = render(<Badge variant={variant}>Checked in</Badge>);

    const glyph = container.querySelector(".rathe-badge__glyph");
    expect(glyph).not.toBeNull();
    expect(glyph?.textContent ?? "").not.toBe("");
    expect(screen.getByText("Checked in")).toBeInTheDocument();
  });

  it("gives every variant a distinct glyph, so shape alone separates them", () => {
    const glyphs = VARIANTS.map((variant) => {
      const { container, unmount } = render(<Badge variant={variant}>Status</Badge>);
      const text = container.querySelector(".rathe-badge__glyph")?.textContent ?? "";
      unmount();
      return text;
    });

    expect(new Set(glyphs).size).toBe(VARIANTS.length);
  });

  it("hides the glyph and dot from assistive technology, which reads the label instead", () => {
    const { container } = render(
      <Badge dot variant="danger">
        Disqualified
      </Badge>,
    );

    expect(container.querySelector(".rathe-badge__glyph")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".rathe-badge__dot")).toHaveAttribute("aria-hidden", "true");
    // The accessible text is exactly the label, no stray glyph characters.
    expect(screen.getByText("Disqualified")).toBeInTheDocument();
  });
});

describe("Badge accessibility", () => {
  it("has no a11y violations", async () => {
    const { container } = render(
      <div>
        {VARIANTS.map((variant) => (
          <Badge key={variant} dot variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
