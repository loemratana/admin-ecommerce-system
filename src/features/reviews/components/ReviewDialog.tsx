import { Star, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ReviewFormValues } from "@/features/reviews/schemas/review.schema";

export type ReviewFormState = ReviewFormValues;

type ReviewDialogProps = {
  form: ReviewFormState;
  saving: boolean;
  error: string;
  onChange: (field: keyof ReviewFormState, value: string | number) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function ReviewDialog({ form, saving, error, onChange, onClose, onSubmit }: ReviewDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="review-dialog-title" className="text-lg font-semibold text-slate-900">Edit Review</h2>
            <p className="mt-0.5 text-sm text-slate-500">Update the review's title, rating, or comment.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Title</span>
            <input value={form.title} onChange={(event) => onChange("title", event.target.value)} placeholder="Great product" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Rating</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => onChange("ratings", star)} aria-label={`${star} stars`} className="p-0.5">
                  <Star className={`h-6 w-6 ${star <= form.ratings ? "fill-current text-amber-500" : "text-slate-200"}`} />
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Comment</span>
            <textarea value={form.comment} onChange={(event) => onChange("comment", event.target.value)} rows={4} placeholder="Write the review comment" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" disabled={saving} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Spinner size="sm" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
