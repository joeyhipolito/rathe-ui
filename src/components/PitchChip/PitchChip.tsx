import { forwardRef, useId } from "react";
import type { HTMLAttributes } from "react";
import "./PitchChip.css";

export type PitchValue = 1 | 2 | 3;
export type PitchColour = "red" | "yellow" | "blue";

/* The printed pitch strip on a Flesh and Blood card: red pitches for 1
   resource, yellow for 2, blue for 3. The mapping is fixed by the game, not by
   this design system, so it lives here as a constant rather than as a prop. */
export const PITCH_COLOUR = {
  1: "red",
  2: "yellow",
  3: "blue",
} as const satisfies Record<PitchValue, PitchColour>;

export interface PitchChipProps extends HTMLAttributes<HTMLSpanElement> {
  pitch: PitchValue;
  size?: "sm" | "md";
  /**
   * Adds a visible "2 resources" caption beside the numeral. It does NOT gate
   * the numeral — the numeral is unconditional, because pitch encoded only in
   * colour is unreadable to a large slice of the player base.
   */
  showValue?: boolean;
}

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

export const PitchChip = forwardRef<HTMLSpanElement, PitchChipProps>(function PitchChip(
  { pitch, size = "md", showValue = false, className, ...rest },
  ref,
) {
  const labelId = useId();
  const colour = PITCH_COLOUR[pitch];

  return (
    <span
      {...rest}
      ref={ref}
      role="img"
      /* role="img" is not a name-from-content role, so the visually hidden span
         below has to be pointed at explicitly — inside the element it would
         never be read, and axe's role-img-alt rule would fail the chip. */
      aria-labelledby={labelId}
      className={cx(
        "rathe-pitch-chip",
        `rathe-pitch-chip--${colour}`,
        `rathe-pitch-chip--${size}`,
        showValue && "rathe-pitch-chip--labelled",
        className,
      )}
    >
      <span className="rathe-sr-only" id={labelId}>
        {`Pitch ${pitch} (${colour})`}
      </span>
      {/* Visible content is hidden from AT because the span above is the
          deliberate, complete name. The caption repeats what the numeral
          already says, so nothing is lost. */}
      <span className="rathe-pitch-chip__value" aria-hidden="true">
        {pitch}
      </span>
      {showValue ? (
        <span className="rathe-pitch-chip__caption" aria-hidden="true">
          {pitch === 1 ? "1 resource" : `${pitch} resources`}
        </span>
      ) : null}
    </span>
  );
});
