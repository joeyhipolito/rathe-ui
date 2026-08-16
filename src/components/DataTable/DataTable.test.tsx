import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { DataTable } from "./DataTable";
import type { DataTableColumn, DataTableSort } from "./DataTable";

interface Standing {
  rank: number;
  player: string;
  hero: string;
  record: string;
  points: number;
}

const rows: Standing[] = [
  { rank: 1, player: "Marlowe Kessler", hero: "Dorinthea Ironsong", record: "6-1-0", points: 18 },
  { rank: 2, player: "Ines Tabuena", hero: "Prism, Sculptor of Arc Light", record: "6-1-0", points: 18 },
  { rank: 3, player: "Yuki Nakashima", hero: "Katsu, the Wanderer", record: "5-2-0", points: 15 },
];

const columns: DataTableColumn<Standing>[] = [
  { key: "rank", header: "#", numeric: true, sortable: true },
  { key: "player", header: "Player", sortable: true },
  { key: "hero", header: "Hero" },
  { key: "record", header: "Record", align: "center" },
  { key: "points", header: "Pts", numeric: true, sortable: true },
];

function Fixture(props: { sort?: DataTableSort | null; onSortChange?: (s: DataTableSort) => void }) {
  return (
    <DataTable<Standing>
      caption="Round 7 standings"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.player}
      rowHeaderKey="player"
      sort={props.sort ?? null}
      onSortChange={props.onSortChange}
    />
  );
}

describe("DataTable behaviour", () => {
  it("reports the active sort through aria-sort and leaves other columns at none", () => {
    render(<Fixture sort={{ key: "points", direction: "descending" }} />);

    expect(screen.getByRole("columnheader", { name: /pts/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    expect(screen.getByRole("columnheader", { name: /player/i })).toHaveAttribute(
      "aria-sort",
      "none",
    );
  });

  it("calls onSortChange ascending on first activation and toggles to descending on the second", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    const { rerender } = render(<Fixture sort={null} onSortChange={onSortChange} />);
    await user.click(screen.getByRole("button", { name: /pts/i }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "points", direction: "ascending" });

    rerender(
      <Fixture sort={{ key: "points", direction: "ascending" }} onSortChange={onSortChange} />,
    );
    await user.click(screen.getByRole("button", { name: /pts/i }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "points", direction: "descending" });
  });

  it("moves the sort to a different column at ascending rather than inheriting the direction", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    render(
      <Fixture sort={{ key: "points", direction: "descending" }} onSortChange={onSortChange} />,
    );
    await user.click(screen.getByRole("button", { name: /player/i }));

    expect(onSortChange).toHaveBeenCalledWith({ key: "player", direction: "ascending" });
  });

  it("reaches the sort control with the keyboard", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<Fixture sort={null} onSortChange={onSortChange} />);

    const sortButton = screen.getByRole("button", { name: /player/i });
    sortButton.focus();
    await user.keyboard("{Enter}");

    expect(onSortChange).toHaveBeenCalledWith({ key: "player", direction: "ascending" });
  });

  it("renders the empty slot in a full-width cell when there are no rows", () => {
    render(
      <DataTable<Standing>
        caption="Round 7 standings"
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.player}
        empty="No players match this filter."
      />,
    );

    const cell = screen.getByRole("cell", { name: "No players match this filter." });
    expect(cell).toHaveAttribute("colspan", String(columns.length));
  });

  it("uses the column render function in preference to the raw value", () => {
    render(
      <DataTable<Standing>
        caption="Round 7 standings"
        columns={[
          { key: "player", header: "Player" },
          { key: "points", header: "Pts", numeric: true, render: (row) => `${row.points} pts` },
        ]}
        rows={rows}
        getRowKey={(row) => row.player}
      />,
    );

    expect(screen.getAllByRole("cell", { name: "18 pts" })).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "15 pts" })).toBeInTheDocument();
  });
});

describe("DataTable semantics", () => {
  it("names the table with a caption that is hidden visually but present in the tree", () => {
    const { container } = render(<Fixture />);

    const caption = container.querySelector("caption");
    expect(caption).not.toBeNull();
    expect(caption).toHaveTextContent("Round 7 standings");
    expect(caption).toHaveClass("rathe-sr-only");
  });

  it("shows the caption when captionVisible is set", () => {
    const { container } = render(
      <DataTable<Standing>
        caption="Round 7 standings"
        captionVisible
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.player}
      />,
    );

    expect(container.querySelector("caption")).not.toHaveClass("rathe-sr-only");
  });

  it("scopes column headers to col and the row header to row", () => {
    render(<Fixture />);

    for (const header of ["#", "Player", "Hero", "Record", "Pts"]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(header.replace("#", "\\#")) }))
        .toHaveAttribute("scope", "col");
    }

    const rowHeader = screen.getByRole("rowheader", { name: "Marlowe Kessler" });
    expect(rowHeader).toHaveAttribute("scope", "row");
  });

  it("exposes the scroll container as a keyboard-reachable labelled region", () => {
    render(<Fixture />);

    const region = screen.getByRole("region", { name: "Round 7 standings" });
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("omits aria-sort from columns that are not sortable", () => {
    render(<Fixture />);

    const hero = screen.getByRole("columnheader", { name: "Hero" });
    expect(hero).not.toHaveAttribute("aria-sort");
    expect(within(hero).queryByRole("button")).toBeNull();
  });

  it("spreads rest props and merges className onto the root", () => {
    render(
      <DataTable<Standing>
        caption="Round 7 standings"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.player}
        className="event-standings"
        data-testid="standings"
      />,
    );

    const region = screen.getByRole("region", { name: "Round 7 standings" });
    expect(region).toHaveClass("rathe-datatable");
    expect(region).toHaveClass("event-standings");
    expect(region).toHaveAttribute("data-testid", "standings");
  });
});

describe("DataTable accessibility", () => {
  it("has no a11y violations", async () => {
    const { container } = render(<Fixture sort={{ key: "points", direction: "descending" }} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no a11y violations when empty", async () => {
    const { container } = render(
      <DataTable<Standing>
        caption="Round 7 standings"
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.player}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
