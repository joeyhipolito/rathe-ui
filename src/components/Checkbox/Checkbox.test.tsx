import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("toggles when the label is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Deck list checked" onChange={onChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "Deck list checked" });
    expect(checkbox).not.toBeChecked();

    await user.click(screen.getByText("Deck list checked"));

    expect(checkbox).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Deck list checked" disabled onChange={onChange} />);

    const checkbox = screen.getByRole("checkbox", { name: "Deck list checked" });
    await user.click(checkbox);

    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stays focusable, it is restyled, not hidden", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Deck list checked" />);

    const checkbox = screen.getByRole("checkbox", { name: "Deck list checked" });
    await user.tab();

    expect(checkbox).toHaveFocus();
    await user.keyboard(" ");
    expect(checkbox).toBeChecked();
  });

  it("sets the indeterminate DOM property and clears it when the prop flips", () => {
    const { rerender } = render(<Checkbox label="All decks checked" indeterminate />);

    const checkbox = screen.getByRole("checkbox", { name: "All decks checked" });
    expect((checkbox as HTMLInputElement).indeterminate).toBe(true);
    // It is a property, never an attribute, asserting that keeps a future
    // "just pass it through" refactor honest.
    expect(checkbox).not.toHaveAttribute("indeterminate");

    rerender(<Checkbox label="All decks checked" indeterminate={false} />);
    expect((checkbox as HTMLInputElement).indeterminate).toBe(false);
  });

  it("wires label, hint and error to the input", () => {
    render(
      <Checkbox
        label="Deck list checked"
        hint="Verified against the 60-card minimum."
        error="Required before pairing."
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Deck list checked" });
    const hint = screen.getByText("Verified against the 60-card minimum.");
    const error = screen.getByRole("alert");

    const describedBy = checkbox.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toEqual([hint.id, error.id]);
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAccessibleDescription(
      "Verified against the 60-card minimum. Error: Required before pairing.",
    );
  });

  it("forwards the ref to the input and merges className", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox label="Deck list checked" ref={ref} className="custom" name="deck-checked" />);

    const checkbox = screen.getByRole("checkbox", { name: "Deck list checked" });
    expect(ref.current).toBe(checkbox);
    expect(checkbox).toHaveAttribute("name", "deck-checked");
    expect(checkbox.closest(".rathe-checkbox")).toHaveClass("custom");
  });

  it("has no a11y violations with a hint, an error and mixed state", async () => {
    const { container } = render(
      <Checkbox
        label="All decks checked"
        indeterminate
        hint="Some players are still registering."
        error="Required before pairing."
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
