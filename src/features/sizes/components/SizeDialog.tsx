import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { SizeFormValues } from "@/features/sizes/schemas/size.schema";

export type SizeFormState = SizeFormValues;

type SizeDialogProps = {
  mode: "create" | "edit";
  form: SizeFormState;
  saving: boolean;
  error: string;
  onChange: (field: keyof SizeFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function SizeDialog({ mode, form, saving, error, onChange, onClose, onSubmit }: SizeDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="size-dialog-title">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="size-dialog-title" className="text-lg font-semibold text-slate-900">{mode === "edit" ? "Edit Size" : "Create Size"}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Size Name</span>
            <input value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Enter size" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Optional Description</span>
            <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Enter description" rows={3} className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" disabled={saving} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Spinner size="sm" />}
            {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Size"}
          </button>
        </div>
      </div>
    </div>
  );
}
