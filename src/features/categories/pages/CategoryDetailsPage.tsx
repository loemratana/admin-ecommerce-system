import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, ExternalLink, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useCategoryDetail, useDeleteCategory, useUpdateCategory } from "@/features/categories/hooks/useCategories";
import { categorySchema } from "@/features/categories/schemas/category.schema";
import CategoryDialog, { type CategoryFormState } from "@/features/categories/components/CategoryDialog";

export default function CategoryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const categoryId = Number(id);

  const { data: category = null, isLoading: loading, error: loadFailure } = useCategoryDetail(categoryId);
  const [actionError, setActionError] = useState("");
  const loadError = actionError || (loadFailure ? getApiErrorMessage(loadFailure) : "");

  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState<CategoryFormState>({ name: "", slug: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const openEdit = () => {
    if (!category) return;
    setFormError("");
    setForm({ name: category.name, slug: category.slug, image: category.image ?? "" });
    setDialog(true);
  };

  // Editing an existing category: don't regenerate the slug from the name (same as CategoriesPage)
  const handleFormChange = (field: keyof CategoryFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    const parsed = categorySchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await updateMutation.mutateAsync({ id: categoryId, payload: parsed.data });
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
      await deleteMutation.mutateAsync(categoryId);
      navigate("/catalog/categories");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageMeta title={category ? `${category.name} | Categories` : "Category | E-Commerce Admin"} description="Manage category and subcategories." />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/catalog/categories" className="hover:text-blue-600">Catalog / Categories</Link>
              <span>/</span>
              <span className="font-medium text-slate-700">{category?.name ?? "..."}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{category?.name ?? "Category"}</h1>
            <p className="mt-1 text-sm text-slate-500">View and manage this category.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/catalog/categories")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <Link to={`/catalog/browse/${categoryId}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <LayoutGrid className="h-4 w-4" /> Browse products
            </Link>
            <button onClick={openEdit} disabled={!category} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50">
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button onClick={() => setConfirmingDelete(true)} disabled={!category} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>

        {loadError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>}

        {loading ? (
          <DetailSkeleton withImage={false} rows={5} />
        ) : category ? (
          <FadeIn className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Sub-categories</h2>
                  <p className="mt-1 text-sm text-slate-500">Sub-categories under {category.name}.</p>
                </div>
                <Link to="/catalog/sub-categories" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  View All <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              {category.subCategories.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">No sub-categories yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-3">Sub-category</th>
                        <th className="px-3 py-3">Slug</th>
                        <th className="px-3 py-3">Products</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {category.subCategories.map((subCategory) => (
                        <tr key={subCategory.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-4">
                            <Link to={`/catalog/sub-categories/${subCategory.id}`} className="font-semibold text-slate-800 hover:text-blue-600">
                              {subCategory.name}
                            </Link>
                          </td>
                          <td className="px-3 py-4 text-slate-500">{subCategory.slug ?? "—"}</td>
                          <td className="px-3 py-4 text-slate-600">
                            <Link to={`/catalog/browse/${categoryId}?sub=${subCategory.id}`} className="hover:text-blue-600">
                              {subCategory.productCount ?? "—"}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
              <div className="flex justify-center rounded-lg bg-slate-50 p-4">
                {category.image ? <img src={category.image} alt={category.name} className="aspect-square w-full rounded-lg object-cover" /> : <div className="aspect-square w-full rounded-lg border border-dashed border-slate-300" />}
              </div>
              <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-3"><dt className="text-slate-400">Name</dt><dd className="font-semibold text-slate-700">{category.name}</dd></div>
                <div className="flex justify-between border-b border-slate-100 pb-3"><dt className="text-slate-400">Slug</dt><dd className="font-medium text-slate-700">{category.slug}</dd></div>
                {category.createdAt && <div className="flex justify-between border-b border-slate-100 pb-3"><dt className="text-slate-400">Created</dt><dd className="font-medium text-slate-700">{category.createdAt}</dd></div>}
                {category.updatedAt && <div className="flex justify-between"><dt className="text-slate-400">Updated</dt><dd className="font-medium text-slate-700">{category.updatedAt}</dd></div>}
              </dl>
            </section>
          </FadeIn>
        ) : null}

        {dialog && (
          <CategoryDialog mode="edit" form={form} saving={saving} error={formError} onChange={handleFormChange} onClose={() => setDialog(false)} onSubmit={save} />
        )}

        {confirmingDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">Delete Category?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">This will permanently remove "{category?.name}".</p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setConfirmingDelete(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                <button disabled={deleting} onClick={confirmDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{deleting && <Spinner size="sm" />}{deleting ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
