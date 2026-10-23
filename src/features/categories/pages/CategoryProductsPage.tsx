import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, FolderTree, PackageSearch, Search, Settings2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useCategories, useCategoryDetail } from "@/features/categories/hooks/useCategories";
import { useArchiveProduct, useProducts } from "@/features/products/hooks/useProducts";
import ProductGrid, { ProductGridSkeleton } from "@/features/products/components/ProductGrid";
import ProductsTable from "@/features/products/components/ProductsTable";
import { ProductLoadingState } from "@/features/products/components/ProductStates";
import ProductViewToggle from "@/features/products/components/ProductViewToggle";
import { readStoredView, storeView } from "@/features/products/utils/product-view";
import { toUiProduct } from "@/features/products/utils/product.mapper";
import type { Product, ProductAction, ProductViewMode } from "@/features/products/types/product-list.types";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Newest first" },
  { value: "createdAt,asc", label: "Oldest first" },
  { value: "title,asc", label: "Name A–Z" },
  { value: "title,desc", label: "Name Z–A" },
  { value: "ratingsAverage,desc", label: "Top rated" },
  { value: "ratingsQuantity,desc", label: "Most reviewed" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "4", label: "4★ & up" },
  { value: "3", label: "3★ & up" },
  { value: "2", label: "2★ & up" },
];

