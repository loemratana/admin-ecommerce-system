import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Star, Trash2, UploadCloud } from "lucide-react";
import type { ProductImage, ProductVariant } from "@/features/products/types/product-editor.types";
import { uploadImage } from "@/lib/api/uploads";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "react-router";

// Backend multipart limit is 10MB (spring.servlet.multipart.max-file-size).
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export type BasicInfoValues = {
  name: string;
  slug: string;
  description: string;
  subCategoryId: string;
  brandId: string;
};

type Option = { value: string; label: string };

type BasicInfoProps = {
  values: BasicInfoValues;
  subCategories: Option[];
  brands: Option[];
  onChange: (field: keyof BasicInfoValues, value: string) => void;
};

export function BasicInformation({ values, subCategories, brands, onChange }: BasicInfoProps) {
  const input = (label: string, field: "name" | "slug", placeholder: string) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input value={values[field]} onChange={(event) => onChange(field, event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
    </label>
  );

  const select = (label: string, field: "subCategoryId" | "brandId", options: Option[], placeholder: string) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <select value={values[field]} onChange={(event) => onChange(field, event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <h2 className="text-base font-semibold text-slate-900">Basic Information</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {input("Product Name", "name", "Enter product name")}
        {input("Slug", "slug", "nike-air-max")}
        <p className="-mt-2 text-xs text-slate-400 md:col-start-2">Used for the product URL.</p>
        {select("Subcategory", "subCategoryId", subCategories, "Select subcategory")}
        {select("Brand", "brandId", brands, "Select brand (optional)")}
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
          <textarea value={values.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Describe the product..." rows={4} className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
      </div>
    </section>
  );
}

type ImagesProps = {
  images: ProductImage[];
  imageCover: string;
  onImageCoverChange: (url: string) => void;
  onAdd: (url: string) => void;
  onDelete: (id: string) => void;
  /** Distinct variant colors an image can be tagged with. */
  colors: string[];
  onColorChange: (id: string, color: string) => void;
  /** Lets the page block saving while uploads are in flight. */
  onUploadingChange?: (uploading: boolean) => void;
};

export function ProductImages({ images, imageCover, onImageCoverChange, onAdd, onDelete, colors, onColorChange, onUploadingChange }: ImagesProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const uploading = uploadingCount > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevCount = useRef(images.length);

  // Jump to the newest image after an add; keep the index in range after a delete.
  useEffect(() => {
    if (images.length > prevCount.current) setActiveIndex(images.length - 1);
    else if (activeIndex >= images.length) setActiveIndex(Math.max(0, images.length - 1));
    prevCount.current = images.length;
  }, [images.length, activeIndex]);

  const active = images[activeIndex];
  const go = (step: number) => setActiveIndex((index) => (index + step + images.length) % images.length);

  useEffect(() => onUploadingChange?.(uploading), [uploading, onUploadingChange]);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError("");

    const all = Array.from(files);
    const valid = all.filter((file) => ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_IMAGE_BYTES);
    const rejected = all.length - valid.length;
    const problems: string[] = [];
    if (rejected > 0) problems.push(`${rejected} file${rejected === 1 ? "" : "s"} skipped (must be PNG, JPG, WEBP or GIF, max 10MB)`);

    if (valid.length > 0) {
      setUploadingCount((count) => count + valid.length);
      // Upload first so only the hosted URL (not a huge base64 data URL) is sent with the product.
      // Uploads run in parallel; one failure doesn't stop the others.
      const results = await Promise.allSettled(
        valid.map(async (file) => {
          try {
            const { data } = await uploadImage(file, "products");
            onAdd(data.url);
          } finally {
            setUploadingCount((count) => count - 1);
          }
        }),
      );
      const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      if (failed.length > 0) problems.push(`${failed.length} upload${failed.length === 1 ? "" : "s"} failed: ${getApiErrorMessage(failed[0].reason)}`);
    }

    if (problems.length > 0) setUploadError(problems.join(" · "));
  };

  const remove = (image: ProductImage) => {
    if (image.url === imageCover) onImageCoverChange(images.find((item) => item.id !== image.id)?.url ?? "");
    onDelete(image.id);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <h2 className="text-base font-semibold text-slate-900">Product Images</h2>
      <p className="mt-1 text-sm text-slate-500">Upload product images. Tap a thumbnail to preview it; the starred image is the cover. Tag an image with a color to show it only when customers pick that color.</p>

      {active && (
        <div className="mt-5">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img src={active.url} alt={`Product image ${activeIndex + 1}`} className="aspect-[4/3] w-full object-contain" onError={(event) => { (event.target as HTMLImageElement).style.opacity = "0.3"; }} />
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} title="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-slate-700 shadow hover:bg-white"><ChevronLeft className="h-5 w-5" /></button>
                <button type="button" onClick={() => go(1)} title="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-slate-700 shadow hover:bg-white"><ChevronRight className="h-5 w-5" /></button>
              </>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-white">{activeIndex + 1} / {images.length}</span>
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button type="button" onClick={() => onImageCoverChange(active.url)} disabled={active.url === imageCover} className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-white disabled:bg-amber-400 disabled:text-white">
                <Star className="h-3.5 w-3.5" /> {active.url === imageCover ? "Cover" : "Set as cover"}
              </button>
              <button type="button" onClick={() => remove(active)} title="Remove image" className="rounded-full bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-700">Shown for color</span>
            <select
              value={colors.find((color) => color.toLowerCase() === active.color.trim().toLowerCase()) ?? active.color}
              onChange={(event) => onColorChange(active.id, event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All colors</option>
              {colors.map((color) => <option key={color} value={color}>{color}</option>)}
              {active.color && !colors.some((color) => color.toLowerCase() === active.color.trim().toLowerCase()) && (
                <option value={active.color}>{active.color} (no variant)</option>
              )}
            </select>
            {colors.length === 0 && <span className="text-xs text-slate-400">Add variant colors to tag images.</span>}
          </label>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${index === activeIndex ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 opacity-70 hover:opacity-100"}`}
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
                {image.url === imageCover && <Star className="absolute right-0.5 top-0.5 h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                {image.color && <span className="absolute inset-x-0 bottom-0 truncate bg-slate-900/70 px-1 text-[10px] font-medium text-white">{image.color}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"}`}
      >
        {uploading ? <Spinner size="lg" className="text-blue-600" /> : <UploadCloud className="h-7 w-7 text-slate-400" />}
        <p className="mt-2 text-sm font-medium text-slate-700">
          {uploading ? `Uploading ${uploadingCount} image${uploadingCount === 1 ? "" : "s"}...` : "Click to upload or drag and drop"}
        </p>
        <p className="text-xs text-slate-400">PNG, JPG, WEBP or GIF - multiple files allowed, max 10MB each</p>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(",")} multiple hidden onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
      </div>
      {uploadError && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{uploadError}</p>}
    </section>
  );
}

type VariantsProps = {
  variants: ProductVariant[];
  sizes: (Option & { active: boolean })[];
  onAdd: () => void;
  onChange: (id: string, field: keyof ProductVariant, value: string | number) => void;
  onDelete: (id: string) => void;
};

export function ProductVariants({ variants, sizes, onAdd, onChange, onDelete }: VariantsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Product Variants</h2>
          <p className="mt-1 text-sm text-slate-500">Each row is a unique SKU. Set opening stock for new rows; after saving, change stock from the inventory page. Manage the size list under Catalog → Sizes.</p>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-[820px] w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>{["Color", "Size", "SKU", "Price", "Price After Discount", "Stock", ""].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variants.map((variant) => (
              <tr key={variant.id}>
                <td className="px-2 py-2"><input value={variant.color} onChange={(event) => onChange(variant.id, "color", event.target.value)} className="h-8 w-full min-w-[90px] rounded border border-slate-200 px-2 text-xs outline-none focus:border-blue-500" /></td>
                <td className="px-2 py-2">
                  <select value={variant.sizeId} onChange={(event) => onChange(variant.id, "sizeId", event.target.value)} className="h-8 w-full min-w-[100px] rounded border border-slate-200 bg-white px-1.5 text-xs outline-none focus:border-blue-500">
                    <option value="">No size</option>
                    {sizes.map((size) => (
                      // Inactive sizes stay visible on variants that already use them, but can't be newly picked.
                      <option key={size.value} value={size.value} disabled={!size.active && size.value !== variant.sizeId}>
                        {size.label}{size.active ? "" : " (inactive)"}
                      </option>
                    ))}
                  </select>
                </td>
                {(["sku", "price", "priceAfterDiscount"] as const).map((field) => (
                  <td key={field} className="px-2 py-2">
                    <input type={field === "sku" ? "text" : "number"} value={variant[field]} onChange={(event) => onChange(variant.id, field, field === "sku" ? event.target.value : Number(event.target.value))} className="h-8 w-full min-w-[90px] rounded border border-slate-200 px-2 text-xs outline-none focus:border-blue-500" />
                  </td>
                ))}
                <td className="px-2 py-2">
                  {variant.serverId ? (
                    // Saved variant: stock moves only through logged inventory actions.
                    <div className="min-w-[110px] leading-tight">
                      <p className="font-semibold text-slate-700">{variant.availableQuantity ?? 0} available</p>
                      <p className="text-slate-400">{variant.soldQuantity} sold · <Link to={`/catalog/inventory/${variant.serverId}`} className="text-blue-600 hover:underline">Manage</Link></p>
                    </div>
                  ) : (
                    <input type="number" min={0} value={variant.initialStock} onChange={(event) => onChange(variant.id, "initialStock", Math.max(0, Number(event.target.value)))} title="Opening stock" placeholder="Opening stock" className="h-8 w-full min-w-[90px] rounded border border-slate-200 px-2 text-xs outline-none focus:border-blue-500" />
                  )}
                </td>
                <td className="px-3 py-2"><button type="button" onClick={() => onDelete(variant.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={onAdd} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600"><Plus className="h-4 w-4" /> Add Variant</button>
    </section>
  );
}
