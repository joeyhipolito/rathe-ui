import * as React from "react";
import "./Badge.css";

export type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Adds a filled status dot before the glyph, for "live right now" states. */
  dot?: boolean;
  /**
   * Suppresses the shape glyph. Only correct when the label itself already
   * names the status ("Game loss", "Dropped") and the badge sits in a column
   * where every value is a badge, so colour is never the sole differentiator.
   */
  glyph?: boolean;
  children: React.ReactNode;
}

/**
 * One glyph per variant, chosen so the shapes stay distinct at 12px and do not
 * rely on hue: a check, a cross, a triangle and a diamond are still four
 * different marks in greyscale or with any form of colour vision deficiency.
 */
const GLYPHS: Record<BadgeVariant, string> = {
  neutral: "○",
  info: "ℹ",
  success: "✓",
  warning: "▲",
  danger: "✕",
  brand: "◆",
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", size = "md", dot = false, glyph = true, className, children, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={cx(
        "rathe-badge",
        `rathe-badge--${variant}`,
        `rathe-badge--${size}`,
        className,
      )}
    >
      {dot ? <span className="rathe-badge__dot" aria-hidden="true" /> : null}
      {/* The glyph is decoration to assistive technology, because the label
          already carries the meaning, but it is the only non-colour channel a sighted
          user has, so it is never conditional on hue alone. */}
      {glyph ? (
        <span className="rathe-badge__glyph" aria-hidden="true">
          {GLYPHS[variant]}
        </span>
      ) : null}
      <span className="rathe-badge__label">{children}</span>
    </span>
  );
});
