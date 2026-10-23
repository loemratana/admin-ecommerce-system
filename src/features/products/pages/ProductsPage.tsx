import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Plus } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import ProductStats from "@/features/products/components/ProductStats";
import ProductToolbar from "@/features/products/components/ProductToolbar";
import ProductsTable from "@/features/products/components/ProductsTable";
import ProductGrid, { ProductGridSkeleton } from "@/features/products/components/ProductGrid";
import ProductViewToggle from "@/features/products/components/ProductViewToggle";
import { readStoredView, storeView } from "@/features/products/utils/product-view";
import { ProductEmptyState, ProductLoadingState } from "@/features/products/components/ProductStates";
import type { Product, ProductAction, ProductViewMode } from "@/features/products/types/product-list.types";
import { useArchiveProduct, useProducts, useProductStats } from "@/features/products/hooks/useProducts";
import { useBrands } from "@/features/brands/hooks/useBrands";
import { useSubCategories } from "@/features/sub-categories/hooks/useSubCategories";
import type { CatalogStatus, ProductFilters } from "@/features/products/types/product.types";
import { toUiProduct } from "@/features/products/utils/product.mapper";
import { getApiErrorMessage } from "@/lib/api/errors";

const TABLE_PAGE_SIZE = 10;
const GRID_PAGE_SIZE = 20;

