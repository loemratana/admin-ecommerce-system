import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Clock, Eye, FileSpreadsheet, FileText, Package, Search, ShoppingBag, Truck, XCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import TableActionMenu from "@/components/common/TableActionMenu";
import { TableSkeleton } from "@/components/common/Skeletons";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useDownloadInvoice, useOrders, useOrderStats, useUpdateOrderStatus } from "@/features/orders/hooks/useOrders";
import ExportOrdersDialog from "@/features/orders/components/ExportOrdersDialog";
import type { OrderStatus, OrderSummaryResponse } from "@/features/orders/types/order.types";
import {
  ORDER_ACTION_LABEL,
  ORDER_FLOW,
  orderNextStatuses,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  REVENUE_STATUSES,
  formatMoney,
  formatOrderDate,
  nextForwardStatus,
} from "@/features/orders/utils/order.format";
import { PAYMENT_METHOD_LABEL } from "@/features/payments/utils/payment.format";

const PAGE_SIZE = 20;
const STATUSES: OrderStatus[] = [...ORDER_FLOW, "CANCELLED"];

const SORT_OPTIONS = [
  { value: "orderDate,desc", label: "Newest first" },
  { value: "orderDate,asc", label: "Oldest first" },
  { value: "totalOrderPrice,desc", label: "Highest total" },
  { value: "totalOrderPrice,asc", label: "Lowest total" },
];

