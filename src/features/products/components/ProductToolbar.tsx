import { RotateCcw, Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { ProductFilters } from "@/features/products/types/product.types";

type ProductToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onReset: () => void;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  brands: { value: string; label: string }[];
  subCategories: { value: string; label: string }[];
};

export default function ProductToolbar({
  search,
  onSearchChange,
  selectedCount,
  onReset,
  filters,
  onFiltersChange,
  brands,
  subCategories,
}: ProductToolbarProps) {
  if (selectedCount > 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3">
        <span className="mr-2 text-sm font-semibold text-blue-900">{selectedCount} selected</span>
        {["Activate", "Deactivate", "Duplicate", "Delete"].map((action) => (
          <button key={action} type="button" className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${action === "Delete" ? "border-red-200 bg-white text-red-600 hover:bg-red-50" : "border-blue-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700"}`}>
            {action}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 xl:flex-row xl:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search products</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search products, SKU..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100" />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.brandId === undefined ? "" : String(filters.brandId)}
          onValueChange={(value) => onFiltersChange({ ...filters, brandId: value ? Number(value) : undefined })}
          options={[{ value: "", label: "All brands" }, ...brands]}
          placeholder="All brands"
          className="min-w-36"
        />
        <Select
          value={filters.subCategoryId === undefined ? "" : String(filters.subCategoryId)}
          onValueChange={(value) => onFiltersChange({ ...filters, subCategoryId: value ? Number(value) : undefined })}
          options={[{ value: "", label: "All subcategories" }, ...subCategories]}
          placeholder="All subcategories"
          className="min-w-40"
        />
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500">
          <span>Min price</span>
          <input
            aria-label="Minimum price"
            type="number"
            min="0"
            step="any"
            value={filters.minPrice ?? ""}
            onChange={(event) => {
              const value = event.target.value === "" ? undefined : Number(event.target.value);
              if (value === undefined || Number.isFinite(value)) onFiltersChange({ ...filters, minPrice: value });
            }}
            className="w-20 bg-transparent text-slate-700 outline-none"
          />
        </label>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500">
          <span>Max price</span>
          <input
            aria-label="Maximum price"
            type="number"
            min="0"
            step="any"
            value={filters.maxPrice ?? ""}
            onChange={(event) => {
              const value = event.target.value === "" ? undefined : Number(event.target.value);
              if (value === undefined || Number.isFinite(value)) onFiltersChange({ ...filters, maxPrice: value });
            }}
            className="w-20 bg-transparent text-slate-700 outline-none"
          />
        </label>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500">
          <span>Min rating</span>
          <input
            aria-label="Minimum rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={filters.minRating ?? ""}
            onChange={(event) => {
              const value = event.target.value === "" ? undefined : Number(event.target.value);
              if (value === undefined || Number.isFinite(value)) onFiltersChange({ ...filters, minRating: value });
            }}
            className="w-16 bg-transparent text-slate-700 outline-none"
          />
        </label>
        <button type="button" onClick={onReset} className="inline-flex h-10 items-center gap-2 px-2 text-sm font-medium text-slate-500 hover:text-blue-600">
          <RotateCcw className="h-3.5 w-3.5" /> Reset filters
        </button>
      </div>
    </div>
  );
}
