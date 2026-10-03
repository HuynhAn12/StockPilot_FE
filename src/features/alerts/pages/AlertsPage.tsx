import { DataTable } from "../../../components/data-display/DataTable";
import { RiskBadge } from "../../../components/data-display/RiskBadge";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useAlerts } from "../hooks/useAlerts";

export function AlertsPage() {
  const { data, isLoading } = useAlerts({ status: "OPEN" });
  const alerts = data?.items || [];

  return (
    <OwnerLayout title="Cảnh báo tồn kho">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">Cảnh báo rủi ro tồn kho</h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Phát hiện sớm nguy cơ hết hàng, thừa hàng, ứ đọng và biến động nhu cầu bất thường.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-(--sp-text-muted)">Đang tải danh sách cảnh báo...</p>
        ) : (
          <DataTable
            columns={["Tiêu đề", "SKU", "Mức độ", "Trạng thái"]}
            rows={alerts.map((a) => [
              a.title,
              a.stockItem?.sku || `SKU-${a.stockItemId}`,
              <RiskBadge
                risk={
                  a.severity === "CRITICAL"
                    ? "critical"
                    : a.severity === "WARNING"
                    ? "high"
                    : "low"
                }
              />,
              a.status === "OPEN" ? "Chưa xử lý" : a.status,
            ])}
          />
        )}
      </div>
    </OwnerLayout>
  );
}
