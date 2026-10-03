import { MetricCard } from "../../../components/data-display/MetricCard";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useAnalyticsSummary } from "../hooks/useAnalytics";

export function AnalyticsPage() {
  const { data } = useAnalyticsSummary();
  const metrics = data?.data;

  return (
    <OwnerLayout title="Phân tích bán hàng">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">Báo cáo phân tích doanh thu</h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Theo dõi hiệu quả doanh thu thuần, số lượng đơn và biến động theo chu kỳ.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Doanh thu tích lũy"
            value={metrics?.grossRevenue ? `${(metrics.grossRevenue / 1_000_000).toFixed(1)} tr ₫` : "0 ₫"}
            delta="+0%"
            tone="success"
          />
          <MetricCard
            label="Số tiền hoàn trả"
            value={metrics?.refundedAmount ? `${(metrics.refundedAmount / 1_000_000).toFixed(1)} tr ₫` : "0 ₫"}
            delta="Hoàn trả"
          />
          <MetricCard
            label="Doanh thu thuần"
            value={metrics?.netRevenue ? `${(metrics.netRevenue / 1_000_000).toFixed(1)} tr ₫` : "0 ₫"}
            delta="Thuần"
            tone="success"
          />
        </div>
      </div>
    </OwnerLayout>
  );
}
