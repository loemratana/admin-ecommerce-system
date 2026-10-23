import { AlertTriangle, Archive, Boxes, CheckCircle2 } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryStatsResponse } from "@/features/inventory/types/inventory.types";

type Props = { stats?: InventoryStatsResponse; isLoading?: boolean };

export default function InventoryStats({ stats, isLoading }: Props) {
  const items = [
    {
      key: "totalVariants",
      label: "Total Variants",
      value: stats?.totalVariants.toLocaleString(),
      hint: "All tracked variants",
      icon: <Boxes className="h-4 w-4 text-brand-500" />,
      badge: <Badge size="sm" color="info">Total</Badge>,
    },
    {
      key: "inStock",
      label: "In Stock",
      value: stats?.inStock.toLocaleString(),
      hint: stats && stats.totalVariants > 0 ? `${Math.round((stats.inStock / stats.totalVariants) * 100)}% available` : "Available variants",
      icon: <CheckCircle2 className="h-4 w-4 text-success-500" />,
      badge: <Badge size="sm" color="success">In stock</Badge>,
    },
    {
      key: "lowStock",
      label: "Low Stock",
      value: stats?.lowStock.toLocaleString(),
      hint: stats && stats.lowStock > 0 ? "Under re-order threshold" : "Stock is healthy",
      icon: <AlertTriangle className="h-4 w-4 text-warning-500" />,
      badge: <Badge size="sm" color={(stats?.lowStock ?? 0) > 0 ? "warning" : "light"}>{(stats?.lowStock ?? 0) > 0 ? "Warning" : "Good"}</Badge>,
    },
    {
      key: "outOfStock",
      label: "Out of Stock",
      value: stats?.outOfStock.toLocaleString(),
      hint: stats && stats.outOfStock > 0 ? "Requires restocking" : "Zero depleted items",
      icon: <Archive className="h-4 w-4 text-error-500" />,
      badge: <Badge size="sm" color={(stats?.outOfStock ?? 0) > 0 ? "error" : "success"}>{(stats?.outOfStock ?? 0) > 0 ? "Out" : "None"}</Badge>,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
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
              {isLoading || !stats || item.value === undefined ? <Skeleton className="h-6 w-14" /> : item.value}
            </h4>
            {!isLoading && stats && item.badge}
          </div>
          {item.hint && (
            <p className="mt-1 truncate text-theme-xs text-gray-400 dark:text-gray-500">{isLoading || !stats ? "" : item.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}
