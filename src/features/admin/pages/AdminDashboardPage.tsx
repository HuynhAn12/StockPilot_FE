import { MetricCard } from "../../../components/data-display/MetricCard";
import { AdminLayout } from "../../../layouts/AdminLayout";
import { useSystemHealth } from "../hooks/useAdmin";

export function AdminDashboardPage() {
  const { data: health } = useSystemHealth();

  return (
    <AdminLayout title="Tổng quan hệ thống">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">Bảng điều khiển quản trị hệ thống</h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Giám sát sức khỏe hạ tầng máy chủ, người dùng, cửa hàng và luồng AI decision engine.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="Trạng thái hệ thống"
            value={health?.status === "OK" ? "Hoạt động tốt" : "Sẵn sàng"}
            delta="Hạ tầng"
            tone="success"
          />
          <MetricCard
            label="Kết nối cơ sở dữ liệu"
            value={health?.database === "CONNECTED" ? "Đã kết nối" : "Sẵn sàng"}
            delta="MySQL"
            tone="neutral"
          />
        </div>
      </div>
    </AdminLayout>
  );
}
