import * as React from "react";
import "./EmptyState.css";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/* `title` is omitted from the native attributes on purpose: the DOM `title`
   attribute is a tooltip string, this one is the visible heading, and letting
   them share a name would silently narrow it to `string`. */
export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons or links. Rendered after the copy so the reading order matches. */
  action?: React.ReactNode;
  /** Decorative. Hidden from assistive technology — the title carries meaning. */
  icon?: React.ReactNode;
  /**
   * Heading level. Never hardcoded: the same empty state sits under an <h1> on
   * a standalone page and under an <h3> inside a card on a dashboard, and a
   * fixed level breaks the document outline in one of those two places.
   */
  as?: HeadingLevel;
  /** `compact` fits inside a table body or a card; `panel` is a full surface. */
  variant?: "compact" | "panel";
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    {
      title,
      description,
      action,
      icon,
      as: Heading = "h2",
      variant = "panel",
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        {...rest}
        ref={ref}
        className={cx("rathe-empty", `rathe-empty--${variant}`, className)}
      >
        {icon ? (
          <div className="rathe-empty__icon" aria-hidden="true">
            {icon}
          </div>
        ) : null}
        <Heading className="rathe-empty__title">{title}</Heading>
        {description ? <p className="rathe-empty__description">{description}</p> : null}
        {children}
        {action ? <div className="rathe-empty__action">{action}</div> : null}
      </div>
    );
  },
);
