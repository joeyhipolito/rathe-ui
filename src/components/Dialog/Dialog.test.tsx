import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Dialog } from "./Dialog";

/*
 * jsdom ships HTMLDialogElement but leaves showModal()/close() unimplemented,
 * so calling them throws "Not implemented". These stand-ins do the only part the
 * component depends on: flipping the `open` attribute (which drives jsdom's
 * default `dialog:not([open]) { display: none }` rule, and therefore
 * visibility for both Testing Library and axe) and firing `close` on the way
 * out. The top layer, the inert background, and native Esc handling are not
 * simulated, so Esc is exercised by dispatching the `cancel` event the browser
 * would have dispatched.
 */
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
    if (typeof returnValue === "string") this.returnValue = returnValue;
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

function Harness(props: {
  closeOnBackdrop?: boolean;
  withInitialFocus?: boolean;
  description?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  return (
    <main>
      <button type="button" onClick={() => setOpen(true)}>
        Open pairings
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Round 4 pairings"
        description={props.description ?? "Seating is final once you confirm."}
        closeOnBackdrop={props.closeOnBackdrop}
        initialFocusRef={props.withInitialFocus ? confirmRef : undefined}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)}>
              Back
            </button>
            <button type="button" ref={confirmRef} onClick={() => setOpen(false)}>
              Confirm pairings
            </button>
          </>
        }
      >
        <p>Table 1 through table 24 are seated.</p>
      </Dialog>
    </main>
  );
}

describe("Dialog", () => {
  it("moves focus into the dialog on open and restores it to the opener on close", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Open pairings" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Round 4 pairings" });
    expect(dialog).toBeVisible();
    // First focusable inside the content region, not the close button, which
    // is earlier in the DOM but a poor first stop.
    expect(screen.getByRole("button", { name: "Back" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("focuses the element nominated by initialFocusRef", async () => {
    const user = userEvent.setup();
    render(<Harness withInitialFocus />);

    await user.click(screen.getByRole("button", { name: "Open pairings" }));

    expect(screen.getByRole("button", { name: "Confirm pairings" })).toHaveFocus();
  });

  it("closes on a backdrop click and ignores clicks inside the panel", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open pairings" }));
    const dialog = container.querySelector("dialog");
    expect(dialog).not.toBeNull();

    await user.click(screen.getByText("Table 1 through table 24 are seated."));
    expect(screen.getByRole("dialog")).toBeVisible();

    // A ::backdrop click reports the dialog element itself as the target.
    await user.click(dialog as HTMLDialogElement);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close on a backdrop click when closeOnBackdrop is false", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness closeOnBackdrop={false} />);

    await user.click(screen.getByRole("button", { name: "Open pairings" }));
    await user.click(container.querySelector("dialog") as HTMLDialogElement);

    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("routes Esc through the same close path as the close button", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Open pairings" });
    await user.click(trigger);

    const dialog = container.querySelector("dialog") as HTMLDialogElement;
    fireEvent(dialog, new Event("cancel", { cancelable: true, bubbles: false }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("locks body scroll while open and restores the previous value on close", async () => {
    const user = userEvent.setup();
    document.body.style.overflow = "auto";
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open pairings" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });

  it("wires aria-labelledby and aria-describedby to the real title and description nodes", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness description="Seating is final once you confirm." />);

    await user.click(screen.getByRole("button", { name: "Open pairings" }));
    const dialog = container.querySelector("dialog") as HTMLDialogElement;

    const labelledBy = dialog.getAttribute("aria-labelledby");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();

    expect(document.getElementById(labelledBy as string)).toHaveTextContent("Round 4 pairings");
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      "Seating is final once you confirm.",
    );
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("omits aria-describedby when there is no description", () => {
    const { container } = render(
      <main>
        <Dialog open onClose={() => {}} title="Concede match">
          <p>Body</p>
        </Dialog>
      </main>,
    );

    expect(container.querySelector("dialog")).not.toHaveAttribute("aria-describedby");
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <main>
        <Dialog
          open
          onClose={() => {}}
          title="Round 4 pairings"
          description="Seating is final once you confirm."
          footer={<button type="button">Confirm pairings</button>}
        >
          <p>Table 1 through table 24 are seated.</p>
        </Dialog>
      </main>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
