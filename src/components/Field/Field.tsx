import * as React from "react";
import "./Field.css";

type FieldOwnProps = {
  /** Visible label. Always rendered — a placeholder is not a label. */
  label: React.ReactNode;
  /** Supporting text, announced before the error. */
  hint?: React.ReactNode;
  /** When present the control is marked invalid and the message is announced. */
  error?: React.ReactNode;
  className?: string;
};

type InputFieldProps = FieldOwnProps & { as?: "input" } & Omit<
    React.ComponentPropsWithoutRef<"input">,
    "children"
  >;

type TextareaFieldProps = FieldOwnProps & { as: "textarea" } & Omit<
    React.ComponentPropsWithoutRef<"textarea">,
    "children"
  >;

export type FieldProps = InputFieldProps | TextareaFieldProps;

export const Field = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, FieldProps>(
  function Field(props, ref) {
    const {
      label,
      hint,
      error,
      className,
      as = "input",
      id: idProp,
      required,
      "aria-describedby": describedByProp,
      "aria-invalid": invalidProp,
      ...rest
    } = props;

    // useId gives a stable id across server render and hydration, which matters
    // because GEM renders some forms from Django and hydrates islands over them.
    const generatedId = React.useId();
    const id = idProp ?? `rathe-field-${generatedId}`;
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    const describedBy =
      [describedByProp, hintId, errorId].filter(Boolean).join(" ") || undefined;

    const controlClassName = [
      "rathe-field__control",
      as === "textarea" ? "rathe-field__control--textarea" : null,
      error ? "rathe-field__control--invalid" : null,
    ]
      .filter(Boolean)
      .join(" ");

    const shared = {
      id,
      className: controlClassName,
      required,
      "aria-describedby": describedBy,
      // An error always wins, but a consumer marking the control invalid for a
      // reason we do not render is not overwritten.
      "aria-invalid": error ? true : invalidProp,
    } as const;

    return (
      <div
        className={["rathe-field", error ? "rathe-field--invalid" : null, className]
          .filter(Boolean)
          .join(" ")}
      >
        <label className="rathe-field__label" htmlFor={id}>
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="rathe-field__required-mark">
                *
              </span>
              <span className="rathe-sr-only">(required)</span>
            </>
          ) : null}
        </label>

        {hint ? (
          <p className="rathe-field__hint" id={hintId}>
            {hint}
          </p>
        ) : null}

        {as === "textarea" ? (
          <textarea
            {...(rest as Omit<React.ComponentPropsWithoutRef<"textarea">, "children">)}
            {...shared}
            ref={ref as React.Ref<HTMLTextAreaElement>}
          />
        ) : (
          <input
            {...(rest as Omit<React.ComponentPropsWithoutRef<"input">, "children">)}
            {...shared}
            ref={ref as React.Ref<HTMLInputElement>}
          />
        )}

        {error ? (
          <p className="rathe-field__error" id={errorId} role="alert">
            {/* The icon is what keeps the error legible for a colour-blind
                scorekeeper; the tint alone would not be. */}
            <svg
              className="rathe-field__error-icon"
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
            <span className="rathe-field__error-text">{error}</span>
          </p>
        ) : null}
      </div>
    );
  },
);
