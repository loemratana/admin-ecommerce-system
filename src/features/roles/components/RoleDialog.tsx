import { useEffect, useState } from "react";
import { Dialog, Field, Input } from "@/components/shared/AdminUI";
import { Spinner } from "@/components/ui/spinner";
import { roleSchema, type RoleFormValues } from "@/features/roles/schemas/role.schema";
import type { RoleDetail, RolePayload } from "@/features/roles/types/role.types";

interface RoleDialogProps {
  mode: "create" | "edit";
  initialData?: RoleDetail | null;
  onClose: () => void;
  onSubmit: (payload: RolePayload) => void;
  saving: boolean;
  error: string;
}

export default function RoleDialog({
  mode,
  initialData,
  onClose,
  onSubmit,
  saving,
  error,
}: RoleDialogProps) {
  const [roleName, setRoleName] = useState(initialData?.roleName ?? "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setRoleName(initialData.roleName);
      setActive(initialData.active);
      setDescription(initialData.description ?? "");
    } else {
      setRoleName("");
      setActive(true);
      setDescription("");
    }
    setValidationErrors({});
  }, [initialData]);

  const handleSave = () => {
    setValidationErrors({});
    const values: RoleFormValues = {
      roleName,
      active,
      description: description || undefined,
    };

    const parsed = roleSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || "form";
        fieldErrors[fieldName] = issue.message;
      });
      setValidationErrors(fieldErrors);
      return;
    }

    onSubmit({
      roleName: parsed.data.roleName,
      active: parsed.data.active,
      description: parsed.data.description,
    });
  };

  const title = mode === "edit" ? "Edit Role" : "Create Role";

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {/* Role Name */}
        <Field label="Role Name">
          <Input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g. SUPPORT_LEAD or ADMIN"
          />
          {validationErrors.roleName && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.roleName}</p>
          )}
        </Field>

        {/* Active Status */}
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800">Active Role</span>
            <p className="text-slate-500">
              When active, this role can be assigned to users and enforce security rules.
            </p>
          </div>
        </label>

        {/* Description */}
        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what users with this role can access"
            rows={3}
            className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {validationErrors.description && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.description}</p>
          )}
        </Field>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Spinner size="sm" />}
            {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
