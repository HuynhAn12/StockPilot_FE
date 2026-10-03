import { DataTable } from "../../../components/data-display/DataTable";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { ORDER_STATUS_LABELS } from "../constants";
import { useOrders } from "../hooks/useOrders";

export function OrdersPage() {
  const { data, isLoading } = useOrders();
  const orders = data?.items || [];

  return (
    <OwnerLayout title="Quản lý đơn hàng">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">Danh sách đơn hàng</h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Theo dõi đơn bán, trạng thái giao hàng và chi tiết thanh toán.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-(--sp-text-muted)">Đang tải đơn hàng...</p>
        ) : (
          <DataTable
            columns={["Mã đơn", "Khách hàng", "Tổng tiền", "Trạng thái"]}
            rows={orders.map((o) => [
              o.orderNumber,
              o.customerName || "Khách lẻ",
              `${o.totalAmount.toLocaleString("vi-VN")} ₫`,
              ORDER_STATUS_LABELS[o.status] || o.status,
            ])}
          />
        )}
      </div>
    </OwnerLayout>
  );
}
