import { useState } from "react";
import { Monitor, Smartphone, Tablet, Trash2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FadeIn from "@/components/common/FadeIn";
import { ListSkeleton } from "@/components/common/Skeletons";
import { Spinner } from "@/components/ui/spinner";
import Button from "@/components/ui/button/Button";
import { useDevices, useRevokeDevice } from "@/features/auth/hooks/useDevices";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Device } from "@/features/auth/types/auth.types";

function DeviceIcon({ type }: { type: string }) {
  if (type.toUpperCase() === "IOS" || type.toUpperCase() === "ANDROID") return <Smartphone className="size-5" />;
  if (type.toUpperCase() === "TABLET") return <Tablet className="size-5" />;
  return <Monitor className="size-5" />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function DevicesPage() {
  const [confirming, setConfirming] = useState<Device | null>(null);
  const [message, setMessage] = useState("");
  const devicesQuery = useDevices();
  const revokeMutation = useRevokeDevice({
    onSuccess: () => {
      setConfirming(null);
      setMessage("Device revoked successfully.");
    },
    onError: (error) => setMessage(getApiErrorMessage(error)),
  });

  return (
    <>
      <PageMeta title="Your Devices | E-Commerce Admin" description="Manage active account devices." />
      <PageBreadcrumb pageTitle="Your Devices" />
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Your Devices</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage the devices currently signed in to your account.</p></div>
        {message && <p role="status" className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{message}</p>}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          {devicesQuery.isLoading && <ListSkeleton rows={3} />}
          {devicesQuery.isError && <p role="alert" className="py-8 text-center text-sm text-error-500">{getApiErrorMessage(devicesQuery.error)}</p>}
          {!devicesQuery.isLoading && !devicesQuery.isError && devicesQuery.data?.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No active devices found.</p>}
          {!devicesQuery.isLoading && (
            <FadeIn>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">{devicesQuery.data?.map((device) => <div key={device.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><div className="rounded-xl bg-brand-50 p-3 text-brand-500 dark:bg-brand-500/10 dark:text-brand-300"><DeviceIcon type={device.deviceType} /></div><div><h2 className="font-medium text-gray-800 dark:text-white/90">{device.deviceName}</h2><p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{device.deviceType}</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last active {formatDate(device.lastSeenAt)}</p><p className="text-xs text-gray-400">Created {formatDate(device.createdAt)}</p></div></div><div className="flex items-center gap-3 sm:justify-end">{device.current ? <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">Current device</span> : <Button variant="outline" size="sm" onClick={() => setConfirming(device)} disabled={revokeMutation.isPending}><Trash2 className="size-4" /> Revoke</Button>}</div></div>)}</div>
            </FadeIn>
          )}
        </div>
      </div>
      {confirming && <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="revoke-title"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"><h2 id="revoke-title" className="text-lg font-semibold text-gray-800 dark:text-white/90">Revoke this device?</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{confirming.deviceName} will be signed out and lose access to this account.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button><Button onClick={() => revokeMutation.mutate(confirming.deviceId)} disabled={revokeMutation.isPending} startIcon={revokeMutation.isPending ? <Spinner size="sm" /> : undefined}>{revokeMutation.isPending ? "Revoking..." : "Revoke device"}</Button></div></div></div>}
    </>
  );
}
