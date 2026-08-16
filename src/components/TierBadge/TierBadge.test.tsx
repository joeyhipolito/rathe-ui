import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { TierBadge } from "./TierBadge";

describe("TierBadge", () => {
  it("renders the tier as a Roman numeral", () => {
    const { rerender } = render(<TierBadge tier={1} />);
    expect(screen.getByRole("img")).toHaveTextContent("I");

    rerender(<TierBadge tier={2} />);
    expect(screen.getByRole("img")).toHaveTextContent("II");

    rerender(<TierBadge tier={3} />);
    expect(screen.getByRole("img")).toHaveTextContent("III");

    rerender(<TierBadge tier={4} />);
    expect(screen.getByRole("img")).toHaveTextContent("IV");
  });

  it("carries a per-tier modifier class so the emphasis ladder is styleable", () => {
    const { rerender } = render(<TierBadge tier={1} />);
    expect(screen.getByRole("img")).toHaveClass("rathe-tier-badge--1");

    rerender(<TierBadge tier={4} />);
    expect(screen.getByRole("img")).toHaveClass("rathe-tier-badge--4");
  });

  it("shows the short event label only when asked", () => {
    const { rerender } = render(<TierBadge tier={2} />);
    expect(screen.getByRole("img").textContent).not.toContain("Road to Nationals,");

    rerender(<TierBadge tier={2} showLabel />);
    expect(screen.getByRole("img")).toHaveTextContent("Road to Nationals");
  });

  it("merges className and spreads the rest", () => {
    render(<TierBadge tier={3} className="event-row__tier" id="tier-badge" />);
    const badge = screen.getByRole("img");
    expect(badge).toHaveClass("rathe-tier-badge", "event-row__tier");
    expect(badge).toHaveAttribute("id", "tier-badge");
  });

  describe("accessible name", () => {
    it("expands the Roman numeral into a plain tier and its events", () => {
      render(<TierBadge tier={4} />);
      expect(
        screen.getByRole("img", { name: "Tier 4, Pro Tour and World Championship" }),
      ).toBeInTheDocument();
    });

    it("names every tier with the events it covers", () => {
      const { rerender } = render(<TierBadge tier={1} />);
      expect(
        screen.getByRole("img", { name: "Tier 1, Armory, Skirmish and Prerelease" }),
      ).toBeInTheDocument();

      rerender(<TierBadge tier={2} />);
      expect(
        screen.getByRole("img", {
          name: "Tier 2, Road to Nationals, ProQuest and Battlegrounds",
        }),
      ).toBeInTheDocument();

      rerender(<TierBadge tier={3} />);
      expect(
        screen.getByRole("img", { name: "Tier 3, Nationals and The Calling" }),
      ).toBeInTheDocument();
    });

    it("does not repeat the visible label in the name when showLabel is set", () => {
      render(<TierBadge tier={4} showLabel />);
      expect(
        screen.getByRole("img", { name: "Tier 4, Pro Tour and World Championship" }),
      ).toBeInTheDocument();
    });
  });

  it("has no a11y violations", async () => {
    const { container } = render(<TierBadge tier={4} showLabel />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
