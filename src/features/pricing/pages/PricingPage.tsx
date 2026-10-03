import { DataTable } from "../../../components/data-display/DataTable";
import { Badge } from "../../../components/ui/Badge";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { PRICING_ACTION_LABELS } from "../constants";
import { usePricingRecommendations } from "../hooks/usePricing";

export function PricingPage() {
  const { data, isLoading } = usePricingRecommendations({ status: "PENDING" });
  const recommendations = data?.items || [];

  return (
    <OwnerLayout title="Gợi ý giá bán">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">Đề xuất giá thông minh</h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Xem xét và phê duyệt các đề xuất điều chỉnh giá bán dựa trên thuật toán tối ưu tồn kho và biên lợi nhuận.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-(--sp-text-muted)">Đang tải đề xuất giá...</p>
        ) : (
          <DataTable
            columns={["Sản phẩm", "Giá hiện tại", "Giá đề xuất", "Đề xuất", "Trạng thái"]}
            rows={recommendations.map((r) => [
              r.stockItem?.name || `SKU-${r.stockItemId}`,
              `${r.currentPrice.toLocaleString("vi-VN")} ₫`,
              `${r.recommendedPrice.toLocaleString("vi-VN")} ₫`,
              <Badge tone={r.action === "INCREASE" ? "info" : r.action === "DECREASE" ? "warning" : "neutral"}>
                {PRICING_ACTION_LABELS[r.action] || r.action}
              </Badge>,
              r.status === "PENDING" ? "Chờ duyệt" : r.status,
            ])}
          />
        )}
      </div>
    </OwnerLayout>
  );
}
