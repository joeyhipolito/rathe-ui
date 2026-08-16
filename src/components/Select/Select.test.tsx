import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Select } from "./Select";

function formats() {
  return (
    <>
      <option value="cc">Classic Constructed</option>
      <option value="blitz">Blitz</option>
      <option value="draft">Booster Draft</option>
    </>
  );
}

describe("Select", () => {
  it("renders a native select and reports the chosen option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select label="Format" onChange={onChange}>
        {formats()}
      </Select>,
    );

    const select = screen.getByLabelText("Format");
    expect(select.tagName).toBe("SELECT");

    await user.selectOptions(select, "blitz");

    expect(select).toHaveValue("blitz");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not change value when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select label="Format" disabled defaultValue="cc" onChange={onChange}>
        {formats()}
      </Select>,
    );

    const select = screen.getByLabelText("Format");
    expect(select).toBeDisabled();
    await user.click(select);

    expect(select).toHaveValue("cc");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("references hint and error from aria-describedby and sets aria-invalid", () => {
    render(
      <Select label="Format" hint="Sets deck legality checks." error="Draft is unavailable.">
        {formats()}
      </Select>,
    );

    const select = screen.getByLabelText("Format");
    const hint = screen.getByText("Sets deck legality checks.");
    const error = screen.getByRole("alert");

    const describedBy = select.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toEqual([hint.id, error.id]);
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Sets deck legality checks. Error: Draft is unavailable.");
  });

  it("omits aria-invalid and the alert when valid", () => {
    render(<Select label="Format">{formats()}</Select>);

    expect(screen.getByLabelText("Format")).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("forwards the ref and merges className and pass-through props", () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(
      <Select label="Format" ref={ref} className="custom" name="format" data-analytics="format">
        {formats()}
      </Select>,
    );

    const select = screen.getByLabelText("Format");
    expect(ref.current).toBe(select);
    expect(select).toHaveAttribute("name", "format");
    expect(select).toHaveAttribute("data-analytics", "format");
    expect(select.closest(".rathe-select")).toHaveClass("custom");
  });

  it("has no a11y violations with a hint and an error", async () => {
    const { container } = render(
      <Select label="Format" required hint="Sets deck legality checks." error="Draft is unavailable.">
        {formats()}
      </Select>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
