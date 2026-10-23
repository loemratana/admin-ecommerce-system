import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import FadeIn from "@/components/common/FadeIn";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useDeleteSubCategory, useSubCategory, useUpdateSubCategory } from "@/features/sub-categories/hooks/useSubCategories";
import { subCategorySchema } from "@/features/sub-categories/schemas/sub-category.schema";
import SubCategoryProductsTable from "@/features/sub-categories/components/SubCategoryProductsTable";
import SubCategoryDialog, {
  type SubCategoryFormState,
} from "@/features/sub-categories/components/SubCategoryDialog";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function SubCategoryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const subCategoryId = Number(id);

  const { data: subCategory = null, isLoading: loading, error: loadFailure } = useSubCategory(subCategoryId);
  const { data: categories = [] } = useCategories();
  const [actionError, setActionError] = useState("");
  const loadError = actionError || (loadFailure ? getApiErrorMessage(loadFailure) : "");

  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState<SubCategoryFormState>({
    name: "",
    slug: "",
    categoryId: "",
    image: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateMutation = useUpdateSubCategory();
  const deleteMutation = useDeleteSubCategory();

  const openEdit = () => {
    if (!subCategory) return;
    setFormError("");
    setForm({
      name: subCategory.name,
      slug: subCategory.slug,
      categoryId: parentCategoryId != null ? String(parentCategoryId) : "",
      image: subCategory.image ?? "",
    });
    setDialog(true);
  };

  // Editing an existing sub-category: don't regenerate the slug from the name (same as SubCategoriesPage)
  const handleFormChange = (
    field: keyof SubCategoryFormState,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    const parsed = subCategorySchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await updateMutation.mutateAsync({ id: subCategoryId, payload: parsed.data });
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
      await deleteMutation.mutateAsync(subCategoryId);
      navigate("/catalog/sub-categories");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const products = subCategory?.products ?? [];
  // category.id can come back null; fall back to matching the categories list by slug or name.
  const parentCategoryId =
    subCategory?.category?.id ??
    categories.find(
      (category) =>
        category.slug === subCategory?.category?.slug ||
        category.name === subCategory?.category?.name,
    )?.id ??
    null;

  return (
    <>
      <PageMeta
        title={
          subCategory
            ? `${subCategory.name} | Sub-categories`
            : "Sub-category | E-Commerce Admin"
        }
        description="Manage a sub-category."
      />
      <main className="font-outfit min-h-screen pb-10">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link
                to="/catalog/sub-categories"
                className="hover:text-blue-600"
              >
                Catalog / Sub-categories
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-700">
                {subCategory?.name ?? "..."}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {subCategory?.name ?? "Sub-category"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View and manage this sub-category.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/catalog/sub-categories")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={openEdit}
              disabled={!subCategory}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={!subCategory}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {loading ? (
          <DetailSkeleton withImage={false} rows={5} />
        ) : subCategory ? (
          <FadeIn className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <section className="h-fit rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Sub-category Information</h2>
                <p className="mt-1 text-xs text-slate-500">Basic information about this sub-category.</p>
              </div>
              <div className="flex justify-center border-b border-slate-100 bg-slate-50 p-4">
                {subCategory.image ? (
                  <img src={subCategory.image} alt={subCategory.name} className="aspect-square w-40 rounded-lg object-cover" />
                ) : (
                  <div className="flex aspect-square w-40 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">No image</div>
                )}
              </div>
              <dl className="divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between gap-6 px-5 py-4">
                  <dt className="text-slate-400">Slug</dt>
                  <dd className="text-right font-semibold text-slate-700">{subCategory.slug}</dd>
                </div>
                <div className="flex items-center justify-between gap-6 px-5 py-4">
                  <dt className="text-slate-400">Parent Category</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {parentCategoryId != null ? (
                      <Link to={`/catalog/categories/${parentCategoryId}`} className="hover:text-blue-600">
                        {subCategory.category?.name}
                      </Link>
                    ) : (
                      subCategory.category?.name || "—"
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-6 px-5 py-4">
                  <dt className="text-slate-400">Products</dt>
                  <dd className="text-right font-semibold text-slate-700">{products.length}</dd>
                </div>
                {subCategory.createdAt && (
                  <div className="flex items-center justify-between gap-6 px-5 py-4">
                    <dt className="text-slate-400">Created</dt>
                    <dd className="text-right text-slate-700">{formatDate(subCategory.createdAt)}</dd>
                  </div>
                )}
                {subCategory.updatedAt && (
                  <div className="flex items-center justify-between gap-6 px-5 py-4">
                    <dt className="text-slate-400">Updated</dt>
                    <dd className="text-right text-slate-700">{formatDate(subCategory.updatedAt)}</dd>
                  </div>
                )}
              </dl>
            </section>

            <SubCategoryProductsTable products={products} />
          </FadeIn>
        ) : null}

        {dialog && (
          <SubCategoryDialog
            mode="edit"
            form={form}
            categories={categories}
            saving={saving}
            error={formError}
            onChange={handleFormChange}
            onClose={() => setDialog(false)}
            onSubmit={save}
          />
        )}

        {confirmingDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">
                Delete Sub-category?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This will permanently remove "{subCategory?.name}".
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
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
