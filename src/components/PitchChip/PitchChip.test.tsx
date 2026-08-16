import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { PitchChip } from "./PitchChip";

describe("PitchChip", () => {
  it("maps each pitch value to its printed colour token class", () => {
    const { rerender } = render(<PitchChip pitch={1} />);
    expect(screen.getByRole("img")).toHaveClass("rathe-pitch-chip--red");

    rerender(<PitchChip pitch={2} />);
    expect(screen.getByRole("img")).toHaveClass("rathe-pitch-chip--yellow");

    rerender(<PitchChip pitch={3} />);
    expect(screen.getByRole("img")).toHaveClass("rathe-pitch-chip--blue");
  });

  it("renders the numeral even when no caption is requested", () => {
    render(<PitchChip pitch={3} />);
    expect(screen.getByRole("img")).toHaveTextContent("3");
  });

  it("keeps the numeral when showValue is false, so pitch is never colour-only", () => {
    render(<PitchChip pitch={1} showValue={false} />);
    expect(screen.getByRole("img").textContent).toContain("1");
  });

  it("adds a resource caption when showValue is set, pluralised correctly", () => {
    const { rerender } = render(<PitchChip pitch={1} showValue />);
    expect(screen.getByRole("img")).toHaveTextContent("1 resource");

    rerender(<PitchChip pitch={3} showValue />);
    expect(screen.getByRole("img")).toHaveTextContent("3 resources");
  });

  it("merges a caller className and spreads the rest onto the root", () => {
    render(<PitchChip pitch={2} className="deck-list__pitch" data-testid="chip" />);
    const chip = screen.getByRole("img");
    expect(chip).toHaveClass("rathe-pitch-chip", "rathe-pitch-chip--yellow", "deck-list__pitch");
    expect(chip).toHaveAttribute("data-testid", "chip");
  });

  it("applies the requested size modifier", () => {
    render(<PitchChip pitch={2} size="sm" />);
    expect(screen.getByRole("img")).toHaveClass("rathe-pitch-chip--sm");
  });

  describe("accessible name", () => {
    it("names the pitch value and its colour, not the colour alone", () => {
      render(<PitchChip pitch={1} />);
      expect(screen.getByRole("img", { name: "Pitch 1 (red)" })).toBeInTheDocument();
    });

    it("is stable across sizes and captions", () => {
      const { rerender } = render(<PitchChip pitch={3} size="sm" />);
      expect(screen.getByRole("img", { name: "Pitch 3 (blue)" })).toBeInTheDocument();

      rerender(<PitchChip pitch={3} showValue />);
      expect(screen.getByRole("img", { name: "Pitch 3 (blue)" })).toBeInTheDocument();
    });

    it("names pitch 2 as yellow", () => {
      render(<PitchChip pitch={2} />);
      expect(screen.getByRole("img", { name: "Pitch 2 (yellow)" })).toBeInTheDocument();
    });
  });

  it("has no a11y violations", async () => {
    const { container } = render(<PitchChip pitch={2} showValue />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
