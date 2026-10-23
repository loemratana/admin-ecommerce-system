import { Archive, ArchiveRestore, Eye, Pencil } from "lucide-react";
import { Link } from "react-router";
import type { Product, ProductAction } from "@/features/products/types/product-list.types";
import TableActionMenu from "@/components/common/TableActionMenu";
import { formatMoney } from "@/lib/currency";

type ProductsTableProps = {
  products: Product[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onAction: (action: ProductAction, product: Product) => void;
};

const statusStyles: Record<Product["status"], string> = {
  Active: "bg-green-600 text-white ring-green-700/20",
  Archived: "bg-slate-200 text-slate-700 ring-slate-300",
  Draft: "bg-slate-500 text-white ring-slate-600/20",
  Inactive: "bg-slate-500 text-white ring-slate-600/20",
  "Out of Stock": "bg-red-600 text-white ring-red-700/20",
};

const stockStyles: Record<Product["stockStatus"], string> = {
  "In Stock": "text-green-600",
  "Low Stock": "text-amber-600",
  "Out of Stock": "text-red-600",
};

function StatusBadge({ status }: { status: Product["status"] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}>{status}</span>;
}

function StockValue({ product }: { product: Product }) {
  return (
    <div>
      <p className="font-semibold text-slate-800">{product.stock}</p>
      <p className={`mt-0.5 text-xs ${stockStyles[product.stockStatus]}`}><span aria-hidden="true">●</span> {product.stockStatus}</p>
      <p className="text-xs text-slate-400">{product.skus} SKUs</p>
    </div>
  );
}

function ActionMenu({ product, onAction }: { product: Product; onAction: ProductsTableProps["onAction"] }) {
  return (
    <TableActionMenu ariaLabel={`Actions for ${product.name}`}>
        {([["view", "View Product", Eye], ["edit", "Edit Product", Pencil]] as const).map(([action, label, Icon]) => <button key={action} type="button" onClick={() => onAction(action, product)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"><Icon className="h-3.5 w-3.5" />{label}</button>)}
        <div className="my-1 border-t border-slate-100" />
        {product.status === "Archived" ? (
          <button type="button" onClick={() => onAction("restore", product)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-green-700 hover:bg-green-50"><ArchiveRestore className="h-3.5 w-3.5" />Restore</button>
        ) : (
          <button type="button" onClick={() => onAction("archive", product)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"><Archive className="h-3.5 w-3.5" />Archive</button>
        )}
    </TableActionMenu>
  );
}

function ProductIdentity({ product }: { product: Product }) {
  return <div className="flex min-w-[220px] items-center gap-3"><img src={product.image} alt="" loading="lazy" decoding="async" className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200" /><div><Link to={`/catalog/products/${product.id}`} className="font-semibold text-slate-800 hover:text-blue-600">{product.name}</Link><p className="mt-0.5 text-xs text-slate-400">SKU: {product.sku}</p></div></div>;
}

export default function ProductsTable({ products, selectedIds, onToggle, onToggleAll, onAction }: ProductsTableProps) {
  const allSelected = products.length > 0 && products.every((product) => selectedIds.includes(product.id));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1060px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-5 py-3"><input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Select all products" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Brand</th><th className="px-3 py-3">Variants</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Updated</th><th className="w-16 px-3 py-3" /></tr></thead>
          <tbody className="divide-y divide-slate-100">{products.map((product) => <tr key={product.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => onToggle(product.id)} aria-label={`Select ${product.name}`} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></td><td className="px-3 py-4"><ProductIdentity product={product} /></td><td className="px-3 py-4 text-slate-600">{product.category}</td><td className="px-3 py-4 text-slate-600">{product.brand}</td><td className="px-3 py-4"><p className="font-medium text-slate-700">{product.variants} variants</p><p className="text-xs text-slate-400">{product.colors} colors · {product.sizes} sizes</p></td><td className="px-3 py-4"><p className="font-semibold text-slate-800">{product.originalPrice && <span className="mr-1 text-xs font-normal text-slate-400 line-through">{formatMoney(product.originalPrice)}</span>}{formatMoney(product.price)}</p><p className="text-xs text-slate-400">{product.originalPrice ? "Sale price" : "From"}</p></td><td className="px-3 py-4"><StockValue product={product} /></td><td className="px-3 py-4"><StatusBadge status={product.status} /></td><td className="px-3 py-4 whitespace-nowrap text-xs text-slate-500">{product.updated}</td><td className="px-3 py-4"><ActionMenu product={product} onAction={onAction} /></td></tr>)}</tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 lg:hidden">{products.map((product) => <article key={product.id} className="p-4"><div className="flex items-start justify-between gap-3"><ProductIdentity product={product} /><ActionMenu product={product} onAction={onAction} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-400">Price</p><p className="mt-1 font-semibold text-slate-800">From {formatMoney(product.price)}</p></div><div><p className="text-xs text-slate-400">Stock</p><StockValue product={product} /></div></div><div className="mt-4 flex items-center justify-between"><StatusBadge status={product.status} /><label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => onToggle(product.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600" /> Select</label></div></article>)}</div>
    </div>
  );
}
