import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check, CircleDollarSign, ClipboardList, FileText, MapPin, PackageCheck, Printer, RotateCcw, Tag, UserRound, XCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { DetailSkeleton } from "@/components/common/Skeletons";
import Badge from "@/components/ui/badge/Badge";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useDownloadInvoice, useOrder, useUpdateOrderStatus } from "@/features/orders/hooks/useOrders";
import { useOrderReturns } from "@/features/returns/hooks/useReturns";
import { RETURN_STATUS_COLOR, RETURN_STATUS_LABEL } from "@/features/returns/utils/return.format";
import type { OrderResponse, OrderStatus } from "@/features/orders/types/order.types";
import {
  ORDER_ACTION_LABEL,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  REVENUE_STATUSES,
  formatMoney,
  formatOrderDate,
  nextForwardStatus,
  orderFlow,
  orderNextStatuses,
} from "@/features/orders/utils/order.format";
import { useOrderPayments } from "@/features/payments/hooks/usePayments";
import { PAYMENT_METHOD_LABEL, PAYMENT_PENDING_HINT, PAYMENT_STATUS_COLOR, PAYMENT_STATUS_LABEL, capturedPayment } from "@/features/payments/utils/payment.format";
import type { PaymentResponse } from "@/features/payments/types/payment.types";

