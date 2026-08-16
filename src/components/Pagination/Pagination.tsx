import * as React from "react";
import "./Pagination.css";

export type PaginationItem = number | "ellipsis";

export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Pages shown either side of the current one. */
  siblingCount?: number;
  /** Pages pinned at each end of the range. */
  boundaryCount?: number;
  /** Accessible name of the nav landmark. Give it context when a page has two. */
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  /** Accessible name for a page button. Must contain the visible number. */
  itemLabel?: (page: number) => string;
  /** Announcement text for the live region when the page changes. */
  statusLabel?: (page: number, pageCount: number) => string;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function range(start: number, end: number): number[] {
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

/**
 * Produces the visible page sequence with ellipses. Exported because the
 * truncation rules are the part of a paginator that quietly breaks, a range
 * that flickers between five and seven controls as you page through it moves
 * the Next button under the pointer, and that is only catchable in a unit test.
 */
export function buildPageItems(
  page: number,
  pageCount: number,
  siblingCount = 1,
  boundaryCount = 1,
): PaginationItem[] {
  if (pageCount <= 0) return [];

  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? (endPages[0] ?? pageCount) - 2 : pageCount - 1,
  );

  const items: PaginationItem[] = [...startPages];

  if (siblingsStart > boundaryCount + 2) {
    items.push("ellipsis");
  } else if (boundaryCount + 1 < pageCount - boundaryCount) {
    // Exactly one page would be hidden, so show it instead of an ellipsis that
    // costs the same width and hides a click target.
    items.push(boundaryCount + 1);
  }

  items.push(...range(siblingsStart, siblingsEnd));

  if (siblingsEnd < pageCount - boundaryCount - 1) {
    items.push("ellipsis");
  } else if (pageCount - boundaryCount > boundaryCount) {
    items.push(pageCount - boundaryCount);
  }

  items.push(...endPages);
  return items;
}

const defaultItemLabel = (page: number): string => `Page ${page}`;
const defaultStatusLabel = (page: number, pageCount: number): string =>
  `Page ${page} of ${pageCount}`;

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page,
    pageCount,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    label = "Pagination",
    previousLabel = "Previous",
    nextLabel = "Next",
    itemLabel = defaultItemLabel,
    statusLabel = defaultStatusLabel,
    className,
    ...rest
  },
  ref,
) {
  const safePageCount = Math.max(1, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), safePageCount);
  const items = buildPageItems(current, safePageCount, siblingCount, boundaryCount);

  const [announcement, setAnnouncement] = React.useState("");
  const isFirstRender = React.useRef(true);

  // The live region starts empty on purpose. Populating it during the first
  // commit makes some screen readers announce "Page 1 of 12" the moment the
  // table loads, on top of whatever the page itself was already saying.
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setAnnouncement(statusLabel(current, safePageCount));
  }, [current, safePageCount, statusLabel]);

  const goTo = (next: number): void => {
    const clamped = Math.min(Math.max(1, next), safePageCount);
    if (clamped !== current) onPageChange(clamped);
  };

  return (
    <nav
      aria-label={label}
      {...rest}
      ref={ref}
      className={cx("rathe-pagination", className)}
    >
      <ul className="rathe-pagination__list">
        <li className="rathe-pagination__item">
          <button
            type="button"
            className="rathe-pagination__control rathe-focusable"
            aria-label={`${previousLabel} page`}
            disabled={current <= 1}
            onClick={() => goTo(current - 1)}
          >
            <span className="rathe-pagination__chevron" aria-hidden="true">
              ‹
            </span>
            <span className="rathe-pagination__control-text">{previousLabel}</span>
          </button>
        </li>

        {items.map((item, index) =>
          item === "ellipsis" ? (
            // Not a button and not focusable: an ellipsis has no destination, so
            // giving it a tab stop only adds keystrokes between real controls.
            <li
              key={`ellipsis-${index}`}
              className="rathe-pagination__item rathe-pagination__ellipsis"
              aria-hidden="true"
            >
              …
            </li>
          ) : (
            <li key={item} className="rathe-pagination__item">
              <button
                type="button"
                className={cx(
                  "rathe-pagination__page",
                  "rathe-focusable",
                  item === current && "rathe-pagination__page--current",
                )}
                aria-label={itemLabel(item)}
                aria-current={item === current ? "page" : undefined}
                onClick={() => goTo(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}

        <li className="rathe-pagination__item">
          <button
            type="button"
            className="rathe-pagination__control rathe-focusable"
            aria-label={`${nextLabel} page`}
            disabled={current >= safePageCount}
            onClick={() => goTo(current + 1)}
          >
            <span className="rathe-pagination__control-text">{nextLabel}</span>
            <span className="rathe-pagination__chevron" aria-hidden="true">
              ›
            </span>
          </button>
        </li>
      </ul>

      <div className="rathe-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </nav>
  );
});
