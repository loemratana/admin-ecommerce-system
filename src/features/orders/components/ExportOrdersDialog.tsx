import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useExportOrders } from "@/features/orders/hooks/useOrders";
import type { OrderStatus } from "@/features/orders/types/order.types";
import { ORDER_FLOW, ORDER_STATUS_LABEL } from "@/features/orders/utils/order.format";

// Must match OrderExcelExporter.MAX_RANGE_DAYS on the backend.
const MAX_RANGE_DAYS = 366;
const ALL = "ALL";
const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  ...[...ORDER_FLOW, "CANCELLED" as const].map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
];

// yyyy-MM-dd in local time (toISOString would shift the day for timezones ahead of UTC).
function isoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

const PRESETS = [
  { label: "This month", range: () => { const now = new Date(); return [new Date(now.getFullYear(), now.getMonth(), 1), now]; } },
  { label: "Last 30 days", range: () => [daysAgo(29), new Date()] },
  { label: "Last 90 days", range: () => [daysAgo(89), new Date()] },
  { label: "This year", range: () => { const now = new Date(); return [new Date(now.getFullYear(), 0, 1), now]; } },
];

type Props = { isOpen: boolean; onClose: () => void; defaultStatus?: OrderStatus };

export default function ExportOrdersDialog({ isOpen, onClose, defaultStatus }: Props) {
  const exportMutation = useExportOrders();
  const [from, setFrom] = useState(() => isoDate(daysAgo(29)));
  const [to, setTo] = useState(() => isoDate(new Date()));
  const [status, setStatus] = useState<string>(defaultStatus ?? ALL);

  // Start from the status the orders list is filtered by.
  useEffect(() => {
    if (isOpen) setStatus(defaultStatus ?? ALL);
  }, [isOpen, defaultStatus]);

  const rangeDays = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
  const error = !from || !to ? "Pick both dates." : rangeDays < 0 ? "'From' must be on or before 'To'." : rangeDays > MAX_RANGE_DAYS ? `The range can be at most ${MAX_RANGE_DAYS} days.` : undefined;

  const submit = async () => {
    if (error) return;
    try {
      await exportMutation.mutateAsync({ from, to, status: status === ALL ? undefined : (status as OrderStatus) });
      toast.success("Orders exported");
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md m-4">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Export orders to Excel</h2>
        <p className="mt-1 text-sm text-slate-500">Orders placed in the date range, with one sheet per order and one per item.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => { const [start, end] = preset.range(); setFrom(isoDate(start)); setTo(isoDate(end)); }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="export-from">From</Label>
            <input id="export-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label htmlFor="export-to">To</Label>
            <input id="export-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-4">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus} options={STATUS_OPTIONS} placeholder="All statuses" />
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={Boolean(error) || exportMutation.isPending} startIcon={exportMutation.isPending ? <Spinner size="sm" /> : undefined}>
            {exportMutation.isPending ? "Exporting..." : "Download .xlsx"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
