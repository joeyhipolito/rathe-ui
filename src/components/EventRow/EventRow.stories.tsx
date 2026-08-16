import type { Meta, StoryObj } from "@storybook/react";
import { EventRow } from "./EventRow";
import type { EventRowProps } from "./EventRow";

const meta = {
  title: "Domain/EventRow",
  component: EventRow,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "One event in a store or tournament listing. It carries the four facts a player",
          "actually decides on: the organised-play tier, the format, the rules enforcement",
          "level, and whether there is still a seat.",
          "",
          "Two decisions worth knowing about:",
          "",
          "- **The date is a `<time>` element, the locale is pinned to `en-NZ`, and the time",
          "  zone defaults to `Pacific/Auckland`.** A tournament start time is an unambiguous",
          "  fact printed by a store, and the browser default is whatever the reader's OS is",
          "  set to. That renders `6/9` as September 6th for a player with a US locale and",
          "  June 9th for the store that scheduled it. That is a support call, and the store",
          "  takes it.",
          "- **The link wraps the event name only.** The row is still clickable end to end,",
          "  but via an `::after` overlay on the link rather than an `<a>` around everything.",
          "  Wrapping the row would make the link's accessible name the whole row: name,",
          "  date, venue, format, tier and seat count read as one sentence. That is what",
          "  makes a screen reader's link list useless.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof EventRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const armory: EventRowProps = {
  name: "Armory: Blitz",
  date: "2026-09-05T10:00:00+12:00",
  venue: "Card Merchant Takapuna, Auckland",
  format: "Blitz",
  tier: 1,
  rel: "Casual",
  capacity: 24,
  registered: 18,
  href: "/events/takapuna-armory-blitz",
};

/** A weekly Armory. Tier 1, Casual, still eight seats. */
export const Default: Story = { args: armory };

/** Road to Nationals season. Tier 2, Competitive REL, Classic Constructed. */
export const RoadToNationals: Story = {
  args: {
    name: "Road to Nationals: Classic Constructed",
    date: "2026-09-19T09:30:00+12:00",
    venue: "Comics Compulsion, Christchurch",
    format: "Classic Constructed",
    tier: 2,
    rel: "Competitive",
    capacity: 64,
    registered: 41,
    href: "/events/christchurch-rtn-cc",
  },
};

/** Nationals. Tier 3, Professional REL. No seat count published yet. */
export const Nationals: Story = {
  args: {
    name: "New Zealand National Championship",
    date: "2026-11-14T08:00:00+13:00",
    venue: "Aotea Centre, Auckland",
    format: "Classic Constructed",
    tier: 3,
    rel: "Professional",
    href: "/events/nz-nationals-2026",
  },
};

/** Tier 4, the apex of the ladder. */
export const ProTour: Story = {
  args: {
    name: "Pro Tour: Auckland",
    date: "2026-12-05T09:00:00+13:00",
    venue: "Viaduct Events Centre, Auckland",
    format: "Classic Constructed",
    tier: 4,
    rel: "Professional",
    capacity: 400,
    registered: 400,
    href: "/events/pro-tour-auckland",
  },
};

/** Full. The word carries it; the hatched ground carries it again in greyscale. */
export const Full: Story = {
  args: {
    ...armory,
    name: "Skirmish: Living Legend",
    capacity: 32,
    registered: 32,
  },
};

/** One seat left. The count is singular, because "1 spots left" is the tell of a generated UI. */
export const LastSeat: Story = {
  args: { ...armory, capacity: 24, registered: 23 },
};

/** No `href`, because the store has not opened registration for this listing yet. */
export const NotLinked: Story = {
  args: { ...armory, href: undefined },
};

/** A Booster Draft prerelease, with no published capacity. */
export const Prerelease: Story = {
  args: {
    name: "Prerelease: Booster Draft",
    date: "2026-10-03T13:00:00+13:00",
    venue: "Vault Games, Hamilton",
    format: "Booster Draft",
    tier: 1,
    rel: "Casual",
    href: "/events/hamilton-prerelease",
  },
};

/** The real surface: a store's month, tiers mixed, one event already full. */
export const Listing: Story = {
  args: armory,
  render: () => (
    <div
      style={{
        borderTop: "1px solid var(--rathe-rule)",
        background: "var(--rathe-paper)",
      }}
    >
      <EventRow {...armory} />
      <EventRow
        name="Skirmish: Living Legend"
        date="2026-09-12T10:00:00+12:00"
        venue="Card Merchant Takapuna, Auckland"
        format="Living Legend"
        tier={1}
        rel="Casual"
        capacity={32}
        registered={32}
        href="/events/takapuna-skirmish-ll"
      />
      <EventRow
        name="Road to Nationals: Classic Constructed"
        date="2026-09-19T09:30:00+12:00"
        venue="Comics Compulsion, Christchurch"
        format="Classic Constructed"
        tier={2}
        rel="Competitive"
        capacity={64}
        registered={41}
        href="/events/christchurch-rtn-cc"
      />
      <EventRow
        name="The Calling: Wellington"
        date="2026-10-24T08:30:00+13:00"
        venue="Shed 6, Wellington"
        format="Classic Constructed"
        tier={3}
        rel="Professional"
        capacity={256}
        registered={198}
        href="/events/calling-wellington"
      />
      <EventRow
        name="Pro Tour: Auckland"
        date="2026-12-05T09:00:00+13:00"
        venue="Viaduct Events Centre, Auckland"
        format="Classic Constructed"
        tier={4}
        rel="Professional"
        capacity={400}
        registered={400}
        href="/events/pro-tour-auckland"
      />
    </div>
  ),
};
