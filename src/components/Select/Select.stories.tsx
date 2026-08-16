import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A native `<select>` with the same label/hint/error wiring as Field. The decision is to *not* build a custom listbox: a div-based one has to reimplement typeahead, virtual cursors and every mobile screen-reader quirk, and it still loses to the OS picker on the phone a store owner actually runs the event from. Styling stops at `appearance: none` and a chevron drawn with CSS borders, so the popup remains the platform's.",
      },
    },
  },
  args: {
    label: "Format",
    children: (
      <>
        <option value="cc">Classic Constructed</option>
        <option value="blitz">Blitz</option>
        <option value="draft">Booster Draft</option>
        <option value="sealed">Sealed Deck</option>
      </>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const WithHint: Story = {
  args: { hint: "Determines the deck legality checks applied at registration." },
};

export const WithError: Story = {
  args: { error: "Draft is not available for this venue's product allocation." },
};

export const WithHintAndError: Story = {
  args: {
    hint: "Determines the deck legality checks applied at registration.",
    error: "Draft is not available for this venue's product allocation.",
  },
};

export const Required: Story = {
  args: { required: true, defaultValue: "" },
};

export const Disabled: Story = {
  args: { disabled: true, hint: "Locked after round one has been paired." },
};

export const WithOptgroups: Story = {
  args: {
    label: "Event type",
    children: (
      <>
        <optgroup label="Casual">
          <option value="armory">Armory</option>
          <option value="skirmish">Skirmish</option>
        </optgroup>
        <optgroup label="Competitive">
          <option value="pq">Pro Quest</option>
          <option value="battle-hardened">Battle Hardened</option>
        </optgroup>
      </>
    ),
  },
};
