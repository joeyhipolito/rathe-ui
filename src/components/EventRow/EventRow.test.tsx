import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { EventRow } from "./EventRow";
import type { EventRowProps } from "./EventRow";

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

describe("EventRow", () => {
  it("renders the date in a time element carrying the machine-readable instant", () => {
    render(<EventRow {...armory} />);
    const time = screen.getByText(/Sat 5 Sep/);
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", new Date(armory.date as string).toISOString());
  });

  /* CLDR abbreviates September as "Sep" in older ICU builds and "Sept" in
     current ones, so the month spelling is the one part of the output not
     worth pinning. Everything the format decision is actually about — day
     before month, weekday present, 12-hour clock, no space before the day
     period — is asserted exactly. */
  const SEP_5_10AM = /^Sat 5 Sept?, 10:00am$/;

  it("formats for a New Zealand audience regardless of the runtime locale", () => {
    render(<EventRow {...armory} />);
    expect(screen.getByText(SEP_5_10AM)).toBeInTheDocument();
  });

  it("renders the venue's local time, not the reader's", () => {
    // 8pm in Auckland on 5 September 2026 is 8am UTC the same day.
    render(<EventRow {...armory} date="2026-09-05T08:00:00Z" />);
    expect(screen.getByText(/^Sat 5 Sept?, 8:00pm$/)).toBeInTheDocument();
  });

  it("honours an explicit time zone for events run outside New Zealand", () => {
    render(<EventRow {...armory} date="2026-09-05T08:00:00Z" timeZone="Australia/Sydney" />);
    expect(screen.getByText(/^Sat 5 Sept?, 6:00pm$/)).toBeInTheDocument();
  });

  it("accepts a Date instance as well as an ISO string", () => {
    render(<EventRow {...armory} date={new Date("2026-09-05T10:00:00+12:00")} />);
    expect(screen.getByText(SEP_5_10AM)).toBeInTheDocument();
  });

  it("degrades to a plain message rather than 'Invalid Date' when the date will not parse", () => {
    render(<EventRow {...armory} date="not-a-date" />);
    expect(screen.getByText("Date to be confirmed")).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
  });

  it("shows the remaining spots when capacity and registrations are known", () => {
    render(<EventRow {...armory} />);
    expect(screen.getByText("6 spots left")).toBeInTheDocument();
    expect(screen.getByText("18 of 24 registered")).toBeInTheDocument();
  });

  it("uses the singular for a single remaining spot", () => {
    render(<EventRow {...armory} registered={23} />);
    expect(screen.getByText("1 spot left")).toBeInTheDocument();
  });

  it("marks the event full when registrations reach capacity, with a cue that is not colour", () => {
    const { container } = render(<EventRow {...armory} capacity={32} registered={32} />);
    expect(screen.getByText("Full")).toBeInTheDocument();
    expect(screen.getByText("32 of 32 — waitlist only")).toBeInTheDocument();
    expect(container.querySelector(".rathe-event-row__seats--full")).not.toBeNull();
    expect(container.querySelector(".rathe-event-row__seats--open")).toBeNull();
  });

  it("treats over-subscription as full and never reports negative spots", () => {
    render(<EventRow {...armory} capacity={24} registered={31} />);
    expect(screen.getByText("Full")).toBeInTheDocument();
    expect(screen.queryByText(/-7/)).not.toBeInTheDocument();
  });

  it("omits the seat panel entirely when capacity is unpublished", () => {
    const { container } = render(
      <EventRow {...armory} capacity={undefined} registered={undefined} />,
    );
    expect(container.querySelector(".rathe-event-row__seats")).toBeNull();
    expect(screen.queryByText(/spots left/)).not.toBeInTheDocument();
  });

  it("renders no link at all when href is absent", () => {
    render(<EventRow {...armory} href={undefined} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Armory: Blitz")).toBeInTheDocument();
  });

  it("carries the tier badge", () => {
    render(<EventRow {...armory} tier={4} />);
    expect(
      screen.getByRole("img", { name: "Tier 4, Pro Tour and World Championship" }),
    ).toBeInTheDocument();
  });

  it("merges className and spreads the rest", () => {
    render(<EventRow {...armory} className="store-page__row" id="event-1" />);
    const row = screen.getByRole("article");
    expect(row).toHaveClass("rathe-event-row", "store-page__row");
    expect(row).toHaveAttribute("id", "event-1");
  });

  describe("accessible name", () => {
    it("names the link with the event only, not the whole row", () => {
      render(<EventRow {...armory} />);
      const link = screen.getByRole("link", { name: "Armory: Blitz" });
      expect(link).toHaveAttribute("href", "/events/takapuna-armory-blitz");
      expect(link).toHaveAccessibleName("Armory: Blitz");
    });

    it("keeps the link name free of the date, venue, format and seat count", () => {
      render(<EventRow {...armory} />);
      const name = screen.getByRole("link").textContent ?? "";
      expect(name).not.toMatch(/Sep/);
      expect(name).not.toMatch(/Takapuna/);
      expect(name).not.toMatch(/Blitz,/);
      expect(name).not.toMatch(/spots left/);
    });

    it("names the row itself with the event", () => {
      render(<EventRow {...armory} />);
      expect(screen.getByRole("article", { name: "Armory: Blitz" })).toBeInTheDocument();
    });
  });

  it("has no a11y violations", async () => {
    const { container } = render(<EventRow {...armory} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations when full and unlinked", async () => {
    const { container } = render(
      <EventRow {...armory} href={undefined} capacity={32} registered={32} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
