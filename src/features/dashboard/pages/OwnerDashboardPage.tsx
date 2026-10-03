import { MetricCard } from "../../../components/data-display/MetricCard";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useDashboardMetrics } from "../hooks/useDashboard";

export function OwnerDashboardPage() {
  const { data: metricsData, refetch } = useDashboardMetrics();
  const metrics = metricsData?.data;

  return (
    <OwnerLayout title="Tổng quan cửa hàng" onRefresh={() => refetch()}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">
            Dashboard quản lý bán hàng & tồn kho
          </h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Theo dõi doanh thu, tồn kho, cảnh báo và các quyết định cần xử lý.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Doanh thu thuần"
            value={metrics?.netRevenue ? `${(metrics.netRevenue / 1_000_000).toFixed(1)} tr ₫` : "0 ₫"}
            delta="+0%"
            tone="success"
          />
          <MetricCard
            label="Số đơn hoàn tất"
            value={String(metrics?.completedOrdersCount ?? 0)}
            delta="Ổn định"
          />
          <MetricCard
            label="Tổng số lượng tồn"
            value={String(metrics?.totalStockQuantity ?? 0)}
            delta="Tồn kho"
            tone="warning"
          />
          <MetricCard
            label="Giá trị tồn kho"
            value={metrics?.inventoryValuation ? `${(metrics.inventoryValuation / 1_000_000).toFixed(1)} tr ₫` : "0 ₫"}
            delta="Định giá"
          />
        </section>
      </div>
    </OwnerLayout>
  );
}
