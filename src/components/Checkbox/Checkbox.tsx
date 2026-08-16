import * as React from "react";
import "./Checkbox.css";

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "type" | "children"> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /**
   * Partial selection, e.g. a "select all" box over a half-selected pairing
   * list. It is a DOM property with no HTML attribute, so it is written to the
   * node in an effect; the browser then exposes `mixed` on its own and no
   * aria-checked override is needed.
   */
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    hint,
    error,
    indeterminate = false,
    className,
    id: idProp,
    disabled,
    required,
    "aria-describedby": describedByProp,
    "aria-invalid": invalidProp,
    ...rest
  },
  ref,
) {
  const innerRef = React.useRef<HTMLInputElement | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, []);

  // There is no `indeterminate` HTML attribute, React cannot render it, so the
  // property has to be written to the node after every commit that changes it.
  React.useEffect(() => {
    const node = innerRef.current;
    if (node) {
      node.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const generatedId = React.useId();
  const id = idProp ?? `rathe-checkbox-${generatedId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={[
        "rathe-checkbox",
        error ? "rathe-checkbox--invalid" : null,
        disabled ? "rathe-checkbox--disabled" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="rathe-checkbox__row">
        {/* The input keeps its box, appearance:none restyles it without
            removing it from the accessibility tree or the tab order. The mark
            is a sibling overlay because pseudo-elements on form controls are
            not reliable across browsers. */}
        <span className="rathe-checkbox__box">
          <input
            {...rest}
            ref={innerRef}
            type="checkbox"
            id={id}
            disabled={disabled}
            required={required}
            className="rathe-checkbox__input"
            aria-describedby={describedBy}
            aria-invalid={error ? true : invalidProp}
          />
          <span className="rathe-checkbox__mark" aria-hidden="true" />
        </span>

        <label className="rathe-checkbox__label" htmlFor={id}>
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="rathe-checkbox__required-mark">
                *
              </span>
              <span className="rathe-sr-only">(required)</span>
            </>
          ) : null}
        </label>
      </div>

      {hint ? (
        <p className="rathe-checkbox__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className="rathe-checkbox__error" id={errorId} role="alert">
          <svg
            className="rathe-checkbox__error-icon"
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
          <span className="rathe-checkbox__error-text">{error}</span>
        </p>
      ) : null}
    </div>
  );
});
