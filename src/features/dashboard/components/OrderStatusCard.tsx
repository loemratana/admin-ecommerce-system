import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { ApexOptions } from "apexcharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderStatus } from "@/features/orders/types/order.types";
import { ORDER_STATUS_LABEL } from "@/features/orders/utils/order.format";
import { useSalesOverview } from "@/features/dashboard/hooks/useDashboard";

const Chart = lazy(() => import("react-apexcharts"));

const STATUS_ORDER: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "#F79009",
  PAID: "#0BA5EC",
  PROCESSING: "#465FFF",
  SHIPPED: "#7A5AF8",
  DELIVERED: "#12B76A",
  CANCELLED: "#F04438",
};

export default function OrderStatusCard() {
  const { data, isLoading, isError } = useSalesOverview();
  const counts = STATUS_ORDER.map((status) => data?.statusCounts[status] ?? 0);
  const total = counts.reduce((sum, n) => sum + n, 0);

  const options: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "donut" },
    labels: STATUS_ORDER.map((status) => ORDER_STATUS_LABEL[status]),
    colors: STATUS_ORDER.map((status) => STATUS_COLORS[status]),
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: { show: true, total: { show: true, label: "Orders", formatter: () => total.toLocaleString() } },
        },
      },
    },
  };

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Order Status</h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Where your orders are in fulfilment</p>
        </div>
        <Link to="/sales/orders" className="text-theme-sm font-medium text-brand-500 hover:text-brand-600">
          View orders
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="mx-auto my-6 h-[200px] w-[200px] rounded-full" />
      ) : isError ? (
        <p className="py-16 text-center text-theme-sm text-red-500">Could not load orders.</p>
      ) : total === 0 ? (
        <p className="py-16 text-center text-theme-sm text-gray-500 dark:text-gray-400">No orders yet.</p>
      ) : (
        <div className="my-4 flex justify-center">
          <Suspense fallback={<Skeleton className="my-6 h-[200px] w-[200px] rounded-full" />}>
            <Chart options={options} series={counts} type="donut" width={260} />
          </Suspense>
        </div>
      )}

      <div className="space-y-3">
        {STATUS_ORDER.map((status, i) => {
          const pct = total > 0 ? (counts[i] / total) * 100 : 0;
          return (
            <div key={status} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                <span className="text-theme-sm text-gray-700 dark:text-gray-300">{ORDER_STATUS_LABEL[status]}</span>
              </div>
              <div className="flex w-full max-w-[160px] items-center gap-3">
                <div className="relative h-2 w-full rounded-sm bg-gray-200 dark:bg-gray-800">
                  <div className="absolute left-0 top-0 h-full rounded-sm" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }} />
                </div>
                <p className="w-10 text-right text-theme-sm font-medium text-gray-800 dark:text-white/90">{counts[i]}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
