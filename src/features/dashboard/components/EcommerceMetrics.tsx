import type { ReactNode } from "react";
import { DollarSign, Package, Receipt, ShoppingBag } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductStats } from "@/features/products/hooks/useProducts";
import { formatMoney } from "@/features/orders/utils/order.format";
import { percentChange, useSalesOverview } from "@/features/dashboard/hooks/useDashboard";
import TrendBadge from "./TrendBadge";

function MetricCard({ icon, label, value, badge, hint }: { icon: ReactNode; label: string; value: ReactNode; badge?: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">{value}</h4>
        {badge}
      </div>
      {hint && <p className="mt-1 truncate text-theme-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

export default function EcommerceMetrics() {
  const sales = useSalesOverview();
  const products = useProductStats();
  const s = sales.data;
  const p = products.data;
  const loading = <Skeleton className="h-6 w-16" />;
  const avgOrder = s && s.thisMonth.orders > 0 ? s.thisMonth.revenue / s.thisMonth.orders : 0;
  const lastAvg = s && s.lastMonth.orders > 0 ? s.lastMonth.revenue / s.lastMonth.orders : 0;
  const iconClass = "h-4 w-4 text-gray-800 dark:text-white/90";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon={<DollarSign className={iconClass} />}
        label="Revenue this month"
        value={s ? formatMoney(s.thisMonth.revenue) : loading}
        badge={s && <TrendBadge value={percentChange(s.thisMonth.revenue, s.lastMonth.revenue)} />}
        hint={s ? `${formatMoney(s.lastMonth.revenue)} last month` : undefined}
      />
      <MetricCard
        icon={<ShoppingBag className={iconClass} />}
        label="Orders this month"
        value={s ? s.thisMonth.orders.toLocaleString() : loading}
        badge={s && <TrendBadge value={percentChange(s.thisMonth.orders, s.lastMonth.orders)} />}
        hint={s ? `${s.totalOrders.toLocaleString()} orders all time` : undefined}
      />
      <MetricCard
        icon={<Receipt className={iconClass} />}
        label="Avg. order value"
        value={s ? formatMoney(avgOrder) : loading}
        badge={s && <TrendBadge value={percentChange(avgOrder, lastAvg)} />}
        hint="Paid orders this month"
      />
      <MetricCard
        icon={<Package className={iconClass} />}
        label="Products"
        value={p ? p.totalProducts.toLocaleString() : loading}
        badge={p && <Badge color="success">+{p.newThisMonth} new</Badge>}
        hint={p ? `${p.activeProducts.toLocaleString()} active · ${p.outOfStock} out of stock` : undefined}
      />
      {sales.isError && <p className="text-theme-sm text-red-500 sm:col-span-2 xl:col-span-4">Could not load order figures. Admin access is required for /orders.</p>}
    </div>
  );
}
