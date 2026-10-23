import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { CouponFormValues } from "@/features/coupons/schemas/coupon.schema";
import type { DiscountType } from "@/features/coupons/types/coupon.types";
import { useCurrency } from "@/lib/currency";

export type CouponFormState = CouponFormValues;

type CouponDialogProps = {
  mode: "create" | "edit";
  form: CouponFormState;
  saving: boolean;
  error: string;
  onChange: <K extends keyof CouponFormState>(field: K, value: CouponFormState[K]) => void;
  onClose: () => void;
  onSubmit: () => void;
};

const fieldClass = "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function CouponDialog({ mode, form, saving, error, onChange, onClose, onSubmit }: CouponDialogProps) {
  const currency = useCurrency();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="coupon-dialog-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="coupon-dialog-title" className="text-lg font-semibold text-slate-900">{mode === "edit" ? "Edit Coupon" : "Create Coupon"}</h2>
            <p className="mt-0.5 text-sm text-slate-500">Set the rules and availability for this promotion.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">{error}</p>}
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Coupon code</span>
            <input value={form.code} onChange={(event) => onChange("code", event.target.value.toUpperCase())} placeholder="WELCOME10" maxLength={50} className={`${fieldClass} font-semibold tracking-wide`} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Discount type</span>
            <select value={form.discountType} onChange={(event) => onChange("discountType", event.target.value as DiscountType)} className={`${fieldClass} bg-white`}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">{form.discountType === "FIXED" ? `Discount amount (${currency})` : "Discount (%)"}</span>
            <input type="number" min="0.01" max={form.discountType === "PERCENTAGE" ? "100" : undefined} step="0.01" value={form.discountValue} onChange={(event) => onChange("discountValue", event.target.value)} placeholder={form.discountType === "FIXED" ? "20" : "10"} className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Minimum order ({currency})</span>
            <input type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={(event) => onChange("minOrderAmount", event.target.value)} placeholder="No minimum" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Usage limit</span>
            <input type="number" min="1" step="1" value={form.usageLimit} onChange={(event) => onChange("usageLimit", event.target.value)} placeholder="Unlimited" className={fieldClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Expiration date</span>
            <input type="date" value={form.expiryDate} onChange={(event) => onChange("expiryDate", event.target.value)} className={fieldClass} />
            <span className="mt-1 block text-xs text-slate-400">The coupon stays valid until the end of this day.</span>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={form.active} onChange={(event) => onChange("active", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            {mode === "edit" ? "Active" : "Active immediately"}
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" disabled={saving} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Spinner size="sm" />}
            {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}
