import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Package, Plus, RotateCcw, Search, X } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { TableSkeleton } from "@/components/common/Skeletons";
import BulkActionBar from "@/components/common/BulkActionBar";
import { Spinner } from "@/components/ui/spinner";
import SizeDialog, { type SizeFormState } from "@/features/sizes/components/SizeDialog";
import SizesTable from "@/features/sizes/components/SizesTable";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useCreateSize, useDeleteSize, useSizes, useToggleSizeStatus, useUpdateSize } from "@/features/sizes/hooks/useSizes";
import { sizeSchema } from "@/features/sizes/schemas/size.schema";
import type { ProductSize } from "@/features/sizes/types/size.types";

const emptyForm: SizeFormState = { name: "", description: "" };

export default function SizesPage() {
  const { data: sizes = [], isLoading: loading, error: loadFailure } = useSizes();
  const loadError = loadFailure ? getApiErrorMessage(loadFailure) : "";
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Name");

  const [dialog, setDialog] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ProductSize | null>(null);
  const [form, setForm] = useState<SizeFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ProductSize | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [banner, setBanner] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const createMutation = useCreateSize();
  const updateMutation = useUpdateSize();
  const deleteMutation = useDeleteSize();
  const toggleMutation = useToggleSizeStatus();

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(""), 4000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const visible = useMemo(
    () =>
      [...sizes]
        .filter((size) => size.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) =>
          sort === "Newest"
            ? (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
            : a.name.localeCompare(b.name, undefined, { numeric: true }),
        ),
    [sizes, search, sort],
  );

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setForm(emptyForm);
    setDialog("create");
  };

  const openEdit = (size: ProductSize) => {
    setEditing(size);
    setFormError("");
    setForm({ name: size.name, description: size.description });
    setDialog("edit");
  };

  const handleFormChange = (field: keyof SizeFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    const parsed = sizeSchema.safeParse(form);
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
        setBanner("Size updated.");
      } else {
        await createMutation.mutateAsync(payload);
        setBanner("Size created.");
      }
      setDialog(null);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (size: ProductSize) => {
    try {
      await toggleMutation.mutateAsync(size);
      setBanner(size.active ? "Size deactivated." : "Size activated.");
    } catch (error) {
      setBanner(getApiErrorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setBanner("Size deleted.");
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(getApiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => (current.length === visible.length ? [] : visible.map((size) => size.id)));
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      setBanner(`${selectedIds.length} sizes deleted.`);
      setSelectedIds([]);
    } catch (error) {
      setBanner(getApiErrorMessage(error));
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <>
      <PageMeta title="Sizes | E-Commerce Admin" description="Manage reusable product sizes used across product variants." />
      <main className="font-outfit min-h-screen pb-10">
        <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/catalog/products" className="hover:text-blue-600">Catalog</Link>
              <span>/</span>
              <span className="font-medium text-slate-700">Sizes</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sizes</h1>
            <p className="mt-1 text-sm text-slate-500">Manage reusable product sizes used across your product variants.</p>
          </div>
          <button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Size
          </button>
        </header>

        {banner && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">{banner}</div>}
        {loadError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>}

        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/30 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sizes..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option>Name</option>
            <option>Newest</option>
          </select>
          <button onClick={() => { setSearch(""); setSort("Name"); }} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-500 hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {!loading && visible.length > 0 && <BulkActionBar count={selectedIds.length} deleting={bulkDeleting} onDelete={bulkDelete} onClear={() => setSelectedIds([])} label="sizes selected" />}

        {loading ? (
          <TableSkeleton />
        ) : visible.length ? (
          <FadeIn>
            <SizesTable
              pageResetKey={`${search}|${sort}`}
              sizes={visible}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onEdit={openEdit}
              onToggleStatus={toggleStatus}
              onDelete={(size) => { setDeleteError(""); setDeleteTarget(size); }}
            />
          </FadeIn>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Package className="h-6 w-6" /></div>
            <h2 className="mt-4 text-base font-semibold text-slate-800">No sizes yet</h2>
            <p className="mt-1 text-sm text-slate-500">Create reusable sizes that can be assigned to product variants.</p>
            <button onClick={openCreate} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">+ Create Size</button>
          </div>
        )}

        {dialog && (
          <SizeDialog mode={dialog} form={form} saving={saving} error={formError} onChange={handleFormChange} onClose={() => setDialog(null)} onSubmit={save} />
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <div className="flex justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Delete Size?</h2>
                <button onClick={() => setDeleteTarget(null)} aria-label="Close"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">This will permanently remove "{deleteTarget.name}". Sizes still assigned to product variants can't be deleted.</p>
              {deleteError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>}
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
