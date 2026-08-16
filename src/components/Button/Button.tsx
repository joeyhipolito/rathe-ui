import * as React from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Marks the button as working. The button keeps its label, its size and its
   * place in the tab order — only activation is suppressed.
   */
  loading?: boolean;
  /** Text announced after the label while loading. */
  loadingLabel?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    loadingLabel = "loading",
    className,
    children,
    disabled = false,
    // Defaulting to "button" rather than the HTML default "submit": a scorekeeper
    // hitting a stray toolbar button mid-round should not post the form.
    type = "button",
    onClick,
    ...rest
  },
  ref,
) {
  const classes = [
    "rathe-button",
    `rathe-button--${variant}`,
    `rathe-button--${size}`,
    loading ? "rathe-button--loading" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // A loading button stays reachable so focus is not thrown to the body
  // mid-submit, so `disabled` is wrong here; activation is blocked in the
  // handler and advertised through aria-disabled instead.
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
    >
      {loading ? <span className="rathe-button__spinner" aria-hidden="true" /> : null}
      <span className="rathe-button__label">{children}</span>
      {loading ? <span className="rathe-sr-only">{loadingLabel}</span> : null}
    </button>
  );
});
