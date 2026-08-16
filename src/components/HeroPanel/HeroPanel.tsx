import { forwardRef, useId } from "react";
import type { HTMLAttributes } from "react";
import "./HeroPanel.css";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeroPanelProps extends HTMLAttributes<HTMLElement> {
  name: string;
  /** Warrior, Guardian, Ninja, Runeblade, Illusionist, Assassin, Brute, Mechanologist, Ranger, Wizard. */
  heroClass: string;
  /** Light, Shadow, Elemental, Draconic, Chaos. A hero may carry more than one. */
  talents?: string[];
  /** Hand size — the number of cards the hero draws back up to at end of turn. */
  intellect: number;
  life: number;
  ability?: string;
  /** Young heroes are the reduced-life printings legal in Blitz. */
  young?: boolean;
  /**
   * The panel heads a deck or a player profile, so its heading level depends on
   * the page it lands in. Defaulting to 2 and letting the page correct it beats
   * shipping a fixed h3 that lies about the outline.
   */
  headingLevel?: HeadingLevel;
}

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

/* Talents are a small closed set in the game, and each one has a colour players
   already associate with it. The chip still spells the talent out — the tint is
   recognition, never the carrier. Unknown talents fall back to the neutral
   chip rather than being dropped. */
const TALENT_MODIFIERS: Record<string, string> = {
  light: "light",
  shadow: "shadow",
  elemental: "elemental",
  draconic: "draconic",
  chaos: "chaos",
  earth: "elemental",
  ice: "elemental",
  lightning: "elemental",
};

export const HeroPanel = forwardRef<HTMLElement, HeroPanelProps>(function HeroPanel(
  {
    name,
    heroClass,
    talents,
    intellect,
    life,
    ability,
    young = false,
    headingLevel = 2,
    className,
    ...rest
  },
  ref,
) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;
  const lineage = [...(talents ?? []), heroClass].join(" ");

  return (
    <section
      {...rest}
      ref={ref}
      className={cx("rathe-hero-panel", className)}
      aria-labelledby={headingId}
    >
      <div className="rathe-hero-panel__header">
        <Heading className="rathe-hero-panel__name" id={headingId}>
          {name}
        </Heading>
        <p className="rathe-hero-panel__lineage">
          {young ? <span className="rathe-hero-panel__young">Young</span> : null}
          <span className="rathe-hero-panel__class">{lineage}</span>
        </p>
      </div>

      {talents && talents.length > 0 ? (
        <ul className="rathe-hero-panel__talents" aria-label="Talents">
          {talents.map((talent) => {
            const modifier = TALENT_MODIFIERS[talent.toLowerCase()];
            return (
              <li
                key={talent}
                className={cx(
                  "rathe-hero-panel__talent",
                  modifier && `rathe-hero-panel__talent--${modifier}`,
                )}
              >
                {talent}
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* A bare 4 beside a bare 40 is unreadable to a new player and reads as
          two loose numbers to a screen reader. A definition list is the only
          markup that carries "this name has this value" natively. */}
      <dl className="rathe-hero-panel__stats">
        <div className="rathe-hero-panel__stat">
          <dt className="rathe-hero-panel__stat-term">
            Intellect
            <span className="rathe-hero-panel__stat-hint">cards drawn to</span>
          </dt>
          <dd className="rathe-hero-panel__stat-value">{intellect}</dd>
        </div>
        <div className="rathe-hero-panel__stat">
          <dt className="rathe-hero-panel__stat-term">
            Life
            <span className="rathe-hero-panel__stat-hint">starting total</span>
          </dt>
          <dd className="rathe-hero-panel__stat-value">{life}</dd>
        </div>
      </dl>

      {ability ? <p className="rathe-hero-panel__ability">{ability}</p> : null}
    </section>
  );
});
