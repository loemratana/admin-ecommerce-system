import { Link, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import Badge from "@/components/ui/badge/Badge";
import { getApiErrorMessage } from "@/lib/api/errors";
import { usePayments } from "@/features/payments/hooks/usePayments";
import type { PaymentMethod, PaymentStatus } from "@/features/payments/types/payment.types";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_PENDING_HINT,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_LABEL,
} from "@/features/payments/utils/payment.format";
import { formatMoney, formatOrderDate } from "@/features/orders/utils/order.format";

const PAGE_SIZE = 20;

function isStatus(value: string | null): value is PaymentStatus {
  return value !== null && (PAYMENT_STATUSES as string[]).includes(value);
}

function isMethod(value: string | null): value is PaymentMethod {
  return value !== null && (PAYMENT_METHODS as string[]).includes(value);
}

export default function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const methodParam = searchParams.get("method");
  const status = isStatus(statusParam) ? statusParam : undefined;
  const method = isMethod(methodParam) ? methodParam : undefined;
  const page = Math.max(0, Number(searchParams.get("page") ?? 1) - 1 || 0);

  const paymentsQuery = usePayments({ status, method, page, size: PAGE_SIZE, sort: "createdAt,desc" });
  const payments = paymentsQuery.data?.content ?? [];
  const totalElements = paymentsQuery.data?.totalElements ?? 0;
  const totalPages = paymentsQuery.data?.totalPages ?? 0;

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

  const tabClass = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`;

  const amountOf = (value: number) => formatMoney(Number(value));

  return (
    <>
      <PageMeta title="Payments | E-Commerce Admin" description="Monitor payment attempts and their status." />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="font-medium text-slate-700">Sales / Payments</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">Every payment attempt for every order. A customer can retry or switch method, so one order can have several.</p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 md:flex-row md:items-center">
            <nav aria-label="Filter by status" className="custom-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
              <button type="button" onClick={() => updateParams({ status: undefined })} className={tabClass(!status)}>All</button>
              {PAYMENT_STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => updateParams({ status: s })} className={tabClass(status === s)}>
                  {PAYMENT_STATUS_LABEL[s]}
                </button>
              ))}
            </nav>
            <label className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
              <span className="sr-only md:not-sr-only">Method</span>
              <select
                value={method ?? ""}
                onChange={(event) => updateParams({ method: event.target.value || undefined })}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>)}
              </select>
            </label>
          </div>

          {paymentsQuery.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(paymentsQuery.error)}</div>}

          {paymentsQuery.isLoading ? (
            <TableSkeleton rows={8} />
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm shadow-slate-200/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><CreditCard className="h-6 w-6" /></div>
              <h2 className="mt-4 text-base font-semibold text-slate-800">No payments found</h2>
              <p className="mt-1 text-sm text-slate-500">{status || method ? "Try another status or method." : "Payments appear here once customers start paying for orders."}</p>
            </div>
          ) : (
            <FadeIn>
              <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 transition ${paymentsQuery.isPlaceholderData ? "opacity-60" : ""}`}>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        {["Payment", "Order", "Customer", "Method", "Amount", "Status", "Started", "Paid"].map((h) => (
                          <th key={h} className="px-4 py-3 first:pl-5 last:pr-5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-4 pl-5 font-mono text-xs font-semibold text-slate-700">#{p.id}</td>
                          <td className="px-4 py-4">
                            <Link to={`/sales/orders/${p.orderNumber}`} className="font-semibold text-blue-600 hover:text-blue-700">#{p.orderNumber}</Link>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-800">{p.customerName ?? "—"}</p>
                            <p className="text-xs text-slate-400">{p.customerEmail}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{PAYMENT_METHOD_LABEL[p.method]}</td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800">{amountOf(p.amount)}</p>
                            {Number(p.refundedAmount) > 0 && <p className="text-xs text-red-600">-{amountOf(p.refundedAmount)} refunded</p>}
                          </td>
                          <td className="px-4 py-4">
                            <Badge size="sm" color={PAYMENT_STATUS_COLOR[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                            {p.status === "PENDING" && <p className="mt-1 text-xs text-slate-400">{PAYMENT_PENDING_HINT[p.method]}</p>}
                            {p.failureReason && <p className="mt-1 max-w-[220px] truncate text-xs text-red-600" title={p.failureReason}>{p.failureReason}</p>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatOrderDate(p.createdAt)}</td>
                          <td className="whitespace-nowrap px-4 py-4 pr-5 text-xs text-slate-500">{p.paidAt ? formatOrderDate(p.paidAt) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-slate-100 lg:hidden">
                  {payments.map((p) => (
                    <Link key={p.id} to={`/sales/orders/${p.orderNumber}`} className="block p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-blue-600">#{p.orderNumber}</p>
                          <p className="mt-1 truncate font-medium text-slate-800">{p.customerName ?? "—"}</p>
                          <p className="text-xs text-slate-400">{PAYMENT_METHOD_LABEL[p.method]} · {formatOrderDate(p.createdAt, false)}</p>
                        </div>
                        <Badge size="sm" color={PAYMENT_STATUS_COLOR[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{amountOf(p.amount)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>
              Showing {payments.length === 0 ? 0 : page * PAGE_SIZE + 1}–{page * PAGE_SIZE + payments.length} of {totalElements.toLocaleString()} payments
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
