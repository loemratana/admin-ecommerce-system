import { useState } from "react";
import { useTablePagination } from "@/hooks/useTablePagination";
import { Link, useNavigate } from "react-router";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Edit2, Eye, KeyRound, Plus, Shield, Trash2 } from "lucide-react";
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
import { Badge, Header, Surface, Toast } from "@/components/shared/AdminUI";
import TableActionMenu from "@/components/common/TableActionMenu";
import RoleDialog from "@/features/roles/components/RoleDialog";
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from "@/features/roles/hooks/useRoles";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { RoleDetail, RolePayload } from "@/features/roles/types/role.types";

const PAGE_SIZE = 10;

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3 w-3" />;
  if (direction === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
}

export default function RolesPage() {
  const navigate = useNavigate();
  const { data: roles = [], isLoading: loading, error: loadFailure } = useRoles();
  const loadError = loadFailure ? getApiErrorMessage(loadFailure) : "";

  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDetail | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useTablePagination(roles.length, PAGE_SIZE);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();

  const handleOpenCreate = () => {
    setEditingRole(null);
    setDialogError("");
    setDialogMode("create");
  };

  const handleOpenEdit = (role: RoleDetail) => {
    setEditingRole(role);
    setDialogError("");
    setDialogMode("edit");
  };

  const handleCloseDialog = () => {
    setDialogMode(null);
    setEditingRole(null);
    setDialogError("");
  };

  const handleSave = async (payload: RolePayload) => {
    setSaving(true);
    setDialogError("");
    try {
      if (dialogMode === "edit" && editingRole) {
        await updateMutation.mutateAsync({ id: editingRole.roleId, payload });
        notify(`Role "${payload.roleName}" updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        notify(`Role "${payload.roleName}" created successfully.`);
      }
      handleCloseDialog();
    } catch (error) {
      setDialogError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role: RoleDetail) => {
    if (!window.confirm(`Delete role "${role.roleName}"? This is blocked if it is still assigned to users.`)) return;
    try {
      await deleteMutation.mutateAsync(role.roleId);
      notify("Role deleted.");
    } catch (error) {
      notify(getApiErrorMessage(error));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => (current.length === roles.length ? [] : roles.map((role) => role.roleId)));
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      notify(`${selectedIds.length} roles deleted.`);
      setSelectedIds([]);
    } catch (error) {
      notify(getApiErrorMessage(error));
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns: ColumnDef<RoleDetail>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={roles.length > 0 && selectedIds.length === roles.length}
          onChange={toggleSelectAll}
          aria-label="Select all roles"
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.roleId)}
          onChange={() => toggleSelect(row.original.roleId)}
          aria-label={`Select ${row.original.roleName}`}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "roleName",
      header: "Role",
      cell: ({ row }) => (
        <Link
          to={`/system/roles/${row.original.roleId}`}
          className="flex items-center gap-2 font-semibold text-slate-800 hover:text-blue-600"
        >
          <Shield className="h-4 w-4 text-slate-400" />
          <span>{row.original.roleName}</span>
        </Link>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-slate-600">{row.original.description || "—"}</span>,
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {row.original.permissions.length} permissions
        </span>
      ),
      accessorFn: (role) => role.permissions.length,
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => <Badge value={row.original.active ? "Active" : "Inactive"} />,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <TableActionMenu ariaLabel={`Actions for ${row.original.roleName}`}>
          <button
            type="button"
            onClick={() => navigate(`/system/roles/${row.original.roleId}`)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Eye className="h-3.5 w-3.5" />
            View & Assign Permissions
          </button>
          <button
            type="button"
            onClick={() => handleOpenEdit(row.original)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Role
          </button>
          <button
            type="button"
            onClick={() => remove(row.original)}
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
    data: roles,
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
      <PageMeta title="Roles & Permissions | System" description="Control what users can access and what actions they can perform." />
      <main className="min-h-screen pb-10">
        <Header
          crumb="System / Roles & Permissions"
          title="Roles & Permissions"
          subtitle="Control what users can access and what actions they can perform."
          action={
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Create Role
            </button>
          }
        />

        {/* Tab Navigation between Roles and Permissions */}
        <div className="mb-6 flex border-b border-slate-200">
          <Link
            to="/system/roles"
            className="flex items-center gap-2 border-b-2 border-blue-600 px-5 py-3 text-sm font-semibold text-blue-600"
          >
            <Shield className="h-4 w-4" />
            Roles
          </Link>
          <Link
            to="/system/permissions"
            className="flex items-center gap-2 border-b-2 border-transparent px-5 py-3 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            <KeyRound className="h-4 w-4" />
            Permissions
          </Link>
        </div>

        {loadError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
        {!loading && (
          <BulkActionBar
            count={selectedIds.length}
            deleting={bulkDeleting}
            onDelete={bulkDelete}
            onClear={() => setSelectedIds([])}
            label="roles selected"
          />
        )}
        <Surface className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
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
                {loading ? (
                  <TableSkeletonRows rows={5} columns={6} />
                ) : roles.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No roles found.</td></tr>
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
                Page {pagination.pageIndex + 1} of {table.getPageCount()} · {roles.length} total
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
        </Surface>
      </main>

      {dialogMode && (
        <RoleDialog
          mode={dialogMode}
          initialData={editingRole}
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
