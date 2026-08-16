import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Radio, RadioGroup } from "./Radio";

function Results(props: { name?: string }) {
  return (
    <RadioGroup legend="Match result" name={props.name ?? "result"}>
      <Radio value="win" label="Win" />
      <Radio value="loss" label="Loss" />
      <Radio value="draw" label="Draw" />
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("selects one option at a time and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup legend="Match result" name="result" onValueChange={onValueChange}>
        <Radio value="win" label="Win" />
        <Radio value="loss" label="Loss" />
      </RadioGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "Win" }));
    expect(screen.getByRole("radio", { name: "Win" })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("win", expect.anything());

    await user.click(screen.getByRole("radio", { name: "Loss" }));
    expect(screen.getByRole("radio", { name: "Loss" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Win" })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("moves selection with the arrow keys, which the shared name provides", async () => {
    const user = userEvent.setup();
    render(<Results />);

    const win = screen.getByRole("radio", { name: "Win" });
    win.focus();
    expect(win).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    const loss = screen.getByRole("radio", { name: "Loss" });
    expect(loss).toHaveFocus();
    expect(loss).toBeChecked();

    // All three share one name, that is what makes the group a single tab stop.
    const names = screen.getAllByRole("radio").map((radio) => radio.getAttribute("name"));
    expect(new Set(names).size).toBe(1);
  });

  it("does not select anything when the group is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup legend="Match result" name="result" disabled onValueChange={onValueChange}>
        <Radio value="win" label="Win" />
        <Radio value="loss" label="Loss" />
      </RadioGroup>,
    );

    const win = screen.getByRole("radio", { name: "Win" });
    expect(win).toBeDisabled();
    await user.click(win);

    expect(win).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("names the group from its legend and links hint and error", () => {
    render(
      <RadioGroup
        legend="Match result"
        name="result"
        hint="Reported from the winner's seat."
        error="Select a result before submitting."
      >
        <Radio value="win" label="Win" />
      </RadioGroup>,
    );

    const group = screen.getByRole("radiogroup", { name: "Match result" });
    const legend = screen.getByText("Match result");
    const hint = screen.getByText("Reported from the winner's seat.");
    const error = screen.getByRole("alert");

    expect(group.tagName).toBe("FIELDSET");
    expect(group).toHaveAttribute("aria-labelledby", legend.id);
    expect(group.getAttribute("aria-describedby")?.split(" ")).toEqual([hint.id, error.id]);
    expect(group).toHaveAttribute("aria-invalid", "true");
  });

  it("links a per-option hint to that option's input", () => {
    render(
      <RadioGroup legend="Drop reason" name="drop">
        <Radio value="dq" label="Disqualification" hint="Requires head judge notes." />
      </RadioGroup>,
    );

    const radio = screen.getByRole("radio", { name: "Disqualification" });
    const hint = screen.getByText("Requires head judge notes.");
    expect(radio.getAttribute("aria-describedby")).toBe(hint.id);
  });

  it("forwards refs to the fieldset and to the input, and merges className", () => {
    const groupRef = React.createRef<HTMLFieldSetElement>();
    const radioRef = React.createRef<HTMLInputElement>();
    render(
      <RadioGroup legend="Match result" name="result" ref={groupRef} className="group-custom">
        <Radio value="win" label="Win" ref={radioRef} className="radio-custom" />
      </RadioGroup>,
    );

    const group = screen.getByRole("radiogroup", { name: "Match result" });
    const radio = screen.getByRole("radio", { name: "Win" });
    expect(groupRef.current).toBe(group);
    expect(radioRef.current).toBe(radio);
    expect(group).toHaveClass("group-custom");
    expect(radio.closest(".rathe-radio")).toHaveClass("radio-custom");
  });

  it("has no a11y violations with a hint and an error", async () => {
    const { container } = render(
      <RadioGroup
        legend="Match result"
        name="result"
        hint="Reported from the winner's seat."
        error="Select a result before submitting."
      >
        <Radio value="win" label="Win" />
        <Radio value="loss" label="Loss" />
        <Radio value="draw" label="Draw" disabled />
      </RadioGroup>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
