type PaginationProps = {
  label: string;
  /** Zero-based current page. */
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
};

const buttonClass = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

/** Page numbers around the current page, with "…" gaps, e.g. 0 … 4 5 6 … 19. */
function pageWindow(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
  const pages = new Set([0, pageCount - 1, page - 1, page, page + 1].filter((p) => p >= 0 && p < pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["…" as const, p] : [p]));
}

export default function Pagination({ label, page = 0, pageCount = 1, onPageChange }: PaginationProps) {
  const go = (next: number) => onPageChange?.(Math.min(Math.max(0, next), pageCount - 1));

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
      <p>{label}</p>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 0} onClick={() => go(page - 1)} className={buttonClass}>Previous</button>
        {pageWindow(page, Math.max(1, pageCount)).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-xs">…</span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => go(p)}
              className={p === page ? "h-8 w-8 rounded-lg bg-blue-600 text-xs font-semibold text-white" : "h-8 w-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50"}
            >
              {p + 1}
            </button>
          ),
        )}
        <button type="button" disabled={page >= pageCount - 1} onClick={() => go(page + 1)} className={buttonClass}>Next</button>
      </div>
    </div>
  );
}
