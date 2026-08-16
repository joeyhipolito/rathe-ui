import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Radio, RadioGroup } from "./Radio";

const meta: Meta<typeof RadioGroup> = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
  subcomponents: { Radio: Radio as React.ComponentType<unknown> },
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A real `<fieldset>` with a `<legend>` naming the group. Arrow-key movement, the single tab stop, and one-of-many selection are native to inputs sharing a `name`. There is no roving tabindex here on purpose, because a hand-rolled one is how groups end up skipping the first option or trapping focus. The group owns name, value and error, and each `Radio` reads them from context.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

const options = (
  <>
    <Radio value="win" label="Win" />
    <Radio value="loss" label="Loss" />
    <Radio value="draw" label="Draw" />
  </>
);

export const Default: Story = {
  args: {
    legend: "Match result",
    name: "result",
    defaultValue: "win",
    children: options,
  },
};

export const WithHint: Story = {
  args: {
    legend: "Match result",
    name: "result-hint",
    hint: "Reported from the winning player's seat.",
    defaultValue: "win",
    children: options,
  },
};

export const WithError: Story = {
  args: {
    legend: "Match result",
    name: "result-error",
    error: "Select a result before submitting the round.",
    children: options,
  },
};

export const WithOptionHints: Story = {
  args: {
    legend: "Drop reason",
    name: "drop-reason",
    children: (
      <>
        <Radio value="voluntary" label="Voluntary" hint="Player asked to be dropped." />
        <Radio value="no-show" label="No show" hint="Missed the round timer." />
        <Radio value="dq" label="Disqualification" hint="Requires head judge notes." />
      </>
    ),
  },
};

export const DisabledGroup: Story = {
  args: {
    legend: "Match result",
    name: "result-disabled",
    disabled: true,
    defaultValue: "loss",
    hint: "Locked once the round is certified.",
    children: options,
  },
};

export const DisabledOption: Story = {
  args: {
    legend: "Match result",
    name: "result-partial",
    children: (
      <>
        <Radio value="win" label="Win" />
        <Radio value="loss" label="Loss" />
        <Radio value="draw" label="Draw" disabled hint="Draws are off in single elimination." />
      </>
    ),
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story: "Controlled through `value` and `onValueChange`. Each Radio reads its checked state from context.",
      },
    },
  },
  render: () => {
    const [result, setResult] = React.useState("win");
    return (
      <div style={{ display: "grid", gap: "var(--rathe-space-3)" }}>
        <RadioGroup
          legend="Match result"
          name="result-controlled"
          value={result}
          onValueChange={setResult}
        >
          {options}
        </RadioGroup>
        <p style={{ margin: 0, color: "var(--rathe-ink-muted)", fontSize: "var(--rathe-text-sm)" }}>
          Reported: {result}
        </p>
      </div>
    );
  },
};
