import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, Check, Copy, ExternalLink, History, Package, Pencil, Trash2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useBrand, useDeleteBrand, useUpdateBrand } from "@/features/brands/hooks/useBrands";
import { brandSchema } from "@/features/brands/schemas/brand.schema";
import BrandDialog, { type BrandFormState } from "@/features/brands/components/BrandDialog";
import FilteredProductsPanel from "@/features/products/components/FilteredProductsPanel";

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
  const productCount = brand?.products?.length ?? 0;

  const loadError = actionError || (loadFailure ? getApiErrorMessage(loadFailure) : "");

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

            <FilteredProductsPanel filter={{ brandId }} ownerName={brand.name} ownerLabel="brand" addProductQuery={`brandId=${brandId}`} />
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
