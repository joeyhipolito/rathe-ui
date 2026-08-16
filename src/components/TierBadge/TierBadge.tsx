import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import "./TierBadge.css";

export type EventTier = 1 | 2 | 3 | 4;

export interface TierDescriptor {
  /** Visual numeral only. Never exposed to assistive technology. */
  roman: string;
  /** Short visible label, sized for a dense event listing. */
  short: string;
  /** Spoken expansion, the events the tier actually covers. */
  full: string;
}

/* Legend Story Studios' organised play ladder. The tier number alone means
   nothing to a player deciding whether to enter, so the badge always knows the
   event types behind it. */
export const ORGANISED_PLAY_TIERS = {
  1: {
    roman: "I",
    short: "Armory",
    full: "Armory, Skirmish and Prerelease",
  },
  2: {
    roman: "II",
    short: "Road to Nationals",
    full: "Road to Nationals, ProQuest and Battlegrounds",
  },
  3: {
    roman: "III",
    short: "Nationals & Calling",
    full: "Nationals and The Calling",
  },
  4: {
    roman: "IV",
    short: "Pro Tour & Worlds",
    full: "Pro Tour and World Championship",
  },
} as const satisfies Record<EventTier, TierDescriptor>;

export interface TierBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tier: EventTier;
  showLabel?: boolean;
}

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

export function tierAccessibleName(tier: EventTier): string {
  return `Tier ${tier}, ${ORGANISED_PLAY_TIERS[tier].full}`;
}

export const TierBadge = forwardRef<HTMLSpanElement, TierBadgeProps>(function TierBadge(
  { tier, showLabel = false, className, ...rest },
  ref,
) {
  const descriptor = ORGANISED_PLAY_TIERS[tier];

  return (
    <span
      {...rest}
      ref={ref}
      role="img"
      /* "IV" is read as the letters I and V by most screen readers, and as the
         Roman numeral by none of them reliably. The numeral is decoration; the
         spoken name is the plain tier plus the events it covers. It has to be
         an explicit label rather than hidden text, because role="img" does not
         build its name from descendant content. */
      aria-label={tierAccessibleName(tier)}
      className={cx("rathe-tier-badge", `rathe-tier-badge--${tier}`, className)}
    >
      <span className="rathe-tier-badge__numeral" aria-hidden="true">
        {descriptor.roman}
      </span>
      {showLabel ? (
        <span className="rathe-tier-badge__label" aria-hidden="true">
          {descriptor.short}
        </span>
      ) : null}
    </span>
  );
});
