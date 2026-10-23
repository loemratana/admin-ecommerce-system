import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type BulkActionBarProps = {
  count: number;
  deleting: boolean;
  onDelete: () => void;
  onClear: () => void;
  label?: string;
};

export default function BulkActionBar({ count, deleting, onDelete, onClear, label = "selected" }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <span className="text-sm font-semibold text-blue-900">{count} {label}</span>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deleting && <Spinner size="xs" />}
        <Trash2 className="h-3.5 w-3.5" />
        {deleting ? "Deleting..." : "Delete"}
      </button>
      <button type="button" onClick={onClear} className="text-xs font-medium text-blue-700 hover:text-blue-900">
        Clear selection
      </button>
    </div>
  );
}
