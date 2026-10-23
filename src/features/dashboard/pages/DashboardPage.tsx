import EcommerceMetrics from "@/features/dashboard/components/EcommerceMetrics";
import StatisticsChart from "@/features/dashboard/components/StatisticsChart";
import MonthlyTarget from "@/features/dashboard/components/MonthlyTarget";
import RecentOrders from "@/features/dashboard/components/RecentOrders";
import OrderStatusCard from "@/features/dashboard/components/OrderStatusCard";
import PageMeta from "@/components/common/PageMeta";

// Rows: KPIs, then trends, then orders. Paired rows split 8/4 so the columns line up.
export default function DashboardPage() {
  return (
    <>
      <PageMeta
        title="Dashboard | E-Commerce Admin"
        description="Sales, orders and products at a glance."
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <section className="col-span-12">
          <EcommerceMetrics />
        </section>

        <section className="col-span-12 xl:col-span-8">
          <StatisticsChart />
        </section>
        <section className="col-span-12 xl:col-span-4">
          <MonthlyTarget />
        </section>

        <section className="col-span-12 xl:col-span-8">
          <RecentOrders />
        </section>
        <section className="col-span-12 xl:col-span-4">
          <OrderStatusCard />
        </section>
      </div>
    </>
  );
}
