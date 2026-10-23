import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, RotateCcw, Search, X } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import BulkActionBar from "@/components/common/BulkActionBar";
import { Spinner } from "@/components/ui/spinner";
import BrandsTable from "@/features/brands/components/BrandsTable";
import BrandDialog, { type BrandFormState } from "@/features/brands/components/BrandDialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useBrands, useCreateBrand, useDeleteBrand, useUpdateBrand } from "@/features/brands/hooks/useBrands";
import { brandSchema } from "@/features/brands/schemas/brand.schema";
import type { Brand } from "@/features/brands/types/brand.types";
import { slugify } from "@/lib/slugify";
const emptyForm: BrandFormState = { name: "", slug: "", image: "" };

export default function BrandsPage() {
  const navigate = useNavigate();
  const { data: brands = [], isLoading: loading, error: loadFailure } = useBrands();
  const loadError = loadFailure ? getApiErrorMessage(loadFailure) : "";
  const [search, setSearch] = useState("");

  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(""), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const visible = useMemo(
    () => brands.filter((brand) => `${brand.name} ${brand.slug}`.toLowerCase().includes(search.toLowerCase())),
    [brands, search],
  );

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setForm(emptyForm);
    setDialog("create");
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setFormError("");
    setForm({ name: brand.name, slug: brand.slug, image: brand.image ?? "" });
    setDialog("edit");
  };

  const handleFormChange = (field: keyof BrandFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && dialog === "create" ? { slug: slugify(value) } : {}),
    }));
  };

  const save = async () => {
    const parsed = brandSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = parsed.data;
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        setBanner("Brand updated.");
      } else {
        await createMutation.mutateAsync(payload);
        setBanner("Brand created.");
      }
      setDialog(null);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setBanner("Brand deleted.");
      setDeleteTarget(null);
    } catch (error) {
      setBanner(getApiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => (current.length === visible.length ? [] : visible.map((brand) => brand.id)));
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      setBanner(`${selectedIds.length} brands deleted.`);
      setSelectedIds([]);
    } catch (error) {
      setBanner(getApiErrorMessage(error));
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <>
      <PageMeta title="Brands | E-Commerce Admin" description="Manage product brands." />
      <main className="font-outfit min-h-screen pb-10">
        <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/catalog/products" className="hover:text-blue-600">Catalog</Link>
              <span>/</span>
              <span className="font-medium text-slate-700">Brands</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Brands</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your product brands.</p>
          </div>
          <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Brand
          </button>
        </header>

        {banner && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{banner}</div>}
        {loadError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>}

        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/30 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brands..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <button onClick={() => setSearch("")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {!loading && <BulkActionBar count={selectedIds.length} deleting={bulkDeleting} onDelete={bulkDelete} onClear={() => setSelectedIds([])} label="brands selected" />}

        {loading ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No brands found.</div>
        ) : (
          <FadeIn>
            <BrandsTable
              pageResetKey={search}
              brands={visible}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onView={(brand) => navigate(`/catalog/brands/${brand.id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          </FadeIn>
        )}

        {dialog && (
          <BrandDialog mode={dialog} form={form} saving={saving} error={formError} onChange={handleFormChange} onClose={() => setDialog(null)} onSubmit={save} />
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <div className="flex justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Delete Brand?</h2>
                <button onClick={() => setDeleteTarget(null)} aria-label="Close"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">This will permanently remove "{deleteTarget.name}". Products assigned to it should be reassigned first.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                <button disabled={deleting} onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {deleting && <Spinner size="sm" />}
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
