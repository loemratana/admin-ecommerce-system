import { useState } from "react";
import { AlertCircle, ArrowDownRight, ArrowLeft, ArrowUpRight, History, SlidersHorizontal } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import { Skeleton } from "@/components/ui/skeleton";
import StockAdjustmentDialog from "@/features/inventory/components/StockAdjustmentDialog";
import { useInventoryDetail, useInventoryTransactions } from "@/features/inventory/hooks/useInventory";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  TRANSACTION_LABEL,
  formatDate,
  formatPrice,
  productImage,
  variantLabel,
} from "@/features/inventory/utils/inventory.format";

function StatCard({ label, value, tone = "text-slate-900" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${tone}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default function InventoryDetailsPage() {
  const { variantId: param } = useParams();
  const variantId = Number(param);
  const navigate = useNavigate();
  const [historyPage, setHistoryPage] = useState(0);
  const [adjusting, setAdjusting] = useState(false);

  const detail = useInventoryDetail(variantId);
  const history = useInventoryTransactions(variantId, historyPage);

  const inventory = detail.data?.inventory;
  const title = inventory?.product?.name ?? "Variant Inventory";

  if (detail.isError) {
    return (
      <main className="font-outfit min-h-screen pb-10">
        <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 py-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <h2 className="mt-3 font-semibold text-red-800">Could not load inventory</h2>
          <p className="mt-1 text-sm text-red-600">{getApiErrorMessage(detail.error)}</p>
          <Link to="/catalog/inventory" className="mt-4 inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
            Back to Inventory
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <PageMeta title={`${title} | Inventory | E-Commerce Admin`} description="View inventory and stock history for a product variant." />
      <Toaster position="top-right" richColors closeButton />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/catalog/inventory" className="hover:text-blue-600">Catalog / Inventory</Link>
          <span>/</span>
          <span className="font-medium text-slate-700">{inventory?.variant?.sku ?? param}</span>
        </div>

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            {inventory ? (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[inventory.status]}`}>{STATUS_LABEL[inventory.status]}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {variantLabel(inventory)} · SKU: {inventory.variant?.sku}
                </p>
              </>
            ) : (
              <>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="mt-2 h-4 w-40" />
              </>
            )}
          </div>
          <div className="flex gap-2 self-start">
            <button
              onClick={() => navigate("/catalog/inventory")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Inventory
            </button>
            <button
              onClick={() => setAdjusting(true)}
              disabled={!inventory}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <SlidersHorizontal className="h-4 w-4" /> Adjust Stock
            </button>
          </div>
        </div>

        {inventory && detail.data && (
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="On Hand" value={inventory.quantity} />
            <StatCard label="Reserved" value={inventory.reservedQuantity} tone="text-amber-600" />
            <StatCard label="Available" value={inventory.availableQuantity} tone="text-green-700" />
            <StatCard label="Sold" value={inventory.soldQuantity ?? 0} tone="text-blue-600" />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
            {inventory && detail.data ? (
              <>
                <img src={productImage(inventory)} alt={title} className="aspect-square w-full rounded-lg object-cover" />
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Product</dt>
                    <dd className="font-semibold text-slate-800">
                      {inventory.product ? (
                        <Link to={`/catalog/products/${inventory.product.id}`} className="hover:text-blue-600">{inventory.product.name}</Link>
                      ) : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Color</dt>
                    <dd className="font-medium text-slate-700">{inventory.variant?.color ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Size</dt>
                    <dd className="font-medium text-slate-700">{inventory.variant?.size?.name ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Price</dt>
                    <dd className="font-semibold text-slate-700">{formatPrice(inventory.price)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-4">
                    <dt className="flex items-center gap-1 text-slate-500"><ArrowUpRight className="h-3.5 w-3.5 text-green-600" /> Total Stock In</dt>
                    <dd className="font-semibold text-green-700">{detail.data.totalStockIn.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="flex items-center gap-1 text-slate-500"><ArrowDownRight className="h-3.5 w-3.5 text-red-600" /> Total Stock Out</dt>
                    <dd className="font-semibold text-red-600">{detail.data.totalStockOut.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Last Updated</dt>
                    <dd className="text-slate-600">{formatDate(inventory.updatedAt, true)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              </>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Stock History</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">Auditable stock movements for this variant.</p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Quantity</th>
                    <th className="px-3 py-3">Reference</th>
                    <th className="px-3 py-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.isLoading &&
                    Array.from({ length: 5 }, (_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
                      </tr>
                    ))}
                  {history.data?.content.map((tx) => (
                    <tr key={tx.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-slate-500">{formatDate(tx.createdAt, true)}</td>
                      <td className="px-3 py-4 font-medium text-slate-700">{TRANSACTION_LABEL[tx.type]}</td>
                      <td className={`px-3 py-4 font-semibold ${tx.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.quantityChange > 0 ? "+" : ""}
                        {tx.quantityChange}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {tx.referenceType ? `${tx.referenceType} #${tx.referenceId ?? ""}` : "—"}
                      </td>
                      <td className="px-3 py-4 text-slate-500">{tx.note || "—"}</td>
                    </tr>
                  ))}
                  {history.data && history.data.content.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-500">No stock movements yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {history.data && history.data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {history.data.currentPage + 1} of {history.data.totalPages} · {history.data.totalElements} movements
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setHistoryPage((p) => p - 1)} disabled={!history.data.hasPrevious} className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-50">
                    Previous
                  </button>
                  <button onClick={() => setHistoryPage((p) => p + 1)} disabled={!history.data.hasNext} className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:opacity-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {adjusting && inventory && <StockAdjustmentDialog item={inventory} onClose={() => setAdjusting(false)} />}
      </main>
    </>
  );
}
