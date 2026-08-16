import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Four variants, two sizes, one loading state. `danger` resolves to the semantic error red and never to the brand vermilion, so a destructive confirm in GEM cannot be mistaken for an on-brand call to action. Loading does not disable the button: it keeps the label, keeps focus, sets `aria-busy`, and blocks activation in the handler, because disabling mid-submit throws keyboard focus to the body and a scorekeeper loses their place.",
      },
    },
  },
  args: {
    children: "Report result",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Primary: Story = {
  args: { variant: "primary", children: "Submit match" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Save draft" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Cancel" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Drop player" },
};

export const Small: Story = {
  args: { size: "sm", children: "Edit" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true, children: "Submit match" },
};

export const Loading: Story = {
  args: { variant: "primary", loading: true, children: "Submitting round" },
};

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: "Every variant at both sizes, for reviewing weight and contrast side by side.",
      },
    },
  },
  render: () => (
    <div style={{ display: "grid", gap: "var(--rathe-space-3)", justifyItems: "start" }}>
      {(["primary", "secondary", "ghost", "danger"] as const).map((variant) => (
        <div key={variant} style={{ display: "flex", gap: "var(--rathe-space-3)", alignItems: "center" }}>
          <Button variant={variant} size="md">
            {variant} md
          </Button>
          <Button variant={variant} size="sm">
            {variant} sm
          </Button>
          <Button variant={variant} size="md" disabled>
            disabled
          </Button>
          <Button variant={variant} size="md" loading>
            loading
          </Button>
        </div>
      ))}
    </div>
  ),
};
