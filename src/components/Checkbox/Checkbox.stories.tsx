import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A real `<input type=\"checkbox\">` restyled with `appearance: none`, never hidden with `display: none`, because the input has to keep focus and keep its role. It also keeps working when CSS fails to load, which is the state a Django page in a store with bad wifi actually reaches. `indeterminate` is a DOM property with no HTML attribute, so it is written to the node in an effect rather than passed as a prop to the element.",
      },
    },
  },
  args: {
    label: "Deck list checked",
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const WithHint: Story = {
  args: {
    hint: "Head judge has verified the 60-card minimum and the hero's legality.",
  },
};

export const WithError: Story = {
  args: {
    error: "The deck list must be checked before the player can be paired.",
  },
};

export const Required: Story = {
  args: { required: true, hint: "Required by tournament rules for competitive events." },
};

export const Disabled: Story = {
  args: { disabled: true, hint: "Locked once round one is paired." },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true, label: "All decks checked" },
};

export const SelectAll: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The parent box drives the children and reads its own mixed state back from them. This is the case indeterminate exists for.",
      },
    },
  },
  render: () => {
    const players = ["Kayo", "Prism", "Viserai"];
    const [checked, setChecked] = React.useState<string[]>(["Prism"]);
    const all = checked.length === players.length;
    const none = checked.length === 0;

    return (
      <div style={{ display: "grid", gap: "var(--rathe-space-2)" }}>
        <Checkbox
          label="All decks checked"
          checked={all}
          indeterminate={!all && !none}
          onChange={(event) => setChecked(event.target.checked ? [...players] : [])}
        />
        <div style={{ display: "grid", gap: "var(--rathe-space-2)", paddingInlineStart: "var(--rathe-space-5)" }}>
          {players.map((player) => (
            <Checkbox
              key={player}
              label={player}
              checked={checked.includes(player)}
              onChange={(event) =>
                setChecked((current) =>
                  event.target.checked
                    ? [...current, player]
                    : current.filter((name) => name !== player),
                )
              }
            />
          ))}
        </div>
      </div>
    );
  },
};
