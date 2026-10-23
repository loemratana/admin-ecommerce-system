import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/shared/AdminUI";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useUpdateSettings } from "@/features/settings/hooks/useSettings";
import { orderSettingsSchema, type OrderSettingsFormValues } from "@/features/settings/schemas/settings.schema";
import type { OrderSettings } from "@/features/settings/types/settings.types";
import { SettingField, SettingsForm } from "./SettingsForm";

// The API stores tax as a fraction (0.1); admins think in percent (10). Round away float noise like 0.07 * 100.
const toForm = (s: OrderSettings): OrderSettingsFormValues => ({
  taxPercent: String(Math.round(Number(s.taxRate) * 10000) / 100),
  shippingFee: String(Number(s.shippingFee)),
  pendingTimeoutMinutes: String(s.pendingTimeoutMinutes),
  returnWindowDays: String(s.returnWindowDays),
});

export default function OrderSettingsForm({ settings, currency, onDirtyChange }: { settings: OrderSettings; currency: string; onDirtyChange: (dirty: boolean) => void }) {
  const mutation = useUpdateSettings("orders");
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<OrderSettingsFormValues>({
    resolver: zodResolver(orderSettingsSchema),
    defaultValues: toForm(settings),
  });

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const save = handleSubmit(async (values) => {
    try {
      const saved = (await mutation.mutateAsync({
        taxRate: Math.round(Number(values.taxPercent) * 100) / 10000,
        shippingFee: Number(values.shippingFee),
        pendingTimeoutMinutes: Number(values.pendingTimeoutMinutes),
        returnWindowDays: Number(values.returnWindowDays),
      })).data.data;
      reset(toForm(saved.orders));
      toast.success("Order settings saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <SettingsForm onSubmit={save} onDiscard={() => reset()} isDirty={isDirty} saving={mutation.isPending}>
      <div className="mb-5 flex max-w-2xl items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Changes apply to orders placed from now on. Existing orders keep the tax and shipping they were charged.</span>
      </div>
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
        <SettingField label="Tax rate (%)" error={errors.taxPercent?.message} hint="Charged on the subtotal after coupons.">
          <Input {...register("taxPercent")} type="number" min="0" max="100" step="0.01" inputMode="decimal" />
        </SettingField>
        <SettingField label={`Shipping fee (${currency})`} error={errors.shippingFee?.message} hint="Flat fee added to every order. 0 = free shipping.">
          <Input {...register("shippingFee")} type="number" min="0" step="0.01" inputMode="decimal" />
        </SettingField>
        <SettingField label="Unpaid order timeout (minutes)" error={errors.pendingTimeoutMinutes?.message} hint="Unpaid orders are cancelled after this and their reserved stock is released. 5 – 10080.">
          <Input {...register("pendingTimeoutMinutes")} type="number" min="5" max="10080" step="1" inputMode="numeric" />
        </SettingField>
        <SettingField label="Return window (days)" error={errors.returnWindowDays?.message} hint="How long after delivery customers can request a return. 0 = no returns.">
          <Input {...register("returnWindowDays")} type="number" min="0" max="365" step="1" inputMode="numeric" />
        </SettingField>
      </div>
    </SettingsForm>
  );
}
