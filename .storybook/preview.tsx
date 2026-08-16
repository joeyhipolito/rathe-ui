import type { Preview } from "@storybook/react";
import React from "react";
import "../src/styles/tokens.css";

/* Every story renders inside .rathe so the token layer applies, and the
   theme is switchable from the toolbar because a component that has only
   ever been reviewed on one ground is a component with an unknown bug. */
const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: "error" },
  },
  globalTypes: {
    theme: {
      description: "Token theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as string;
      React.useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        document.body.style.background = "var(--rathe-paper)";
      }, [theme]);
      return (
        <div className="rathe" style={{ padding: "2rem", background: "var(--rathe-paper)" }}>
          <Story />
        </div>
      );
    },
  ],
};
export default preview;
