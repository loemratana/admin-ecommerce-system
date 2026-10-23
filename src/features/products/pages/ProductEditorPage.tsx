import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import { Spinner } from "@/components/ui/spinner";
import {
  BasicInformation,
  ProductImages,
  ProductVariants,
  type BasicInfoValues,
} from "@/features/products/components/ProductEditor";
import {
  EditorSkeleton,
  ProductReview,
  ProductSummary,
} from "@/features/products/components/ProductEditorAside";
import type {
  ProductImage,
  ProductVariant,
} from "@/features/products/types/product-editor.types";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useSubCategories } from "@/features/sub-categories/hooks/useSubCategories";
import { useBrands } from "@/features/brands/hooks/useBrands";
import { useSizes } from "@/features/sizes/hooks/useSizes";
import {
  useProduct,
  useSaveProduct,
} from "@/features/products/hooks/useProducts";
import { productEditorSchema } from "@/features/products/schemas/product.schema";
import type { ProductRequest } from "@/features/products/types/product.types";
import { toast, Toaster } from "sonner";

const initialValues: BasicInfoValues = {
  name: "",
  slug: "",
  description: "",
  subCategoryId: "",
  brandId: "",
};
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
let uid = 0;
const nextId = () => `local-${Date.now()}-${uid++}`;

