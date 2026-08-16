import * as React from "react";
import "./Skeleton.css";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Any CSS length. Numbers are treated as pixels. */
  width?: number | string;
  height?: number | string;
  /** Any CSS radius; defaults to the small token. */
  radius?: string;
  /** Renders a stack of bars for multi-line text. The last line is shortened. */
  lines?: number;
  /** Width of the final line in a multi-line stack. */
  lastLineWidth?: string;
}

export interface SkeletonTextProps extends SkeletonProps {
  /** Text placed in the live region. Say what is loading, not just "loading". */
  loadingLabel?: string;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function toLength(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * A skeleton is `aria-hidden` on purpose. Announcing a placeholder bar is noise
 * — what a screen reader user needs is one polite "Loading standings" and then
 * the real content, which is why the live region is a separate node the
 * consumer owns (or gets from SkeletonText).
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { width, height, radius, lines = 1, lastLineWidth = "60%", className, style, ...rest },
  ref,
) {
  const count = Math.max(1, Math.floor(lines));

  const vars = {
    ...style,
    "--rathe-skeleton-w": toLength(width) ?? "100%",
    "--rathe-skeleton-h": toLength(height) ?? "1em",
    "--rathe-skeleton-r": radius ?? "var(--rathe-radius-sm)",
  } as React.CSSProperties;

  if (count === 1) {
    return (
      <div
        aria-hidden="true"
        {...rest}
        ref={ref}
        className={cx("rathe-skeleton", "rathe-skeleton__bar", className)}
        style={vars}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      {...rest}
      ref={ref}
      className={cx("rathe-skeleton", "rathe-skeleton--stack", className)}
      style={vars}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rathe-skeleton__bar"
          style={index === count - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
});

/**
 * Skeleton plus the live region it needs. The announcement sits outside the
 * aria-hidden subtree — nesting it inside would hide the one thing that is
 * supposed to be heard.
 */
export const SkeletonText = React.forwardRef<HTMLDivElement, SkeletonTextProps>(
  function SkeletonText({ loadingLabel = "Loading", className, lines = 3, ...rest }, ref) {
    return (
      <div className={cx("rathe-skeleton-text", className)}>
        <span className="rathe-sr-only" role="status" aria-live="polite">
          {loadingLabel}
        </span>
        <Skeleton ref={ref} lines={lines} {...rest} />
      </div>
    );
  },
);
