import { useState } from "react";
import { useTablePagination } from "@/hooks/useTablePagination";
import { Link } from "react-router";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Package, Search } from "lucide-react";
import type { SubCategoryProduct } from "@/features/sub-categories/types/sub-category.types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatPrice } from "@/lib/currency";

const PAGE_SIZE = 10;

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />;
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
}

function ProductThumb({ product, className }: { product: SubCategoryProduct; className: string }) {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt="" className={`${className} object-cover`} />;
  }
  return (
    <span className={`${className} flex items-center justify-center bg-slate-100 text-slate-400`}>
      <Package className="h-5 w-5" />
    </span>
  );
}

const columns: ColumnDef<SubCategoryProduct>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <Link to={`/catalog/products/${row.original.id}`} className="flex items-center gap-3">
        <ProductThumb product={row.original} className="h-11 w-11 shrink-0 rounded-lg" />
        <strong className="text-slate-800 hover:text-blue-600">{row.original.name}</strong>
      </Link>
    ),
  },
  { accessorKey: "slug", header: "Slug", cell: ({ row }) => <span className="text-slate-500">{row.original.slug}</span> },
  { accessorKey: "price", header: "Price", cell: ({ row }) => <span className="font-medium text-slate-700">{formatPrice(row.original.price)}</span> },
];

export default function SubCategoryProductsTable({ products }: { products: SubCategoryProduct[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useTablePagination(products.length, PAGE_SIZE, globalFilter);

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Products</h2>
          <p className="mt-1 text-sm text-slate-500">{products.length} products in this sub-category.</p>
        </div>
        {products.length > 0 && (
          <label className="relative block sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={globalFilter}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder="Search products..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        )}
      </div>

      {products.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">No products in this sub-category yet.</p>
      ) : filteredCount === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">No products match "{globalFilter}".</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {table.getHeaderGroups()[0].headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 first:pl-5">
                      <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 hover:text-slate-700">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon direction={header.column.getIsSorted()} />
                      </button>
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
            {rows.map(({ original: product }) => (
              <Link key={product.id} to={`/catalog/products/${product.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                <ProductThumb product={product} className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-800">{product.name}</strong>
                  <span className="mt-1 block truncate text-xs text-slate-500">{product.slug}</span>
                </div>
                <span className="text-sm font-medium text-slate-700">{formatPrice(product.price)}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {table.getPageCount() > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Page {pagination.pageIndex + 1} of {table.getPageCount()} · {filteredCount} total
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
    </section>
  );
}
