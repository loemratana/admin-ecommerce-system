import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import { DetailSkeleton, StatsSkeleton } from "@/components/common/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Badge, Header, Summary, Surface, Toast } from "@/components/shared/AdminUI";
import RoleDialog from "@/features/roles/components/RoleDialog";
import { useAssignPermissions, useRole, useUpdateRole } from "@/features/roles/hooks/useRoles";
import { usePermissions } from "@/features/permissions/hooks/usePermissions";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { RolePayload } from "@/features/roles/types/role.types";
import type { Permission } from "@/features/permissions/types/permission.types";

function groupByResource(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const list = groups.get(permission.resource) || [];
    list.push(permission);
    groups.set(permission.resource, list);
  }
  return groups;
}

export default function RoleDetailPage() {
  const { id } = useParams();
  const roleId = Number(id);

  const roleQuery = useRole(roleId);
  const permissionsQuery = usePermissions();
  const role = roleQuery.data ?? null;
  const allPermissions = useMemo(() => permissionsQuery.data ?? [], [permissionsQuery.data]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const loading = roleQuery.isLoading || permissionsQuery.isLoading;
  const loadFailure = roleQuery.error ?? permissionsQuery.error;
  const error = loadFailure ? getApiErrorMessage(loadFailure) : "";
  const assignMutation = useAssignPermissions();
  const updateMutation = useUpdateRole();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  // Seed the checkbox selection once per role; later refetches must not discard unsaved toggles.
  const seededRoleId = useRef<number | null>(null);
  useEffect(() => {
    if (!role || seededRoleId.current === role.roleId) return;
    seededRoleId.current = role.roleId;
    setSelected(new Set(role.permissions.map((permission) => permission.id)));
  }, [role]);

  const groups = useMemo(() => groupByResource(allPermissions), [allPermissions]);

  const toggle = (permissionId: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      await assignMutation.mutateAsync({ id: roleId, permissionIds: Array.from(selected) });
      notify("Permissions updated.");
    } catch (err) {
      notify(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    if (!role) return;
    setEditError("");
    setEditOpen(true);
  };

  const saveEdit = async (payload: RolePayload) => {
    setSavingEdit(true);
    setEditError("");
    try {
      await updateMutation.mutateAsync({ id: roleId, payload });
      setEditOpen(false);
      notify("Role updated successfully.");
    } catch (err) {
      setEditError(getApiErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen pb-10 p-6">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
        </div>
        <StatsSkeleton items={4} className="mb-5" />
        <DetailSkeleton withImage={false} rows={5} />
      </main>
    );
  }
  if (error || !role) return <main className="min-h-screen pb-10 p-6 text-sm text-red-600">{error || "Role not found."}</main>;

  return (
    <>
      <PageMeta title={`${role.roleName} | Roles`} description="Review and edit role permissions." />
      <main className="min-h-screen pb-10">
        <Header
          crumb={`System / Roles / ${role.roleName}`}
          title={role.roleName}
          subtitle={role.description || "No description"}
          action={<button type="button" onClick={openEdit} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">Edit Role</button>}
        />
        <Summary items={[["Permissions assigned", String(role.permissions.length)], ["Total permissions", String(allPermissions.length)], ["Status", role.active ? "Active" : "Inactive"], ["Role Id", String(role.roleId)]]} />
        <Surface className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Permission matrix</h2>
              <p className="mt-1 text-sm text-slate-500">Select permissions and save to replace this role's full permission set.</p>
            </div>
            <Badge value={role.active ? "Active" : "Inactive"} />
          </div>
          <div className="space-y-4">
            {Array.from(groups.entries()).map(([resource, permissions]) => (
              <div key={resource} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3"><p className="text-sm font-semibold text-slate-800">{resource}</p><span className="text-xs text-slate-500">{permissions.length} permissions</span></div>
                <div className="divide-y divide-slate-100">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span>
                        <span className="font-medium text-slate-700">{permission.action}</span>
                        {permission.description && <span className="ml-2 text-xs text-slate-400">{permission.description}</span>}
                      </span>
                      <input type="checkbox" checked={selected.has(permission.id)} onChange={() => toggle(permission.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {allPermissions.length === 0 && <p className="text-sm text-slate-500">No permissions defined yet.</p>}
          </div>
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button type="button" disabled={saving} onClick={savePermissions} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{saving && <Spinner size="sm" />}{saving ? "Saving..." : "Save permissions"}</button>
          </div>
        </Surface>
      </main>

      {editOpen && (
        <RoleDialog
          mode="edit"
          initialData={role}
          onClose={() => setEditOpen(false)}
          onSubmit={saveEdit}
          saving={savingEdit}
          error={editError}
        />
      )}
      <Toast message={toast} />
    </>
  );
}
