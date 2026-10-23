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
import type { ProductSize } from "@/features/sizes/types/size.types";
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

type Props = {
  /** Changing this (e.g. the active search/filters) returns the table to page 1. */
  pageResetKey?: string;
  sizes: ProductSize[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (size: ProductSize) => void;
  onToggleStatus: (size: ProductSize) => void;
  onDelete: (size: ProductSize) => void;
};

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />;
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
}

function Status({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-green-600 text-white" : "bg-slate-500 text-white"}`}>{active ? "Active" : "Inactive"}</span>;
}

function Actions({ size, onEdit, onToggleStatus, onDelete }: Omit<Props, "sizes" | "selectedIds" | "onToggleSelect" | "onToggleSelectAll"> & { size: ProductSize }) {
  return (
    <TableActionMenu ariaLabel={`Actions for ${size.name}`} widthClassName="w-44">
      <button onClick={() => onEdit(size)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">Edit</button>
      <button onClick={() => onToggleStatus(size)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">{size.active ? "Deactivate" : "Activate"}</button>
      <div className="my-1 border-t border-slate-100" />
      <button onClick={() => onDelete(size)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
    </TableActionMenu>
  );
}

export default function SizesTable({ sizes, pageResetKey, selectedIds, onToggleSelect, onToggleSelectAll, onEdit, onToggleStatus, onDelete }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useTablePagination(sizes.length, PAGE_SIZE, pageResetKey);

  const columns: ColumnDef<ProductSize>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={sizes.length > 0 && selectedIds.length === sizes.length}
          onChange={onToggleSelectAll}
          aria-label="Select all sizes"
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
      header: "Size",
      cell: ({ row }) => (
        <div>
          <strong className="text-slate-800">{row.original.name}</strong>
          {row.original.description && <p className="mt-0.5 text-xs text-slate-400">{row.original.description}</p>}
        </div>
      ),
    },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <span className="text-xs text-slate-500">{row.original.createdAt ?? "—"}</span> },
    { accessorKey: "active", header: "Status", cell: ({ row }) => <Status active={row.original.active} /> },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => <Actions size={row.original} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />,
    },
  ];

  const table = useReactTable({
    data: sizes,
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
        <table className="w-full min-w-[560px] text-left text-sm">
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
          const size = row.original;
          return (
            <article key={size.id} className="flex items-center gap-3 p-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(size.id)}
                onChange={() => onToggleSelect(size.id)}
                aria-label={`Select ${size.name}`}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">{size.name}</div>
              <div className="min-w-0 flex-1">
                <strong className="block text-sm text-slate-800">{size.name}</strong>
                {size.description && <span className="mt-1 block text-xs text-slate-500">{size.description}</span>}
              </div>
              <Status active={size.active} />
              <Actions size={size} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
            </article>
          );
        })}
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Page {pagination.pageIndex + 1} of {table.getPageCount()} · {sizes.length} total
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
