import { AlertTriangle, Archive, CheckCircle2, Package } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";

type ProductStatsProps = {
  total: number;
  active: number;
  activePercent: number;
  newThisMonth: number;
  lowStock: number;
  outOfStock: number;
  loading?: boolean;
};

export default function ProductStats({ total, active, activePercent, newThisMonth, lowStock, outOfStock, loading }: ProductStatsProps) {
  const stats = [
    {
      key: "total",
      label: "Total Products",
      value: total.toLocaleString(),
      hint: `${newThisMonth} new this month`,
      icon: <Package className="h-4 w-4 text-brand-500" />,
      badge: <Badge size="sm" color="primary">+{newThisMonth}</Badge>,
    },
    {
      key: "active",
      label: "Active Products",
      value: active.toLocaleString(),
      hint: `${activePercent.toFixed(0)}% of catalog`,
      icon: <CheckCircle2 className="h-4 w-4 text-success-500" />,
      badge: <Badge size="sm" color="success">{activePercent.toFixed(0)}%</Badge>,
    },
    {
      key: "lowStock",
      label: "Low Stock",
      value: lowStock.toLocaleString(),
      hint: lowStock > 0 ? "Needs attention" : "All healthy",
      icon: <AlertTriangle className="h-4 w-4 text-warning-500" />,
      badge: <Badge size="sm" color={lowStock > 0 ? "warning" : "light"}>{lowStock > 0 ? "Low" : "OK"}</Badge>,
    },
    {
      key: "outOfStock",
      label: "Out of Stock",
      value: outOfStock.toLocaleString(),
      hint: outOfStock > 0 ? "Needs restocking" : "In stock",
      icon: <Archive className="h-4 w-4 text-error-500" />,
      badge: <Badge size="sm" color={outOfStock > 0 ? "error" : "success"}>{outOfStock > 0 ? "Restock" : "Full"}</Badge>,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.key}
          className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              {item.icon}
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {loading ? <Skeleton className="h-6 w-14" /> : item.value}
            </h4>
            {!loading && item.badge}
          </div>
          {item.hint && (
            <p className="mt-1 truncate text-theme-xs text-gray-400 dark:text-gray-500">{loading ? "" : item.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}
