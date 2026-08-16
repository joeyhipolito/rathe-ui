import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Dialog } from "./Dialog";

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  // Every story drives `open` from its own wrapper state, since a dialog with
  // no opener cannot demonstrate focus restoration. These satisfy the required
  // props for the docs table; the wrappers override them.
  args: { open: false, onClose: () => {}, title: "Dialog" },
  parameters: {
    docs: {
      description: {
        component: [
          "Built on the native `<dialog>` element driven by `showModal()`, not on a",
          "div with a hand-rolled focus trap. The browser then owns the top layer, the",
          "inert background, and Esc — three things that JS traps get subtly wrong and",
          "that fail loudly during a live tournament. What the platform does not give",
          "us is added on top: focus is moved into the dialog on open and restored to",
          "the opener on close, backdrop clicks are detected by comparing the event",
          "target to the dialog element (a `::backdrop` click reports the dialog as the",
          "target), and Esc is intercepted via the native `cancel` event so it exits",
          "through the same `onClose` path as the button rather than closing the",
          "element behind React's state.",
        ].join(" "),
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const buttonStyle: React.CSSProperties = {
  font: "inherit",
  padding: "var(--rathe-space-2) var(--rathe-space-4)",
  borderRadius: "var(--rathe-radius-md)",
  border: "1px solid var(--rathe-rule-strong)",
  background: "var(--rathe-surface)",
  color: "var(--rathe-ink)",
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid var(--rathe-blood)",
  background: "var(--rathe-blood)",
  color: "var(--rathe-blood-ink)",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid var(--rathe-danger)",
  background: "var(--rathe-danger)",
  color: "var(--rathe-danger-ink)",
};

function DropRoundDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button type="button" style={buttonStyle} onClick={() => setOpen(true)}>
        Drop player from round
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Drop Kayo from Round 4?"
        description="The player keeps their existing match record. Pairings for Round 4 will be regenerated and any table already seated will be reprinted."
        footer={
          <>
            <button type="button" style={buttonStyle} onClick={() => setOpen(false)}>
              Keep in event
            </button>
            <button type="button" style={primaryButtonStyle} onClick={() => setOpen(false)}>
              Drop player
            </button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Kayo, Berserker Prodigy — seat 12, 2-1-0. Head judge sign-off is recorded against
          your scorekeeper account.
        </p>
      </Dialog>
    </>
  );
}

export const Default: Story = {
  render: () => <DropRoundDialog />,
};

function DestructiveDialog() {
  const [open, setOpen] = React.useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      <button type="button" style={buttonStyle} onClick={() => setOpen(true)}>
        Delete event
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        // A stray backdrop click must not be a way to leave a destructive
        // confirmation ambiguous, so this one only closes deliberately.
        closeOnBackdrop={false}
        initialFocusRef={cancelRef}
        size="sm"
        title="Delete Armory — Tuesday?"
        description="47 recorded matches and 62 registrations are removed. This cannot be undone and does not sync back from GEM."
        footer={
          <>
            <button type="button" ref={cancelRef} style={buttonStyle} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" style={dangerButtonStyle} onClick={() => setOpen(false)}>
              Delete event
            </button>
          </>
        }
      />
    </>
  );
}

export const DestructiveConfirmation: Story = {
  name: "Destructive confirmation (focus nominated, no backdrop close)",
  render: () => <DestructiveDialog />,
};

function ScrollingDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button type="button" style={buttonStyle} onClick={() => setOpen(true)}>
        View round 4 pairings
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Round 4 pairings"
        description="Seating is final. Body scroll is locked behind the dialog while it is open."
        footer={
          <button type="button" style={primaryButtonStyle} onClick={() => setOpen(false)}>
            Print and close
          </button>
        }
      >
        <ol style={{ margin: 0, paddingLeft: "var(--rathe-space-5)" }}>
          {Array.from({ length: 24 }, (_, index) => (
            <li key={index} style={{ padding: "var(--rathe-space-1) 0" }}>
              Table {index + 1} — pairing locked
            </li>
          ))}
        </ol>
      </Dialog>
    </>
  );
}

export const LongContent: Story = {
  name: "Long content (panel scrolls, page does not)",
  render: () => <ScrollingDialog />,
};