function isStatus(value: string | null): value is OrderStatus {
  return value !== null && (STATUSES as string[]).includes(value);
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const status = isStatus(statusParam) ? statusParam : undefined;
  const urlSearch = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? SORT_OPTIONS[0].value;
  const page = Math.max(0, Number(searchParams.get("page") ?? 1) - 1 || 0);
  const [search, setSearch] = useState(urlSearch);
  const [exportOpen, setExportOpen] = useState(false);

  const ordersQuery = useOrders({ status, search: urlSearch || undefined, sort, page, size: PAGE_SIZE });
  const statsQuery = useOrderStats();
  const statusMutation = useUpdateOrderStatus();
  const invoiceMutation = useDownloadInvoice();
  const orders = ordersQuery.data?.content ?? [];
  const totalElements = ordersQuery.data?.totalElements ?? 0;
  const totalPages = ordersQuery.data?.totalPages ?? 0;
  const stats = statsQuery.data;

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

  const changeStatus = async (order: OrderSummaryResponse, next: OrderStatus) => {
    // Paid and not yet shipped (cash on delivery is only paid at delivery): cancelling refunds the payment.
    const paid = REVENUE_STATUSES.includes(order.status) && order.paymentMethod !== "CASH_ON_DELIVERY";
    const refundNote = paid ? ` The ${formatMoney(Number(order.totalOrderPrice))} payment will be refunded to the customer.` : "";
    if (next === "CANCELLED" && !window.confirm(`Cancel order #${order.orderNumber}? Reserved stock will be released.${refundNote}`)) return;
    try {
      await statusMutation.mutateAsync({ orderNumber: order.orderNumber, status: next });
      toast.success(`Order #${order.orderNumber} is now ${ORDER_STATUS_LABEL[next].toLowerCase()}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const downloadInvoice = async (orderNumber: string) => {
    try {
      await invoiceMutation.mutateAsync(orderNumber);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const iconClass = "h-4 w-4 text-gray-800 dark:text-white/90";
  const summary = [
    {
      label: "Total orders",
      value: stats?.totalOrders.toLocaleString(),
      filter: undefined,
      hint: stats ? `${formatMoney(stats.totalRevenue)} revenue` : undefined,
      icon: <ShoppingBag className={iconClass} />,
      badge: stats ? <Badge size="sm" color="success">{formatMoney(stats.totalRevenue)}</Badge> : undefined,
    },
    {
      label: "Awaiting payment",
      value: stats?.byStatus.PENDING.toLocaleString(),
      filter: "PENDING" as const,
      hint: "Unpaid orders",
      icon: <Clock className="h-4 w-4 text-warning-500" />,
      badge: <Badge size="sm" color="warning">Pending</Badge>,
    },
    {
      label: "To fulfil",
      value: stats ? (stats.byStatus.PAID + stats.byStatus.PROCESSING).toLocaleString() : undefined,
      filter: undefined,
      hint: stats ? `${stats.byStatus.PAID} paid · ${stats.byStatus.PROCESSING} processing` : undefined,
      icon: <Package className="h-4 w-4 text-blue-500" />,
      badge: <Badge size="sm" color="info">Processing</Badge>,
    },
    {
      label: "Shipped",
      value: stats?.byStatus.SHIPPED.toLocaleString(),
      filter: "SHIPPED" as const,
      hint: "On the way to customers",
      icon: <Truck className="h-4 w-4 text-indigo-500" />,
      badge: <Badge size="sm" color="primary">In transit</Badge>,
    },
    {
      label: "Delivered",
      value: stats?.byStatus.DELIVERED.toLocaleString(),
      filter: "DELIVERED" as const,
      hint: stats?.byStatus.CANCELLED ? `${stats.byStatus.CANCELLED} cancelled` : "Completed orders",
      icon: <CheckCircle2 className="h-4 w-4 text-success-500" />,
      badge: <Badge size="sm" color="success">Delivered</Badge>,
    },
  ];

  const rowActions = (order: OrderSummaryResponse) => (
    <TableActionMenu ariaLabel={`Actions for order ${order.orderNumber}`} widthClassName="w-48">
      <button type="button" onClick={() => navigate(`/sales/orders/${order.orderNumber}`)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">
        <Eye className="h-3.5 w-3.5" /> View order
      </button>
      {REVENUE_STATUSES.includes(order.status) && (
        <button type="button" disabled={invoiceMutation.isPending} onClick={() => downloadInvoice(order.orderNumber)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          <FileText className="h-3.5 w-3.5" /> Download invoice
        </button>
      )}
      {orderNextStatuses(order.status, order.paymentMethod)
        .filter((next) => next !== "CANCELLED")
        .map((next) => (
          <button key={next} type="button" disabled={statusMutation.isPending} onClick={() => changeStatus(order, next)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <ClipboardList className="h-3.5 w-3.5" /> {ORDER_ACTION_LABEL[next]}
          </button>
        ))}
      {orderNextStatuses(order.status, order.paymentMethod).includes("CANCELLED") && (
        <>
          <div className="my-1 border-t border-slate-100" />
          <button type="button" disabled={statusMutation.isPending} onClick={() => changeStatus(order, "CANCELLED")} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
            <XCircle className="h-3.5 w-3.5" /> Cancel order
          </button>
        </>
      )}
    </TableActionMenu>
  );

  const tabClass = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <>
      <PageMeta title="Orders | E-Commerce Admin" description="Manage and track customer orders." />
      <Toaster position="top-right" richColors closeButton />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="font-medium text-slate-700">Sales / Orders</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Orders</h1>
            <p className="mt-1 text-sm text-slate-500">Track orders and move them through payment, fulfilment and delivery.</p>
          </div>
          <button type="button" onClick={() => setExportOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {summary.map((item) => {
              const isActive = item.filter ? status === item.filter : !status && item.label === "Total orders";
              return item.filter ? (
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
              ) : (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
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
                </div>
              );
            })}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40">
            <nav aria-label="Filter by status" className="custom-scrollbar flex gap-1 overflow-x-auto">
              <button type="button" onClick={() => updateParams({ status: undefined })} className={tabClass(!status)}>
                All {stats && <span className="text-xs opacity-75">{stats.totalOrders}</span>}
              </button>
              {STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => updateParams({ status: s })} className={tabClass(status === s)}>
                  {ORDER_STATUS_LABEL[s]} {stats && <span className="text-xs opacity-75">{stats.byStatus[s]}</span>}
                </button>
              ))}
            </nav>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search orders</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order number, customer name or email…"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <Select value={sort} onValueChange={(value) => updateParams({ sort: value === SORT_OPTIONS[0].value ? undefined : value })} options={SORT_OPTIONS} placeholder="Sort" className="md:w-44" />
            </div>
          </div>

          {ordersQuery.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(ordersQuery.error)}</div>}

          {ordersQuery.isLoading ? (
            <TableSkeleton rows={8} />
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm shadow-slate-200/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><ClipboardList className="h-6 w-6" /></div>
              <h2 className="mt-4 text-base font-semibold text-slate-800">No orders found</h2>
              <p className="mt-1 text-sm text-slate-500">{status || urlSearch ? "Try another status or search." : "Orders will appear here once customers check out."}</p>
            </div>
          ) : (
            <FadeIn>
              <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 transition ${ordersQuery.isPlaceholderData ? "opacity-60" : ""}`}>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        {["Order", "Customer", "Items", "Total", "Status", "Placed", ""].map((h) => (
                          <th key={h} className="px-4 py-3 first:pl-5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => {
                        const next = nextForwardStatus(order.status, order.paymentMethod);
                        return (
                          <tr key={order.orderNumber} className="hover:bg-slate-50/70">
                            <td className="px-4 py-4 pl-5">
                              <Link to={`/sales/orders/${order.orderNumber}`} className="font-semibold text-blue-600 hover:text-blue-700">#{order.orderNumber}</Link>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-medium text-slate-800">{order.customerName ?? "—"}</p>
                              <p className="text-xs text-slate-400">{order.customerEmail}</p>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</td>
                            <td className="px-4 py-4 font-semibold text-slate-800">{formatMoney(Number(order.totalOrderPrice))}</td>
                            <td className="px-4 py-4">
                              <Badge size="sm" color={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                              {order.paymentMethod && <p className="mt-1 text-xs text-slate-400">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{formatOrderDate(order.orderDate)}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {next && (
                                  <button type="button" disabled={statusMutation.isPending} onClick={() => changeStatus(order, next)} className="whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50">
                                    {ORDER_ACTION_LABEL[next]}
                                  </button>
                                )}
                                {rowActions(order)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-slate-100 lg:hidden">
                  {orders.map((order) => (
                    <article key={order.orderNumber} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link to={`/sales/orders/${order.orderNumber}`} className="font-semibold text-blue-600">#{order.orderNumber}</Link>
                          <p className="mt-1 truncate font-medium text-slate-800">{order.customerName ?? "—"}</p>
                          <p className="text-xs text-slate-400">{order.itemCount} items · {formatOrderDate(order.orderDate, false)}</p>
                        </div>
                        {rowActions(order)}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <strong className="text-slate-900">{formatMoney(Number(order.totalOrderPrice))}</strong>
                        <Badge size="sm" color={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>
              Showing {orders.length === 0 ? 0 : page * PAGE_SIZE + 1}–{page * PAGE_SIZE + orders.length} of {totalElements.toLocaleString()} orders
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
      <ExportOrdersDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} defaultStatus={status} />
    </>
  );
}
