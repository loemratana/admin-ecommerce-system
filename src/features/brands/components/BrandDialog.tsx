import { useState } from "react";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import ImageUploadField from "@/components/common/ImageUploadField";
import type { BrandFormValues } from "@/features/brands/schemas/brand.schema";

export type BrandFormState = BrandFormValues;

type BrandDialogProps = {
  mode: "create" | "edit";
  form: BrandFormState;
  saving: boolean;
  error: string;
  onChange: (field: keyof BrandFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function BrandDialog({ mode, form, saving, error, onChange, onClose, onSubmit }: BrandDialogProps) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="brand-dialog-title">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="brand-dialog-title" className="text-lg font-semibold text-slate-900">{mode === "edit" ? "Edit Brand" : "Create Brand"}</h2>
            <p className="mt-0.5 text-sm text-slate-500">Manage brand identity and visibility.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <ImageUploadField label="Brand Logo" value={form.image} onChange={(url) => onChange("image", url)} folder="brands" onUploadingChange={setUploading} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Brand Name</span>
            <input value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Enter brand name" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Slug</span>
            <input value={form.slug} onChange={(event) => onChange("slug", event.target.value)} placeholder="nike" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <span className="mt-1 block text-xs text-slate-400">
              {mode === "create" ? "Automatically generated from the brand name." : "Changing the slug changes this brand's URL."}
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" disabled={saving || uploading} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Spinner size="sm" />}
            {saving ? "Saving..." : uploading ? "Uploading image..." : mode === "edit" ? "Save Changes" : "Create Brand"}
          </button>
        </div>
      </div>
    </div>
  );
}
