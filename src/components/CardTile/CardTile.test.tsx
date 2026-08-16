import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { CardTile } from "./CardTile";
import type { CardTileProps } from "./CardTile";

const sinkBelow: CardTileProps = {
  name: "Sink Below",
  pitch: 3,
  cost: 0,
  power: null,
  defence: 3,
  type: "Defence Reaction",
  cardClass: "Generic",
};

const woundingBlow: CardTileProps = {
  name: "Wounding Blow",
  pitch: 1,
  cost: 1,
  power: 4,
  defence: 3,
  type: "Action",
  cardClass: "Warrior",
};

describe("CardTile", () => {
  it("is an article when it is not selectable", () => {
    render(<CardTile {...sinkBelow} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("is a real button, not a clickable div, when onSelect is given", async () => {
    const onSelect = vi.fn();
    render(<CardTile {...sinkBelow} onSelect={onSelect} />);

    const tile = screen.getByRole("button");
    expect(tile.tagName).toBe("BUTTON");
    expect(tile).toHaveAttribute("type", "button");

    await userEvent.click(tile);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("is keyboard operable because it is a button", async () => {
    const onSelect = vi.fn();
    render(<CardTile {...woundingBlow} onSelect={onSelect} />);

    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("reports selection through aria-pressed", () => {
    const { rerender } = render(<CardTile {...sinkBelow} onSelect={() => undefined} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");

    rerender(<CardTile {...sinkBelow} selected onSelect={() => undefined} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button")).toHaveClass("rathe-card-tile--selected");
  });

  it("renders the pitch strip in the token class for the printed colour", () => {
    const { container, rerender } = render(<CardTile {...sinkBelow} />);
    expect(container.querySelector(".rathe-card-tile__strip--blue")).not.toBeNull();

    rerender(<CardTile {...woundingBlow} />);
    expect(container.querySelector(".rathe-card-tile__strip--red")).not.toBeNull();
  });

  it("renders an em dash rather than a zero for a card with no attack power", () => {
    render(<CardTile {...sinkBelow} />);
    expect(screen.getByRole("article")).toHaveTextContent("—");
    expect(screen.getByRole("article")).not.toHaveTextContent("0 power");
  });

  it("falls back to a typographic plate carrying the class initial when there is no image", () => {
    const { container } = render(<CardTile {...woundingBlow} />);
    const plate = container.querySelector(".rathe-card-tile__art");
    expect(plate).not.toBeNull();
    expect(plate).toHaveTextContent("W");
    expect(container.querySelector("img")).toBeNull();
  });

  it("uses an image with an empty alt when one is supplied, because the root carries the name", () => {
    const { container } = render(
      <CardTile {...woundingBlow} imageUrl="https://cdn.example.test/wounding-blow.png" />,
    );
    const image = container.querySelector("img");
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute("alt", "");
  });

  it("merges className and spreads the rest", () => {
    render(<CardTile {...sinkBelow} className="deck-list__row" id="card-sink-below" />);
    const tile = screen.getByRole("article");
    expect(tile).toHaveClass("rathe-card-tile", "deck-list__row");
    expect(tile).toHaveAttribute("id", "card-sink-below");
  });

  describe("accessible name", () => {
    it("states the whole card identity in spoken order", () => {
      render(<CardTile {...sinkBelow} />);
      expect(
        screen.getByRole("article", {
          name: "Sink Below, pitch 3 blue, Defence Reaction, Generic, cost 0, 3 defence",
        }),
      ).toBeInTheDocument();
    });

    it("uses the same name on the selectable variant", () => {
      render(<CardTile {...woundingBlow} onSelect={() => undefined} />);
      expect(
        screen.getByRole("button", {
          name: "Wounding Blow, pitch 1 red, Action, Warrior, cost 1, 4 power, 3 defence",
        }),
      ).toBeInTheDocument();
    });

    it("folds the talent into the class, as a player would say it", () => {
      render(
        <CardTile
          name="Rift Bind"
          pitch={2}
          cost={1}
          power={4}
          defence={3}
          type="Action"
          cardClass="Runeblade"
          talent="Shadow"
        />,
      );
      expect(
        screen.getByRole("article", {
          name: "Rift Bind, pitch 2 yellow, Action, Shadow Runeblade, cost 1, 4 power, 3 defence",
        }),
      ).toBeInTheDocument();
    });

    it("omits stats the card does not have rather than naming them zero", () => {
      render(
        <CardTile
          name="Dawnblade"
          pitch={2}
          cost={0}
          power={3}
          defence={null}
          type="Weapon"
          cardClass="Warrior"
          talent="Light"
        />,
      );
      const tile = screen.getByRole("article", {
        name: "Dawnblade, pitch 2 yellow, Weapon, Light Warrior, cost 0, 3 power",
      });
      expect(tile).toBeInTheDocument();
    });
  });

  it("has no a11y violations", async () => {
    const { container } = render(<CardTile {...sinkBelow} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations when selectable and selected", async () => {
    const { container } = render(
      <CardTile {...woundingBlow} selected onSelect={() => undefined} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
