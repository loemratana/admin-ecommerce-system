import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductImage, ProductVariant } from "@/features/products/types/product-editor.types";
import { formatMoney } from "@/lib/currency";

type SummaryProps = { name: string; brand: string; subcategory: string; images: ProductImage[]; variants: ProductVariant[]; cover?: string };
export function ProductSummary({ name, brand, subcategory, images, variants, cover }: SummaryProps) {
  const prices = variants.map((variant) => Number(variant.priceAfterDiscount || variant.price)).filter((price) => price > 0);
  const soldTotal = variants.reduce((total, variant) => total + Number(variant.soldQuantity || 0), 0);
  // Cover first, then the rest of the gallery without duplicates.
  const urls = [...new Set([cover, ...images.map((image) => image.url)].filter((url): url is string => Boolean(url)))];
  const [selected, setSelected] = useState<string>();
  const activeIndex = Math.max(0, urls.indexOf(selected ?? ""));
  const shown = urls[activeIndex];
  const go = (step: number) => setSelected(urls[(activeIndex + step + urls.length) % urls.length]);

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <h2 className="text-base font-semibold text-slate-900">Product Preview</h2>
      <div className="relative mt-4 overflow-hidden rounded-lg bg-slate-100">
        <img src={shown || "/images/product/product-01.jpg"} alt="Product preview" className="aspect-[4/3] w-full object-cover" />
        {urls.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} title="Previous image" className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 text-slate-700 shadow hover:bg-white"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => go(1)} title="Next image" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 text-slate-700 shadow hover:bg-white"><ChevronRight className="h-4 w-4" /></button>
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-white">{activeIndex + 1} / {urls.length}</span>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {urls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelected(url)}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 transition ${index === activeIndex ? "border-blue-500" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{name || "Untitled product"}</h3>
      <p className="mt-1 text-sm text-slate-500">{brand || "No brand"}</p>
      <p className="mt-3 text-sm text-slate-500">{subcategory || "No subcategory"}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
        <div><dt className="text-slate-400">Variants</dt><dd className="mt-1 font-semibold text-slate-800">{variants.length}</dd></div>
        <div><dt className="text-slate-400">Images</dt><dd className="mt-1 font-semibold text-slate-800">{images.length}</dd></div>
        <div><dt className="text-slate-400">Price</dt><dd className="mt-1 font-semibold text-slate-800">{prices.length ? `From ${formatMoney(Math.min(...prices))}` : "Not set"}</dd></div>
        <div><dt className="text-slate-400">Sold</dt><dd className="mt-1 font-semibold text-slate-800">{soldTotal}</dd></div>
      </dl>
    </aside>
  );
}

export function ProductReview({ name, subcategory, brand, images, variants }: Omit<SummaryProps, "cover">) {
  const prices = variants.map((variant) => Number(variant.priceAfterDiscount || variant.price)).filter((price) => price > 0);
  const soldTotal = variants.reduce((total, variant) => total + Number(variant.soldQuantity || 0), 0);
  const rows = [
    ["Product", name || "Not set"],
    ["Subcategory", subcategory || "Not set"],
    ["Brand", brand || "Not set"],
    ["Images", `${images.length} images`],
    ["Variants", `${variants.length} variants`],
    ["Price", prices.length ? `${formatMoney(Math.min(...prices))} – ${formatMoney(Math.max(...prices))}` : "Not set"],
    ["Total Sold", String(soldTotal)],
  ];
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /><h2 className="text-base font-semibold text-slate-900">Review</h2></div>
      <div className="mt-4 divide-y divide-slate-100">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-medium text-slate-800">{value}</span></div>)}</div>
    </section>
  );
}

export function EditorSkeleton() {
  return <div className="animate-pulse space-y-5"><div className="h-36 rounded-xl bg-slate-200" /><div className="h-64 rounded-xl bg-slate-200" /><div className="h-96 rounded-xl bg-slate-200" /></div>;
}
