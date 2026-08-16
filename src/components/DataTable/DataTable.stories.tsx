import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./DataTable";
import type { DataTableColumn, DataTableSort } from "./DataTable";
import { Badge } from "../Badge/Badge";

interface Standing {
  rank: number;
  player: string;
  hero: string;
  record: string;
  points: number;
  opponentWinPct: number;
  status: "checked-in" | "drop" | "penalty";
}

const standings: Standing[] = [
  {
    rank: 1,
    player: "Marlowe Kessler",
    hero: "Dorinthea Ironsong",
    record: "6-1-0",
    points: 18,
    opponentWinPct: 62.4,
    status: "checked-in",
  },
  {
    rank: 2,
    player: "Ines Tabuena",
    hero: "Prism, Sculptor of Arc Light",
    record: "6-1-0",
    points: 18,
    opponentWinPct: 59.1,
    status: "checked-in",
  },
  {
    rank: 3,
    player: "Devon Achterberg",
    hero: "Bravo, Showstopper",
    record: "5-1-1",
    points: 16,
    opponentWinPct: 61.8,
    status: "checked-in",
  },
  {
    rank: 4,
    player: "Yuki Nakashima",
    hero: "Katsu, the Wanderer",
    record: "5-2-0",
    points: 15,
    opponentWinPct: 57.3,
    status: "penalty",
  },
  {
    rank: 5,
    player: "Rosa Villanueva",
    hero: "Viserai, Rune Blood",
    record: "5-2-0",
    points: 15,
    opponentWinPct: 55.9,
    status: "checked-in",
  },
  {
    rank: 6,
    player: "Callum Frost",
    hero: "Kano, Dracai of Aether",
    record: "4-2-1",
    points: 13,
    opponentWinPct: 58.6,
    status: "checked-in",
  },
  {
    rank: 7,
    player: "Adaeze Okafor",
    hero: "Rhinar, Reckless Rampage",
    record: "4-3-0",
    points: 12,
    opponentWinPct: 54.2,
    status: "checked-in",
  },
  {
    rank: 8,
    player: "Tomasz Wieczorek",
    hero: "Iyslander, Stormbind",
    record: "3-4-0",
    points: 9,
    opponentWinPct: 49.7,
    status: "drop",
  },
];

const statusCopy: Record<Standing["status"], { label: string; variant: "success" | "warning" | "neutral" }> = {
  "checked-in": { label: "Checked in", variant: "success" },
  penalty: { label: "Game loss", variant: "warning" },
  drop: { label: "Dropped", variant: "neutral" },
};

const columns: DataTableColumn<Standing>[] = [
  { key: "rank", header: "#", numeric: true, sortable: true, width: "4rem" },
  { key: "player", header: "Player", sortable: true },
  { key: "hero", header: "Hero" },
  { key: "record", header: "Record", align: "center", width: "7rem" },
  { key: "points", header: "Pts", numeric: true, sortable: true, width: "5rem" },
  {
    key: "opponentWinPct",
    header: "OppWin%",
    numeric: true,
    sortable: true,
    width: "7rem",
    render: (row) => row.opponentWinPct.toFixed(1),
  },
  {
    key: "status",
    header: "Status",
    width: "9rem",
    render: (row) => {
      const status = statusCopy[row.status];
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
  },
];

const meta: Meta<typeof DataTable> = {
  title: "Data/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A real `<table>`, because the thing a scorekeeper does at a live event is compare values *across* rows and *down* columns, and only a table gives assistive technology the row/column relationship that makes that possible. A grid of `<div>`s reads as a wall of unrelated text.",
          "",
          "Three decisions worth knowing:",
          "",
          "- **The sort control is a `<button>` inside the `<th>`, never a handler on the `<th>` itself.** A click handler on a header cell is unreachable by keyboard and invisible to screen readers. The `<th>` carries `aria-sort`; the button carries the interaction.",
          "- **Numeric columns get `font-variant-numeric: tabular-nums` and end-alignment.** Proportional digits make a points column ragged, and a ragged column cannot be scanned vertically — which is the only reason a standings table exists.",
          "- **The scroll wrapper is a labelled `region` with `tabIndex={0}`.** A box that scrolls with a mouse but not with a keyboard is a trap on a narrow screen. The tab stop is static rather than measured; see the comment in the source for why.",
          "",
          "`caption` is required and visually hidden by default — a table with no accessible name is unusable when you are moving between three of them on one page. Pass `captionVisible` to show it.",
        ].join("\n"),
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Round 7 standings from a Road to Nationals, sortable and hero-aware. */
export const Standings: Story = {
  render: () => {
    const [sort, setSort] = React.useState<DataTableSort>({
      key: "rank",
      direction: "ascending",
    });

    const rows = React.useMemo(() => {
      const sorted = [...standings];
      sorted.sort((a, b) => {
        const key = sort.key as keyof Standing;
        const left = a[key];
        const right = b[key];
        const order =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right));
        return sort.direction === "ascending" ? order : -order;
      });
      return sorted;
    }, [sort]);

    return (
      <DataTable<Standing>
        caption="Road to Nationals — Auckland, round 7 standings"
        captionVisible
        columns={columns}
        rows={rows}
        sort={sort}
        onSortChange={setSort}
        getRowKey={(row) => row.player}
        rowHeaderKey="player"
      />
    );
  },
};

/** Compact density for a pairings board projected behind the judge station. */
export const Pairings: Story = {
  render: () => (
    <DataTable<{ table: number; playerA: string; playerB: string; result: string }>
      caption="Round 8 pairings"
      captionVisible
      density="compact"
      columns={[
        { key: "table", header: "Table", numeric: true, width: "5rem" },
        { key: "playerA", header: "Seat A" },
        { key: "playerB", header: "Seat B" },
        { key: "result", header: "Result", align: "center", width: "8rem" },
      ]}
      rows={[
        { table: 1, playerA: "Marlowe Kessler", playerB: "Ines Tabuena", result: "—" },
        { table: 2, playerA: "Devon Achterberg", playerB: "Yuki Nakashima", result: "—" },
        { table: 3, playerA: "Rosa Villanueva", playerB: "Callum Frost", result: "2-1" },
        { table: 4, playerA: "Adaeze Okafor", playerB: "Tomasz Wieczorek", result: "2-0" },
      ]}
      getRowKey={(row) => row.table}
      rowHeaderKey="playerA"
    />
  ),
};

/** Zero results still render a table, so the column headers keep their meaning. */
export const NoResults: Story = {
  render: () => (
    <DataTable<Standing>
      caption="Standings filtered to Classic Constructed"
      captionVisible
      columns={columns}
      rows={[]}
      getRowKey={(row) => row.player}
      empty="No players match this filter."
    />
  ),
};

/** The caption stays in the accessibility tree when it is hidden visually. */
export const HiddenCaption: Story = {
  render: () => (
    <DataTable<Standing>
      caption="Top eight after the swiss rounds"
      columns={columns}
      rows={standings.slice(0, 4)}
      getRowKey={(row) => row.player}
      rowHeaderKey="player"
    />
  ),
};