function Section({ title, icon, children, action }: { title: string; icon: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {icon}
          <span>{title}</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Line({ label, value, tone = "text-slate-700", strong = false }: { label: ReactNode; value: string; tone?: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "border-t border-slate-200 pt-3 text-base font-semibold text-slate-900" : "text-sm"}`}>
      <span className={strong ? "" : "text-slate-500"}>{label}</span>
      <span className={strong ? "" : tone}>{value}</span>
    </div>
  );
}

const money = (value: number | null | undefined) => formatMoney(Number(value ?? 0));

// The backend keeps only the placed and last-updated dates, so earlier steps show as done without a time.
function StatusProgress({ order, refunded }: { order: OrderResponse; refunded?: PaymentResponse }) {
  if (order.status === "CANCELLED") {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">This order was cancelled</p>
          <p className="mt-0.5 text-red-600/80">
            Cancelled {formatOrderDate(order.updateDate)}. Any reserved stock was released.
            {refunded && Number(refunded.refundedAmount) > 0 && <> {money(refunded.refundedAmount)} was refunded ({PAYMENT_METHOD_LABEL[refunded.method]}).</>}
          </p>
        </div>
      </div>
    );
  }

  // Cash on delivery has no Paid step: the money is collected on delivery.
  const flow = orderFlow(order.paymentMethod);
  const current = flow.indexOf(order.status);
  return (
    <ol className={`grid gap-2 ${flow.length === 4 ? "grid-cols-4" : "grid-cols-5"}`}>
      {flow.map((step, index) => {
        const done = index <= current;
        const date = index === 0 ? order.orderDate : index === current ? order.updateDate : null;
        return (
          <li key={step} className="relative flex flex-col items-center text-center">
            {index > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${done ? "bg-blue-600" : "bg-slate-200"}`} aria-hidden="true" />}
            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-400"} ${index === current ? "ring-4 ring-blue-100" : ""}`}>
              {done ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}
            </span>
            <span className={`mt-2 text-xs font-medium ${done ? "text-slate-800" : "text-slate-400"}`}>{ORDER_STATUS_LABEL[step]}</span>
            {date && <span className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">{formatOrderDate(date, false)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetailPage() {
  const { id: orderNumber } = useParams();
  const { data: order, isLoading, error } = useOrder(orderNumber);
  const statusMutation = useUpdateOrderStatus();
  const invoiceMutation = useDownloadInvoice();
  const { data: returns = [], isLoading: isReturnsLoading } = useOrderReturns(orderNumber);
  const { data: payments = [], isLoading: isPaymentsLoading } = useOrderPayments(orderNumber);

  // The payment that took the money; cancelling refunds it automatically.
  const paid = capturedPayment(payments);
  const paidRefundable = paid ? Number(paid.amount) - Number(paid.refundedAmount) : 0;

  const changeStatus = async (next: OrderStatus) => {
    if (!order) return;
    if (next === "CANCELLED") {
      const refundNote = paidRefundable > 0
        ? paid?.method === "STRIPE"
          ? ` ${money(paidRefundable)} will be refunded to the customer's card.`
          : ` ${money(paidRefundable)} will be recorded as refunded; hand it back to the customer.`
        : "";
      if (!window.confirm(`Cancel order #${order.orderNumber}? Reserved stock will be released.${refundNote}`)) return;
    }
    try {
      await statusMutation.mutateAsync({ orderNumber: order.orderNumber, status: next });
      toast.success(
        next === "CANCELLED" && paidRefundable > 0
          ? `Order cancelled and ${money(paidRefundable)} refunded`
          : `Order is now ${ORDER_STATUS_LABEL[next].toLowerCase()}`
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const downloadInvoice = async () => {
    if (!order) return;
    try {
      await invoiceMutation.mutateAsync(order.orderNumber);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const next = order ? nextForwardStatus(order.status, order.paymentMethod) : undefined;
  const canCancel = order ? orderNextStatuses(order.status, order.paymentMethod).includes("CANCELLED") : false;
  const pendingStatus = statusMutation.isPending ? statusMutation.variables?.status : undefined;
  const address = order?.shippingAddress;
  const itemCount = order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  // Newest attempt first; it is the one that counts.
  const latestPayment = payments[0];

  return (
    <>
      <PageMeta title={`Order #${orderNumber} | E-Commerce Admin`} description="Order detail." />
      <Toaster position="top-right" richColors closeButton />
      <main className="font-outfit min-h-screen pb-10">
        <Link to="/sales/orders" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 print:hidden">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>

        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 text-sm text-slate-500 print:hidden">Sales / Orders / #{orderNumber}</div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">#{orderNumber}</h1>
              {order && <Badge color={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>}
            </div>
            {order && (
              <p className="mt-1 text-sm text-slate-500">
                Placed {formatOrderDate(order.orderDate)} · Last updated {formatOrderDate(order.updateDate)}
              </p>
            )}
          </div>
          {order && (
            <div className="flex flex-wrap gap-2 print:hidden">
              <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <Printer className="h-4 w-4" /> Print
              </button>
              {REVENUE_STATUSES.includes(order.status) && (
                <button type="button" disabled={invoiceMutation.isPending} onClick={downloadInvoice} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  {invoiceMutation.isPending ? <Spinner size="sm" /> : <FileText className="h-4 w-4" />} Invoice PDF
                </button>
              )}
              {canCancel && (
                <button type="button" disabled={statusMutation.isPending} onClick={() => changeStatus("CANCELLED")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                  {pendingStatus === "CANCELLED" ? <Spinner size="sm" /> : <XCircle className="h-4 w-4" />} Cancel order
                </button>
              )}
              {next && (
                <button type="button" disabled={statusMutation.isPending} onClick={() => changeStatus(next)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">
                  {pendingStatus === next && <Spinner size="sm" />} {ORDER_ACTION_LABEL[next]}
                </button>
              )}
            </div>
          )}
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(error)}</div>}

        {isLoading ? (
          <DetailSkeleton rows={6} />
        ) : order ? (
          <FadeIn className="space-y-5">
            <Section title="Progress" icon={<ClipboardList className="h-4 w-4" />}>
              <StatusProgress order={order} refunded={paid} />
            </Section>

            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <Section title={`Items (${itemCount})`} icon={<PackageCheck className="h-4 w-4" />}>
                <div className="divide-y divide-slate-100">
                  {order.items.map((item) => {
                    const unit = item.priceAfterDiscount ?? item.price;
                    const discounted = item.priceAfterDiscount !== null && Number(item.priceAfterDiscount) < Number(item.price);
                    const variant = [item.color, item.sizeName].filter(Boolean).join(" / ");
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <PackageCheck className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          {item.productVariantId ? (
                            <Link to={`/catalog/inventory/${item.productVariantId}`} className="block truncate text-sm font-semibold text-slate-800 hover:text-blue-600">{item.productName}</Link>
                          ) : (
                            <p className="truncate text-sm font-semibold text-slate-800">{item.productName}</p>
                          )}
                          <p className="mt-0.5 text-xs text-slate-500">
                            {variant && `${variant} · `}SKU: {item.sku ?? "—"}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>
                            {discounted && <span className="mr-1 line-through">{money(item.price)}</span>}
                            {money(unit)} × {item.quantity}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{money(item.lineTotal)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="ml-auto max-w-xs space-y-2">
                    <Line label="Subtotal" value={money(order.subtotal)} />
                    {Number(order.discountAmount) > 0 && <Line label="Discount" value={`-${money(order.discountAmount)}`} tone="text-green-600" />}
                    <Line label="Shipping" value={Number(order.shippingPrice) > 0 ? money(order.shippingPrice) : "Free"} />
                    <Line label="Tax" value={money(order.taxPrice)} />
                    <Line label="Total" value={money(order.totalOrderPrice)} strong />
                    {Number(order.refundedAmount) > 0 && (
                      <>
                        <Line label="Refunded (after delivery)" value={`-${money(order.refundedAmount)}`} tone="text-red-600" />
                        <Line label="Net" value={money(Number(order.totalOrderPrice) - Number(order.refundedAmount))} />
                      </>
                    )}
                  </div>
                </div>
              </Section>

              <div className="space-y-5">
                <Section title="Customer" icon={<UserRound className="h-4 w-4" />}>
                  {order.customer ? (
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                        {order.customer.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{order.customer.name}</p>
                        <a href={`mailto:${order.customer.email}`} className="block truncate text-sm text-blue-600">{order.customer.email}</a>
                        {order.customer.phone && <p className="text-sm text-slate-500">{order.customer.phone}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No customer on this order.</p>
                  )}
                </Section>

                <Section title="Shipping address" icon={<MapPin className="h-4 w-4" />}>
                  {address ? (
                    <address className="text-sm not-italic leading-6 text-slate-600">
                      {address.recipientName && <span className="font-medium text-slate-800">{address.recipientName}<br /></span>}
                      {address.street && <>{address.street}<br /></>}
                      {[address.city, address.state, address.zipCode].filter(Boolean).join(", ")}
                      {address.country && <><br />{address.country}</>}
                      {address.phone && <><br /><span className="text-slate-500">{address.phone}</span></>}
                    </address>
                  ) : (
                    <p className="text-sm text-slate-500">No shipping address.</p>
                  )}
                </Section>

                <Section
                  title="Payment"
                  icon={<CircleDollarSign className="h-4 w-4" />}
                  action={payments.length > 1 ? <span className="text-xs text-slate-400">{payments.length} attempts</span> : undefined}
                >
                  <div className="space-y-2">
                    <Line label="Method" value={order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] : "Not chosen yet"} />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Status</span>
                      {latestPayment ? (
                        <Badge size="sm" color={PAYMENT_STATUS_COLOR[latestPayment.status]}>{PAYMENT_STATUS_LABEL[latestPayment.status]}</Badge>
                      ) : (
                        <Badge size="sm" color={order.status === "PENDING" ? "warning" : "light"}>
                          {order.status === "PENDING" ? "Awaiting payment" : REVENUE_STATUSES.includes(order.status) ? "Marked as paid" : "None"}
                        </Badge>
                      )}
                    </div>
                    <Line label="Amount" value={money(order.totalOrderPrice)} />
                    {latestPayment?.status === "PENDING" && <p className="text-xs text-slate-400">{PAYMENT_PENDING_HINT[latestPayment.method]}.</p>}
                    {!latestPayment && REVENUE_STATUSES.includes(order.status) && (
                      <p className="text-xs text-slate-400">No payment record: this order was marked as paid by an admin.</p>
                    )}
                  </div>

                  {isPaymentsLoading ? (
                    <div className="mt-4 py-2 text-center text-xs text-slate-400">Loading payments...</div>
                  ) : payments.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                      {payments.map((p) => (
                        <li key={p.id} className="flex items-start justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700">{PAYMENT_METHOD_LABEL[p.method]} <span className="font-mono text-slate-400">#{p.id}</span></p>
                            <p className="text-slate-400">
                              Started {formatOrderDate(p.createdAt)}
                              {p.paidAt && <> · Paid {formatOrderDate(p.paidAt)}</>}
                            </p>
                            {Number(p.refundedAmount) > 0 && (
                              <p className="text-red-600">
                                Refunded {money(p.refundedAmount)} of {money(p.amount)}
                                {p.method === "CASH_ON_DELIVERY" && " · hand back in cash"}
                              </p>
                            )}
                            {p.failureReason && <p className="text-red-600">{p.failureReason}</p>}
                          </div>
                          <Badge size="sm" color={PAYMENT_STATUS_COLOR[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section title={`Returns (${returns.length})`} icon={<RotateCcw className="h-4 w-4" />}>
                  {isReturnsLoading ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading returns...</div>
                  ) : returns.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center">
                      <RotateCcw className="mx-auto h-5 w-5 text-slate-300" />
                      <p className="mt-2 text-xs font-medium text-slate-600">No returns recorded</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Customer has not requested a return for this order.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {returns.map((r) => (
                        <div key={r.returnNumber} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-600">
                          <div className="flex items-center justify-between gap-2">
                            <Link to={`/sales/returns/${r.returnNumber}`} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                              #{r.returnNumber}
                            </Link>
                            <Badge size="sm" color={RETURN_STATUS_COLOR[r.status]}>{RETURN_STATUS_LABEL[r.status]}</Badge>
                          </div>

                          <p className="mt-1 text-[11px] text-slate-400">
                            Requested {formatOrderDate(r.createdAt)}
                          </p>

                          <div className="mt-2 text-slate-700">
                            <span className="font-medium text-slate-800">Reason: </span>
                            <span className="text-slate-600">{r.reason}</span>
                          </div>

                          <div className="mt-2.5 space-y-1.5 border-t border-slate-200/60 pt-2">
                            <p className="font-medium text-slate-800">Returned items ({r.items.reduce((s, it) => s + it.quantity, 0)} units):</p>
                            <div className="space-y-1">
                              {r.items.map((item) => {
                                const variant = [item.color, item.sizeName].filter(Boolean).join(" / ");
                                return (
                                  <div key={item.id} className="flex items-start justify-between gap-2 text-[11px]">
                                    <span className="truncate text-slate-700">
                                      • {item.productName}{variant ? ` (${variant})` : ""}
                                    </span>
                                    <span className="shrink-0 font-medium text-slate-900">Qty: {item.quantity}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
                            <span className="text-slate-500">Estimated refund:</span>
                            <span className="font-medium text-slate-800">{money(r.estimatedRefund)}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Final refund:</span>
                            <span className={`font-semibold ${r.refundAmount !== null ? "text-slate-900" : "text-slate-400"}`}>
                              {r.refundAmount !== null ? money(r.refundAmount) : "Pending receipt"}
                            </span>
                          </div>

                          <div className="mt-3 border-t border-slate-200/60 pt-2 text-right">
                            <Link
                              to={`/sales/returns/${r.returnNumber}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              View Return Details →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {order.coupons.length > 0 && (
                  <Section title="Coupons" icon={<Tag className="h-4 w-4" />}>
                    <div className="space-y-2">
                      {order.coupons.map((coupon) => (
                        <Line
                          key={coupon.id}
                          label={<span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{coupon.couponCode}</span>}
                          value={`-${money(coupon.discountAmount)}`}
                          tone="text-green-600"
                        />
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            </div>
          </FadeIn>
        ) : null}
      </main>
    </>
  );
}
