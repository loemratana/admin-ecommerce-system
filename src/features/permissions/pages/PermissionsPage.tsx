import { useMemo, useState } from "react";
import { useTablePagination } from "@/hooks/useTablePagination";
import { Link } from "react-router";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, KeyRound, Plus, Search, Shield, Trash2, Edit2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import { TableSkeletonRows } from "@/components/common/Skeletons";
import BulkActionBar from "@/components/common/BulkActionBar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Header, Input, Surface, Toast } from "@/components/shared/AdminUI";
import TableActionMenu from "@/components/common/TableActionMenu";
import PermissionDialog from "@/features/permissions/components/PermissionDialog";
import {
  useCreatePermission,
  useDeletePermission,
  usePermissions,
  useUpdatePermission,
} from "@/features/permissions/hooks/usePermissions";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Permission, PermissionPayload } from "@/features/permissions/types/permission.types";

const PAGE_SIZE = 10;

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  READ: "bg-sky-50 text-sky-700 border-sky-200",
  UPDATE: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-rose-50 text-rose-700 border-rose-200",
  MANAGE: "bg-purple-50 text-purple-700 border-purple-200",
};

const RESOURCE_COLORS: Record<string, string> = {
  PRODUCT: "bg-blue-100 text-blue-800",
  CATEGORY: "bg-indigo-100 text-indigo-800",
  ORDER: "bg-violet-100 text-violet-800",
  USER: "bg-amber-100 text-amber-800",
  ROLE: "bg-cyan-100 text-cyan-800",
  INVENTORY: "bg-emerald-100 text-emerald-800",
  REVIEW: "bg-orange-100 text-orange-800",
  BRAND: "bg-pink-100 text-pink-800",
  SIZE: "bg-teal-100 text-teal-800",
  COUPON: "bg-purple-100 text-purple-800",
  PAYMENT: "bg-green-100 text-green-800",
};

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />;
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
}

