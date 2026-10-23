import { Link } from "react-router";
import { Archive, ArchiveRestore, Eye, Pencil, Star } from "lucide-react";
import type { Product, ProductAction } from "@/features/products/types/product-list.types";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/features/products/utils/product.mapper";
import { formatMoney } from "@/lib/currency";

type ProductCardProps = {
  product: Product;
  selected?: boolean;
  onToggle?: (id: string) => void;
  onAction?: (action: ProductAction, product: Product) => void;
};

const MAX_SWATCHES = 5;

export default function ProductCard({ product, selected = false, onToggle, onAction }: ProductCardProps) {
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const extraColors = product.colorSwatches.length - MAX_SWATCHES;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Link to={`/catalog/products/${product.id}`} aria-label={product.name}>
          <img
            src={product.image}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(event) => {
              if (!event.currentTarget.src.endsWith(PRODUCT_PLACEHOLDER_IMAGE)) event.currentTarget.src = PRODUCT_PLACEHOLDER_IMAGE;
            }}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>

        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">-{discount}%</span>
        )}

        {onToggle && (
          <label className={`absolute right-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-white/90 shadow-sm transition ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(product.id)}
              aria-label={`Select ${product.name}`}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        )}

        {onAction && (
          <div className="absolute inset-x-3 bottom-3 flex translate-y-2 justify-center gap-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
            {([["view", "View", Eye], ["edit", "Edit", Pencil]] as const).map(([action, label, Icon]) => (
              <button
                key={action}
                type="button"
                onClick={() => onAction(action, product)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/95 px-3 text-xs font-semibold text-slate-700 shadow-sm hover:text-blue-600"
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
            {product.status === "Archived" ? (
              <button
                type="button"
                onClick={() => onAction("restore", product)}
                aria-label={`Restore ${product.name}`}
                title="Restore"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-green-700 shadow-sm hover:bg-green-50"
              >
                <ArchiveRestore className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onAction("archive", product)}
                aria-label={`Archive ${product.name}`}
                title="Archive"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-red-600 shadow-sm hover:bg-red-50"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">
          {product.brand !== "—" ? product.brand : product.category}
        </p>
        <Link to={`/catalog/products/${product.id}`} className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800 hover:text-blue-600">
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Star className={`h-3.5 w-3.5 ${product.rating > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          <span className="font-medium text-slate-700">{product.rating > 0 ? product.rating.toFixed(1) : "—"}</span>
          <span>({product.ratingCount})</span>
          <span className="ml-auto truncate">{product.category}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-base font-bold text-slate-900">
              {product.price > 0 ? formatMoney(product.price) : "—"}
            </p>
            {product.originalPrice && <p className="text-xs text-slate-400 line-through">{formatMoney(product.originalPrice)}</p>}
          </div>
          {product.colorSwatches.length > 0 ? (
            <div className="flex items-center gap-1" aria-label={`${product.colorSwatches.length} colors`}>
              {product.colorSwatches.slice(0, MAX_SWATCHES).map((color) => (
                <span key={color} title={color} className="h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: color }} />
              ))}
              {extraColors > 0 && <span className="text-xs text-slate-400">+{extraColors}</span>}
            </div>
          ) : (
            <span className="text-xs text-slate-400">{product.variants} variants</span>
          )}
        </div>
      </div>
    </article>
  );
}
