import { lazy, Suspense } from "react";
import { ApexOptions } from "apexcharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactMoney, formatMoney } from "@/features/orders/utils/order.format";
import { percentChange, useSalesOverview } from "@/features/dashboard/hooks/useDashboard";
import TrendBadge from "./TrendBadge";

const Chart = lazy(() => import("react-apexcharts"));

// No target is stored on the backend yet, so last month's revenue is the target to beat.
export default function MonthlyTarget() {
  const { data, isLoading } = useSalesOverview();
  const target = data?.lastMonth.revenue ?? 0;
  const revenue = data?.thisMonth.revenue ?? 0;
  const progress = target > 0 ? Math.min(100, (revenue / target) * 100) : revenue > 0 ? 100 : 0;
  const change = data ? percentChange(revenue, target) : null;

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: { fontFamily: "Outfit, sans-serif", type: "radialBar", height: 330, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: "80%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: { fontSize: "36px", fontWeight: "600", offsetY: -40, color: "#1D2939", formatter: (val) => `${Number(val).toFixed(1)}%` },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
    labels: ["Progress"],
  };

  let message = "";
  if (data) {
    if (target === 0) message = `You've earned ${formatMoney(revenue)} this month. There's no revenue from last month to compare against yet.`;
    else if (revenue >= target) message = `You've earned ${formatMoney(revenue)} this month, already ahead of last month. Keep up the good work!`;
    else message = `You've earned ${formatMoney(revenue)} this month, ${formatMoney(target - revenue)} short of last month's total.`;
  }

  const figures = [
    { label: "Target", value: target },
    { label: "Revenue", value: revenue },
    { label: "Today", value: data?.todayRevenue ?? 0 },
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex-1 rounded-2xl bg-white px-5 pb-11 pt-5 shadow-default dark:bg-gray-900 sm:px-6 sm:pt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Monthly Target</h3>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">This month's revenue vs last month's</p>
        <div className="relative">
          {isLoading ? (
            <Skeleton className="mx-auto mt-6 h-[200px] w-[300px] rounded-full" />
          ) : (
            <div className="max-h-[330px]" id="chartDarkStyle">
              <Suspense fallback={<Skeleton className="mx-auto mt-6 h-[200px] w-[300px] rounded-full" />}>
                <Chart options={options} series={[Math.round(progress * 10) / 10]} type="radialBar" height={330} />
              </Suspense>
            </div>
          )}
          {data && (
            <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%]">
              <TrendBadge value={change} />
            </span>
          )}
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">{message}</p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        {figures.map((item, index) => (
          <div key={item.label} className="flex items-center gap-5 sm:gap-8">
            {index > 0 && <div className="h-7 w-px bg-gray-200 dark:bg-gray-800" />}
            <div>
              <p className="mb-1 text-center text-theme-xs text-gray-500 dark:text-gray-400 sm:text-sm">{item.label}</p>
              <p className="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
                {data ? formatCompactMoney(item.value) : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
