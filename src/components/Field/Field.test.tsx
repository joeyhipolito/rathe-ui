import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Field } from "./Field";

describe("Field", () => {
  it("associates the label with the control and accepts typing", async () => {
    const user = userEvent.setup();
    render(<Field label="Player GEM ID" />);

    const input = screen.getByLabelText("Player GEM ID");
    await user.type(input, "1039284");

    expect(input).toHaveValue("1039284");
  });

  it("does not accept typing when disabled", async () => {
    const user = userEvent.setup();
    render(<Field label="Player GEM ID" disabled />);

    const input = screen.getByLabelText("Player GEM ID");
    await user.type(input, "1039284");

    expect(input).toBeDisabled();
    expect(input).toHaveValue("");
  });

  it("references hint and error from a single aria-describedby and sets aria-invalid", () => {
    render(
      <Field
        label="Player GEM ID"
        hint="Found on the membership card."
        error="No player matches that GEM ID."
      />,
    );

    const input = screen.getByLabelText("Player GEM ID");
    const hint = screen.getByText("Found on the membership card.");
    const error = screen.getByRole("alert");

    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toContain(hint.id);
    expect(describedBy).toContain(error.id);
    expect(describedBy).toHaveLength(2);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Found on the membership card. Error: No player matches that GEM ID.",
    );
  });

  it("keeps a consumer-supplied aria-describedby alongside the generated ids", () => {
    render(
      <>
        <span id="external-note">Case sensitive.</span>
        <Field label="Player GEM ID" aria-describedby="external-note" error="Unknown ID." />
      </>,
    );

    const describedBy =
      screen.getByLabelText("Player GEM ID").getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy[0]).toBe("external-note");
    expect(describedBy).toHaveLength(2);
  });

  it("omits aria-invalid and the alert when there is no error", () => {
    render(<Field label="Player GEM ID" hint="Found on the membership card." />);

    const input = screen.getByLabelText("Player GEM ID");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders a textarea via the as prop and forwards the ref to it", () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Field as="textarea" label="Judge notes" ref={ref} rows={4} className="custom" />);

    const textarea = screen.getByLabelText("Judge notes");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("rows", "4");
    expect(ref.current).toBe(textarea);
    expect(textarea.closest(".rathe-field")).toHaveClass("custom");
  });

  it("forwards the ref to the input by default", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Field label="Player GEM ID" ref={ref} />);

    expect(ref.current).toBe(screen.getByLabelText("Player GEM ID"));
  });

  it("has no a11y violations with a hint and an error", async () => {
    const { container } = render(
      <Field
        label="Player GEM ID"
        hint="Found on the membership card."
        error="No player matches that GEM ID."
        required
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
