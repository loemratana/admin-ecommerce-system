import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Clock, PackageCheck, PackageOpen, RotateCcw, Search, XCircle } from "lucide-react";
import { Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useReturns, useReturnStats } from "@/features/returns/hooks/useReturns";
import type { ReturnStatus } from "@/features/returns/types/return.types";
import { RETURN_NEXT_STEP, RETURN_STATUSES, RETURN_STATUS_COLOR, RETURN_STATUS_LABEL } from "@/features/returns/utils/return.format";
import { formatMoney, formatOrderDate } from "@/features/orders/utils/order.format";

const PAGE_SIZE = 20;

function isStatus(value: string | null): value is ReturnStatus {
  return value !== null && (RETURN_STATUSES as string[]).includes(value);
}

export default function ReturnsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const status = isStatus(statusParam) ? statusParam : undefined;
  const urlSearch = searchParams.get("q") ?? "";
  const page = Math.max(0, Number(searchParams.get("page") ?? 1) - 1 || 0);
  const [search, setSearch] = useState(urlSearch);

  const returnsQuery = useReturns({ status, search: urlSearch || undefined, page, size: PAGE_SIZE, sort: "createdAt,desc" });
  const statsQuery = useReturnStats();
  const returns = returnsQuery.data?.content ?? [];
  const totalElements = returnsQuery.data?.totalElements ?? 0;
  const totalPages = returnsQuery.data?.totalPages ?? 0;
  const stats = statsQuery.data;
  const total = stats ? Object.values(stats).reduce((sum, count) => sum + count, 0) : undefined;

  const updateParams = (changes: Record<string, string | undefined>, resetPage = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (resetPage) next.delete("page");
      return next;
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() !== urlSearch) updateParams({ q: search.trim() || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => setSearch(urlSearch), [urlSearch]);

  const iconClass = "h-4 w-4 text-gray-800 dark:text-white/90";
  const summary = [
    {
      label: "Total Returns",
      value: total !== undefined ? total.toLocaleString() : undefined,
      filter: undefined,
      hint: "All return records",
      icon: <RotateCcw className={iconClass} />,
      badge: <Badge size="sm" color="light">Total</Badge>,
    },
    {
      label: "Requested",
      value: stats?.REQUESTED !== undefined ? stats.REQUESTED.toLocaleString() : undefined,
      filter: "REQUESTED" as const,
      hint: "Waiting for approval",
      icon: <Clock className="h-4 w-4 text-warning-500" />,
      badge: <Badge size="sm" color="warning">Action needed</Badge>,
    },
    {
      label: "Approved",
      value: stats?.APPROVED !== undefined ? stats.APPROVED.toLocaleString() : undefined,
      filter: "APPROVED" as const,
      hint: "Awaiting items",
      icon: <PackageCheck className="h-4 w-4 text-blue-500" />,
      badge: <Badge size="sm" color="info">In transit</Badge>,
    },
    {
      label: "Received",
      value: stats?.RECEIVED !== undefined ? stats.RECEIVED.toLocaleString() : undefined,
      filter: "RECEIVED" as const,
      hint: "Restocked & recorded",
      icon: <PackageOpen className="h-4 w-4 text-success-500" />,
      badge: <Badge size="sm" color="success">Restocked</Badge>,
    },
    {
      label: "Rejected",
      value: stats?.REJECTED !== undefined ? stats.REJECTED.toLocaleString() : undefined,
      filter: "REJECTED" as const,
      hint: "Declined requests",
      icon: <XCircle className="h-4 w-4 text-error-500" />,
      badge: <Badge size="sm" color="error">Closed</Badge>,
    },
  ];

  const tabClass = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <>
      <PageMeta title="Returns | E-Commerce Admin" description="Review and process customer returns." />
      <Toaster position="top-right" richColors closeButton />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="font-medium text-slate-700">Sales / Returns</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Returns</h1>
          <p className="mt-1 text-sm text-slate-500">Approve return requests, then record what arrived: sellable items go back into stock and the refund is sent back through the order's payment (card refunds are automatic; cash is handed back).</p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {summary.map((item) => {
              const isActive = item.filter ? status === item.filter : !status;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => updateParams({ status: item.filter })}
                  className={`group rounded-xl border p-3.5 text-left transition sm:p-4 ${
                    isActive
                      ? "border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/20 dark:border-brand-500 dark:bg-brand-500/[0.05]"
                      : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 transition group-hover:scale-105">
                      {item.icon}
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
                      {item.value === undefined ? <Skeleton className="h-6 w-14" /> : item.value}
                    </h4>
                    {item.badge}
                  </div>
                  {item.hint && (
                    <p className="mt-1 truncate text-theme-xs text-gray-400 dark:text-gray-500">{item.hint}</p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40">
            <nav aria-label="Filter by status" className="custom-scrollbar flex gap-1 overflow-x-auto">
              <button type="button" onClick={() => updateParams({ status: undefined })} className={tabClass(!status)}>
                All {total !== undefined && <span className="text-xs opacity-75">{total}</span>}
              </button>
              {RETURN_STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => updateParams({ status: s })} className={tabClass(status === s)}>
                  {RETURN_STATUS_LABEL[s]} {stats && <span className="text-xs opacity-75">{stats[s]}</span>}
                </button>
              ))}
            </nav>
            <label className="relative block">
              <span className="sr-only">Search returns</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search return number, order number, customer name or email…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {returnsQuery.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(returnsQuery.error)}</div>}

          {returnsQuery.isLoading ? (
            <TableSkeleton rows={8} />
          ) : returns.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm shadow-slate-200/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><RotateCcw className="h-6 w-6" /></div>
              <h2 className="mt-4 text-base font-semibold text-slate-800">No returns found</h2>
              <p className="mt-1 text-sm text-slate-500">{status || urlSearch ? "Try another status or search." : "Return requests from customers will appear here."}</p>
            </div>
          ) : (
            <FadeIn>
              <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 transition ${returnsQuery.isPlaceholderData ? "opacity-60" : ""}`}>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        {["Return Number", "Order Number", "Customer", "Items", "Estimated Refund", "Final Refund", "Status", "Requested Date", "Actions"].map((h) => (
                          <th key={h} className="px-4 py-3 first:pl-5 last:pr-5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returns.map((r) => {
                        const units = r.items.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                          <tr key={r.returnNumber} className="hover:bg-slate-50/70">
                            <td className="px-4 py-4 pl-5">
                              <Link to={`/sales/returns/${r.returnNumber}`} className="font-semibold text-blue-600 hover:text-blue-700">#{r.returnNumber}</Link>
                              {RETURN_NEXT_STEP[r.status] && <p className="text-xs text-amber-600">{RETURN_NEXT_STEP[r.status]}</p>}
                            </td>
                            <td className="px-4 py-4">
                              <Link to={`/sales/orders/${r.orderNumber}`} className="text-slate-600 hover:text-blue-600">#{r.orderNumber}</Link>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-medium text-slate-800">{r.customerName ?? "—"}</p>
                              <p className="text-xs text-slate-400">{r.customerEmail}</p>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{units} unit{units === 1 ? "" : "s"}</td>
                            <td className="px-4 py-4 font-medium text-slate-800">
                              {formatMoney(Number(r.estimatedRefund))}
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-900">
                              {r.refundAmount !== null ? formatMoney(Number(r.refundAmount)) : <span className="font-normal text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-4"><Badge size="sm" color={RETURN_STATUS_COLOR[r.status]}>{RETURN_STATUS_LABEL[r.status]}</Badge></td>
                            <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatOrderDate(r.createdAt)}</td>
                            <td className="px-4 py-4 pr-5">
                              <Link
                                to={`/sales/returns/${r.returnNumber}`}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-blue-400 hover:text-blue-600 hover:bg-slate-50 transition"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-slate-100 lg:hidden">
                  {returns.map((r) => (
                    <Link key={r.returnNumber} to={`/sales/returns/${r.returnNumber}`} className="block p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-blue-600">#{r.returnNumber}</p>
                          <p className="mt-1 truncate font-medium text-slate-800">{r.customerName ?? "—"}</p>
                          <p className="text-xs text-slate-400">Order #{r.orderNumber} · {formatOrderDate(r.createdAt, false)}</p>
                        </div>
                        <Badge size="sm" color={RETURN_STATUS_COLOR[r.status]}>{RETURN_STATUS_LABEL[r.status]}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-xs text-slate-500">Estimated: {formatMoney(Number(r.estimatedRefund))}</span>
                        <span className="font-semibold text-slate-900">
                          Final: {r.refundAmount !== null ? formatMoney(Number(r.refundAmount)) : "Pending"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>
              Showing {returns.length === 0 ? 0 : page * PAGE_SIZE + 1}–{page * PAGE_SIZE + returns.length} of {totalElements.toLocaleString()} returns
            </p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page === 0} onClick={() => updateParams({ page: page <= 1 ? undefined : String(page) }, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="px-2 text-xs">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
              <button type="button" disabled={page + 1 >= totalPages} onClick={() => updateParams({ page: String(page + 2) }, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
