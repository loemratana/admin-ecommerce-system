import { Link } from "react-router";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, formatMoney } from "@/features/orders/utils/order.format";
import { useRecentOrders } from "@/features/dashboard/hooks/useDashboard";

const headerClass = "py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";
const cellClass = "py-3 text-theme-sm text-gray-500 dark:text-gray-400";

export default function RecentOrders() {
  const { data: orders, isLoading, isError } = useRecentOrders(6);

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Orders</h3>
        <Link
          to="/sales/orders"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          See all
        </Link>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className={headerClass}>Order</TableCell>
              <TableCell isHeader className={headerClass}>Date</TableCell>
              <TableCell isHeader className={headerClass}>Total</TableCell>
              <TableCell isHeader className={headerClass}>Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading &&
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }, (_, j) => (
                    <TableCell key={j} className="py-4">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {orders?.map((order) => (
              <TableRow key={order.orderNumber}>
                <TableCell className="py-3">
                  <Link to={`/sales/orders/${order.orderNumber}`} className="text-theme-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">
                    #{order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell className={cellClass}>
                  {new Date(order.orderDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
                <TableCell className={`${cellClass} font-medium text-gray-800 dark:text-white/90`}>{formatMoney(Number(order.totalOrderPrice))}</TableCell>
                <TableCell className={cellClass}>
                  <Badge size="sm" color={ORDER_STATUS_COLOR[order.status]}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {isError && <p className="py-6 text-center text-theme-sm text-red-500">Could not load recent orders.</p>}
        {orders?.length === 0 && <p className="py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">No orders yet.</p>}
      </div>
    </div>
  );
}
