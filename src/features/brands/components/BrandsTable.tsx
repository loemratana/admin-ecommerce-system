import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Brand } from "@/features/brands/types/brand.types";
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

const PAGE_SIZE = 10;

type BrandsTableProps = {
  /** Changing this (e.g. the active search/filters) returns the table to page 1. */
  pageResetKey?: string;
  brands: Brand[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onView: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
};

const FALLBACK_LOGO_COUNT = 15;

function fallbackLogo(id: number) {
  const index = (Math.abs(id) % FALLBACK_LOGO_COUNT) + 1;
  return `/images/brand/brand-${String(index).padStart(2, "0")}.svg`;
}

function BrandLogo({ brand, className }: { brand: Brand; className: string }) {
  if (brand.image) {
    return <img src={brand.image} alt="" className={`${className} object-cover`} />;
  }
  return (
    <span className={`${className} flex items-center justify-center bg-slate-50 p-1.5`}>
      <img src={fallbackLogo(brand.id)} alt="" className="h-full w-full object-contain" />
    </span>
  );
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />;
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
}

function Actions({ brand, onView, onEdit, onDelete }: Omit<BrandsTableProps, "brands" | "selectedIds" | "onToggleSelect" | "onToggleSelectAll"> & { brand: Brand }) {
  return (
    <TableActionMenu ariaLabel={`Actions for ${brand.name}`} widthClassName="w-40">
      <button onClick={() => onView(brand)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">View</button>
      <button onClick={() => onEdit(brand)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">Edit</button>
      <div className="my-1 border-t border-slate-100" />
      <button onClick={() => onDelete(brand)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
    </TableActionMenu>
  );
}

export default function BrandsTable({ brands, pageResetKey, selectedIds, onToggleSelect, onToggleSelectAll, onView, onEdit, onDelete }: BrandsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useTablePagination(brands.length, PAGE_SIZE, pageResetKey);

  const columns: ColumnDef<Brand>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={brands.length > 0 && selectedIds.length === brands.length}
          onChange={onToggleSelectAll}
          aria-label="Select all brands"
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={() => onToggleSelect(row.original.id)}
          aria-label={`Select ${row.original.name}`}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Brand",
      cell: ({ row }) => (
        <button onClick={() => onView(row.original)} className="flex items-center gap-3 text-left">
          <BrandLogo brand={row.original} className="h-11 w-11 shrink-0 rounded-lg" />
          <strong className="text-slate-800 hover:text-blue-600">{row.original.name}</strong>
        </button>
      ),
    },
    { accessorKey: "slug", header: "Slug", cell: ({ row }) => <span className="text-slate-500">{row.original.slug}</span> },
    { accessorKey: "updatedAt", header: "Updated", cell: ({ row }) => <span className="text-xs text-slate-500">{row.original.updatedAt ?? "—"}</span> },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => <Actions brand={row.original} onView={onView} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];

  const table = useReactTable({
    data: brands,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th key={header.id} className="px-4 py-3 first:pl-5">
                  {header.column.getCanSort() ? (
                    <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-slate-700">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon direction={header.column.getIsSorted()} />
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 first:pl-5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 md:hidden">
        {rows.map((row) => {
          const brand = row.original;
          return (
            <article key={brand.id} className="flex items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={selectedIds.includes(brand.id)}
                onChange={() => onToggleSelect(brand.id)}
                aria-label={`Select ${brand.name}`}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
              />
              <BrandLogo brand={brand} className="h-12 w-12 shrink-0 rounded-lg" />
              <button onClick={() => onView(brand)} className="min-w-0 flex-1 text-left">
                <strong className="block truncate text-sm text-slate-800">{brand.name}</strong>
                <span className="mt-1 block text-xs text-slate-500">{brand.slug}</span>
              </button>
              <Actions brand={brand} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            </article>
          );
        })}
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Page {pagination.pageIndex + 1} of {table.getPageCount()} · {brands.length} total
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink isActive>{pagination.pageIndex + 1}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
