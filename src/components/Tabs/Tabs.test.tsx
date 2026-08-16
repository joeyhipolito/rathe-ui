import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Tabs, TabList, Tab, TabPanel } from "./Tabs";

function Rounds(props: { activation?: "automatic" | "manual"; orientation?: "horizontal" | "vertical" }) {
  return (
    <main>
      <Tabs defaultValue="round-1" activation={props.activation} orientation={props.orientation}>
        <TabList aria-label="Tournament rounds">
          <Tab value="round-1">Round 1</Tab>
          <Tab value="round-2">Round 2</Tab>
          <Tab value="round-3">Round 3</Tab>
        </TabList>
        <TabPanel value="round-1">Round 1 results</TabPanel>
        <TabPanel value="round-2">Round 2 results</TabPanel>
        <TabPanel value="round-3">Round 3 results</TabPanel>
      </Tabs>
      <button type="button">After the tabs</button>
    </main>
  );
}

function tabs() {
  return {
    one: screen.getByRole("tab", { name: "Round 1" }),
    two: screen.getByRole("tab", { name: "Round 2" }),
    three: screen.getByRole("tab", { name: "Round 3" }),
  };
}

describe("Tabs", () => {
  it("moves selection with arrow keys and keeps the roving tabindex correct", async () => {
    const user = userEvent.setup();
    render(<Rounds />);

    const { one, two, three } = tabs();
    expect(one).toHaveAttribute("tabindex", "0");
    expect(two).toHaveAttribute("tabindex", "-1");
    expect(three).toHaveAttribute("tabindex", "-1");

    one.focus();
    await user.keyboard("{ArrowRight}");

    expect(two).toHaveFocus();
    expect(two).toHaveAttribute("aria-selected", "true");
    expect(two).toHaveAttribute("tabindex", "0");
    expect(one).toHaveAttribute("aria-selected", "false");
    expect(one).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Round 2 results");

    await user.keyboard("{ArrowLeft}");
    expect(one).toHaveFocus();
    expect(one).toHaveAttribute("aria-selected", "true");
  });

  it("wraps at both ends and jumps with Home and End", async () => {
    const user = userEvent.setup();
    render(<Rounds />);

    const { one, three } = tabs();
    one.focus();

    await user.keyboard("{ArrowLeft}");
    expect(three).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(one).toHaveFocus();

    await user.keyboard("{End}");
    expect(three).toHaveFocus();

    await user.keyboard("{Home}");
    expect(one).toHaveFocus();
  });

  it("moves focus out of the tablist on Tab rather than between tabs", async () => {
    const user = userEvent.setup();
    render(<Rounds />);

    tabs().one.focus();
    await user.tab();

    expect(screen.getByRole("tabpanel")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After the tabs" })).toHaveFocus();
  });

  it("with manual activation moves focus without selecting until Enter or Space", async () => {
    const user = userEvent.setup();
    render(<Rounds activation="manual" />);

    const { one, two, three } = tabs();
    one.focus();

    await user.keyboard("{ArrowRight}");
    expect(two).toHaveFocus();
    expect(two).toHaveAttribute("aria-selected", "false");
    expect(one).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");
    expect(two).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    expect(three).toHaveFocus();
    expect(three).toHaveAttribute("aria-selected", "false");

    await user.keyboard(" ");
    expect(three).toHaveAttribute("aria-selected", "true");
  });

  it("uses Up and Down arrows when the tablist is vertical", async () => {
    const user = userEvent.setup();
    render(<Rounds orientation="vertical" />);

    const { one, two } = tabs();
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");

    one.focus();
    await user.keyboard("{ArrowDown}");
    expect(two).toHaveFocus();
  });

  it("selects the first tab when no value or defaultValue is supplied", () => {
    render(
      <main>
        <Tabs>
          <TabList aria-label="Deck sections">
            <Tab value="hero">Hero</Tab>
            <Tab value="weapons">Weapons</Tab>
          </TabList>
          <TabPanel value="hero">Kayo</TabPanel>
          <TabPanel value="weapons">Romping Club</TabPanel>
        </Tabs>
      </main>,
    );

    expect(screen.getByRole("tab", { name: "Hero" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Hero" })).toHaveAttribute("tabindex", "0");
  });

  it("skips disabled tabs when arrowing", async () => {
    const user = userEvent.setup();
    render(
      <main>
        <Tabs defaultValue="round-1">
          <TabList aria-label="Tournament rounds">
            <Tab value="round-1">Round 1</Tab>
            <Tab value="round-2" disabled>
              Round 2
            </Tab>
            <Tab value="round-3">Round 3</Tab>
          </TabList>
          <TabPanel value="round-1">Round 1 results</TabPanel>
          <TabPanel value="round-2">Round 2 results</TabPanel>
          <TabPanel value="round-3">Round 3 results</TabPanel>
        </Tabs>
      </main>,
    );

    screen.getByRole("tab", { name: "Round 1" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Round 3" })).toHaveFocus();
  });

  it("wires aria-controls and aria-labelledby to the real tab and panel nodes", () => {
    render(<Rounds />);

    for (const name of ["Round 1", "Round 2", "Round 3"]) {
      const tab = screen.getByRole("tab", { name });
      const controls = tab.getAttribute("aria-controls");
      expect(controls).toBeTruthy();

      const panel = document.getElementById(controls as string);
      expect(panel).not.toBeNull();
      expect(panel).toHaveAttribute("role", "tabpanel");
      expect(panel).toHaveAttribute("aria-labelledby", tab.id);
      // Panels stay mounted so aria-controls never dangles.
      expect(panel).toHaveTextContent(`${name} results`);
      expect(panel).toHaveAttribute("tabindex", "0");
    }

    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  });

  it("has no a11y violations", async () => {
    const { container } = render(<Rounds />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