export default function ProductEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editMode = Boolean(id && id !== "new");
  const productId = editMode ? Number(id) : null;

  const subCategoriesQuery = useSubCategories();
  const brandsQuery = useBrands();
  const sizesQuery = useSizes();
  const productQuery = useProduct(productId);
  const saveMutation = useSaveProduct();
  const subCategoryOptions = useMemo(
    () =>
      (subCategoriesQuery.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    [subCategoriesQuery.data],
  );
  const brandOptions = useMemo(
    () =>
      (brandsQuery.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    [brandsQuery.data],
  );
  const sizeOptions = useMemo(
    () =>
      (sizesQuery.data ?? []).map((item) => ({
        value: String(item.id),
        label: item.name,
        active: item.active,
      })),
    [sizesQuery.data],
  );
  const loading =
    editMode &&
    (productQuery.isLoading ||
      subCategoriesQuery.isLoading ||
      brandsQuery.isLoading);
  const loadFailure =
    subCategoriesQuery.error ?? brandsQuery.error ?? productQuery.error;
  const [searchParams] = useSearchParams();
  // A new product can be pre-assigned to a brand, e.g. from the brand detail page (?brandId=5).
  const [values, setValues] = useState<BasicInfoValues>(() => ({ ...initialValues, brandId: editMode ? "" : searchParams.get("brandId") ?? "" }));
  const [imageCover, setImageCover] = useState("");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const product = productQuery.data;
  useEffect(() => {
    if (!product) return;
    setValues({
      name: product.title,
      slug: product.slug,
      description: product.description || "",
      subCategoryId: product.subCategory
        ? String(product.subCategory.subCategoryId)
        : "",
      brandId: product.brand ? String(product.brand.brandId) : "",
    });
    setImageCover(product.imageCover || "");
    setImages(
      (product.images ?? []).map((image) => ({
        id: nextId(),
        url: image.imageUrl,
        color: image.color ?? "",
        sortOrder: image.sortOrder ?? 0,
        serverId: image.id,
      })),
    );
    setVariants(
      (product.variants ?? []).map((variant) => ({
        id: nextId(),
        color: variant.color || "",
        sizeId: variant.size ? String(variant.size.id) : "",
        sku: variant.sku,
        price: variant.price,
        priceAfterDiscount: variant.priceAfterDiscount ?? 0,
        soldQuantity: variant.soldQuantity ?? 0,
        availableQuantity: variant.availableQuantity ?? 0,
        initialStock: 0,
        serverId: variant.id,
      })),
    );
  }, [product]);

  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty]);

  const updateValue = (field: keyof BasicInfoValues, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" && !editMode ? { slug: slugify(value) } : {}),
    }));
    setDirty(true);
  };

  const addImage = (url: string) => {
    setImages((current) => [
      ...current,
      { id: nextId(), url, color: "", sortOrder: current.length },
    ]);
    // Functional update: several uploads can finish in the same tick; the first one becomes the cover
    setImageCover((cover) => cover || url);
    setDirty(true);
  };

  const deleteImage = (imageId: string) => {
    setImages((current) => current.filter((image) => image.id !== imageId));
    setDirty(true);
  };

  const setImageColor = (imageId: string, color: string) => {
    setImages((current) =>
      current.map((image) => (image.id === imageId ? { ...image, color } : image)),
    );
    setDirty(true);
  };

  // Distinct variant colors, offered when tagging an image.
  const variantColors = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const variant of variants) {
      const color = variant.color.trim();
      if (color && !byKey.has(color.toLowerCase())) byKey.set(color.toLowerCase(), color);
    }
    return [...byKey.values()];
  }, [variants]);

  const addVariant = () => {
    setVariants((current) => [
      ...current,
      {
        id: nextId(),
        color: "",
        sizeId: "",
        sku: "",
        price: 0,
        priceAfterDiscount: 0,
        soldQuantity: 0,
        initialStock: 0,
      },
    ]);
    setDirty(true);
  };

  const updateVariant = (
    variantId: string,
    field: keyof ProductVariant,
    value: string | number,
  ) => {
    const previous = variants.find((variant) => variant.id === variantId);
    const next = variants.map((variant) =>
      variant.id === variantId ? { ...variant, [field]: value } : variant,
    );
    setVariants(next);
    // Renaming the last variant of a color carries its tagged images along to the new name.
    if (field === "color" && previous) {
      const oldKey = previous.color.trim().toLowerCase();
      const stillUsed = next.some((variant) => variant.color.trim().toLowerCase() === oldKey);
      if (oldKey && !stillUsed) {
        setImages((current) =>
          current.map((image) =>
            image.color.trim().toLowerCase() === oldKey ? { ...image, color: String(value).trim() } : image,
          ),
        );
      }
    }
    setDirty(true);
  };

  const deleteVariant = (variantId: string) => {
    setVariants((current) =>
      current.filter((variant) => variant.id !== variantId),
    );
    setDirty(true);
  };

  const brandLabel = useMemo(
    () =>
      brandOptions.find((option) => option.value === values.brandId)?.label ||
      "",
    [brandOptions, values.brandId],
  );
  const subCategoryLabel = useMemo(
    () =>
      subCategoryOptions.find((option) => option.value === values.subCategoryId)
        ?.label || "",
    [subCategoryOptions, values.subCategoryId],
  );

  const buildPayload = (): ProductRequest | null => {
    const parsed = productEditorSchema.safeParse({
      name: values.name,
      slug: values.slug,
      subCategoryId: values.subCategoryId,
      variants,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return null;
    }
    setError("");
    return {
      title: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description.trim() || undefined,
      imageCover: imageCover.trim() || undefined,
      subCategoryId: Number(values.subCategoryId),
      brandId: values.brandId ? Number(values.brandId) : undefined,
      variants: variants.map((variant) => ({
        id: variant.serverId,
        color: variant.color.trim() || undefined,
        sizeId: variant.sizeId ? Number(variant.sizeId) : undefined,
        sku: variant.sku.trim(),
        price: Number(variant.price),
        priceAfterDiscount: variant.priceAfterDiscount
          ? Number(variant.priceAfterDiscount)
          : undefined,
        // Existing variants' stock is changed on the inventory page, where every change is logged.
        initialStock: variant.serverId ? undefined : Number(variant.initialStock) || 0,
      })),
      images: images.map((image, index) => ({
        id: image.serverId,
        imageUrl: image.url,
        color: image.color.trim() || undefined,
        sortOrder: image.sortOrder ?? index,
      })),
    };
  };

  const save = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      const response = await saveMutation.mutateAsync({
        id: editMode ? productId : null,
        payload,
      });
      setDirty(false);

      const savedData = response.data;

      toast.success(
        editMode
          ? `Product ${savedData.title} updated successfully.`
          : `Product "${savedData.title}" created successfully.`,
        { duration: 3000 },
      );
      navigate(`/catalog/products/${response.data.id}`);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(getApiErrorMessage(err));
      toast.error("Failed to save product.", {
        description: message,
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const cover = imageCover || images[0]?.url;
  const confirmLeave = () => {
    if (
      !dirty ||
      window.confirm(
        "You have unsaved changes. Are you sure you want to leave?",
      )
    )
      navigate("/catalog/products");
  };

  if (loading) {
    return (
      <>
        <PageMeta
          title="Loading product | E-Commerce Admin"
          description="Loading product editor."
        />
        <main className="font-outfit min-h-screen pb-12">
          <EditorSkeleton />
        </main>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${editMode ? "Edit" : "Create"} Product | E-Commerce Admin`}
        description="Create and manage product information, images, variants and inventory."
      />
      <main className="font-outfit min-h-screen pb-12">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/catalog/products" className="hover:text-blue-600">
                Catalog / Products
              </Link>
              <span>/</span>
              <span className="font-medium text-slate-700">
                {editMode ? `${values.name} / Edit` : "Create Product"}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {editMode ? "Edit Product" : "Create Product"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {editMode
                ? "Update product information, images, variants and inventory."
                : "Add a new product with images, variants, pricing and inventory."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={confirmLeave}
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || uploadingImages}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving || uploadingImages ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
              {saving
                ? "Saving..."
                : uploadingImages
                  ? "Uploading images..."
                  : editMode
                  ? "Save Changes"
                  : "Create Product"}
            </button>
          </div>
        </div>
        {(error || loadFailure) && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || getApiErrorMessage(loadFailure)}
          </div>
        )}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <BasicInformation
              values={values}
              subCategories={subCategoryOptions}
              brands={brandOptions}
              onChange={updateValue}
            />
            <ProductImages
              images={images}
              imageCover={imageCover}
              onImageCoverChange={(url) => {
                setImageCover(url);
                setDirty(true);
              }}
              onAdd={addImage}
              onDelete={deleteImage}
              colors={variantColors}
              onColorChange={setImageColor}
              onUploadingChange={setUploadingImages}
            />
            <ProductVariants
              variants={variants}
              sizes={sizeOptions}
              onAdd={addVariant}
              onChange={updateVariant}
              onDelete={deleteVariant}
            />
            <ProductReview
              name={values.name}
              subcategory={subCategoryLabel}
              brand={brandLabel}
              images={images}
              variants={variants}
            />
          </div>
          <ProductSummary
            name={values.name}
            brand={brandLabel}
            subcategory={subCategoryLabel}
            images={images}
            variants={variants}
            cover={cover}
          />
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <ArrowLeft className="h-3.5 w-3.5" /> Changes are saved when you
          submit the product.
        </div>
      </main>

      <Outlet />

      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
