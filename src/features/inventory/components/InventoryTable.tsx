import { Link } from "react-router";
import type { InventoryResponse, InventoryStatus } from "@/features/inventory/types/inventory.types";
import TableActionMenu from "@/components/common/TableActionMenu";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  formatPrice,
  formatRelative,
  productImage,
  variantLabel,
} from "@/features/inventory/utils/inventory.format";

type Props = {
  items: InventoryResponse[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onAdjust: (item: InventoryResponse) => void;
};

/** Route param for the detail page is the product variant id (that's what the API is keyed on). */
const variantId = (item: InventoryResponse) => item.variant?.id ?? item.id;

function Status({ status }: { status: InventoryStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

function Stock({ item }: { item: InventoryResponse }) {
  const width = Math.min(100, item.availableQuantity * 3);
  const bar = item.status === "OUT_OF_STOCK" ? "bg-red-400" : item.status === "LOW_STOCK" ? "bg-amber-400" : "bg-green-500";
  return (
    <div className="min-w-[110px]">
      <strong className="text-slate-800">{item.availableQuantity}</strong>
      <span className="ml-1 text-xs text-slate-400">available</span>
      {item.reservedQuantity > 0 && (
        <p className="text-[11px] text-slate-400">
          {item.quantity} on hand · {item.reservedQuantity} reserved
        </p>
      )}
      <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Actions({ item, onAdjust }: { item: InventoryResponse; onAdjust: Props["onAdjust"] }) {
  const linkClass = "block rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50";
  return (
    <TableActionMenu ariaLabel={`Actions for ${item.variant?.sku ?? item.id}`} widthClassName="w-48">
      {item.product && (
        <Link to={`/catalog/products/${item.product.id}`} className={linkClass}>
          View Product
        </Link>
      )}
      <Link to={`/catalog/inventory/${variantId(item)}`} className={linkClass}>
        View Stock History
      </Link>
      <button onClick={() => onAdjust(item)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">
        Adjust Stock
      </button>
    </TableActionMenu>
  );
}

export default function InventoryTable({ items, selectedIds, onToggle, onToggleAll, onAdjust }: Props) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-12 px-5 py-3">
                <input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Select all variants" />
              </th>
              <th className="px-3 py-3">Product / Variant</th>
              <th className="px-3 py-3">SKU</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Sold</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Updated</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggle(item.id)} aria-label={`Select ${item.variant?.sku}`} />
                </td>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <img src={productImage(item)} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    <div>
                      <Link to={`/catalog/inventory/${variantId(item)}`} className="font-semibold text-slate-800 hover:text-blue-600">
                        {item.product?.name ?? "Unknown product"}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">{variantLabel(item)}{item.variant?.status === "ARCHIVED" && <span className="ml-1.5 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">Archived</span>}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 font-mono text-xs text-slate-500">{item.variant?.sku ?? "—"}</td>
                <td className="px-3 py-4 font-semibold text-slate-700">{formatPrice(item.price)}</td>
                <td className="px-3 py-4"><Stock item={item} /></td>
                <td className="px-3 py-4 text-slate-600">{item.soldQuantity ?? 0}</td>
                <td className="px-3 py-4"><Status status={item.status} /></td>
                <td className="px-3 py-4 text-xs text-slate-500">{formatRelative(item.updatedAt)}</td>
                <td className="px-3 py-4"><Actions item={item} onAdjust={onAdjust} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 lg:hidden">
        {items.map((item) => (
          <article key={item.id} className="flex items-center gap-3 p-3">
            <img src={productImage(item)} alt="" className="h-11 w-11 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <Link to={`/catalog/inventory/${variantId(item)}`} className="block truncate text-sm font-semibold text-slate-800">
                {item.product?.name ?? "Unknown product"}
              </Link>
              <p className="mt-0.5 text-xs text-slate-500">
                {variantLabel(item)} · {item.variant?.sku}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <Stock item={item} />
                <Status status={item.status} />
              </div>
            </div>
            <button onClick={() => onAdjust(item)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
              Adjust
            </button>
            <Actions item={item} onAdjust={onAdjust} />
          </article>
        ))}
      </div>
    </div>
  );
}
