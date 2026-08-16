import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Button } from "./Button";

describe("Button", () => {
  it("calls onClick when activated", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Report result</Button>);

    await user.click(screen.getByRole("button", { name: "Report result" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Report result
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Report result" });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("stays focusable and keeps its accessible name while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Submit round
      </Button>,
    );

    const button = screen.getByRole("button", { name: /submit round/i });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAccessibleName("Submit round loading");

    await user.tab();
    expect(button).toHaveFocus();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("defaults to type=button and accepts an explicit submit type", () => {
    const { rerender } = render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");

    rerender(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });

  it("forwards its ref and merges className and pass-through props", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} className="custom" variant="danger" data-testid="drop" aria-keyshortcuts="d">
        Drop player
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Drop player" });
    expect(ref.current).toBe(button);
    expect(button).toHaveClass("rathe-button", "rathe-button--danger", "custom");
    expect(button).toHaveAttribute("data-testid", "drop");
    expect(button).toHaveAttribute("aria-keyshortcuts", "d");
  });

  it("has no a11y violations across variants and states", async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Submit match</Button>
        <Button variant="secondary">Save draft</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger">Drop player</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Submitting</Button>
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
