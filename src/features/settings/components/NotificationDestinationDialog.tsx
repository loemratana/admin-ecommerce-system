import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  NOTIFICATION_EVENTS,
  notificationDestinationSchema,
  type NotificationDestinationFormValues,
} from "@/features/settings/schemas/notification.schema";
import type { NotificationDestination } from "@/features/settings/types/notification.types";
import { EVENT_INFO } from "./notification.labels";
import { fieldClass } from "./SettingsForm";

type Props = {
  destination: NotificationDestination | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: NotificationDestinationFormValues) => void;
};

const toForm = (d: NotificationDestination | null): NotificationDestinationFormValues =>
  d
    ? { name: d.name, channel: d.channel, target: d.target, events: [...d.events], enabled: d.enabled }
    : { name: "", channel: "TELEGRAM", target: "", events: ["NEW_ORDER"], enabled: true };

export default function NotificationDestinationDialog({ destination, saving, error, onClose, onSubmit }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<NotificationDestinationFormValues>({
    resolver: zodResolver(notificationDestinationSchema),
    defaultValues: toForm(destination),
  });
  const channel = watch("channel");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="notification-dialog-title">
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="notification-dialog-title" className="text-lg font-semibold text-slate-900">
              {destination ? "Edit Destination" : "Add Destination"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">A Telegram group or an email address, and the events it receives.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-4 p-5">
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Name</span>
            <input {...register("name")} placeholder="Sales team" maxLength={100} className={fieldClass} />
            {errors.name && <span role="alert" className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Channel</span>
            <select {...register("channel")} className={fieldClass}>
              <option value="TELEGRAM">Telegram group</option>
              <option value="EMAIL">Email</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">{channel === "TELEGRAM" ? "Chat ID" : "Email address"}</span>
            <input
              {...register("target")}
              placeholder={channel === "TELEGRAM" ? "-1001234567890" : "team@example.com"}
              inputMode={channel === "TELEGRAM" ? "text" : "email"}
              className={`${fieldClass} font-mono`}
            />
            {errors.target ? (
              <span role="alert" className="mt-1 block text-xs text-red-600">{errors.target.message}</span>
            ) : (
              <span className="mt-1 block text-xs text-slate-400">
                {channel === "TELEGRAM"
                  ? "Group ids are negative. Add the bot to the group first, or the test message fails with \"chat not found\"."
                  : "Gets an HTML email for each selected event."}
              </span>
            )}
          </label>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">Events</legend>
            <div className="grid gap-2">
              {NOTIFICATION_EVENTS.map((event) => (
                <label key={event} className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" value={event} {...register("events")} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
                  <span>
                    <span className="font-medium text-slate-700">{EVENT_INFO[event].label}</span>
                    <span className="block text-xs text-slate-400">{EVENT_INFO[event].description}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.events && <span role="alert" className="mt-1 block text-xs text-red-600">{errors.events.message}</span>}
          </fieldset>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" {...register("enabled")} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Enabled
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Spinner size="sm" />}
            {saving ? "Saving..." : destination ? "Save Changes" : "Add Destination"}
          </button>
        </div>
      </form>
    </div>
  );
}
