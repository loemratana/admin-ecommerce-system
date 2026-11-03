import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DataTablePaginationProps = {
  /** Zero-based current page. */
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Plural noun for the count, e.g. "orders". */
  itemLabel?: string;
  className?: string;
};

/** Page numbers around the current page with "…" gaps, e.g. 1 … 4 5 6 … 20 (zero-based values). */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
  const pages = [...new Set([0, pageCount - 1, page - 1, page, page + 1])].filter((p) => p >= 0 && p < pageCount).sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? ["gap" as const, p] : [p]));
}

const navButton =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

export default function DataTablePagination({
  page,
  pageSize,
  totalElements,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = "rows",
  className,
}: DataTablePaginationProps) {
  const lastPage = Math.max(0, totalPages - 1);
  const from = totalElements === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(totalElements, (page + 1) * pageSize);
  const go = (next: number) => onPageChange(Math.min(Math.max(0, next), lastPage));

  return (
    <div className={cn("flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        )}
        <span>
          Showing <span className="font-medium text-slate-700">{from.toLocaleString()}–{to.toLocaleString()}</span> of{" "}
          <span className="font-medium text-slate-700">{totalElements.toLocaleString()}</span> {itemLabel}
        </span>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button type="button" onClick={() => go(0)} disabled={page === 0} aria-label="First page" className={navButton}>
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous page" className={navButton}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((p, i) =>
              p === "gap" ? (
                <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => go(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={p === page ? "inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white" : navButton}
                >
                  {p + 1}
                </button>
              ),
            )}
          </div>
          <span className="px-2 text-xs sm:hidden">
            {page + 1} / {totalPages}
          </span>
          <button type="button" onClick={() => go(page + 1)} disabled={page >= lastPage} aria-label="Next page" className={navButton}>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => go(lastPage)} disabled={page >= lastPage} aria-label="Last page" className={navButton}>
            <ChevronsRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
