import { DataTable } from "../../../components/data-display/DataTable";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useInventoryBalances } from "../hooks/useInventory";

export function InventoryPage() {
  const { data, isLoading } = useInventoryBalances();
  const balances = data?.items || [];

  return (
    <OwnerLayout title="Quản lý tồn kho">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">Tồn kho hiện tại</h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Theo dõi số lượng tồn, hàng khả dụng và lịch sử biến động kho.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-(--sp-text-muted)">Đang tải dữ liệu tồn kho...</p>
        ) : (
          <DataTable
            columns={["SKU", "Tên mặt hàng", "Số lượng tồn", "Đang giữ chỗ"]}
            rows={balances.map((b) => [
              b.stockItem?.sku || `SKU-${b.stockItemId}`,
              b.stockItem?.name || "Mặt hàng",
              String(b.quantity),
              String(b.reservedQuantity),
            ])}
          />
        )}
      </div>
    </OwnerLayout>
  );
}
