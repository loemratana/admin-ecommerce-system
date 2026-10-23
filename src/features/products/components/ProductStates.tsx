import { PackageSearch } from "lucide-react";
import { TableSkeleton } from "@/components/common/Skeletons";

export function ProductEmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm shadow-slate-200/40"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><PackageSearch className="h-6 w-6" /></div><h2 className="mt-4 text-base font-semibold text-slate-800">No products found</h2><p className="mt-1 text-sm text-slate-500">Try changing your filters or create your first product.</p><button type="button" onClick={onAdd} className="mt-5 inline-flex h-9 items-center rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700">+ Add Product</button></div>;
}

export function ProductLoadingState() {
  return <TableSkeleton rows={8} />;
}
