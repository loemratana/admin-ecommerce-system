import { useTablePagination } from "@/hooks/useTablePagination";
import TableActionMenu from "@/components/common/TableActionMenu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Coupon } from "@/features/coupons/types/coupon.types";
import { formatDate, formatDiscount, formatMinimum, formatUsage, getCouponStatus, statusClass } from "@/features/coupons/utils/coupon.format";

const PAGE_SIZE = 10;

type Props = {
  coupons: Coupon[];
  /** Changing this (e.g. the active search/filters) returns the table to page 1. */
  pageResetKey?: string;
  onEdit: (coupon: Coupon) => void;
  onToggleStatus: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
};

function Status({ coupon }: { coupon: Coupon }) {
  const status = getCouponStatus(coupon);
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[status]}`}>{status}</span>;
}

function Actions({ coupon, onEdit, onToggleStatus, onDelete }: Omit<Props, "coupons"> & { coupon: Coupon }) {
  return (
    <TableActionMenu ariaLabel={`Actions for ${coupon.code}`} widthClassName="w-44">
      <button onClick={() => onEdit(coupon)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">Edit Coupon</button>
      <button onClick={() => onToggleStatus(coupon)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">{coupon.active ? "Disable" : "Enable"}</button>
      <div className="my-1 border-t border-slate-100" />
      <button onClick={() => onDelete(coupon)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
    </TableActionMenu>
  );
}

export default function CouponsTable({ coupons, pageResetKey, onEdit, onToggleStatus, onDelete }: Props) {
  const [{ pageIndex: page }, setPagination] = useTablePagination(coupons.length, PAGE_SIZE, pageResetKey);
  const setPage = (update: (page: number) => number) => setPagination((current) => ({ ...current, pageIndex: update(current.pageIndex) }));

  const pageCount = Math.max(1, Math.ceil(coupons.length / PAGE_SIZE));
  const rows = coupons.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {["Code", "Discount", "Minimum order", "Usage", "Remaining", "Valid until", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 first:pl-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-4 pl-5 font-semibold tracking-wide text-slate-800">{coupon.code}</td>
                <td className="px-4 py-4 font-semibold text-slate-800">{formatDiscount(coupon)}</td>
                <td className="px-4 py-4 text-slate-600">{formatMinimum(coupon)}</td>
                <td className="px-4 py-4 text-slate-600">{formatUsage(coupon)}</td>
                <td className="px-4 py-4 text-slate-600">{coupon.remainingUses ?? "∞"}</td>
                <td className="px-4 py-4 text-xs text-slate-500">{formatDate(coupon.expiryDate)}</td>
                <td className="px-4 py-4"><Status coupon={coupon} /></td>
                <td className="px-4 py-4"><Actions coupon={coupon} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 lg:hidden">
        {rows.map((coupon) => (
          <article key={coupon.id} className="flex items-start justify-between p-4">
            <div>
              <p className="font-semibold text-slate-800">{coupon.code}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatDiscount(coupon)} off{coupon.minOrderAmount != null && ` · min. ${formatMinimum(coupon)}`}
              </p>
              <p className="mt-1 text-xs text-slate-400">{formatUsage(coupon)} used · until {formatDate(coupon.expiryDate)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Status coupon={coupon} />
              <Actions coupon={coupon} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
            </div>
          </article>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">Page {page + 1} of {pageCount} · {coupons.length} total</p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious disabled={page === 0} onClick={() => setPage((p) => p - 1)} />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink isActive>{page + 1}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
