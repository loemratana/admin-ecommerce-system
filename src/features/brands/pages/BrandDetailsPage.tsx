import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Check, Copy, ExternalLink, History, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useBrand, useDeleteBrand, useUpdateBrand } from "@/features/brands/hooks/useBrands";
import { brandSchema } from "@/features/brands/schemas/brand.schema";
import BrandDialog, { type BrandFormState } from "@/features/brands/components/BrandDialog";
import { useArchiveProduct, useProducts } from "@/features/products/hooks/useProducts";
import { toUiProduct } from "@/features/products/utils/product.mapper";
import { readStoredView, storeView } from "@/features/products/utils/product-view";
import ProductGrid, { ProductGridSkeleton } from "@/features/products/components/ProductGrid";
import ProductsTable from "@/features/products/components/ProductsTable";
import ProductViewToggle from "@/features/products/components/ProductViewToggle";
import { ProductLoadingState } from "@/features/products/components/ProductStates";
import type { Product, ProductAction, ProductViewMode } from "@/features/products/types/product-list.types";
import type { CatalogStatus } from "@/features/products/types/product.types";

const PAGE_SIZE = 12;

const STATUS_TABS: { value: CatalogStatus | "ALL"; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ALL", label: "All" },
];

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function BrandLogo({ name, image }: { name: string; image: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {image && !failed ? (
        <img src={image} alt={name} onError={() => setFailed(true)} className="h-full w-full object-contain p-2" />
      ) : (
        <span className="text-2xl font-bold text-blue-600">{initials(name)}</span>
      )}
    </div>
  );
}

function CopySlug({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(slug);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context); the slug is still selectable.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy slug"
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600 hover:bg-slate-100"
    >
      /{slug}
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
    </button>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-base font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-5">
        <Skeleton className="h-24 w-24 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </div>
  );
}

export default function BrandDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const brandId = Number(id);

  const { data: brand = null, isLoading: loading, error: loadFailure } = useBrand(brandId);
  const [actionError, setActionError] = useState("");

  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState<BrandFormState>({ name: "", slug: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();
  const archiveMutation = useArchiveProduct();

  // Brand's products, from the products API so we get price, stock and status.
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "ALL">("ACTIVE");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<ProductViewMode>(readStoredView);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTitle(search.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const productsQuery = useProducts({
    brandId,
    title: title || undefined,
    status,
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
  });
  const products = useMemo(() => (productsQuery.data?.content ?? []).map(toUiProduct), [productsQuery.data]);
  const totalElements = productsQuery.data?.page.totalElements ?? 0;
  const totalPages = productsQuery.data?.page.totalPages ?? 0;
  const productCount = brand?.products?.length ?? 0;

  const loadError =
    actionError ||
    (loadFailure ? getApiErrorMessage(loadFailure) : "") ||
    (productsQuery.error ? getApiErrorMessage(productsQuery.error) : "");

  const openEdit = () => {
    if (!brand) return;
    setFormError("");
    setForm({ name: brand.name, slug: brand.slug, image: brand.image ?? "" });
    setDialog(true);
  };

  const handleFormChange = (field: keyof BrandFormState, value: string) => {
    // Editing an existing brand: don't regenerate the slug from the name (same as BrandsPage)
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    const parsed = brandSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await updateMutation.mutateAsync({ id: brandId, payload: parsed.data });
      setDialog(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(brandId);
      navigate("/catalog/brands");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleProductAction = async (action: ProductAction, product: Product) => {
    if (action === "view" || action === "edit") {
      navigate(`/catalog/products/${product.id}`);
      return;
    }
    const restore = action === "restore";
    if (!restore && !window.confirm(`Archive "${product.name}"? It disappears from the shop; orders and stock history are kept.`)) return;
    setActionError("");
    try {
      await archiveMutation.mutateAsync({ id: Number(product.id), restore });
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  };

  const changeView = (mode: ProductViewMode) => {
    storeView(mode);
    setView(mode);
  };

  const addProduct = () => navigate(`/catalog/products/new?brandId=${brandId}`);
  const filtered = Boolean(title) || status !== "ACTIVE";

  return (
    <>
      <PageMeta title={brand ? `${brand.name} | Brands` : "Brand | E-Commerce Admin"} description="Brand details and products." />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <nav className="flex min-w-0 items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <Link to="/catalog/brands" className="hover:text-blue-600">Brands</Link>
            <span>/</span>
            <span className="truncate font-medium text-slate-700">{brand?.name ?? "…"}</span>
          </nav>
          <button type="button" onClick={() => navigate("/catalog/brands")} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {loadError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}

        {loading ? (
          <HeaderSkeleton />
        ) : brand ? (
          <FadeIn className="space-y-6">
            {/* Brand header */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
                <BrandLogo name={brand.name} image={brand.image} />
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{brand.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CopySlug slug={brand.slug} />
                    <span className="text-xs text-slate-400">ID #{brand.id}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/catalog/products?brandId=${brand.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <ExternalLink className="h-4 w-4" /> View in Products
                  </Link>
                  <button type="button" onClick={openEdit} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
              <div className="grid divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Stat icon={<Package className="h-5 w-5" />} label="Products" value={productCount.toLocaleString()} />
                <Stat icon={<CalendarDays className="h-5 w-5" />} label="Created" value={formatDate(brand.createdAt)} />
                <Stat icon={<History className="h-5 w-5" />} label="Last updated" value={formatDate(brand.updatedAt)} />
              </div>
            </section>

            {/* Products */}
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
                      aria-label="Search this brand's products"
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
                {productsQuery.isLoading ? (
                  view === "grid" ? <ProductGridSkeleton count={8} /> : <ProductLoadingState />
                ) : products.length > 0 ? (
                  <FadeIn className={productsQuery.isPlaceholderData ? "pointer-events-none opacity-60" : undefined}>
                    {view === "grid" ? (
                      <ProductGrid products={products} onAction={handleProductAction} />
                    ) : (
                      <ProductsTable products={products} selectedIds={[]} onToggle={() => {}} onToggleAll={() => {}} onAction={handleProductAction} />
                    )}
                  </FadeIn>
                ) : (
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-6 py-14 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Package className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-800">{filtered ? "No products match" : `No products for ${brand.name} yet`}</h3>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                      {filtered ? "Try a different search or status." : "Products you assign to this brand will show up here."}
                    </p>
                    {filtered ? (
                      <button type="button" onClick={() => { setSearch(""); setStatus("ACTIVE"); setPage(0); }} className="mt-4 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Clear filters
                      </button>
                    ) : (
                      <button type="button" onClick={addProduct} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Add product
                      </button>
                    )}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="mt-5 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
                    <p>
                      Showing {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + products.length} of {totalElements.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">‹ Previous</button>
                      <span className="px-2 text-xs">Page {page + 1} of {totalPages}</span>
                      <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Next ›</button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </FadeIn>
        ) : null}

        {dialog && (
          <BrandDialog mode="edit" form={form} saving={saving} error={formError} onChange={handleFormChange} onClose={() => setDialog(false)} onSubmit={save} />
        )}

        {confirmingDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-brand-title">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="delete-brand-title" className="text-lg font-semibold text-slate-900">Delete brand?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This permanently removes "{brand?.name}".
                    {productCount > 0 && ` ${productCount.toLocaleString()} product${productCount === 1 ? " is" : "s are"} assigned to it.`}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmingDelete(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="button" disabled={deleting} onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {deleting && <Spinner size="sm" />}
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