export default function PermissionsPage() {
  const { data: permissions = [], isLoading: loading, error: loadFailure } = usePermissions();
  const loadError = loadFailure ? getApiErrorMessage(loadFailure) : "";

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [selectedResource, setSelectedResource] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const createMutation = useCreatePermission();
  const updateMutation = useUpdatePermission();
  const deleteMutation = useDeletePermission();

  const resourcesList = useMemo(() => {
    const set = new Set<string>();
    permissions.forEach((p) => {
      if (p.resource) set.add(p.resource);
    });
    return Array.from(set).sort();
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    return permissions.filter((perm) => {
      const matchSearch =
        !search ||
        perm.name.toLowerCase().includes(search.toLowerCase()) ||
        perm.resource.toLowerCase().includes(search.toLowerCase()) ||
        perm.action.toLowerCase().includes(search.toLowerCase()) ||
        (perm.description ?? "").toLowerCase().includes(search.toLowerCase());

      const matchResource = selectedResource === "ALL" || perm.resource === selectedResource;

      return matchSearch && matchResource;
    });
  }, [permissions, search, selectedResource]);

  const [pagination, setPagination] = useTablePagination(filteredPermissions.length, PAGE_SIZE, `${search}|${selectedResource}`);

  const handleOpenCreate = () => {
    setEditingPermission(null);
    setDialogError("");
    setDialogMode("create");
  };

  const handleOpenEdit = (perm: Permission) => {
    setEditingPermission(perm);
    setDialogError("");
    setDialogMode("edit");
  };

  const handleCloseDialog = () => {
    setDialogMode(null);
    setEditingPermission(null);
    setDialogError("");
  };

  const handleSave = async (payload: PermissionPayload) => {
    setSaving(true);
    setDialogError("");
    try {
      if (dialogMode === "edit" && editingPermission) {
        await updateMutation.mutateAsync({ id: editingPermission.id, payload });
        notify(`Permission "${payload.name}" updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        notify(`Permission "${payload.name}" created successfully.`);
      }
      handleCloseDialog();
    } catch (error) {
      setDialogError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (perm: Permission) => {
    if (
      !window.confirm(
        `Delete permission "${perm.name}"? Permissions still assigned to roles cannot be deleted.`
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(perm.id);
      setSelectedIds((current) => current.filter((id) => id !== perm.id));
      notify(`Permission "${perm.name}" deleted.`);
    } catch (error) {
      notify(getApiErrorMessage(error));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  // Selects or deselects only the rows on the current page
  const toggleSelectPage = (pageIds: number[], allSelected: boolean) => {
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...current, ...pageIds]))
    );
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSelectedIds([]);
  };

  const handleResourceChange = (value: string) => {
    setSelectedResource(value);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} permissions? Permissions still assigned to roles cannot be deleted.`
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    try {
      const ids = [...selectedIds];
      const results = await Promise.allSettled(ids.map((id) => deleteMutation.mutateAsync(id)));
      const failedIds = ids.filter((_, index) => results[index].status === "rejected");
      const deletedCount = ids.length - failedIds.length;

      if (failedIds.length === 0) {
        notify(`${deletedCount} permissions deleted.`);
      } else {
        const firstError = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
        notify(
          `${deletedCount} deleted, ${failedIds.length} failed: ${getApiErrorMessage(firstError?.reason)}`
        );
      }
      // Keep only the failed ones selected so the user can see what's left
      setSelectedIds(failedIds);
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns: ColumnDef<Permission>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const pageIds = table.getRowModel().rows.map((row) => row.original.id);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
        return (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => toggleSelectPage(pageIds, allSelected)}
            aria-label="Select all permissions on this page"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        );
      },
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={() => toggleSelect(row.original.id)}
          aria-label={`Select ${row.original.name}`}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Permission Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-900">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "resource",
      header: "Resource",
      cell: ({ row }) => {
        const res = row.original.resource;
        const colorClass = RESOURCE_COLORS[res] || "bg-slate-100 text-slate-700";
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colorClass}`}
          >
            {res}
          </span>
        );
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const act = row.original.action;
        const colorClass =
          ACTION_COLORS[act] || "bg-slate-50 text-slate-700 border-slate-200";
        return (
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${colorClass}`}
          >
            {act}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-slate-600">
          {row.original.description || <span className="text-slate-400">—</span>}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <TableActionMenu ariaLabel={`Actions for ${row.original.name}`}>
          <button
            type="button"
            onClick={() => handleOpenEdit(row.original)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Permission
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </TableActionMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredPermissions,
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
    <>
      <PageMeta
        title="Permissions | System"
        description="View and manage granular permissions across system resources and actions."
      />
      <main className="min-h-screen pb-10">
        <Header
          crumb="System / Permissions"
          title="Permissions"
          subtitle="Define granular access rights for resources and assign them to roles."
          action={
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Create Permission
            </button>
          }
        />

        {/* Tab Navigation between Roles and Permissions */}
        <div className="mb-6 flex border-b border-slate-200">
          <Link
            to="/system/roles"
            className="flex items-center gap-2 border-b-2 border-transparent px-5 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            <Shield className="h-4 w-4" />
            Roles
          </Link>
          <Link
            to="/system/permissions"
            className="flex items-center gap-2 border-b-2 border-blue-600 px-5 py-3 text-sm font-semibold text-blue-600"
          >
            <KeyRound className="h-4 w-4" />
            Permissions
          </Link>
        </div>

        {loadError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {/* Metric Summaries */}
        <Surface className="mb-5 grid grid-cols-2 divide-x divide-slate-200 overflow-hidden md:grid-cols-4">
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Total Permissions</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{permissions.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Resources</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{resourcesList.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Filtered View</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {filteredPermissions.length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-slate-500">Selected</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{selectedIds.length}</p>
          </div>
        </Surface>

        {/* Filter & Search Bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name, resource, action..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Resource:</label>
            <select
              value={selectedResource}
              onChange={(e) => handleResourceChange(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Resources ({permissions.length})</option>
              {resourcesList.map((res) => (
                <option key={res} value={res}>
                  {res} ({permissions.filter((p) => p.resource === res).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loading && (
          <BulkActionBar
            count={selectedIds.length}
            deleting={bulkDeleting}
            onDelete={handleBulkDelete}
            onClear={() => setSelectedIds([])}
            label="permissions selected"
          />
        )}

        {/* Permissions Data Table */}
        <Surface className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {table.getHeaderGroups()[0].headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 first:pl-5">
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-slate-700"
                        >
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
                {loading ? (
                  <TableSkeletonRows rows={5} columns={6} />
                ) : filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      {search || selectedResource !== "ALL"
                        ? "No permissions matched your filters."
                        : "No permissions defined yet."}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3.5 first:pl-5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {table.getPageCount() > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
              <p className="text-xs text-slate-500">
                Page {pagination.pageIndex + 1} of {table.getPageCount()} ·{" "}
                {filteredPermissions.length} total
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      disabled={!table.getCanPreviousPage()}
                      onClick={() => table.previousPage()}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{pagination.pageIndex + 1}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      disabled={!table.getCanNextPage()}
                      onClick={() => table.nextPage()}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Surface>
      </main>

      {dialogMode && (
        <PermissionDialog
          mode={dialogMode}
          initialData={editingPermission}
          onClose={handleCloseDialog}
          onSubmit={handleSave}
          saving={saving}
          error={dialogError}
        />
      )}

      <Toast message={toast} />
    </>
  );
}
