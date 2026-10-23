import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Check,
  ClipboardList,
  DollarSign,
  Info,
  MessageSquare,
  PackageCheck,
  PackageOpen,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { DetailSkeleton } from "@/components/common/Skeletons";
import Badge from "@/components/ui/badge/Badge";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, Field } from "@/components/shared/AdminUI";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useReturn, useReturnAction } from "@/features/returns/hooks/useReturns";
import type { ReturnItemCondition } from "@/features/returns/types/return.types";
import { CONDITION_LABEL, RETURN_STATUS_COLOR, RETURN_STATUS_LABEL } from "@/features/returns/utils/return.format";
import { validateAndBuildReceivePayload } from "@/features/returns/utils/receiveReturn";
import { formatMoney, formatOrderDate } from "@/features/orders/utils/order.format";
import { useOrderPayments } from "@/features/payments/hooks/usePayments";
import { REFUND_ROUTE, capturedPayment } from "@/features/payments/utils/payment.format";

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

const money = (value: number | null | undefined) => formatMoney(Number(value ?? 0));
const STEPS = ["REQUESTED", "APPROVED", "RECEIVED"] as const;

export default function ReturnDetailPage() {
  const params = useParams<{ id?: string; returnNumber?: string }>();
  const returnNumber = params.returnNumber || params.id;
  const { data: ret, isLoading, error } = useReturn(returnNumber);
  const action = useReturnAction();
  // The refund goes back through the payment that took the money; its method decides how.
  const { data: orderPayments = [] } = useOrderPayments(ret?.orderNumber);
  const paidWith = capturedPayment(orderPayments)?.method;
  const refundRoute = paidWith ? REFUND_ROUTE[paidWith] : undefined;

  // Modals state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState("");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveNote, setReceiveNote] = useState("");
  const [itemConditions, setItemConditions] = useState<Record<number, ReturnItemCondition | "">>({});
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
  const [receiveError, setReceiveError] = useState("");

  const openReceiveModal = () => {
    if (!ret) return;
    const initialConditions: Record<number, ReturnItemCondition | ""> = {};
    for (const item of ret.items) {
      initialConditions[item.id] = item.condition ?? "";
    }
    setItemConditions(initialConditions);
    setItemErrors({});
    setReceiveError("");
    setReceiveNote("");
    setReceiveModalOpen(true);
  };

  const handleSetAllConditions = (condition: ReturnItemCondition) => {
    if (!ret) return;
    const updated: Record<number, ReturnItemCondition | ""> = {};
    for (const item of ret.items) {
      updated[item.id] = condition;
    }
    setItemConditions(updated);
    setItemErrors({});
    setReceiveError("");
  };

  const handleApprove = async () => {
    if (!ret) return;
    try {
      await action.mutateAsync({
        type: "approve",
        returnNumber: ret.returnNumber,
        note: approveNote.trim() || undefined,
      });
      setApproveModalOpen(false);
      setApproveNote("");
      toast.success("Return approved successfully");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleReject = async () => {
    if (!ret) return;
    const trimmed = rejectNote.trim();
    if (!trimmed) {
      setRejectError("A rejection note is required to explain why the return is rejected.");
      return;
    }
    setRejectError("");
    try {
      await action.mutateAsync({
        type: "reject",
        returnNumber: ret.returnNumber,
        note: trimmed,
      });
      setRejectModalOpen(false);
      setRejectNote("");
      toast.success("Return rejected");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleReceive = async () => {
    if (!ret) return;

    const validation = validateAndBuildReceivePayload(ret.items, itemConditions, receiveNote);

    if (!validation.isValid || !validation.payload) {
      setItemErrors(validation.itemErrors);
      const errMsg =
        validation.generalError ||
        validation.noteError ||
        "Please select an inspection condition for all items.";
      setReceiveError(errMsg);
      toast.error(errMsg);
      return;
    }

    setItemErrors({});
    setReceiveError("");

    try {
      await action.mutateAsync({
        type: "receive",
        returnNumber: ret.returnNumber,
        payload: validation.payload,
      });
      setReceiveModalOpen(false);
      setReceiveNote("");
      setItemConditions({});
      toast.success(
        refundRoute?.automatic
          ? "Items received, stock restored and refund sent to the customer's card"
          : "Items received, stock restored and refund recorded"
      );
    } catch (err) {
      const errMsg = getApiErrorMessage(err);
      setReceiveError(errMsg);
      toast.error(errMsg);
    }
  };

  const pending = action.isPending ? action.variables?.type : undefined;
  const canDecide = ret?.status === "REQUESTED";
  const canReceive = ret?.status === "APPROVED";
  const canReject = ret?.status === "REQUESTED" || ret?.status === "APPROVED";
  const current = ret ? STEPS.indexOf(ret.status as (typeof STEPS)[number]) : -1;

  return (
    <>
      <PageMeta title={`Return #${returnNumber} | E-Commerce Admin`} description="Return detail." />
      <Toaster position="top-right" richColors closeButton />
      <main className="font-outfit min-h-screen pb-10">
        <Link to="/sales/returns" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Back to returns
        </Link>

        <div className="mb-6">
          <div className="mb-3 text-sm text-slate-500">Sales / Returns / #{returnNumber}</div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">#{returnNumber}</h1>
            {ret && <Badge color={RETURN_STATUS_COLOR[ret.status]}>{RETURN_STATUS_LABEL[ret.status]}</Badge>}
          </div>
          {ret && (
            <p className="mt-1 text-sm text-slate-500">
              For order <Link to={`/sales/orders/${ret.orderNumber}`} className="font-medium text-blue-600 hover:underline">#{ret.orderNumber}</Link> · Requested {formatOrderDate(ret.createdAt)}
            </p>
          )}
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(error)}</div>}

        {isLoading ? (
          <DetailSkeleton rows={6} />
        ) : ret ? (
          <FadeIn className="space-y-5">
            <Section title="Progress" icon={<ClipboardList className="h-4 w-4" />}>
              {ret.status === "REJECTED" || ret.status === "CANCELLED" ? (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">{ret.status === "REJECTED" ? "Rejected" : "Cancelled by the customer"}</p>
                    <p className="mt-0.5 text-red-600/80">{formatOrderDate(ret.updatedAt)}. No stock or refund changes were made.</p>
                  </div>
                </div>
              ) : (
                <ol className="grid grid-cols-3 gap-2">
                  {STEPS.map((step, index) => {
                    const done = index <= current;
                    return (
                      <li key={step} className="relative flex flex-col items-center text-center">
                        {index > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${done ? "bg-blue-600" : "bg-slate-200"}`} aria-hidden="true" />}
                        <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-400"} ${index === current ? "ring-4 ring-blue-100" : ""}`}>
                          {done ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">{index + 1}</span>}
                        </span>
                        <span className={`mt-2 text-xs font-medium ${done ? "text-slate-800" : "text-slate-400"}`}>{RETURN_STATUS_LABEL[step]}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Section>

            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <Section title={`Items (${ret.items.reduce((sum, item) => sum + item.quantity, 0)})`} icon={<PackageCheck className="h-4 w-4" />}>
                <div className="divide-y divide-slate-100">
                  {ret.items.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-3 py-3.5">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-slate-100 object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <PackageCheck className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.productName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {[item.color, item.sizeName].filter(Boolean).join(" / ")} {item.sku && `· SKU: ${item.sku}`}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            Return Item ID: #{item.id}
                          </span>
                          <span className="font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded text-[11px]">
                            Order Item ID: #{item.orderItemId}
                          </span>
                          <span>Unit Price: {money(item.unitPrice)}</span>
                          <span className="font-medium text-slate-700">Requested Qty: {item.quantity}</span>
                        </div>
                      </div>
                      {item.condition && (
                        <Badge size="sm" color={item.condition === "RESTOCK" ? "success" : "error"}>
                          {CONDITION_LABEL[item.condition]}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                  <span>{ret.refundAmount !== null ? "Recorded refund" : "Estimated refund"}</span>
                  <span>{money(ret.refundAmount ?? ret.estimatedRefund)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Coupon discounts and tax are shared out across the items; shipping is non-refundable.</p>
              </Section>

              <div className="space-y-5">
                <Section title="Customer" icon={<UserRound className="h-4 w-4" />}>
                  <p className="font-semibold text-slate-800">{ret.customerName ?? "—"}</p>
                  {ret.customerEmail && <a href={`mailto:${ret.customerEmail}`} className="text-sm text-blue-600 hover:underline">{ret.customerEmail}</a>}
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">Return Reason</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{ret.reason}</p>
                  {ret.adminNote && (
                    <>
                      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">Administrator Note</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{ret.adminNote}</p>
                    </>
                  )}
                </Section>

                {/* Refund & Financial Status */}
                <Section title="Refund Summary" icon={<DollarSign className="h-4 w-4" />}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Estimated Refund</span>
                      <span className="font-medium text-slate-800">{money(ret.estimatedRefund)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Final Refund</span>
                      <span className={`font-semibold ${ret.refundAmount !== null ? "text-slate-900" : "text-slate-400"}`}>
                        {ret.refundAmount !== null ? money(ret.refundAmount) : "Pending item receipt"}
                      </span>
                    </div>
                    {ret.status !== "REJECTED" && ret.status !== "CANCELLED" && (
                      <div className="border-t border-slate-100 pt-3">
                        <div className={`rounded-lg border p-3 text-xs ${refundRoute?.automatic ? "border-blue-200/60 bg-blue-50/80 text-blue-800" : "border-amber-200/60 bg-amber-50/80 text-amber-800"}`}>
                          <p className="flex items-center gap-1.5 font-semibold">
                            <Info className={`h-3.5 w-3.5 shrink-0 ${refundRoute?.automatic ? "text-blue-600" : "text-amber-600"}`} />
                            {refundRoute?.automatic ? "Automatic refund" : "Manual refund"}
                          </p>
                          <p className={`mt-1 leading-relaxed ${refundRoute?.automatic ? "text-blue-700" : "text-amber-700"}`}>
                            {refundRoute
                              ? ret.status === "RECEIVED" ? refundRoute.done : refundRoute.upcoming
                              : "This order has no payment record (it was marked as paid by an admin), so the refund is only recorded. Pay it back to the customer yourself."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Section>

                {/* Timestamps */}
                <Section title="Timeline & Timestamps" icon={<Calendar className="h-4 w-4" />}>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Requested Date</span>
                      <span className="font-medium text-slate-800">{formatOrderDate(ret.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Last Updated</span>
                      <span className="font-medium text-slate-800">{formatOrderDate(ret.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Received Date</span>
                      <span className="font-medium text-slate-800">
                        {ret.receivedAt ? formatOrderDate(ret.receivedAt) : <span className="text-slate-400">Not received</span>}
                      </span>
                    </div>
                  </div>
                </Section>

                {/* Return Management Actions */}
                {(canDecide || canReceive || canReject) && (
                  <Section title={canReceive ? "Receive & Inspect Items" : "Review Request"} icon={canReceive ? <PackageOpen className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}>
                    <p className="mb-4 text-sm text-slate-600">
                      {canReceive
                        ? "Items have been approved for return. When package arrives, open the receiving dialog to inspect each item's condition and confirm receipt."
                        : "Review customer return reason. You can approve the request to allow item return, or reject it with a note to the customer."}
                    </p>

                    <div className="flex flex-wrap gap-2.5">
                      {canDecide && (
                        <button
                          type="button"
                          onClick={() => {
                            setApproveNote("");
                            setApproveModalOpen(true);
                          }}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
                        >
                          <Check className="h-4 w-4" /> Approve Return
                        </button>
                      )}

                      {canReceive && (
                        <button
                          type="button"
                          onClick={openReceiveModal}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 transition shadow-sm shadow-green-600/20"
                        >
                          <PackageOpen className="h-4 w-4" /> Receive & Inspect Items
                        </button>
                      )}

                      {canReject && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectNote("");
                            setRejectError("");
                            setRejectModalOpen(true);
                          }}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition"
                        >
                          <XCircle className="h-4 w-4" /> Reject Return
                        </button>
                      )}
                    </div>
                  </Section>
                )}
              </div>
            </div>
          </FadeIn>
        ) : null}

        {/* 1. Approve Return Modal */}
        {approveModalOpen && ret && (
          <Dialog title={`Approve Return #${ret.returnNumber}`} onClose={() => setApproveModalOpen(false)}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to approve this return request? Once approved, the customer will be notified to return the item(s) to the warehouse.
              </p>

              <Field label="Administrator note to customer (optional)">
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="e.g. Return approved. Please return items in original packaging."
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-y rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={action.isPending}
                  onClick={handleApprove}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {pending === "approve" && <Spinner size="sm" />}
                  {pending === "approve" ? "Approving..." : "Confirm Approval"}
                </button>
              </div>
            </div>
          </Dialog>
        )}

        {/* 2. Reject Return Modal */}
        {rejectModalOpen && ret && (
          <Dialog title={`Reject Return #${ret.returnNumber}`} onClose={() => setRejectModalOpen(false)}>
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                <p className="font-semibold">Rejection is irreversible</p>
                <p className="mt-0.5 text-red-600/90">
                  Rejecting this return will close the request. The reason entered below is sent directly to the customer.
                </p>
              </div>

              {rejectError && <p className="text-xs text-red-600 font-medium">{rejectError}</p>}

              <Field label="Rejection reason (required) *">
                <textarea
                  value={rejectNote}
                  onChange={(e) => {
                    setRejectNote(e.target.value);
                    if (rejectError) setRejectError("");
                  }}
                  placeholder="e.g. The returned item does not meet the return policy (past 30-day window)."
                  rows={3}
                  maxLength={1000}
                  className={`w-full resize-y rounded-lg border p-2.5 text-sm outline-none transition ${
                    rejectError ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
              </Field>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={action.isPending || !rejectNote.trim()}
                  onClick={handleReject}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {pending === "reject" && <Spinner size="sm" />}
                  {pending === "reject" ? "Rejecting..." : "Reject Return"}
                </button>
              </div>
            </div>
          </Dialog>
        )}

        {/* 3. Receive Return Items Modal */}
        {receiveModalOpen && ret && (
          <Dialog title="Receive & Inspect Returned Items" onClose={() => !action.isPending && setReceiveModalOpen(false)}>
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                <p className="font-semibold flex items-center gap-1.5">
                  <PackageOpen className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  Warehouse Receiving & Inspection
                </p>
                <p className="mt-1 text-blue-700/90 leading-relaxed">
                  Inspect the physical condition of every returned item below. Items marked as <strong>{CONDITION_LABEL.RESTOCK}</strong> will be restored to active inventory. Items marked as <strong>{CONDITION_LABEL.DAMAGED}</strong> will be written off without restocking.
                </p>
                <p className="mt-2 text-blue-700/90 leading-relaxed">
                  <strong>Confirming sends the refund of {money(ret.estimatedRefund)}</strong>
                  {refundRoute?.automatic ? " back to the customer's card through Stripe." : paidWith ? ". Paid in cash: hand the money back to the customer." : " to the order record only (no payment to refund)."}
                </p>
              </div>

              {receiveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <p className="font-semibold flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    Validation error
                  </p>
                  <p className="mt-0.5">{receiveError}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Items to Inspect ({ret.items.length})
                  </p>
                  {ret.items.length > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Quick set:</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllConditions("RESTOCK")}
                        className="rounded px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50"
                      >
                        All Restock
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllConditions("DAMAGED")}
                        className="rounded px-2 py-0.5 text-[11px] font-medium text-amber-600 hover:bg-amber-50"
                      >
                        All Damaged
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {ret.items.map((item) => {
                    const currentCondition = itemConditions[item.id] ?? "";
                    const hasError = Boolean(itemErrors[item.id]);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-3 transition ${
                          hasError
                            ? "border-red-300 bg-red-50/30"
                            : "border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg bg-white object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400">
                              <PackageCheck className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {[item.color, item.sizeName].filter(Boolean).join(" / ") || "Standard"}
                              {item.sku ? ` · SKU: ${item.sku}` : ""}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                              <span className="font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                Return Item ID: #{item.id}
                              </span>
                              <span className="font-medium text-slate-700">
                                Requested Qty: {item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 border-t border-slate-200/70 pt-2.5">
                          <label
                            htmlFor={`condition-${item.id}`}
                            className="block text-xs font-medium text-slate-700 mb-1"
                          >
                            Inspection Condition <span className="text-red-500">*</span>
                          </label>
                          <select
                            id={`condition-${item.id}`}
                            value={currentCondition}
                            onChange={(e) => {
                              const val = e.target.value as ReturnItemCondition | "";
                              setItemConditions((prev) => ({ ...prev, [item.id]: val }));
                              if (itemErrors[item.id]) {
                                setItemErrors((prev) => {
                                  const copy = { ...prev };
                                  delete copy[item.id];
                                  return copy;
                                });
                              }
                              if (receiveError) setReceiveError("");
                            }}
                            className={`w-full rounded-lg border bg-white px-2.5 py-2 text-xs font-medium text-slate-800 outline-none transition ${
                              hasError
                                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            }`}
                          >
                            <option value="">Select condition (Required)...</option>
                            <option value="RESTOCK">
                              {CONDITION_LABEL.RESTOCK} (RESTOCK) — Return to inventory
                            </option>
                            <option value="DAMAGED">
                              {CONDITION_LABEL.DAMAGED} (DAMAGED) — Write off without restocking
                            </option>
                          </select>
                          {hasError && (
                            <p className="mt-1 text-xs text-red-600 font-medium">
                              {itemErrors[item.id]}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Field label="Warehouse receiving note (optional, max 1000 characters)">
                <textarea
                  value={receiveNote}
                  onChange={(e) => {
                    setReceiveNote(e.target.value);
                    if (receiveError) setReceiveError("");
                  }}
                  placeholder="e.g. Returned package inspected at central warehouse. All items verified."
                  rows={2}
                  maxLength={1000}
                  className="w-full resize-y rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <div className="mt-1 flex justify-end text-[11px] text-slate-400">
                  <span>{receiveNote.length}/1000</span>
                </div>
              </Field>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={action.isPending}
                  onClick={() => setReceiveModalOpen(false)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={action.isPending}
                  onClick={handleReceive}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition"
                >
                  {pending === "receive" && <Spinner size="sm" />}
                  {pending === "receive" ? "Receiving..." : "Confirm Receipt"}
                </button>
              </div>
            </div>
          </Dialog>
        )}
      </main>
    </>
  );
}
