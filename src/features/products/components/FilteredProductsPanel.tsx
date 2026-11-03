import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Package, Plus, Search, X } from "lucide-react";
import FadeIn from "@/components/common/FadeIn";
import DataTablePagination from "@/components/common/DataTablePagination";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useArchiveProduct, useProducts } from "@/features/products/hooks/useProducts";
import { toUiProduct } from "@/features/products/utils/product.mapper";
import { readStoredView, storeView } from "@/features/products/utils/product-view";
import ProductGrid, { ProductGridSkeleton } from "@/features/products/components/ProductGrid";
import ProductsTable from "@/features/products/components/ProductsTable";
import ProductViewToggle from "@/features/products/components/ProductViewToggle";
import { ProductLoadingState } from "@/features/products/components/ProductStates";
import type { Product, ProductAction, ProductViewMode } from "@/features/products/types/product-list.types";
import type { CatalogStatus, ProductQuery } from "@/features/products/types/product.types";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

const STATUS_TABS: { value: CatalogStatus | "ALL"; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ALL", label: "All" },
];

type FilteredProductsPanelProps = {
  /** Which products to show, e.g. { brandId: 3 } or { subCategoryId: 7 }. */
  filter: Pick<ProductQuery, "brandId" | "subCategoryId" | "categoryId">;
  /** Name of the brand/sub-category, used in the empty state. */
  ownerName: string;
  /** e.g. "brand" or "sub-category". */
  ownerLabel: string;
  /** Query string that pre-fills the new-product form, e.g. "brandId=3". */
  addProductQuery?: string;
};

/**
 * Products for one brand/sub-category, from the products API so rows carry price, stock and
 * status. Search, status tabs, grid/table view and server-side pagination.
 */
export default function FilteredProductsPanel({ filter, ownerName, ownerLabel, addProductQuery }: FilteredProductsPanelProps) {
  const navigate = useNavigate();
  const archiveMutation = useArchiveProduct();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "ALL">("ACTIVE");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [view, setView] = useState<ProductViewMode>(readStoredView);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTitle(search.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const productsQuery = useProducts({ ...filter, title: title || undefined, status, page, size: pageSize, sort: "createdAt,desc" });
  const products = useMemo(() => (productsQuery.data?.content ?? []).map(toUiProduct), [productsQuery.data]);
  const totalElements = productsQuery.data?.page.totalElements ?? 0;
  const totalPages = productsQuery.data?.page.totalPages ?? 0;
  const filtered = Boolean(title) || status !== "ACTIVE";
  const error = actionError || (productsQuery.error ? getApiErrorMessage(productsQuery.error) : "");

  const handleAction = async (action: ProductAction, product: Product) => {
    if (action === "view" || action === "edit") {
      navigate(`/catalog/products/${product.id}`);
      return;
    }
    const restore = action === "restore";
    if (!restore && !window.confirm(`Archive "${product.name}"? It disappears from the shop; orders and stock history are kept.`)) return;
    setActionError("");
    try {
      await archiveMutation.mutateAsync({ id: Number(product.id), restore });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const changeView = (mode: ProductViewMode) => {
    storeView(mode);
    setView(mode);
  };

  const addProduct = () => navigate(`/catalog/products/new${addProductQuery ? `?${addProductQuery}` : ""}`);
  const clearFilters = () => {
    setSearch("");
    setStatus("ACTIVE");
    setPage(0);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Products</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {productsQuery.isLoading ? "Loading…" : `${totalElements.toLocaleString()} ${status === "ALL" ? "" : status.toLowerCase() + " "}product${totalElements === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              aria-label={`Search this ${ownerLabel}'s products`}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-56"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <div role="group" aria-label="Product status" className="inline-flex h-10 items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={status === tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(0);
                }}
                className={`h-8 rounded-md px-3 text-sm font-medium transition ${status === tab.value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ProductViewToggle value={view} onChange={changeView} />
          <button type="button" onClick={addProduct} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      <div className="p-5">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {productsQuery.isLoading ? (
          view === "grid" ? <ProductGridSkeleton count={8} /> : <ProductLoadingState />
        ) : products.length > 0 ? (
          <FadeIn className={productsQuery.isPlaceholderData ? "pointer-events-none opacity-60" : undefined}>
            {view === "grid" ? (
              <ProductGrid products={products} onAction={handleAction} />
            ) : (
              <ProductsTable products={products} selectedIds={[]} onToggle={() => {}} onToggleAll={() => {}} onAction={handleAction} />
            )}
          </FadeIn>
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Package className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-800">{filtered ? "No products match" : `No products in ${ownerName} yet`}</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {filtered ? "Try a different search or status." : `Products you assign to this ${ownerLabel} will show up here.`}
            </p>
            {filtered ? (
              <button type="button" onClick={clearFilters} className="mt-4 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Clear filters
              </button>
            ) : (
              <button type="button" onClick={addProduct} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Add product
              </button>
            )}
          </div>
        )}

        {totalElements > 0 && (
          <DataTablePagination
            className="mt-5"
            page={page}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            itemLabel="products"
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
          />
        )}
      </div>
    </section>
  );
}
