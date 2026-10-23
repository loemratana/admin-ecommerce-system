import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, RotateCcw, Search, X } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import BulkActionBar from "@/components/common/BulkActionBar";
import { Spinner } from "@/components/ui/spinner";
import CategoriesTable from "@/features/categories/components/CategoriesTable";
import CategoryDialog, { type CategoryFormState } from "@/features/categories/components/CategoryDialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/features/categories/hooks/useCategories";
import { categorySchema } from "@/features/categories/schemas/category.schema";
import type { Category } from "@/features/categories/types/category.types";
import { slugify } from "@/lib/slugify";

const emptyForm: CategoryFormState = { name: "", slug: "", image: "" };

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { data: categories = [], isLoading: loading, error: loadFailure } = useCategories();
  const loadError = loadFailure ? getApiErrorMessage(loadFailure) : "";
  const [search, setSearch] = useState("");

  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(""), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const visible = useMemo(
    () => categories.filter((category) => `${category.name} ${category.slug}`.toLowerCase().includes(search.toLowerCase())),
    [categories, search],
  );

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setForm(emptyForm);
    setDialog("create");
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormError("");
    setForm({ name: category.name, slug: category.slug, image: category.image ?? "" });
    setDialog("edit");
  };

  const handleFormChange = (field: keyof CategoryFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && dialog === "create" ? { slug: slugify(value) } : {}),
    }));
  };

  const save = async () => {
    const parsed = categorySchema.safeParse(form);
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
        setBanner("Category updated.");
      } else {
        await createMutation.mutateAsync(payload);
        setBanner("Category created.");
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
      setSelectedIds((current) => current.filter((id) => id !== deleteTarget.id));
      setBanner("Category deleted.");
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

  const toggleSelectAll = (pageIds: number[], allSelected: boolean) => {
    setSelectedIds((current) =>
      allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds])),
    );
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSelectedIds([]);
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} categories? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      const ids = [...selectedIds];
      const results = await Promise.allSettled(ids.map((id) => deleteMutation.mutateAsync(id)));
      const failedIds = ids.filter((_, index) => results[index].status === "rejected");
      const deletedCount = ids.length - failedIds.length;

      if (failedIds.length === 0) {
        setBanner(`${deletedCount} categories deleted.`);
      } else {
        const firstError = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
        setBanner(`${deletedCount} deleted, ${failedIds.length} failed: ${getApiErrorMessage(firstError?.reason)}`);
      }
      // Keep only the failed ones selected so the user can see what's left
      setSelectedIds(failedIds);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <>
      <PageMeta title="Categories | E-Commerce Admin" description="Organize products into categories and subcategories." />
      <main className="font-outfit min-h-screen pb-10">
        <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/catalog/products" className="hover:text-blue-600">Catalog</Link>
              <span>/</span>
              <span className="font-medium text-slate-700">Categories</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Categories</h1>
            <p className="mt-1 text-sm text-slate-500">Organize your products into categories and subcategories.</p>
          </div>
          <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </header>

        {banner && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{banner}</div>}
        {loadError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>}

        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/30 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => handleSearchChange(event.target.value)} placeholder="Search categories..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <button onClick={() => handleSearchChange("")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {!loading && <BulkActionBar count={selectedIds.length} deleting={bulkDeleting} onDelete={bulkDelete} onClear={() => setSelectedIds([])} label="categories selected" />}

        {loading ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No categories found.</div>
        ) : (
          <FadeIn>
            <CategoriesTable
              pageResetKey={search}
              categories={visible}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onView={(category) => navigate(`/catalog/categories/${category.id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          </FadeIn>
        )}

        {dialog && (
          <CategoryDialog mode={dialog} form={form} saving={saving} error={formError} onChange={handleFormChange} onClose={() => setDialog(null)} onSubmit={save} />
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <div className="flex justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Delete Category?</h2>
                <button onClick={() => setDeleteTarget(null)} aria-label="Close"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">This will permanently remove "{deleteTarget.name}".</p>
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
