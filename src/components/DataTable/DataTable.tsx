import * as React from "react";
import "./DataTable.css";

export type SortDirection = "ascending" | "descending";

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

export type DataTableAlign = "start" | "center" | "end";

export interface DataTableColumn<T> {
  /** Stable identity for the column. Also the default property read off a row. */
  key: string;
  header: React.ReactNode;
  align?: DataTableAlign;
  /** Digits get tabular figures and end-alignment so columns of points line up. */
  numeric?: boolean;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  /** Any CSS width. Applied through <col> so it does not fight cell padding. */
  width?: string;
}

export interface DataTableProps<T>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  columns: ReadonlyArray<DataTableColumn<T>>;
  rows: ReadonlyArray<T>;
  /** Required. Announced as the table's name; hidden unless captionVisible. */
  caption: string;
  captionVisible?: boolean;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort) => void;
  getRowKey: (row: T, index: number) => React.Key;
  /** Column whose cell becomes the row's <th scope="row"> — usually the name. */
  rowHeaderKey?: string;
  density?: "comfortable" | "compact";
  zebra?: boolean;
  /** Rendered inside a full-width cell when rows is empty, keeping table semantics. */
  empty?: React.ReactNode;
  /** Overrides the scroll region's accessible name. Defaults to the caption. */
  scrollRegionLabel?: string;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Fallback cell renderer for columns without `render`. Values that are not
 * primitives are dropped rather than stringified — "[object Object]" in a
 * standings column is worse than an empty cell, and it hides the bug.
 */
function defaultCell<T>(row: T, key: string): React.ReactNode {
  if (row === null || typeof row !== "object") return null;
  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return String(value);
  return null;
}

function nextSort(current: DataTableSort | null | undefined, key: string): DataTableSort {
  if (current && current.key === key && current.direction === "ascending") {
    return { key, direction: "descending" };
  }
  return { key, direction: "ascending" };
}

function DataTableInner<T>(
  props: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
): React.ReactElement {
  const {
    columns,
    rows,
    caption,
    captionVisible = false,
    sort = null,
    onSortChange,
    getRowKey,
    rowHeaderKey,
    density = "comfortable",
    zebra = true,
    empty = "No results.",
    scrollRegionLabel,
    className,
    ...rest
  } = props;

  return (
    <div
      // A horizontally scrollable box must be reachable by keyboard, so it is a
      // labelled region with a tab stop. Ideally the tab stop appears only when
      // the content actually overflows (a ResizeObserver measuring scrollWidth
      // vs clientWidth); that costs a layout read on every resize and, in a
      // scorekeeping table that re-renders per result entry, measured worse than
      // the cost of one extra tab stop. Static tabIndex is the deliberate trade.
      role="region"
      aria-label={scrollRegionLabel ?? caption}
      tabIndex={0}
      {...rest}
      ref={ref}
      className={cx(
        "rathe-datatable",
        `rathe-datatable--${density}`,
        zebra && "rathe-datatable--zebra",
        className,
      )}
    >
      <table className="rathe-datatable__table">
        <caption
          className={cx(
            "rathe-datatable__caption",
            !captionVisible && "rathe-sr-only",
          )}
        >
          {caption}
        </caption>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead className="rathe-datatable__head">
          <tr>
            {columns.map((column) => {
              const align: DataTableAlign =
                column.align ?? (column.numeric ? "end" : "start");
              const isSorted = sort?.key === column.key;
              const cellClass = cx(
                "rathe-datatable__th",
                `rathe-datatable__cell--${align}`,
                column.numeric && "rathe-datatable__cell--numeric",
                column.sortable && "rathe-datatable__th--sortable",
                isSorted && "rathe-datatable__th--sorted",
              );

              if (!column.sortable) {
                return (
                  <th key={column.key} scope="col" className={cellClass}>
                    {column.header}
                  </th>
                );
              }

              return (
                <th
                  key={column.key}
                  scope="col"
                  className={cellClass}
                  aria-sort={isSorted && sort ? sort.direction : "none"}
                >
                  {/* The control is the button, never the th: a click handler on a
                      th is invisible to keyboard and to assistive technology. */}
                  <button
                    type="button"
                    className="rathe-datatable__sort rathe-focusable"
                    onClick={() => onSortChange?.(nextSort(sort, column.key))}
                  >
                    <span className="rathe-datatable__sort-label">{column.header}</span>
                    <span className="rathe-datatable__sort-glyph" aria-hidden="true">
                      {isSorted && sort?.direction === "descending"
                        ? "▼"
                        : isSorted
                          ? "▲"
                          : "⇅"}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="rathe-datatable__body">
          {rows.length === 0 ? (
            <tr className="rathe-datatable__row rathe-datatable__row--empty">
              <td className="rathe-datatable__td rathe-datatable__td--empty" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={getRowKey(row, index)} className="rathe-datatable__row">
                {columns.map((column) => {
                  const align: DataTableAlign =
                    column.align ?? (column.numeric ? "end" : "start");
                  const cellClass = cx(
                    `rathe-datatable__cell--${align}`,
                    column.numeric && "rathe-datatable__cell--numeric",
                  );
                  const content = column.render
                    ? column.render(row)
                    : defaultCell(row, column.key);

                  if (rowHeaderKey !== undefined && column.key === rowHeaderKey) {
                    return (
                      <th
                        key={column.key}
                        scope="row"
                        className={cx("rathe-datatable__th-row", cellClass)}
                      >
                        {content}
                      </th>
                    );
                  }

                  return (
                    <td key={column.key} className={cx("rathe-datatable__td", cellClass)}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const DataTableWithRef = React.forwardRef(DataTableInner);
DataTableWithRef.displayName = "DataTable";

/**
 * forwardRef erases the generic, so the public binding is re-typed. This is the
 * standard escape hatch for generic components that also forward a ref.
 */
export const DataTable = DataTableWithRef as <T>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;
