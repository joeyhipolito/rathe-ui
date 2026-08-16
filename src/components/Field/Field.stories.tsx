import type { Meta, StoryObj } from "@storybook/react";
import { Field } from "./Field";

const meta: Meta<typeof Field> = {
  title: "Primitives/Field",
  component: Field,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "One wrapper owns label, hint and error for both `<input>` and `<textarea>`, because the wiring is mostly what teams get wrong when each form hand-rolls it: `htmlFor`, a generated id, `aria-describedby` carrying hint *and* error, `aria-invalid`, `role=\"alert\"`. The error is never colour alone. It carries a warning icon and a screen-reader \"Error:\" prefix, and the invalid border thickens to 2px, because a colour-blind scorekeeper needs a second signal.",
      },
    },
  },
  args: {
    label: "Player GEM ID",
  },
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  args: { placeholder: "e.g. 1039284" },
};

export const WithHint: Story = {
  args: {
    hint: "Found on the back of the player's membership card.",
    placeholder: "e.g. 1039284",
  },
};

export const WithError: Story = {
  args: {
    error: "No player matches that GEM ID.",
    defaultValue: "0000000",
  },
};

export const WithHintAndError: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Both messages sit in one space-separated aria-describedby, hint first, because the control should be explained before it is corrected.",
      },
    },
  },
  args: {
    hint: "Found on the back of the player's membership card.",
    error: "No player matches that GEM ID.",
    defaultValue: "0000000",
  },
};

export const Required: Story = {
  args: { required: true, hint: "Every result needs a reporting judge." },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "1039284", hint: "Locked once the round is certified." },
};

export const AsTextarea: Story = {
  args: {
    as: "textarea",
    label: "Judge notes",
    hint: "Visible to head judge and organiser only.",
    rows: 4,
  },
};

export const TextareaWithError: Story = {
  args: {
    as: "textarea",
    label: "Judge notes",
    error: "Notes are required when issuing a game loss.",
    rows: 4,
  },
};
