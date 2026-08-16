import * as React from "react";
import { render, screen, act, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { ToastProvider, useToast } from "./Toast";

function Console(props: { duration?: number }) {
  const toast = useToast();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          toast({
            title: "Result recorded",
            description: "Table 12, Kayo 2-1 Dorinthea.",
            variant: "success",
            duration: props.duration,
          })
        }
      >
        Record result
      </button>
      <button
        type="button"
        onClick={() =>
          toast({
            title: "Could not sync to GEM",
            variant: "danger",
          })
        }
      >
        Fail a sync
      </button>
    </>
  );
}

function Harness(props: { duration?: number; max?: number }) {
  return (
    <ToastProvider duration={props.duration ?? 5000} max={props.max}>
      <main>
        <Console duration={props.duration} />
      </main>
    </ToastProvider>
  );
}

/*
 * The timer tests drive the DOM with fireEvent rather than user-event: with
 * vitest's fake timers installed, user-event's internal waits never settle,
 * and a hung test leaves the fake clock installed for every test after it.
 * React synthesises onMouseEnter/onMouseLeave from mouseover/mouseout, so
 * those are the events dispatched here.
 */
function hover(element: HTMLElement) {
  fireEvent.mouseOver(element, { relatedTarget: document.body });
}

function unhover(element: HTMLElement) {
  fireEvent.mouseOut(element, { relatedTarget: document.body });
}

function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function toastNode(title: string): HTMLElement {
  const node = screen.getByText(title).closest(".rathe-toast");
  if (!node) throw new Error(`No toast found for "${title}"`);
  return node as HTMLElement;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("mounts both live regions empty, before any toast fires", () => {
    render(<Harness />);

    const polite = screen.getByRole("status");
    const assertive = screen.getByRole("alert");

    expect(polite).toBeInTheDocument();
    expect(assertive).toBeInTheDocument();
    expect(polite).toBeEmptyDOMElement();
    expect(assertive).toBeEmptyDOMElement();
  });

  it("declares fixed politeness on each region and routes danger to the assertive one", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const polite = screen.getByRole("status");
    const assertive = screen.getByRole("alert");
    expect(polite).toHaveAttribute("aria-live", "polite");
    expect(assertive).toHaveAttribute("aria-live", "assertive");

    await user.click(screen.getByRole("button", { name: "Record result" }));
    await user.click(screen.getByRole("button", { name: "Fail a sync" }));

    expect(within(polite).getByText("Result recorded")).toBeInTheDocument();
    expect(within(assertive).getByText("Could not sync to GEM")).toBeInTheDocument();
    // Politeness is never mutated after mount, only which region receives children.
    expect(polite).toHaveAttribute("aria-live", "polite");
    expect(assertive).toHaveAttribute("aria-live", "assertive");
  });

  it("pauses the auto-dismiss timer on hover and resumes it on leave", () => {
    vi.useFakeTimers();
    render(<Harness duration={1000} />);
    fireEvent.click(screen.getByRole("button", { name: "Record result" }));

    const toast = toastNode("Result recorded");
    tick(400);
    hover(toast);

    // Well past the original duration; the countdown is held while hovered.
    tick(5000);
    expect(screen.getByText("Result recorded")).toBeInTheDocument();

    unhover(toast);
    // Resumes with the 600ms that were left, not a fresh 1000ms.
    tick(500);
    expect(screen.getByText("Result recorded")).toBeInTheDocument();

    tick(200);
    expect(screen.queryByText("Result recorded")).not.toBeInTheDocument();
  });

  it("pauses the timer while focus is inside the toast", () => {
    vi.useFakeTimers();
    render(<Harness duration={1000} />);
    fireEvent.click(screen.getByRole("button", { name: "Record result" }));

    act(() => {
      screen.getByRole("button", { name: "Dismiss: Result recorded" }).focus();
    });
    tick(5000);

    expect(screen.getByText("Result recorded")).toBeInTheDocument();
  });

  it("auto-dismisses a normal toast but never a danger toast", () => {
    vi.useFakeTimers();
    render(<Harness duration={1000} />);
    fireEvent.click(screen.getByRole("button", { name: "Record result" }));
    fireEvent.click(screen.getByRole("button", { name: "Fail a sync" }));

    tick(60_000);

    expect(screen.queryByText("Result recorded")).not.toBeInTheDocument();
    expect(screen.getByText("Could not sync to GEM")).toBeInTheDocument();
  });

  it("dismisses through the accessible close button", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Fail a sync" }));
    await user.click(screen.getByRole("button", { name: "Dismiss: Could not sync to GEM" }));

    expect(screen.queryByText("Could not sync to GEM")).not.toBeInTheDocument();
  });

  it("caps the stack without evicting a danger toast", async () => {
    const user = userEvent.setup();
    render(<Harness max={2} />);

    await user.click(screen.getByRole("button", { name: "Fail a sync" }));
    await user.click(screen.getByRole("button", { name: "Record result" }));
    await user.click(screen.getByRole("button", { name: "Record result" }));

    expect(screen.getByText("Could not sync to GEM")).toBeInTheDocument();
    expect(screen.getAllByText("Result recorded")).toHaveLength(1);
  });

  it("throws when useToast is called outside a provider", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Console />)).toThrow(/inside a <ToastProvider>/);
    error.mockRestore();
  });

  it("has no a11y violations", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Record result" }));
    await user.click(screen.getByRole("button", { name: "Fail a sync" }));

    // The regions are portalled to document.body by design, so the whole body
    // is scanned rather than the render container. The landmark rule is turned
    // off for the same reason: a body-level toast overlay is not page content
    // and does not belong inside a landmark.
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
