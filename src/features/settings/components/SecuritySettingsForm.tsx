import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/shared/AdminUI";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useUpdateSettings } from "@/features/settings/hooks/useSettings";
import { securitySettingsSchema, type SecuritySettingsFormValues } from "@/features/settings/schemas/settings.schema";
import type { SecuritySettings } from "@/features/settings/types/settings.types";
import { SettingField, SettingsForm } from "./SettingsForm";

const PRESETS = [15, 30, 60, 150, 480];

const toForm = (s: SecuritySettings): SecuritySettingsFormValues => ({ accessTokenTtlMinutes: String(s.accessTokenTtlMinutes) });

export default function SecuritySettingsForm({ settings, onDirtyChange }: { settings: SecuritySettings; onDirtyChange: (dirty: boolean) => void }) {
  const mutation = useUpdateSettings("security");
  const { register, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: toForm(settings),
  });

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const save = handleSubmit(async (values) => {
    try {
      const saved = (await mutation.mutateAsync({ accessTokenTtlMinutes: Number(values.accessTokenTtlMinutes) })).data.data;
      reset(toForm(saved.security));
      toast.success("Security settings saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <SettingsForm onSubmit={save} onDiscard={() => reset()} isDirty={isDirty} saving={mutation.isPending}>
      <div className="max-w-2xl space-y-5">
        <SettingField
          label="Access token lifetime (minutes)"
          error={errors.accessTokenTtlMinutes?.message}
          hint="How long each login token is valid. The apps renew it automatically while the refresh token (30 days) is valid, so this is not an idle timeout. Shorter means blocked users and permission changes take effect sooner. 5 – 1440."
        >
          <Input {...register("accessTokenTtlMinutes")} type="number" min="5" max="1440" step="1" inputMode="numeric" />
        </SettingField>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setValue("accessTokenTtlMinutes", String(minutes), { shouldDirty: true, shouldValidate: true })}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700"
            >
              {minutes < 60 ? `${minutes} min` : `${minutes / 60} h`}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Applies to tokens issued from now on, for every user. People already signed in keep their current token until it expires.
        </div>
      </div>
    </SettingsForm>
  );
}
