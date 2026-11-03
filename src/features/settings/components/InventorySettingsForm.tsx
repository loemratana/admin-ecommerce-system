import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/shared/AdminUI";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useUpdateSettings } from "@/features/settings/hooks/useSettings";
import { inventorySettingsSchema, type InventorySettingsFormValues } from "@/features/settings/schemas/settings.schema";
import type { InventorySettings } from "@/features/settings/types/settings.types";
import { SettingField, SettingsForm } from "./SettingsForm";

const toForm = (s: InventorySettings): InventorySettingsFormValues => ({
  lowStockThreshold: String(s.lowStockThreshold),
});

export default function InventorySettingsForm({ settings, onDirtyChange }: { settings: InventorySettings; onDirtyChange: (dirty: boolean) => void }) {
  const mutation = useUpdateSettings("inventory");
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<InventorySettingsFormValues>({
    resolver: zodResolver(inventorySettingsSchema),
    defaultValues: toForm(settings),
  });

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const save = handleSubmit(async (values) => {
    try {
      const saved = (await mutation.mutateAsync({ lowStockThreshold: Number(values.lowStockThreshold) })).data.data;
      reset(toForm(saved.inventory));
      toast.success("Inventory settings saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <SettingsForm onSubmit={save} onDiscard={() => reset()} isDirty={isDirty} saving={mutation.isPending}>
      <div className="mb-5 flex max-w-2xl items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Used for the Low Stock badge, the inventory and product stats, and the low-stock notification. A variant alerts once
          when its available stock drops to this number, and again if it runs out.
        </span>
      </div>
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
        <SettingField label="Low-stock threshold (units)" error={errors.lowStockThreshold?.message} hint="Available stock at or below this counts as low. 0 = only out-of-stock alerts.">
          <Input {...register("lowStockThreshold")} type="number" min="0" max="100000" step="1" inputMode="numeric" />
        </SettingField>
      </div>
    </SettingsForm>
  );
}
