import { LayoutGrid, List } from "lucide-react";
import type { ProductViewMode } from "@/features/products/types/product-list.types";

const OPTIONS = [
  { value: "table", label: "Table view", Icon: List },
  { value: "grid", label: "Grid view", Icon: LayoutGrid },
] as const;

export default function ProductViewToggle({ value, onChange }: { value: ProductViewMode; onChange: (mode: ProductViewMode) => void }) {
  return (
    <div role="group" aria-label="Product view" className="inline-flex h-10 items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
      {OPTIONS.map(({ value: mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          aria-label={label}
          aria-pressed={value === mode}
          title={label}
          onClick={() => onChange(mode)}
          className={`inline-flex h-8 w-9 items-center justify-center rounded-md transition ${
            value === mode ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
