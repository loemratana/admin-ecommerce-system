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
import type { Category } from "@/features/categories/types/category.types";
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

type CategoriesTableProps = {
  /** Changing this (e.g. the active search/filters) returns the table to page 1. */
  pageResetKey?: string;
  categories: Category[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  /** Selects or deselects only the rows on the current page. */
  onToggleSelectAll: (pageIds: number[], allSelected: boolean) => void;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />;
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
}

function Actions({ category, onView, onEdit, onDelete }: Omit<CategoriesTableProps, "categories" | "selectedIds" | "onToggleSelect" | "onToggleSelectAll"> & { category: Category }) {
  return (
    <TableActionMenu ariaLabel={`Actions for ${category.name}`} widthClassName="w-40">
      <button onClick={() => onView(category)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">View</button>
      <button onClick={() => onEdit(category)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">Edit</button>
      <div className="my-1 border-t border-slate-100" />
      <button onClick={() => onDelete(category)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
    </TableActionMenu>
  );
}

export default function CategoriesTable({ categories, pageResetKey, selectedIds, onToggleSelect, onToggleSelectAll, onView, onEdit, onDelete }: CategoriesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useTablePagination(categories.length, PAGE_SIZE, pageResetKey);

  const columns: ColumnDef<Category>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const pageIds = table.getRowModel().rows.map((row) => row.original.id);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
        return (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onToggleSelectAll(pageIds, allSelected)}
            aria-label="Select all categories on this page"
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
        );
      },
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
      header: "Category",
      cell: ({ row }) => (
        <button onClick={() => onView(row.original)} className="flex items-center gap-3 text-left">
          {row.original.image ? <img src={row.original.image} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-slate-100" />}
          <span>
            <strong className="block text-slate-800 hover:text-blue-600">{row.original.name}</strong>
            <small className="text-xs text-slate-400">Category</small>
          </span>
        </button>
      ),
    },
    { accessorKey: "slug", header: "Slug", cell: ({ row }) => <span className="text-slate-500">{row.original.slug}</span> },
    { accessorKey: "updatedAt", header: "Updated", cell: ({ row }) => <span className="text-xs text-slate-500">{row.original.updatedAt ?? "—"}</span> },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => <Actions category={row.original} onView={onView} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];

  const table = useReactTable({
    data: categories,
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
          const category = row.original;
          return (
            <article key={category.id} className="flex items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={selectedIds.includes(category.id)}
                onChange={() => onToggleSelect(category.id)}
                aria-label={`Select ${category.name}`}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
              />
              {category.image ? <img src={category.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="h-12 w-12 rounded-lg bg-slate-100" />}
              <button onClick={() => onView(category)} className="min-w-0 flex-1 text-left">
                <strong className="block truncate text-sm text-slate-800">{category.name}</strong>
                <span className="mt-1 block text-xs text-slate-500">{category.slug}</span>
              </button>
              <Actions category={category} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            </article>
          );
        })}
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Page {pagination.pageIndex + 1} of {table.getPageCount()} · {categories.length} total
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