function numberParam(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

// /catalog/browse picks the first category; /catalog/browse/:id shows that category's products.
export default function CategoryProductsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];
  const categoryId = id ? Number(id) : undefined;
  const detailQuery = useCategoryDetail(categoryId ?? Number.NaN);
  const category = detailQuery.data;

  const subCategoryId = numberParam(searchParams, "sub");
  const minRating = numberParam(searchParams, "rating");
  const sort = searchParams.get("sort") ?? SORT_OPTIONS[0].value;
  const urlTitle = searchParams.get("q") ?? "";
  const page = Math.max(0, (numberParam(searchParams, "page") ?? 1) - 1);
  const [search, setSearch] = useState(urlTitle);
  const [view, setView] = useState<ProductViewMode>(() => (searchParams.get("view") === "table" ? "table" : searchParams.get("view") === "grid" ? "grid" : readStoredView()));
  const [actionError, setActionError] = useState("");

  const productsQuery = useProducts({
    page,
    size: PAGE_SIZE,
    sort,
    title: urlTitle || undefined,
    minRating,
    // A selected sub-category narrows within the category; otherwise show the whole category.
    ...(subCategoryId !== undefined ? { subCategoryId } : { categoryId }),
  });
  const deleteMutation = useArchiveProduct();
  const products = useMemo(() => (productsQuery.data?.content ?? []).map(toUiProduct), [productsQuery.data]);
  const totalElements = productsQuery.data?.page.totalElements ?? 0;
  const totalPages = productsQuery.data?.page.totalPages ?? 0;

  const updateParams = (changes: Record<string, string | undefined>, resetPage = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (resetPage) next.delete("page");
      return next;
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() !== urlTitle) updateParams({ q: search.trim() || undefined });
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => setSearch(urlTitle), [urlTitle]);

  if (!id && categories.length > 0) return <Navigate to={`/catalog/browse/${categories[0].id}`} replace />;

  const changeView = (mode: ProductViewMode) => {
    setView(mode);
    storeView(mode);
    updateParams({ view: mode }, false);
  };

  const handleAction = async (action: ProductAction, product: Product) => {
    if (action === "view" || action === "edit") {
      navigate(`/catalog/products/${product.id}`);
      return;
    }
    const restore = action === "restore";
    if (!restore && !window.confirm(`Archive "${product.name}"? It disappears from the shop; orders and stock history are kept.`)) return;
    setActionError("");
    try {
      await deleteMutation.mutateAsync({ id: Number(product.id), restore });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const error =
    actionError ||
    (categoriesQuery.error ? getApiErrorMessage(categoriesQuery.error) : "") ||
    (detailQuery.error ? getApiErrorMessage(detailQuery.error) : "") ||
    (productsQuery.error ? getApiErrorMessage(productsQuery.error) : "");
  const activeSub = category?.subCategories.find((sub) => sub.id === subCategoryId);
  const hasFilters = Boolean(urlTitle || minRating !== undefined || subCategoryId !== undefined);

  const chipClass = (active: boolean) =>
    `inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition ${
      active ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
    }`;

  return (
    <>
      <PageMeta title={category ? `${category.name} products | E-Commerce Admin` : "Browse by category | E-Commerce Admin"} description="Browse products by category and sub-category." />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link to="/catalog/categories" className="hover:text-blue-600">Categories</Link>
          <span>/</span>
          <span className="font-medium text-slate-700">{category?.name ?? "Browse"}</span>
        </div>

        {/* Category switcher */}
        <nav aria-label="Categories" className="custom-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {categoriesQuery.isLoading
            ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />)
            : categories.map((item) => (
                <Link key={item.id} to={`/catalog/browse/${item.id}${view === "table" ? "?view=table" : ""}`} className={chipClass(item.id === categoryId)}>
                  {item.image && <img src={item.image} alt="" className="h-5 w-5 rounded-full object-cover" />}
                  {item.name}
                </Link>
              ))}
        </nav>

        {/* Category hero */}
        <section className="mb-5 flex flex-col gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:flex-row sm:items-center">
          {detailQuery.isLoading || !category ? (
            <>
              <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </>
          ) : (
            <>
              {category.image ? (
                <img src={category.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><FolderTree className="h-8 w-8" /></div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{category.name}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {category.subCategories.length} sub-categor{category.subCategories.length === 1 ? "y" : "ies"} · {productsQuery.isLoading ? "…" : totalElements.toLocaleString()} product{totalElements === 1 ? "" : "s"}
                  {activeSub ? ` in ${activeSub.name}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => navigate("/catalog/categories")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <ArrowLeft className="h-4 w-4" /> Categories
                </button>
                <Link to={`/catalog/categories/${category.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Settings2 className="h-4 w-4" /> Manage
                </Link>
              </div>
            </>
          )}
        </section>

        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          {/* Sub-category sidebar */}
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 lg:sticky lg:top-24">
            <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Sub-categories</h2>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
              <button
                type="button"
                onClick={() => updateParams({ sub: undefined })}
                className={`flex shrink-0 items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${subCategoryId === undefined ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                All {category?.name ?? "products"}
              </button>
              {detailQuery.isLoading && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="my-1 h-8 w-full" />)}
              {category?.subCategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => updateParams({ sub: String(sub.id) })}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${sub.id === subCategoryId ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <span className="truncate">{sub.name}</span>
                  {sub.productCount !== null && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{sub.productCount}</span>}
                </button>
              ))}
              {category && category.subCategories.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No sub-categories yet.</p>}
            </div>
          </aside>

          <section className="min-w-0 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40 md:flex-row md:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search in category</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search in ${activeSub?.name ?? category?.name ?? "category"}…`}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={minRating === undefined ? "" : String(minRating)} onValueChange={(value) => updateParams({ rating: value || undefined })} options={RATING_OPTIONS} placeholder="Any rating" className="min-w-32" />
                <Select value={sort} onValueChange={(value) => updateParams({ sort: value === SORT_OPTIONS[0].value ? undefined : value })} options={SORT_OPTIONS} placeholder="Sort" className="min-w-40" />
                <ProductViewToggle value={view} onChange={changeView} />
              </div>
            </div>

            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500">Filters:</span>
                {activeSub && <FilterPill label={activeSub.name} onClear={() => updateParams({ sub: undefined })} />}
                {urlTitle && <FilterPill label={`“${urlTitle}”`} onClear={() => { setSearch(""); updateParams({ q: undefined }); }} />}
                {minRating !== undefined && <FilterPill label={`${minRating}★ & up`} onClear={() => updateParams({ rating: undefined })} />}
                <button type="button" onClick={() => { setSearch(""); updateParams({ sub: undefined, q: undefined, rating: undefined }); }} className="font-medium text-blue-600 hover:text-blue-700">
                  Clear all
                </button>
              </div>
            )}

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            {productsQuery.isLoading || (!categoryId && categoriesQuery.isLoading) ? (
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
              <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm shadow-slate-200/40">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><PackageSearch className="h-6 w-6" /></div>
                <h2 className="mt-4 text-base font-semibold text-slate-800">{categories.length === 0 && !categoriesQuery.isLoading ? "No categories yet" : "No products here yet"}</h2>
                <p className="mt-1 text-sm text-slate-500">{hasFilters ? "Try clearing your filters." : "Products added to this category will show up here."}</p>
                <button type="button" onClick={() => navigate("/catalog/products/new")} className="mt-5 inline-flex h-9 items-center rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white hover:bg-blue-700">+ Add Product</button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
                <p>
                  Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + products.length} of {totalElements.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" disabled={page === 0} onClick={() => updateParams({ page: page <= 1 ? undefined : String(page) }, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </button>
                  <span className="px-2 text-xs">Page {page + 1} of {totalPages}</span>
                  <button type="button" disabled={page + 1 >= totalPages} onClick={() => updateParams({ page: String(page + 2) }, false)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function FilterPill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1 text-xs font-medium text-blue-700">
      {label}
      <button type="button" onClick={onClear} aria-label={`Remove ${label}`} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-blue-100">
        ×
      </button>
    </span>
  );
}
