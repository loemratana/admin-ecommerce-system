import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/features/orders/api/orders.api";
import type { OrderStatus, OrderSummaryResponse } from "@/features/orders/types/order.types";
import { REVENUE_STATUSES } from "@/features/orders/utils/order.format";

// There is no dedicated analytics endpoint yet, so the dashboard aggregates the
// admin order list client-side. One request covers the last 12+ months for a
// small/medium shop; swap this for a /dashboard endpoint when volume grows.
const ORDER_SAMPLE_SIZE = 1000;

export const dashboardKeys = {
  all: ["dashboard"] as const,
  orders: () => [...dashboardKeys.all, "orders"] as const,
  recentOrders: (size: number) => [...dashboardKeys.all, "recent-orders", size] as const,
};

export interface MonthBucket {
  label: string;
  orders: number;
  revenue: number;
}

export interface SalesOverview {
  months: MonthBucket[]; // Jan..Dec of the current year
  totalOrders: number; // all-time, from totalElements
  thisMonth: MonthBucket;
  lastMonth: MonthBucket;
  todayRevenue: number;
  yearRevenue: number;
  statusCounts: Record<OrderStatus, number>;
  sampled: number; // how many orders the figures are based on
  truncated: boolean; // true when more orders exist than were sampled
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const isRevenue = (order: OrderSummaryResponse) => REVENUE_STATUSES.includes(order.status);

export function summarizeOrders(orders: OrderSummaryResponse[], totalOrders: number, now = new Date()): SalesOverview {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastMonthDate = new Date(year, month - 1, 1);
  const todayKey = now.toDateString();

  const months: MonthBucket[] = MONTH_LABELS.map((label) => ({ label, orders: 0, revenue: 0 }));
  const lastMonth: MonthBucket = { label: MONTH_LABELS[lastMonthDate.getMonth()], orders: 0, revenue: 0 };
  const statusCounts: Record<OrderStatus, number> = { PENDING: 0, PAID: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
  let todayRevenue = 0;

  for (const order of orders) {
    const date = new Date(order.orderDate);
    const amount = isRevenue(order) ? Number(order.totalOrderPrice) || 0 : 0;
    statusCounts[order.status] += 1;

    if (date.getFullYear() === year) {
      months[date.getMonth()].orders += 1;
      months[date.getMonth()].revenue += amount;
    }
    if (date.getFullYear() === lastMonthDate.getFullYear() && date.getMonth() === lastMonthDate.getMonth()) {
      lastMonth.orders += 1;
      lastMonth.revenue += amount;
    }
    if (date.toDateString() === todayKey) todayRevenue += amount;
  }

  return {
    months,
    totalOrders,
    thisMonth: months[month],
    lastMonth,
    todayRevenue,
    yearRevenue: months.reduce((sum, bucket) => sum + bucket.revenue, 0),
    statusCounts,
    sampled: orders.length,
    truncated: totalOrders > orders.length,
  };
}

export function useSalesOverview() {
  return useQuery({
    queryKey: dashboardKeys.orders(),
    queryFn: async () => {
      const page = (await getOrders({ page: 0, size: ORDER_SAMPLE_SIZE, sort: "orderDate,desc" })).data.data;
      return summarizeOrders(page.content, page.totalElements);
    },
    staleTime: 60_000,
  });
}

export function useRecentOrders(size = 5) {
  return useQuery({
    queryKey: dashboardKeys.recentOrders(size),
    queryFn: async () => (await getOrders({ page: 0, size, sort: "orderDate,desc" })).data.data.content,
  });
}

// Percentage change from previous to current; null when there is no baseline.
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
