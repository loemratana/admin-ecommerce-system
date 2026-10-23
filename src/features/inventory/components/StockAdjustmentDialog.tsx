import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useChangeStock, type StockChange } from "@/features/inventory/hooks/useInventory";
import { getApiErrorMessage } from "@/lib/api/errors";
import { productImage, variantLabel } from "@/features/inventory/utils/inventory.format";
import type { AdjustmentMode, AdjustStockPayload, InventoryResponse } from "@/features/inventory/types/inventory.types";

type Props = { item: InventoryResponse; onClose: () => void };

// Which backend operation each reason maps to. "restock" logs a PURCHASE; the rest go to /adjust.
type Reason = { label: string; action: "restock" | AdjustStockPayload["type"] };

const REASONS: Record<AdjustmentMode, Reason[]> = {
  "Add Stock": [
    { label: "Stock Received", action: "restock" },
    { label: "Returned", action: "RETURN" },
    { label: "Stock Correction", action: "ADJUSTMENT" },
  ],
  "Remove Stock": [
    { label: "Damaged", action: "DAMAGE" },
    { label: "Lost", action: "LOSS" },
    { label: "Stock Correction", action: "ADJUSTMENT" },
  ],
  "Set Stock": [{ label: "Stock Correction", action: "ADJUSTMENT" }],
};

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500";

export default function StockAdjustmentDialog({ item, onClose }: Props) {
  const [mode, setMode] = useState<AdjustmentMode>("Add Stock");
  const [quantity, setQuantity] = useState("");
  const [reasonLabel, setReasonLabel] = useState(REASONS["Add Stock"][0].label);
  const [note, setNote] = useState("");
  const changeStock = useChangeStock();

  const amount = Math.floor(Number(quantity) || 0);
  const delta = mode === "Add Stock" ? amount : mode === "Remove Stock" ? -amount : amount - item.quantity;
  const next = item.quantity + delta;
  const reason = REASONS[mode].find((r) => r.label === reasonLabel) ?? REASONS[mode][0];

  // Mirrors the backend rules so the admin sees the problem before submitting.
  const error =
    quantity === "" ? null
    : mode !== "Set Stock" && amount <= 0 ? "Quantity must be greater than 0"
    : mode === "Remove Stock" && amount > item.availableQuantity ? `Only ${item.availableQuantity} units are available (reserved units cannot be removed)`
    : mode === "Set Stock" && amount < item.reservedQuantity ? `Stock cannot be lower than the ${item.reservedQuantity} reserved units`
    : mode === "Set Stock" && delta === 0 ? "New stock equals current stock"
    : null;

  const changeMode = (value: AdjustmentMode) => {
    setMode(value);
    setReasonLabel(REASONS[value][0].label);
  };

  const submit = () => {
    if (quantity === "" || error) return;
    const variantId = item.variant?.id;
    if (variantId == null) return;

    const trimmedNote = note.trim() || undefined;
    const change: StockChange =
      reason.action === "restock"
        ? { kind: "restock", variantId, payload: { quantity: amount, note: trimmedNote } }
        : { kind: "adjust", variantId, payload: { type: reason.action, quantityChange: delta, note: trimmedNote ?? reason.label } };

    changeStock.mutate(change, {
      onSuccess: () => {
        toast.success(`Stock updated: ${item.quantity} → ${next}`);
        onClose();
      },
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Adjust Inventory</h2>
            <p className="mt-1 text-sm text-slate-500">Record an auditable stock movement.</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <img src={productImage(item)} alt="" className="h-12 w-12 rounded-lg object-cover" />
            <div>
              <p className="font-semibold text-slate-800">{item.product?.name}</p>
              <p className="text-xs text-slate-500">
                {variantLabel(item)} · SKU: {item.variant?.sku}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Adjustment Type</span>
              <select value={mode} onChange={(e) => changeMode(e.target.value as AdjustmentMode)} className={inputClass}>
                <option>Add Stock</option>
                <option>Remove Stock</option>
                <option>Set Stock</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">{mode === "Set Stock" ? "New Quantity" : "Quantity"}</span>
              <input type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" className={inputClass} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Reason</span>
              <select value={reason.label} onChange={(e) => setReasonLabel(e.target.value)} className={inputClass}>
                {REASONS[mode].map((r) => (
                  <option key={r.label}>{r.label}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Note</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} placeholder="Optional note" rows={2} className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" />
            </label>
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x rounded-lg border border-slate-200 bg-slate-50 py-3 text-center">
            <div>
              <p className="text-xs text-slate-400">Current Stock</p>
              <strong className="mt-1 block text-slate-800">{item.quantity}</strong>
              {item.reservedQuantity > 0 && <p className="text-[11px] text-slate-400">{item.reservedQuantity} reserved</p>}
            </div>
            <div>
              <p className="text-xs text-slate-400">Adjustment</p>
              <strong className={`mt-1 block ${delta < 0 ? "text-red-600" : "text-blue-600"}`}>
                {delta > 0 ? "+" : ""}
                {delta}
              </strong>
            </div>
            <div>
              <p className="text-xs text-slate-400">New Stock</p>
              <strong className="mt-1 block text-slate-800">{next}</strong>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={quantity === "" || !!error || changeStock.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changeStock.isPending ? "Saving..." : "Confirm Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}
