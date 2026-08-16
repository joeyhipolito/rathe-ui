import { forwardRef, useId } from "react";
import type { HTMLAttributes, MouseEvent, Ref } from "react";
import { PitchChip, PITCH_COLOUR } from "../PitchChip";
import type { PitchValue } from "../PitchChip";
import "./CardTile.css";

export type CardType =
  | "Action"
  | "Attack Reaction"
  | "Defence Reaction"
  | "Instant"
  | "Item"
  | "Equipment"
  | "Weapon"
  | "Aura";

export interface CardTileProps
  extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  name: string;
  pitch: PitchValue;
  cost: number;
  /** Attack power. `null` for cards that never attack, an Aura, an Item, most Instants. */
  power: number | null;
  /** Defence value. `null` for cards that cannot be blocked with, e.g. an Equipment already in the arena. */
  defence: number | null;
  type: CardType;
  /** Warrior, Guardian, Ninja, Runeblade, Illusionist, Generic … */
  cardClass: string;
  /** Light, Shadow, Elemental, Draconic, Chaos … */
  talent?: string;
  imageUrl?: string;
  selected?: boolean;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
}

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

/**
 * The spoken identity of a card, assembled in the order a player would say it
 * out loud (name, pitch, type, class) rather than in the order the tile
 * happens to lay things out. Visual order is a layout decision and will change;
 * this string is a domain fact and should not.
 */
export function cardAccessibleName(
  card: Pick<
    CardTileProps,
    "name" | "pitch" | "cost" | "power" | "defence" | "type" | "cardClass" | "talent"
  >,
): string {
  const { name, pitch, cost, power, defence, type, cardClass, talent } = card;
  return [
    name,
    `pitch ${pitch} ${PITCH_COLOUR[pitch]}`,
    type,
    talent ? `${talent} ${cardClass}` : cardClass,
    `cost ${cost}`,
    power === null ? null : `${power} power`,
    defence === null ? null : `${defence} defence`,
  ]
    .filter((part): part is string => part !== null)
    .join(", ");
}

export const CardTile = forwardRef<HTMLElement, CardTileProps>(function CardTile(
  {
    name,
    pitch,
    cost,
    power,
    defence,
    type,
    cardClass,
    talent,
    imageUrl,
    selected = false,
    onSelect,
    className,
    ...rest
  },
  ref,
) {
  const labelId = useId();
  const colour = PITCH_COLOUR[pitch];
  const label = cardAccessibleName({ name, pitch, cost, power, defence, type, cardClass, talent });

  /* Every child below is phrasing content. The selectable tile is a real
     <button>, and a <div> or <dl> inside a button is invalid HTML that browsers
     silently reparent, which breaks the layout in exactly the surfaces (deck
     builder search) where the tile is selectable. */
  const content = (
    <>
      <span className="rathe-sr-only" id={labelId}>
        {label}
      </span>
      <span
        className={cx("rathe-card-tile__strip", `rathe-card-tile__strip--${colour}`)}
        aria-hidden="true"
      />
      <span className="rathe-card-tile__body">
        {imageUrl === undefined ? (
          /* The plate carries the class initial alone. It previously repeated
             the card type, which the detail row beside it already states, and
             the longest real type name overflowed a 48px plate. Dropping the
             duplicate fixed the clipping and the redundancy together. */
          <span className="rathe-card-tile__art" aria-hidden="true">
            <span className="rathe-card-tile__art-initial">
              {cardClass.trim().charAt(0).toUpperCase()}
            </span>
          </span>
        ) : (
          <img className="rathe-card-tile__art-image" src={imageUrl} alt="" />
        )}
        <span className="rathe-card-tile__detail">
          <span className="rathe-card-tile__name">{name}</span>
          <span className="rathe-card-tile__meta">
            <PitchChip pitch={pitch} size="sm" aria-hidden="true" />
            <span className="rathe-card-tile__type">{type}</span>
            <span className="rathe-card-tile__class">
              {talent ? `${talent} ${cardClass}` : cardClass}
            </span>
          </span>
          <span className="rathe-card-tile__stats">
            <span className="rathe-card-tile__stat">
              <span className="rathe-card-tile__stat-label">Cost</span>
              <span className="rathe-card-tile__stat-value">{cost}</span>
            </span>
            <span className="rathe-card-tile__stat">
              <span className="rathe-card-tile__stat-label">Power</span>
              <span className="rathe-card-tile__stat-value">{power ?? "—"}</span>
            </span>
            <span className="rathe-card-tile__stat">
              <span className="rathe-card-tile__stat-label">Def</span>
              <span className="rathe-card-tile__stat-value">{defence ?? "—"}</span>
            </span>
          </span>
        </span>
      </span>
    </>
  );

  const rootClassName = cx(
    "rathe-card-tile",
    selected && "rathe-card-tile--selected",
    onSelect ? "rathe-card-tile--selectable" : "rathe-card-tile--static",
    className,
  );

  if (onSelect) {
    return (
      <button
        {...rest}
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        className={rootClassName}
        aria-pressed={selected}
        aria-labelledby={labelId}
        onClick={onSelect}
      >
        {content}
      </button>
    );
  }

  return (
    <article {...rest} ref={ref} className={rootClassName} aria-labelledby={labelId}>
      {content}
    </article>
  );
});
