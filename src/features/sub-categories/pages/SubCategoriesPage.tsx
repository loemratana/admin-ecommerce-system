import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, RotateCcw, Search, X } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import BulkActionBar from "@/components/common/BulkActionBar";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreateSubCategory, useDeleteSubCategory, useSubCategories, useUpdateSubCategory } from "@/features/sub-categories/hooks/useSubCategories";
import { subCategorySchema } from "@/features/sub-categories/schemas/sub-category.schema";
import type { SubCategory } from "@/features/sub-categories/types/sub-category.types";
import SubCategoriesTable from "@/features/sub-categories/components/SubCategoriesTable";
import SubCategoryDialog, { type SubCategoryFormState } from "@/features/sub-categories/components/SubCategoryDialog";
import { slugify } from "@/lib/slugify";

const emptyForm: SubCategoryFormState = { name: "", slug: "", categoryId: "", image: "" };

export default function SubCategoriesPage() {
  const navigate = useNavigate();
  const { data: subCategories = [], isLoading: loading, error: loadFailure } = useSubCategories();
  const { data: categories = [] } = useCategories();
  const loadError = loadFailure ? getApiErrorMessage(loadFailure) : "";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<SubCategory | null>(null);
  const [form, setForm] = useState<SubCategoryFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<SubCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const createMutation = useCreateSubCategory();
  const updateMutation = useUpdateSubCategory();
  const deleteMutation = useDeleteSubCategory();

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(""), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const categoryOptions = useMemo(() => [{ value: "All", label: "All categories" }, ...categories.map((category) => ({ value: String(category.id), label: category.name }))], [categories]);

  const visible = useMemo(
    () =>
      subCategories.filter(
        (subCategory) =>
          (categoryFilter === "All" || String(subCategory.categoryId) === categoryFilter) &&
          `${subCategory.name} ${subCategory.slug}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [subCategories, search, categoryFilter],
  );

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setForm(emptyForm);
    setDialog("create");
  };

  const openEdit = (subCategory: SubCategory) => {
    setEditing(subCategory);
    setFormError("");
    setForm({ name: subCategory.name, slug: subCategory.slug, categoryId: String(subCategory.categoryId), image: subCategory.image ?? "" });
    setDialog("edit");
  };

  const handleFormChange = (field: keyof SubCategoryFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && dialog === "create" ? { slug: slugify(value) } : {}),
    }));
  };

  const save = async () => {
    const parsed = subCategorySchema.safeParse(form);
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
        setBanner("Sub-category updated.");
      } else {
        await createMutation.mutateAsync(payload);
        setBanner("Sub-category created.");
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
      setBanner("Sub-category deleted.");
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
    setSelectedIds((current) => (current.length === visible.length ? [] : visible.map((subCategory) => subCategory.id)));
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      setBanner(`${selectedIds.length} sub-categories deleted.`);
      setSelectedIds([]);
    } catch (error) {
      setBanner(getApiErrorMessage(error));
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <>
      <PageMeta title="Sub-categories | E-Commerce Admin" description="Manage sub-categories nested under catalog categories." />
      <main className="font-outfit min-h-screen pb-10">
        <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/catalog/products" className="hover:text-blue-600">Catalog</Link>
              <span>/</span>
              <span className="font-medium text-slate-700">Sub-categories</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sub-categories</h1>
            <p className="mt-1 text-sm text-slate-500">Create and organize sub-categories under each parent category.</p>
          </div>
          <button onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Sub-category
          </button>
        </header>

        {banner && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{banner}</div>}
        {loadError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>}

        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/30 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sub-categories..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter} options={categoryOptions} placeholder="All categories" className="md:w-56" />
          <button onClick={() => { setSearch(""); setCategoryFilter("All"); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {!loading && <BulkActionBar count={selectedIds.length} deleting={bulkDeleting} onDelete={bulkDelete} onClear={() => setSelectedIds([])} label="sub-categories selected" />}

        {loading ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No sub-categories found.</div>
        ) : (
          <FadeIn>
            <SubCategoriesTable
              pageResetKey={`${search}|${categoryFilter}`}
              subCategories={visible}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onView={(subCategory) => navigate(`/catalog/sub-categories/${subCategory.id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          </FadeIn>
        )}

        {dialog && (
          <SubCategoryDialog
            mode={dialog}
            form={form}
            categories={categories}
            saving={saving}
            error={formError}
            onChange={handleFormChange}
            onClose={() => setDialog(null)}
            onSubmit={save}
          />
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <div className="flex justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Delete Sub-category?</h2>
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
