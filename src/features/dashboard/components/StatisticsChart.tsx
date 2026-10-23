import { lazy, Suspense, useState } from "react";
import { ApexOptions } from "apexcharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactMoney, formatMoney } from "@/features/orders/utils/order.format";
import { useSalesOverview, type MonthBucket } from "@/features/dashboard/hooks/useDashboard";

const Chart = lazy(() => import("react-apexcharts"));

type Range = "monthly" | "quarterly";

const RANGES: { value: Range; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

function toQuarters(months: MonthBucket[]): MonthBucket[] {
  return [0, 1, 2, 3].map((q) => {
    const slice = months.slice(q * 3, q * 3 + 3);
    return {
      label: `Q${q + 1}`,
      orders: slice.reduce((sum, m) => sum + m.orders, 0),
      revenue: slice.reduce((sum, m) => sum + m.revenue, 0),
    };
  });
}

export default function StatisticsChart() {
  const { data, isLoading, isError } = useSalesOverview();
  const [range, setRange] = useState<Range>("monthly");
  const buckets = data ? (range === "monthly" ? data.months : toQuarters(data.months)) : [];
  const yearOrders = data?.months.reduce((sum, m) => sum + m.orders, 0) ?? 0;

  const options: ApexOptions = {
    legend: { show: true, position: "top", horizontalAlign: "left" },
    colors: ["#465FFF", "#9CB9FF"],
    chart: { fontFamily: "Outfit, sans-serif", height: 310, type: "area", toolbar: { show: false } },
    stroke: { curve: "smooth", width: [2, 2] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 0, strokeColors: "#fff", strokeWidth: 2, hover: { size: 6 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { enabled: true, shared: true },
    xaxis: {
      type: "category",
      categories: buckets.map((b) => b.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: [
      {
        seriesName: "Revenue",
        labels: { style: { fontSize: "12px", colors: ["#6B7280"] }, formatter: (val: number) => formatCompactMoney(val) },
      },
      {
        seriesName: "Orders",
        opposite: true,
        labels: { style: { fontSize: "12px", colors: ["#6B7280"] }, formatter: (val: number) => String(Math.round(val)) },
      },
    ],
  };

  const series = [
    { name: "Revenue", data: buckets.map((b) => Math.round(b.revenue * 100) / 100) },
    { name: "Orders", data: buckets.map((b) => b.orders) },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Statistics</h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Revenue and order volume for {new Date().getFullYear()}
            {data?.truncated && ` · based on the latest ${data.sampled.toLocaleString()} orders`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 self-start rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={`rounded-md px-3 py-2 text-theme-sm font-medium hover:text-gray-900 dark:hover:text-white ${
                range === option.value ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[310px] w-full" />
      ) : isError ? (
        <p className="py-24 text-center text-theme-sm text-red-500">Could not load statistics.</p>
      ) : (
        <>
          <div className="custom-scrollbar max-w-full overflow-x-auto">
            <div className="min-w-[1000px] xl:min-w-full">
              <Suspense fallback={<Skeleton className="h-[310px] w-full" />}>
                <Chart options={options} series={series} type="area" height={310} />
              </Suspense>
            </div>
          </div>
          {data && (
            <p className="mt-2 text-theme-xs text-gray-400">
              Year to date: {formatMoney(data.yearRevenue)} from {yearOrders.toLocaleString()} orders
            </p>
          )}
        </>
      )}
    </div>
  );
}
