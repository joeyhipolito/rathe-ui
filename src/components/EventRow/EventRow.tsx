import { forwardRef, useId } from "react";
import type { HTMLAttributes } from "react";
import { TierBadge } from "../TierBadge";
import type { EventTier } from "../TierBadge";
import "./EventRow.css";

export type RulesEnforcementLevel = "Casual" | "Competitive" | "Professional";

export type GameFormat =
  | "Classic Constructed"
  | "Blitz"
  | "Living Legend"
  | "Silver Age"
  | "Booster Draft"
  | "Sealed Deck"
  | (string & {});

export interface EventRowProps extends HTMLAttributes<HTMLElement> {
  name: string;
  date: Date | string;
  venue: string;
  format: GameFormat;
  tier: EventTier;
  rel: RulesEnforcementLevel;
  capacity?: number;
  registered?: number;
  href?: string;
  /**
   * IANA zone the event is run in. Defaults to the zone the listing is written
   * for rather than the reader's own: a player in Sydney reading an Auckland
   * Armory needs the Auckland start time, not their own.
   */
  timeZone?: string;
}

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

/*
 * Locale is pinned to en-NZ rather than left to the browser. A tournament start
 * time is an unambiguous fact printed on a store's listing, and the browser
 * default is whatever the reader's OS happens to be set to — which turns
 * "6/9" into September 6th for a player with a US locale and June 9th for the
 * store that scheduled it. Store staff field that phone call. The parts are
 * reassembled by hand instead of being taken from a single format string so
 * the output is identical across ICU versions and Node builds.
 */
const NZ_LOCALE = "en-NZ";

export function formatEventDateTime(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat(NZ_LOCALE, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";

  // ICU renders the day period as "am", "AM" or "a.m." depending on the build.
  const dayPeriod = part("dayPeriod").toLowerCase().replace(/[^a-z]/g, "");

  return `${part("weekday")} ${part("day")} ${part("month")}, ${part("hour")}:${part("minute")}${dayPeriod}`;
}

export const EventRow = forwardRef<HTMLElement, EventRowProps>(function EventRow(
  {
    name,
    date,
    venue,
    format,
    tier,
    rel,
    capacity,
    registered,
    href,
    timeZone = "Pacific/Auckland",
    className,
    ...rest
  },
  ref,
) {
  const nameId = useId();
  const parsed = date instanceof Date ? date : new Date(date);
  const isValidDate = !Number.isNaN(parsed.getTime());

  const hasSeatCount = typeof capacity === "number" && typeof registered === "number";
  const remaining = hasSeatCount ? Math.max(0, capacity - registered) : null;
  const isFull = hasSeatCount && registered >= capacity;

  return (
    <article
      {...rest}
      ref={ref}
      className={cx("rathe-event-row", isFull && "rathe-event-row--full", className)}
      aria-labelledby={nameId}
    >
      <span className="rathe-event-row__tier">
        <TierBadge tier={tier} />
      </span>

      <span className="rathe-event-row__identity">
        <span className="rathe-event-row__name" id={nameId}>
          {/*
            The link wraps the event name only. Wrapping the whole row would
            make the link's accessible name the entire row — name, date, venue,
            format, tier and seat count read as one sentence — which is what
            makes link lists in screen readers unusable. The hit area is
            restored with an ::after overlay on the link instead, so pointer and
            touch users still get the whole row, and the spoken name stays
            "Auckland Armory: Blitz".
          */}
          {href ? (
            <a className="rathe-event-row__link" href={href}>
              {name}
            </a>
          ) : (
            name
          )}
        </span>
        <span className="rathe-event-row__venue">{venue}</span>
      </span>

      <span className="rathe-event-row__when">
        {isValidDate ? (
          <time className="rathe-event-row__time" dateTime={parsed.toISOString()}>
            {formatEventDateTime(parsed, timeZone)}
          </time>
        ) : (
          <span className="rathe-event-row__time">Date to be confirmed</span>
        )}
      </span>

      <span className="rathe-event-row__play">
        <span className="rathe-event-row__format">{format}</span>
        <span className="rathe-event-row__rel">{rel}</span>
      </span>

      {hasSeatCount ? (
        <span
          className={cx(
            "rathe-event-row__seats",
            isFull ? "rathe-event-row__seats--full" : "rathe-event-row__seats--open",
          )}
        >
          {isFull ? (
            <>
              {/* "Full" is the cue, not the tint. The hatched ground behind it
                  is a second non-colour signal for greyscale printouts. */}
              <span className="rathe-event-row__seats-value">Full</span>
              <span className="rathe-event-row__seats-detail">
                {`${registered} of ${capacity} — waitlist only`}
              </span>
            </>
          ) : (
            <>
              <span className="rathe-event-row__seats-value">
                {remaining === 1 ? "1 spot left" : `${remaining} spots left`}
              </span>
              <span className="rathe-event-row__seats-detail">
                {`${registered} of ${capacity} registered`}
              </span>
            </>
          )}
        </span>
      ) : null}
    </article>
  );
});
