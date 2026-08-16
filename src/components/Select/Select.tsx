import * as React from "react";
import "./Select.css";

export interface SelectProps extends Omit<React.ComponentPropsWithoutRef<"select">, "size"> {
  /** Visible label. Always rendered. */
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** `<option>` / `<optgroup>` children, exactly as the platform expects them. */
  children?: React.ReactNode;
}

/**
 * A native `<select>`, deliberately. A custom listbox is a permanent
 * accessibility liability — typeahead, virtual cursors, Android TalkBack and
 * iOS VoiceOver all have to be reimplemented and then re-fixed on every OS
 * release — and it is worse on a phone at a store counter than the platform
 * picker. Styling stops at `appearance: none` plus a CSS chevron so the popup
 * stays the operating system's.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    className,
    id: idProp,
    required,
    children,
    "aria-describedby": describedByProp,
    "aria-invalid": invalidProp,
    ...rest
  },
  ref,
) {
  const generatedId = React.useId();
  const id = idProp ?? `rathe-select-${generatedId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={["rathe-select", error ? "rathe-select--invalid" : null, className]
        .filter(Boolean)
        .join(" ")}
    >
      <label className="rathe-select__label" htmlFor={id}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="rathe-select__required-mark">
              *
            </span>
            <span className="rathe-sr-only">(required)</span>
          </>
        ) : null}
      </label>

      {hint ? (
        <p className="rathe-select__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {/* The chevron is a ::after on this wrapper, not on the select: pseudo
          elements do not render on replaced form controls in every browser. */}
      <div className="rathe-select__control-wrap">
        <select
          {...rest}
          ref={ref}
          id={id}
          required={required}
          className={["rathe-select__control", error ? "rathe-select__control--invalid" : null]
            .filter(Boolean)
            .join(" ")}
          aria-describedby={describedBy}
          aria-invalid={error ? true : invalidProp}
        >
          {children}
        </select>
      </div>

      {error ? (
        <p className="rathe-select__error" id={errorId} role="alert">
          <svg
            className="rathe-select__error-icon"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M8 1.6 15 14.4H1L8 1.6Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M8 6v3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="8" cy="11.9" r="0.85" fill="currentColor" />
          </svg>
          <span className="rathe-sr-only">Error: </span>
          <span className="rathe-select__error-text">{error}</span>
        </p>
      ) : null}
    </div>
  );
});
