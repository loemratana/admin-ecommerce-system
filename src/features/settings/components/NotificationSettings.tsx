import { useState } from "react";
import { CircleCheck, Mail, Pencil, Plus, Send, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useDeleteNotificationDestination,
  useNotificationChannels,
  useNotificationDestinations,
  useSaveNotificationDestination,
  useSendTestNotification,
} from "@/features/settings/hooks/useNotificationDestinations";
import { useSettings, useUpdateSettings } from "@/features/settings/hooks/useSettings";
import type { NotificationDestinationFormValues } from "@/features/settings/schemas/notification.schema";
import type { NotificationChannel, NotificationDestination } from "@/features/settings/types/notification.types";
import NotificationDestinationDialog from "./NotificationDestinationDialog";
import { CHANNEL_INFO, EVENT_INFO } from "./notification.labels";

const CHANNELS: NotificationChannel[] = ["TELEGRAM", "EMAIL"];

/** Store setting (Settings → notifications section); saved as soon as it is switched. */
function CustomerOrderEmailToggle({ emailConfigured }: { emailConfigured: boolean | undefined }) {
  const { data: settings } = useSettings();
  const mutation = useUpdateSettings("notifications");
  const on = settings?.notifications.customerOrderEmail ?? false;

  const toggle = async () => {
    try {
      await mutation.mutateAsync({ customerOrderEmail: !on });
      toast.success(on ? "Order confirmation emails turned off" : "Order confirmation emails turned on");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <div className="text-sm">
            <div id="customer-order-email-label" className="font-medium text-slate-700">Email customers an order confirmation</div>
            <div className="text-xs text-slate-500">
              Sent to the customer's account email when they place an order: items, totals, shipping address and your store contact.
            </div>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="customer-order-email-label"
          disabled={!settings || mutation.isPending}
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${on ? "bg-blue-600" : "bg-slate-300"}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      {on && emailConfigured === false && (
        <div className="mt-2 flex items-start gap-1 pl-7 text-xs text-amber-700">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Email is not configured on the server, so nothing is sent yet. {CHANNEL_INFO.EMAIL.setup}</span>
        </div>
      )}
    </div>
  );
}
const ChannelIcon = ({ channel, className }: { channel: NotificationChannel; className?: string }) =>
  channel === "TELEGRAM" ? <Send className={className} /> : <Mail className={className} />;

/** Settings → Notifications: which Telegram groups and email addresses get which store events. Saved per destination, not with a form footer. */
export default function NotificationSettings() {
  const { data: destinations, isLoading, error } = useNotificationDestinations();
  const { data: channels } = useNotificationChannels();
  const save = useSaveNotificationDestination();
  const remove = useDeleteNotificationDestination();
  const test = useSendTestNotification();

  // undefined = dialog closed, null = adding, otherwise editing that destination
  const [editing, setEditing] = useState<NotificationDestination | null | undefined>(undefined);
  const [dialogError, setDialogError] = useState("");
  const [testingId, setTestingId] = useState<number | null>(null);

  const openDialog = (destination: NotificationDestination | null) => {
    setDialogError("");
    setEditing(destination);
  };

  const submit = async (values: NotificationDestinationFormValues) => {
    try {
      await save.mutateAsync({ id: editing?.id ?? null, payload: values });
      toast.success(editing ? "Destination saved" : "Destination added");
      setEditing(undefined);
    } catch (e) {
      setDialogError(getApiErrorMessage(e));
    }
  };

  const toggleEnabled = async (d: NotificationDestination) => {
    try {
      await save.mutateAsync({ id: d.id, payload: { name: d.name, channel: d.channel, target: d.target, events: d.events, enabled: !d.enabled } });
      toast.success(d.enabled ? `"${d.name}" paused` : `"${d.name}" enabled`);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const sendTest = async (d: NotificationDestination) => {
    setTestingId(d.id);
    try {
      await test.mutateAsync(d.id);
      toast.success(`Test message sent to "${d.name}"`);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setTestingId(null);
    }
  };

  const deleteDestination = async (d: NotificationDestination) => {
    if (!window.confirm(`Delete "${d.name}"? It stops receiving notifications.`)) return;
    try {
      await remove.mutateAsync(d.id);
      toast.success("Destination deleted");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <CustomerOrderEmailToggle emailConfigured={channels?.EMAIL} />

      {/* Credentials live on the server; this only says whether they are set. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((channel) => {
          const configured = channels?.[channel];
          return (
            <div key={channel} className="flex items-start gap-3 rounded-lg border border-slate-200 px-4 py-3">
              <ChannelIcon channel={channel} className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0 text-sm">
                <div className="font-medium text-slate-700">{CHANNEL_INFO[channel].label}</div>
                {channels === undefined ? (
                  <div className="text-xs text-slate-400">Checking…</div>
                ) : configured ? (
                  <div className="flex items-center gap-1 text-xs text-green-700"><CircleCheck className="h-3.5 w-3.5" /> Connected</div>
                ) : (
                  <div className="flex items-start gap-1 text-xs text-amber-700">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Not configured. {CHANNEL_INFO[channel].setup}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <details className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <summary className="cursor-pointer font-medium">How to add a Telegram group</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Add the store's bot to the group (one bot serves every group).</li>
          <li>Send any message in the group, then open <code className="rounded bg-white/70 px-1">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> and copy <code className="rounded bg-white/70 px-1">chat.id</code> (it looks like -100…).</li>
          <li>Add it here with the events the group should get, then press <strong>Test</strong>.</li>
        </ol>
      </details>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Destinations</h3>
          <button type="button" onClick={() => openDialog(null)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add destination
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(error)}</div>
        ) : isLoading ? (
          <div className="flex justify-center py-10"><Spinner size="md" /></div>
        ) : !destinations?.length ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
            No destinations yet, so no notifications are sent. Add a Telegram group or an email address.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {destinations.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <ChannelIcon channel={d.channel} className={`mt-1 h-4 w-4 shrink-0 ${d.enabled ? "text-blue-600" : "text-slate-300"}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-medium ${d.enabled ? "text-slate-800" : "text-slate-400"}`}>{d.name}</span>
                      {!d.enabled && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">Paused</span>}
                    </div>
                    <div className="truncate font-mono text-xs text-slate-500">{d.target}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {d.events.map((event) => (
                        <span key={event} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{EVENT_INFO[event].label}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <label className="mr-1 flex items-center gap-1.5 text-xs text-slate-500" title={d.enabled ? "Pause" : "Enable"}>
                    <input type="checkbox" checked={d.enabled} disabled={save.isPending} onChange={() => toggleEnabled(d)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                    On
                  </label>
                  <button
                    type="button"
                    disabled={testingId !== null || !channels?.[d.channel]}
                    title={channels?.[d.channel] ? "Send a test message now" : `${CHANNEL_INFO[d.channel].label} is not configured on the server`}
                    onClick={() => sendTest(d)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {testingId === d.id ? <Spinner size="sm" /> : <Send className="h-3.5 w-3.5" />} Test
                  </button>
                  <button type="button" onClick={() => openDialog(d)} aria-label={`Edit ${d.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => deleteDestination(d)} aria-label={`Delete ${d.name}`} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing !== undefined && (
        <NotificationDestinationDialog
          destination={editing}
          saving={save.isPending}
          error={dialogError}
          onClose={() => setEditing(undefined)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
