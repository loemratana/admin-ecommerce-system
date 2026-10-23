import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/shared/AdminUI";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useUpdateSettings } from "@/features/settings/hooks/useSettings";
import { storeSettingsSchema, type StoreSettingsFormValues } from "@/features/settings/schemas/settings.schema";
import type { StoreSettings } from "@/features/settings/types/settings.types";
import { SettingField, SettingsForm } from "./SettingsForm";

const toForm = (s: StoreSettings): StoreSettingsFormValues => ({
  name: s.name,
  email: s.email ?? "",
  phone: s.phone ?? "",
  address: s.address ?? "",
  description: s.description ?? "",
});

export default function StoreSettingsForm({ settings, onDirtyChange }: { settings: StoreSettings; onDirtyChange: (dirty: boolean) => void }) {
  const mutation = useUpdateSettings("store");
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: toForm(settings),
  });

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const save = handleSubmit(async (values) => {
    try {
      const saved = (await mutation.mutateAsync(values)).data.data;
      reset(toForm(saved.store));
      toast.success("Store settings saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <SettingsForm onSubmit={save} onDiscard={() => reset()} isDirty={isDirty} saving={mutation.isPending}>
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
        <SettingField label="Store name" error={errors.name?.message} hint="Shown on invoices and the storefront." className="sm:col-span-2">
          <Input {...register("name")} maxLength={150} />
        </SettingField>
        <SettingField label="Store email" error={errors.email?.message}>
          <Input {...register("email")} type="email" placeholder="shop@example.com" />
        </SettingField>
        <SettingField label="Store phone" error={errors.phone?.message}>
          <Input {...register("phone")} placeholder="+855 12 345 678" maxLength={30} />
        </SettingField>
        <SettingField label="Address" error={errors.address?.message} hint="Printed under the store name on invoices." className="sm:col-span-2">
          <Input {...register("address")} placeholder="Street, city, country" maxLength={255} />
        </SettingField>
        <SettingField label="Store description" error={errors.description?.message} className="sm:col-span-2">
          <textarea {...register("description")} maxLength={1000} className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </SettingField>
      </div>
    </SettingsForm>
  );
}
