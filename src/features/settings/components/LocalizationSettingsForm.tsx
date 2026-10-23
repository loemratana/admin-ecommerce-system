import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useUpdateSettings } from "@/features/settings/hooks/useSettings";
import { localizationSettingsSchema, type LocalizationSettingsFormValues } from "@/features/settings/schemas/settings.schema";
import type { LocalizationSettings } from "@/features/settings/types/settings.types";
import { SettingField, SettingsForm, fieldClass } from "./SettingsForm";

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "KHR", name: "Cambodian Riel" },
  { code: "THB", name: "Thai Baht" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
];

const FALLBACK_TIMEZONES = ["Asia/Phnom_Penh", "Asia/Bangkok", "Asia/Ho_Chi_Minh", "Asia/Singapore", "Asia/Tokyo", "Europe/London", "America/New_York", "UTC"];

// Intl.supportedValuesOf is ES2022; older browsers get a short list.
function timezones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  return intl.supportedValuesOf?.("timeZone") ?? FALLBACK_TIMEZONES;
}

export default function LocalizationSettingsForm({ settings, onDirtyChange }: { settings: LocalizationSettings; onDirtyChange: (dirty: boolean) => void }) {
  const mutation = useUpdateSettings("localization");
  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<LocalizationSettingsFormValues>({
    resolver: zodResolver(localizationSettingsSchema),
    defaultValues: settings,
  });

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  // Keep the saved value selectable even if it is not in our lists.
  const currencyOptions = useMemo(
    () => (CURRENCIES.some((c) => c.code === settings.currency) ? CURRENCIES : [{ code: settings.currency, name: settings.currency }, ...CURRENCIES]),
    [settings.currency],
  );
  const zoneOptions = useMemo(() => {
    const zones = timezones();
    return zones.includes(settings.timezone) ? zones : [settings.timezone, ...zones];
  }, [settings.timezone]);

  const timezone = watch("timezone");
  const preview = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date());
    } catch {
      return "";
    }
  }, [timezone]);

  const save = handleSubmit(async (values) => {
    try {
      const saved = (await mutation.mutateAsync(values)).data.data;
      reset(saved.localization);
      toast.success("Localization settings saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <SettingsForm onSubmit={save} onDiscard={() => reset()} isDirty={isDirty} saving={mutation.isPending}>
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
        <SettingField label="Currency" error={errors.currency?.message} hint="Label shown on invoices and the storefront. Prices are not converted.">
          <select {...register("currency")} className={fieldClass}>
            {currencyOptions.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </SettingField>
        <SettingField label="Timezone" error={errors.timezone?.message} hint={preview ? `Store time now: ${preview}. Used for invoice dates and Excel exports.` : "Used for invoice dates and Excel exports."}>
          <select {...register("timezone")} className={fieldClass}>
            {zoneOptions.map((zone) => (
              <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>
            ))}
          </select>
        </SettingField>
      </div>
    </SettingsForm>
  );
}
