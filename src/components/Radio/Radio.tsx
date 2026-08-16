import * as React from "react";
import "./Radio.css";

type RadioGroupContextValue = {
  name: string;
  /** Present only when the group is controlled. */
  value?: string;
  /** Present only when the group is uncontrolled with an initial selection. */
  defaultValue?: string;
  onValueChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  invalid?: boolean;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps
  extends Omit<React.ComponentPropsWithoutRef<"fieldset">, "onChange"> {
  /** Rendered as the `<legend>`, and the group's accessible name. */
  legend: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Shared `name`. Sharing it is what gives the group its roving arrow keys. */
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * A real `<fieldset>` + `<legend>`. Arrow-key navigation, the single tab stop
 * and "checking one unchecks the rest" are all native behaviour of inputs that
 * share a `name`; reimplementing them with a roving tabindex would only be a
 * way to get them slightly wrong.
 */
export const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  function RadioGroup(
    {
      legend,
      hint,
      error,
      name,
      value,
      defaultValue,
      onValueChange,
      className,
      children,
      disabled,
      id: idProp,
      "aria-describedby": describedByProp,
      ...rest
    },
    ref,
  ) {
    const generatedId = React.useId();
    const id = idProp ?? `rathe-radio-group-${generatedId}`;
    const legendId = `${id}-legend`;
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(" ") || undefined;

    const context = React.useMemo<RadioGroupContextValue>(
      () => ({ name, value, defaultValue, onValueChange, disabled, invalid: Boolean(error) }),
      [name, value, defaultValue, onValueChange, disabled, error],
    );

    return (
      <fieldset
        {...rest}
        ref={ref}
        id={id}
        disabled={disabled}
        role="radiogroup"
        aria-labelledby={legendId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={["rathe-radio-group", error ? "rathe-radio-group--invalid" : null, className]
          .filter(Boolean)
          .join(" ")}
      >
        <legend className="rathe-radio-group__legend" id={legendId}>
          {legend}
        </legend>

        {hint ? (
          <p className="rathe-radio-group__hint" id={hintId}>
            {hint}
          </p>
        ) : null}

        <div className="rathe-radio-group__options">
          <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
        </div>

        {error ? (
          <p className="rathe-radio-group__error" id={errorId} role="alert">
            <svg
              className="rathe-radio-group__error-icon"
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
            <span className="rathe-radio-group__error-text">{error}</span>
          </p>
        ) : null}
      </fieldset>
    );
  },
);

export interface RadioProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "type" | "children" | "value"> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  value: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    label,
    hint,
    value,
    className,
    id: idProp,
    name: nameProp,
    checked: checkedProp,
    defaultChecked: defaultCheckedProp,
    disabled: disabledProp,
    onChange,
    "aria-describedby": describedByProp,
    ...rest
  },
  ref,
) {
  const group = React.useContext(RadioGroupContext);

  const generatedId = React.useId();
  const id = idProp ?? `rathe-radio-${generatedId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [describedByProp, hintId].filter(Boolean).join(" ") || undefined;

  const name = nameProp ?? group?.name;
  const disabled = disabledProp ?? group?.disabled;

  // Controlled and uncontrolled are resolved once, here, so a radio never
  // receives both `checked` and `defaultChecked` and trips React's warning.
  let checked = checkedProp;
  let defaultChecked = defaultCheckedProp;
  if (group) {
    if (group.value !== undefined) {
      checked = group.value === value;
      defaultChecked = undefined;
    } else if (group.defaultValue !== undefined && defaultChecked === undefined) {
      defaultChecked = group.defaultValue === value;
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.target.checked) {
      group?.onValueChange?.(value, event);
    }
  };

  return (
    <div
      className={[
        "rathe-radio",
        group?.invalid ? "rathe-radio--invalid" : null,
        disabled ? "rathe-radio--disabled" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="rathe-radio__row">
        {/* Same technique as Checkbox: appearance:none on a real input, with
            the dot as a sibling overlay rather than a pseudo-element. */}
        <span className="rathe-radio__box">
          <input
            {...rest}
            ref={ref}
            type="radio"
            id={id}
            name={name}
            value={value}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            className="rathe-radio__input"
            aria-describedby={describedBy}
            onChange={handleChange}
          />
          <span className="rathe-radio__dot" aria-hidden="true" />
        </span>

        <label className="rathe-radio__label" htmlFor={id}>
          {label}
        </label>
      </div>

      {hint ? (
        <p className="rathe-radio__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
});
