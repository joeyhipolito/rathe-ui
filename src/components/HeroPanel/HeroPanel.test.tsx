import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { HeroPanel } from "./HeroPanel";

describe("HeroPanel", () => {
  it("labels every vital stat instead of printing bare numbers", () => {
    const { container } = render(
      <HeroPanel name="Dorinthea Ironsong" heroClass="Warrior" intellect={4} life={40} />,
    );

    const terms = container.querySelectorAll("dt");
    const values = container.querySelectorAll("dd");
    expect(terms).toHaveLength(2);
    expect(values).toHaveLength(2);
    expect(terms[0]!).toHaveTextContent("Intellect");
    expect(values[0]!).toHaveTextContent("4");
    expect(terms[1]!).toHaveTextContent("Life");
    expect(values[1]!).toHaveTextContent("40");
  });

  it("uses a definition list, which is the semantic for name/value pairs", () => {
    const { container } = render(
      <HeroPanel name="Bravo, Showstopper" heroClass="Guardian" intellect={3} life={40} />,
    );
    expect(container.querySelector("dl")).not.toBeNull();
  });

  it("expands the jargon so a new player can act on the numbers", () => {
    render(<HeroPanel name="Katsu, the Wanderer" heroClass="Ninja" intellect={4} life={20} />);
    expect(screen.getByText("cards drawn to")).toBeInTheDocument();
    expect(screen.getByText("starting total")).toBeInTheDocument();
  });

  it("renders talents as a labelled list of chips", () => {
    render(
      <HeroPanel
        name="Prism, Sculptor of Arc Light"
        heroClass="Illusionist"
        talents={["Light"]}
        intellect={4}
        life={40}
      />,
    );

    const talents = screen.getByRole("list", { name: "Talents" });
    const items = screen.getAllByRole("listitem");
    expect(talents).toBeInTheDocument();
    expect(items).toHaveLength(1);
    expect(items[0]!).toHaveTextContent("Light");
    expect(items[0]!).toHaveClass("rathe-hero-panel__talent--light");
  });

  it("renders every talent a hero carries", () => {
    render(
      <HeroPanel
        name="Briar, Warden of Thorns"
        heroClass="Runeblade"
        talents={["Elemental", "Earth"]}
        intellect={4}
        life={40}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("falls back to the neutral chip for a talent it does not know", () => {
    render(
      <HeroPanel
        name="Enigma, Ledger of Ancestry"
        heroClass="Illusionist"
        talents={["Royal"]}
        intellect={4}
        life={40}
      />,
    );
    const [chip] = screen.getAllByRole("listitem");
    expect(chip!).toHaveTextContent("Royal");
    expect(chip!.className).toBe("rathe-hero-panel__talent");
  });

  it("omits the talent list entirely for a hero with no talents", () => {
    render(<HeroPanel name="Dorinthea Ironsong" heroClass="Warrior" intellect={4} life={40} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("marks a young hero, which changes the formats the deck is legal in", () => {
    render(
      <HeroPanel name="Katsu, the Wanderer" heroClass="Ninja" intellect={4} life={20} young />,
    );
    expect(screen.getByText("Young")).toBeInTheDocument();
  });

  it("reads talent and class as one lineage, the way a player says it", () => {
    render(
      <HeroPanel
        name="Viserai, Rune Blood"
        heroClass="Runeblade"
        talents={["Shadow"]}
        intellect={4}
        life={40}
      />,
    );
    expect(screen.getByText("Shadow Runeblade")).toBeInTheDocument();
  });

  it("renders the hero ability only when there is one", () => {
    const ability =
      "Once per Turn Action — [1 Resource]: The next Dawnblade attack this turn gets go again.";
    const { rerender, container } = render(
      <HeroPanel
        name="Dorinthea Ironsong"
        heroClass="Warrior"
        intellect={4}
        life={40}
        ability={ability}
      />,
    );
    expect(screen.getByText(ability)).toBeInTheDocument();

    rerender(<HeroPanel name="Dorinthea Ironsong" heroClass="Warrior" intellect={4} life={40} />);
    expect(container.querySelector(".rathe-hero-panel__ability")).toBeNull();
  });

  it("lets the page own the heading level", () => {
    const { rerender } = render(
      <HeroPanel name="Dorinthea Ironsong" heroClass="Warrior" intellect={4} life={40} />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();

    rerender(
      <HeroPanel
        name="Dorinthea Ironsong"
        heroClass="Warrior"
        intellect={4}
        life={40}
        headingLevel={4}
      />,
    );
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });

  it("merges className and spreads the rest", () => {
    render(
      <HeroPanel
        name="Dorinthea Ironsong"
        heroClass="Warrior"
        intellect={4}
        life={40}
        className="deck-page__hero"
        id="hero-panel"
      />,
    );
    const panel = screen.getByRole("region");
    expect(panel).toHaveClass("rathe-hero-panel", "deck-page__hero");
    expect(panel).toHaveAttribute("id", "hero-panel");
  });

  describe("accessible name", () => {
    it("names the region with the hero, via its own heading", () => {
      render(
        <HeroPanel
          name="Prism, Sculptor of Arc Light"
          heroClass="Illusionist"
          talents={["Light"]}
          intellect={4}
          life={40}
        />,
      );
      expect(
        screen.getByRole("region", { name: "Prism, Sculptor of Arc Light" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Prism, Sculptor of Arc Light" }),
      ).toBeInTheDocument();
    });

    it("names the talent list so its items are not loose words", () => {
      render(
        <HeroPanel
          name="Viserai, Rune Blood"
          heroClass="Runeblade"
          talents={["Shadow"]}
          intellect={4}
          life={40}
        />,
      );
      expect(screen.getByRole("list")).toHaveAccessibleName("Talents");
    });

    it("keeps each stat paired with its term rather than announcing a bare number", () => {
      const { container } = render(
        <HeroPanel name="Bravo, Showstopper" heroClass="Guardian" intellect={3} life={40} />,
      );
      const pairs = container.querySelectorAll(".rathe-hero-panel__stat");
      expect(pairs).toHaveLength(2);
      expect(pairs[0]!).toHaveTextContent(/Intellect/);
      expect(pairs[0]!).toHaveTextContent(/3/);
      expect(pairs[1]!).toHaveTextContent(/Life/);
      expect(pairs[1]!).toHaveTextContent(/40/);
    });
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <HeroPanel
        name="Dorinthea Ironsong"
        heroClass="Warrior"
        intellect={4}
        life={40}
        ability="Once per Turn Action — [1 Resource]: The next Dawnblade attack this turn gets go again."
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations with talents and a young hero", async () => {
    const { container } = render(
      <HeroPanel
        name="Katsu, the Wanderer"
        heroClass="Ninja"
        talents={["Shadow"]}
        intellect={4}
        life={20}
        young
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
