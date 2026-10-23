import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="hidden h-3 w-16 sm:block" />
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeletonRows({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-4 first:pl-5">
              <Skeleton className={cn("h-3.5", colIndex === 0 ? "w-28" : "w-16")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DetailSkeleton({ withImage = true, rows = 4 }: { withImage?: boolean; rows?: number }) {
  return (
    <div className={withImage ? "grid gap-5 sm:grid-cols-[160px_1fr]" : "grid gap-5"}>
      {withImage && <Skeleton className="aspect-square w-full rounded-xl" />}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ items = 4, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-12" />
        </div>
      ))}
    </div>
  );
}
