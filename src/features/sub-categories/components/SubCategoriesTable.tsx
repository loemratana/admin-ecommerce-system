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
import type { SubCategory } from "@/features/sub-categories/types/sub-category.types";
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

type SubCategoriesTableProps = {
  /** Changing this (e.g. the active search/filters) returns the table to page 1. */
  pageResetKey?: string;
  subCategories: SubCategory[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onView: (subCategory: SubCategory) => void;
  onEdit: (subCategory: SubCategory) => void;
  onDelete: (subCategory: SubCategory) => void;
};

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />;
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
}

function Actions({ subCategory, onView, onEdit, onDelete }: Omit<SubCategoriesTableProps, "subCategories" | "selectedIds" | "onToggleSelect" | "onToggleSelectAll"> & { subCategory: SubCategory }) {
  return (
    <TableActionMenu ariaLabel={`Actions for ${subCategory.name}`} widthClassName="w-40">
      <button onClick={() => onView(subCategory)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">View</button>
      <button onClick={() => onEdit(subCategory)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50">Edit</button>
      <div className="my-1 border-t border-slate-100" />
      <button onClick={() => onDelete(subCategory)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
    </TableActionMenu>
  );
}

export default function SubCategoriesTable({ subCategories, pageResetKey, selectedIds, onToggleSelect, onToggleSelectAll, onView, onEdit, onDelete }: SubCategoriesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useTablePagination(subCategories.length, PAGE_SIZE, pageResetKey);

  const columns: ColumnDef<SubCategory>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={subCategories.length > 0 && selectedIds.length === subCategories.length}
          onChange={onToggleSelectAll}
          aria-label="Select all sub-categories"
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
      header: "Sub-category",
      cell: ({ row }) => (
        <button onClick={() => onView(row.original)} className="flex items-center gap-3 text-left font-semibold text-slate-800 hover:text-blue-600">
          {row.original.image ? <img src={row.original.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 shrink-0 rounded-lg bg-slate-100" />}
          {row.original.name}
        </button>
      ),
    },
    { accessorKey: "slug", header: "Slug", cell: ({ row }) => <span className="text-slate-500">{row.original.slug}</span> },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => <span className="text-slate-600">{row.original.categoryName ?? `#${row.original.categoryId}`}</span>,
    },
    {
      accessorKey: "productCount",
      header: "Products",
      cell: ({ row }) => <span className="font-medium text-slate-700">{row.original.productCount ?? "—"}</span>,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => <Actions subCategory={row.original} onView={onView} onEdit={onEdit} onDelete={onDelete} />,
    },
  ];

  const table = useReactTable({
    data: subCategories,
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
        <table className="w-full min-w-[720px] text-left text-sm">
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
          const subCategory = row.original;
          return (
            <article key={subCategory.id} className="flex items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={selectedIds.includes(subCategory.id)}
                onChange={() => onToggleSelect(subCategory.id)}
                aria-label={`Select ${subCategory.name}`}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
              />
              {subCategory.image ? <img src={subCategory.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />}
              <button onClick={() => onView(subCategory)} className="min-w-0 flex-1 text-left">
                <strong className="block truncate text-sm text-slate-800">{subCategory.name}</strong>
                <span className="mt-1 block text-xs text-slate-500">{subCategory.categoryName ?? `Category #${subCategory.categoryId}`} · {subCategory.slug}</span>
              </button>
              <Actions subCategory={subCategory} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            </article>
          );
        })}
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Page {pagination.pageIndex + 1} of {table.getPageCount()} · {subCategories.length} total
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