function getNumberParam(params: URLSearchParams, key: string): number | undefined {
  const value = params.get(key);
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTitle = searchParams.get("title") ?? "";
  const [search, setSearch] = useState(urlTitle);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const viewParam = searchParams.get("view");
  const view: ProductViewMode = viewParam === "grid" || viewParam === "table" ? viewParam : readStoredView();
  const PAGE_SIZE = view === "grid" ? GRID_PAGE_SIZE : TABLE_PAGE_SIZE;
  const changeView = (mode: ProductViewMode) => {
    storeView(mode);
    setPage(0);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("view", mode);
      return next;
    });
  };
  const filters: ProductFilters = {
    brandId: getNumberParam(searchParams, "brandId"),
    subCategoryId: getNumberParam(searchParams, "subCategoryId"),
    minPrice: getNumberParam(searchParams, "minPrice"),
    maxPrice: getNumberParam(searchParams, "maxPrice"),
    minRating: getNumberParam(searchParams, "minRating"),
  };
  const statusParam = searchParams.get("status");
  const status: CatalogStatus | "ALL" = statusParam === "ARCHIVED" || statusParam === "ALL" ? statusParam : "ACTIVE";
  const [actionError, setActionError] = useState("");
  const productsQuery = useProducts({ page, size: PAGE_SIZE, title: urlTitle || undefined, status, ...filters });
  const statsQuery = useProductStats();
  const brandsQuery = useBrands();
  const subCategoriesQuery = useSubCategories();
  const archiveMutation = useArchiveProduct();
  const products = useMemo(() => (productsQuery.data?.content ?? []).map(toUiProduct), [productsQuery.data]);
  const totalElements = productsQuery.data?.page.totalElements ?? 0;
  const totalPages = productsQuery.data?.page.totalPages ?? 0;
  const loading = productsQuery.isLoading;
  const error =
    actionError ||
    (productsQuery.error ? getApiErrorMessage(productsQuery.error) : "") ||
    (brandsQuery.error ? getApiErrorMessage(brandsQuery.error) : "") ||
    (subCategoriesQuery.error ? getApiErrorMessage(subCategoriesQuery.error) : "");
  const brandOptions = (brandsQuery.data ?? []).map((brand) => ({ value: String(brand.id), label: brand.name }));
  const subCategoryOptions = (subCategoriesQuery.data ?? []).map((subCategory) => ({
    value: String(subCategory.id),
    label: subCategory.name,
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const title = search.trim();
      if (title === urlTitle) return;
      setPage(0);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (title) next.set("title", title);
        else next.delete("title");
        return next;
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, urlTitle, setSearchParams]);

  useEffect(() => {
    setSearch(urlTitle);
    setPage(0);
  }, [urlTitle]);

  const toggleProduct = (id: string) => setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const toggleAll = () => setSelectedIds((current) => (current.length === products.length ? [] : products.map((product) => product.id)));

  const handleAction = async (action: ProductAction, product: Product) => {
    if (action === "view" || action === "edit") {
      navigate(`/catalog/products/${product.id}`);
      return;
    }
    const restore = action === "restore";
    if (!restore && !window.confirm(`Archive "${product.name}"? It disappears from the shop; orders, returns and stock history are kept and you can restore it any time.`)) return;
    setActionError("");
    try {
      await archiveMutation.mutateAsync({ id: Number(product.id), restore });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const changeStatus = (next: CatalogStatus | "ALL") => {
    setPage(0);
    setSelectedIds([]);
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      if (next === "ACTIVE") params.delete("status");
      else params.set("status", next);
      return params;
    });
  };
  const tabClass = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`;

  const stats = statsQuery.data;

  return (
    <>
      <PageMeta title="Products | E-Commerce Admin" description="Manage products, variants, pricing, images and inventory." />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div><div className="mb-3 flex items-center gap-2 text-sm text-slate-500"><Link to="/" className="hover:text-blue-600">Dashboard</Link><span>/</span><span className="font-medium text-slate-700">Catalog / Products</span></div><h1 className="text-3xl font-semibold tracking-tight text-slate-900">Products</h1><p className="mt-1 text-sm text-slate-500">Manage your products, variants, pricing, images and inventory.</p></div>
          <button type="button" onClick={() => navigate("/catalog/products/new")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Product</button>
        </div>
        <div className="space-y-5">
          <ProductStats
            total={stats?.totalProducts ?? 0}
            active={stats?.activeProducts ?? 0}
            activePercent={stats?.activeProductsPercent ?? 0}
            newThisMonth={stats?.newThisMonth ?? 0}
            lowStock={stats?.lowStock ?? 0}
            outOfStock={stats?.outOfStock ?? 0}
            loading={statsQuery.isLoading}
          />
          <ProductToolbar
            search={search}
            onSearchChange={setSearch}
            selectedCount={selectedIds.length}
            filters={filters}
            onFiltersChange={(nextFilters) => {
              setPage(0);
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                const values: ProductFilters = nextFilters;
                for (const key of Object.keys(values) as (keyof ProductFilters)[]) {
                  const value = values[key];
                  if (value === undefined) next.delete(key);
                  else next.set(key, String(value));
                }
                return next;
              });
            }}
            brands={brandOptions}
            subCategories={subCategoryOptions}
            onReset={() => {
              setSearch("");
              setSearchParams(status === "ACTIVE" ? { view } : { view, status });
              setPage(0);
              setSelectedIds([]);
            }}
          />
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <nav aria-label="Filter by status" className="flex gap-1">
            <button type="button" onClick={() => changeStatus("ACTIVE")} className={tabClass(status === "ACTIVE")}>Active {stats && <span className="text-xs opacity-75">{stats.totalProducts}</span>}</button>
            <button type="button" onClick={() => changeStatus("ARCHIVED")} className={tabClass(status === "ARCHIVED")}>Archived {stats && <span className="text-xs opacity-75">{stats.archivedProducts}</span>}</button>
            <button type="button" onClick={() => changeStatus("ALL")} className={tabClass(status === "ALL")}>All</button>
          </nav>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {loading ? "Loading products…" : `${totalElements.toLocaleString()} product${totalElements === 1 ? "" : "s"}`}
            </p>
            <ProductViewToggle value={view} onChange={changeView} />
          </div>
          {loading ? (
            view === "grid" ? <ProductGridSkeleton /> : <ProductLoadingState />
          ) : products.length > 0 ? (
            <FadeIn className={productsQuery.isPlaceholderData ? "pointer-events-none opacity-60" : undefined}>
              {view === "grid" ? (
                <ProductGrid products={products} selectedIds={selectedIds} onToggle={toggleProduct} onAction={handleAction} />
              ) : (
                <ProductsTable products={products} selectedIds={selectedIds} onToggle={toggleProduct} onToggleAll={toggleAll} onAction={handleAction} />
              )}
            </FadeIn>
          ) : (
            <ProductEmptyState onAdd={() => navigate("/catalog/products/new")} />
          )}
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>Showing {products.length === 0 ? 0 : page * PAGE_SIZE + 1}–{page * PAGE_SIZE + products.length} of {totalElements} products</p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">‹ Previous</button>
              <span className="px-2 text-xs">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
              <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next ›</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
