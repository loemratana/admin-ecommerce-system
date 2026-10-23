import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";
import { Globe, KeyRound, ShoppingCart, Store } from "lucide-react";
import { Toaster } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { Header, Surface } from "@/components/shared/AdminUI";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatOrderDate } from "@/features/orders/utils/order.format";
import { useSettings } from "@/features/settings/hooks/useSettings";
import type { SettingsSection } from "@/features/settings/types/settings.types";
import StoreSettingsForm from "@/features/settings/components/StoreSettingsForm";
import OrderSettingsForm from "@/features/settings/components/OrderSettingsForm";
import LocalizationSettingsForm from "@/features/settings/components/LocalizationSettingsForm";
import SecuritySettingsForm from "@/features/settings/components/SecuritySettingsForm";

// Notifications and Payments are left out until the API can send email and take payments.
const SECTIONS: { id: SettingsSection; label: string; description: string; icon: typeof Store }[] = [
  { id: "store", label: "Store", description: "Name and contact details shown on invoices and the storefront.", icon: Store },
  { id: "orders", label: "Orders", description: "Tax, shipping, unpaid-order timeout and the return window.", icon: ShoppingCart },
  { id: "localization", label: "Localization", description: "Currency label and the timezone used for dates.", icon: Globe },
  { id: "security", label: "Security", description: "How long login tokens stay valid.", icon: KeyRound },
];

function isSection(value: string | null): value is SettingsSection {
  return SECTIONS.some((s) => s.id === value);
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const section: SettingsSection = isSection(sectionParam) ? sectionParam : "store";
  const current = SECTIONS.find((s) => s.id === section)!;
  const { data: settings, isLoading, error } = useSettings();
  const [dirty, setDirty] = useState(false);
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);

  const openSection = (next: SettingsSection) => {
    if (next === section) return;
    if (dirty && !window.confirm(`Discard unsaved ${current.label.toLowerCase()} changes?`)) return;
    setDirty(false);
    setSearchParams(next === "store" ? {} : { section: next });
  };

  return (
    <>
      <PageMeta title="Settings | System" description="Configure store and platform settings." />
      <Toaster position="top-right" richColors closeButton />
      <main className="min-h-screen pb-10">
        <Header
          crumb="System / Settings"
          title="Settings"
          subtitle="Configure store details, order rules, localization and security."
        />
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <Surface className="h-fit p-2">
            <div className="mb-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Settings</div>
            <nav aria-label="Settings sections">
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-current={section === id ? "page" : undefined}
                  onClick={() => openSection(id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${section === id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </Surface>

          <Surface className="p-5">
            <div className="mb-6 flex flex-col justify-between gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{current.label} Settings</h2>
                <p className="mt-1 text-sm text-slate-500">{current.description}</p>
              </div>
              {settings?.updatedBy && (
                <p className="text-xs text-slate-400">
                  Last saved {formatOrderDate(settings.updatedAt)} by {settings.updatedBy}
                </p>
              )}
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(error)}</div>
            ) : isLoading || !settings ? (
              <DetailSkeleton withImage={false} rows={4} />
            ) : section === "store" ? (
              <StoreSettingsForm key="store" settings={settings.store} onDirtyChange={onDirtyChange} />
            ) : section === "orders" ? (
              <OrderSettingsForm key="orders" settings={settings.orders} currency={settings.localization.currency} onDirtyChange={onDirtyChange} />
            ) : section === "localization" ? (
              <LocalizationSettingsForm key="localization" settings={settings.localization} onDirtyChange={onDirtyChange} />
            ) : (
              <SecuritySettingsForm key="security" settings={settings.security} onDirtyChange={onDirtyChange} />
            )}
          </Surface>
        </div>
      </main>
    </>
  );
}
