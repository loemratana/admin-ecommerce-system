import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertCircle, Download, Package, RotateCcw, Search } from "lucide-react";
import { Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import { TableSkeleton } from "@/components/common/Skeletons";
import InventoryStats from "@/features/inventory/components/InventoryStats";
import InventoryTable from "@/features/inventory/components/InventoryTable";
import StockAdjustmentDialog from "@/features/inventory/components/StockAdjustmentDialog";
import { useInventory, useInventoryStats } from "@/features/inventory/hooks/useInventory";
import { getApiErrorMessage } from "@/lib/api/errors";
import { STATUS_LABEL, variantLabel } from "@/features/inventory/utils/inventory.format";
import type { InventoryResponse, InventoryStatus } from "@/features/inventory/types/inventory.types";

const PAGE_SIZE = 10;

function exportCsv(rows: InventoryResponse[]) {
  const header = ["Product", "Variant", "SKU", "Price", "On Hand", "Reserved", "Available", "Sold", "Status", "Updated"];
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.product?.name, variantLabel(r), r.variant?.sku, r.price, r.quantity, r.reservedQuantity, r.availableQuantity, r.soldQuantity ?? 0, STATUS_LABEL[r.status], r.updatedAt]
      .map(escape)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Compact page list: 1 … 4 5 6 … 20 */
function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set([0, total - 1, current - 1, current, current + 1].filter((p) => p >= 0 && p < total));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (["…", p] as const) : [p]));
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<InventoryStatus | "">("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [adjusting, setAdjusting] = useState<InventoryResponse | null>(null);

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const inventory = useInventory({ search: debouncedSearch || undefined, status: status || undefined, page, size: PAGE_SIZE });
  const stats = useInventoryStats();

  const items = inventory.data?.content ?? [];
  const totalElements = inventory.data?.totalElements ?? 0;
  const totalPages = inventory.data?.totalPages ?? 0;
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const toggle = (id: number) => setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setPage(0);
  };
  const goToPage = (next: number) => {
    setPage(next);
    setSelectedIds([]);
  };

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(totalElements, (page + 1) * PAGE_SIZE);

  return (
    <>
      <PageMeta title="Inventory | E-Commerce Admin" description="Monitor and manage stock across product variants." />
      <Toaster position="top-right" richColors closeButton />
      <main className="font-outfit min-h-screen pb-10">
        <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/catalog/products" className="hover:text-blue-600">Catalog</Link>
              <span>/</span>
              <span className="font-medium text-slate-700">Inventory</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Inventory</h1>
            <p className="mt-1 text-sm text-slate-500">Monitor and manage stock across all product variants.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportCsv(selectedItems.length ? selectedItems : items)}
              disabled={!items.length}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </header>

        <div className="space-y-5">
          <InventoryStats stats={stats.data} isLoading={stats.isLoading} />

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
              <strong className="mr-2 text-blue-900">Selected: {selectedIds.length} variants</strong>
              {selectedItems.length === 1 && (
                <button onClick={() => setAdjusting(selectedItems[0])} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                  Adjust Stock
                </button>
              )}
              <button onClick={() => exportCsv(selectedItems)} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                Export
              </button>
              <button onClick={() => setSelectedIds([])} className="ml-auto text-xs text-blue-700">
                Clear
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 xl:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product, SKU, color..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as InventoryStatus | "");
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600"
            >
              <option value="">All statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            <button onClick={resetFilters} className="inline-flex h-10 items-center gap-2 px-2 text-sm text-slate-500">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>

          {inventory.isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <TableSkeleton rows={PAGE_SIZE} />
            </div>
          ) : inventory.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <h2 className="mt-3 font-semibold text-red-800">Could not load inventory</h2>
              <p className="mt-1 text-sm text-red-600">{getApiErrorMessage(inventory.error)}</p>
              <button onClick={() => inventory.refetch()} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                Retry
              </button>
            </div>
          ) : items.length ? (
            <InventoryTable
              items={items}
              selectedIds={selectedIds}
              onToggle={toggle}
              onToggleAll={() => setSelectedIds(selectedItems.length === items.length ? [] : items.map((item) => item.id))}
              onAdjust={setAdjusting}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
              <Package className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 font-semibold text-slate-800">No inventory found</h2>
              <p className="mt-1 text-sm text-slate-500">
                {debouncedSearch || status ? "No product variants match your current filters." : "Create a product with variants to start tracking stock."}
              </p>
              {(debouncedSearch || status) && (
                <button onClick={resetFilters} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {totalPages > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
              <span>
                Showing {from}–{to} of {totalElements.toLocaleString()} variants
                {inventory.isFetching && !inventory.isLoading && <span className="ml-2 text-xs text-slate-400">Updating…</span>}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={!inventory.data?.hasPrevious}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-50"
                >
                  Previous
                </button>
                {pageNumbers(page, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="px-1 py-2 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold ${p === page ? "bg-blue-600 text-white" : "border border-slate-200 bg-white"}`}
                    >
                      {p + 1}
                    </button>
                  ),
                )}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={!inventory.data?.hasNext}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {adjusting && <StockAdjustmentDialog item={adjusting} onClose={() => setAdjusting(null)} />}
      </main>
    </>
  );
}
