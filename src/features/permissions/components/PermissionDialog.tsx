import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Dialog, Field, Input } from "@/components/shared/AdminUI";
import { Spinner } from "@/components/ui/spinner";
import { permissionSchema, type PermissionFormValues } from "@/features/permissions/schemas/permission.schema";
import type { Permission, PermissionPayload } from "@/features/permissions/types/permission.types";

const SUGGESTED_RESOURCES = [
  "PRODUCT",
  "CATEGORY",
  "ORDER",
  "USER",
  "INVENTORY",
  "ROLE",
  "REVIEW",
  "BRAND",
  "SIZE",
  "COUPON",
  "PAYMENT",
];

const SUGGESTED_ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"];

interface PermissionDialogProps {
  mode: "create" | "edit";
  initialData?: Permission | null;
  onClose: () => void;
  onSubmit: (payload: PermissionPayload) => void;
  saving: boolean;
  error: string;
}

export default function PermissionDialog({
  mode,
  initialData,
  onClose,
  onSubmit,
  saving,
  error,
}: PermissionDialogProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [resource, setResource] = useState(initialData?.resource ?? "");
  const [action, setAction] = useState(initialData?.action ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setResource(initialData.resource);
      setAction(initialData.action);
      setDescription(initialData.description ?? "");
    } else {
      setName("");
      setResource("");
      setAction("");
      setDescription("");
    }
    setValidationErrors({});
  }, [initialData]);

  const handleAutoGenerateName = () => {
    if (resource.trim() && action.trim()) {
      const generated = `${resource.trim().toUpperCase()}_${action.trim().toUpperCase()}`;
      setName(generated);
    }
  };

  // Name is locked after creation: DataSeeder and authority checks look permissions up by name
  const isEdit = mode === "edit";

  const handleSelectResource = (res: string) => {
    setResource(res);
    if (!isEdit && (!name || name === `${resource}_${action}`)) {
      const act = action.trim().toUpperCase();
      setName(act ? `${res}_${act}` : `${res}_`);
    }
  };

  const handleSelectAction = (act: string) => {
    setAction(act);
    if (!isEdit && (!name || name === `${resource}_${action}`)) {
      const res = resource.trim().toUpperCase();
      setName(res ? `${res}_${act}` : `_${act}`);
    }
  };

  const handleSave = () => {
    setValidationErrors({});
    const values: PermissionFormValues = {
      name,
      resource,
      action,
      description: description || undefined,
    };

    const parsed = permissionSchema.safeParse(values);
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
      name: isEdit && initialData ? initialData.name : parsed.data.name,
      resource: parsed.data.resource,
      action: parsed.data.action,
      // Backend skips null fields on update, so send "" in edit mode to allow clearing
      description: parsed.data.description ?? (isEdit ? "" : undefined),
    });
  };

  const title = isEdit ? "Edit Permission" : "Create Permission";

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {/* Resource Selection */}
        <Field label="Resource">
          <Input
            value={resource}
            onChange={(e) => setResource(e.target.value.toUpperCase())}
            placeholder="e.g. PRODUCT"
          />
          {validationErrors.resource && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.resource}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED_RESOURCES.slice(0, 7).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => handleSelectResource(res)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                  resource === res
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </Field>

        {/* Action Selection */}
        <Field label="Action">
          <Input
            value={action}
            onChange={(e) => setAction(e.target.value.toUpperCase())}
            placeholder="e.g. CREATE"
          />
          {validationErrors.action && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.action}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED_ACTIONS.map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => handleSelectAction(act)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                  action === act
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </Field>

        {/* Permission Name */}
        <Field label="Permission Name">
          {isEdit ? (
            <>
              <div className="flex h-10 w-full items-center rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-500">
                {name}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Permission names can't be changed after creation. Create a new permission instead.
              </p>
            </>
          ) : (
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="e.g. PRODUCT_CREATE"
            />
            {resource && action && (
              <button
                type="button"
                onClick={handleAutoGenerateName}
                title="Generate name from Resource and Action"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Auto
              </button>
            )}
          </div>
          )}
          {validationErrors.name && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
          )}
        </Field>

        {/* Description */}
        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Allows creating new products"
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
            {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Permission"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
