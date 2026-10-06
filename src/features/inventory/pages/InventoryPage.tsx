import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  History,
  Package,
  Scale,
  Search,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useInventoryBalances, useStockMovements } from "../hooks/useInventory";
import { AuditAdjustmentModal } from "../components/AuditAdjustmentModal";

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"balances" | "movements">("balances");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const { data: balanceData, isLoading: isLoadingBalances, refetch: refetchBalances } =
    useInventoryBalances();
  const { data: movementData, isLoading: isLoadingMovements, refetch: refetchMovements } =
    useStockMovements();

  const balances = balanceData?.items || [];
  const movements = movementData?.items || [];

  const filteredBalances = balances.filter(
    (b) =>
      b.stockItem?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.stockItem?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQuantity = balances.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
  const totalReserved = balances.reduce((sum, b) => sum + Number(b.reservedQuantity || 0), 0);
  const totalAvailable = totalQuantity - totalReserved;

  const handleRefresh = () => {
    refetchBalances();
    refetchMovements();
  };

  return (
    <OwnerLayout title="Quản lý tồn kho" onRefresh={handleRefresh}>
      <div className="grid gap-6">
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">Quản lý tồn kho</h1>
            <p className="mt-1 text-sm text-(--sp-text-muted)">
              Theo dõi số lượng tồn, hàng giữ chỗ cho đơn và lịch sử xuất nhập kho từ Backend API.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Boxes className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Tổng số lượng tồn</p>
                <p className="text-xl font-bold text-(--sp-text)">{totalQuantity.toLocaleString("vi-VN")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <Package className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Hàng sẵn sàng bán</p>
                <p className="text-xl font-bold text-emerald-700">
                  {Math.max(0, totalAvailable).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Đang giữ chỗ cho đơn</p>
                <p className="text-xl font-bold text-amber-700">{totalReserved.toLocaleString("vi-VN")}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-purple-50 text-purple-600">
                <History className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Số mặt hàng (SKU)</p>
                <p className="text-xl font-bold text-purple-700">{balances.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* View Tabs & Search & Action Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 border-b border-(--sp-border) pb-2 sm:border-b-0 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("balances")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "balances"
                  ? "bg-(--sp-primary) text-white shadow-xs"
                  : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
              }`}
            >
              Tồn kho hiện tại ({balances.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("movements")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "movements"
                  ? "bg-(--sp-primary) text-white shadow-xs"
                  : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
              }`}
            >
              Lịch sử biến động ({movements.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === "balances" && (
              <div className="w-full sm:w-64 relative">
                <Search className="absolute left-3 top-2.5 size-4 text-(--sp-text-muted)" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm SKU hoặc tên mặt hàng..."
                  className="pl-9"
                />
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAuditModalOpen(true)}
              className="gap-1.5 whitespace-nowrap"
            >
              <Scale className="size-4" />
              Cân tồn nhanh
            </Button>
          </div>
        </div>

        {/* Balances Tab Table */}
        {activeTab === "balances" && (
          <Card className="overflow-hidden border-(--sp-border)">
            {isLoadingBalances ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredBalances.length === 0 ? (
              <div className="py-12 text-center">
                <Boxes className="mx-auto size-12 text-(--sp-text-muted)/50" />
                <h3 className="mt-3 text-base font-semibold text-(--sp-text)">Chưa có dữ liệu tồn kho</h3>
                <p className="mt-1 text-sm text-(--sp-text-muted)">
                  Chưa ghi nhận số dư tồn kho cho các SKU trong cửa hàng.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                    <tr>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Tên mặt hàng</th>
                      <th className="px-4 py-3">Kho hàng</th>
                      <th className="px-4 py-3 text-right">Tổng tồn</th>
                      <th className="px-4 py-3 text-right">Đang giữ chỗ</th>
                      <th className="px-4 py-3 text-right">Khả dụng</th>
                      <th className="px-4 py-3 text-center">Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--sp-border)">
                    {filteredBalances.map((b) => {
                      const avail = Number(b.quantity) - Number(b.reservedQuantity);
                      const isLowStock = avail <= 5;
                      return (
                        <tr key={b.id} className="hover:bg-(--sp-bg-subtle)/50 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-medium text-(--sp-text)">
                            {b.stockItem?.sku || `SKU-${b.stockItemId}`}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-(--sp-text)">
                            {b.stockItem?.name || `Mặt hàng #${b.stockItemId}`}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-(--sp-text-muted)">
                            Kho #{b.warehouseId}
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold text-(--sp-text)">
                            {Number(b.quantity).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-3.5 text-right text-amber-600 font-medium">
                            {Number(b.reservedQuantity).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                            {Math.max(0, avail).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Badge tone={avail === 0 ? "danger" : isLowStock ? "warning" : "success"}>
                              {avail === 0 ? "Hết hàng" : isLowStock ? "Sắp hết" : "Đủ hàng"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Movements Tab Table */}
        {activeTab === "movements" && (
          <Card className="overflow-hidden border-(--sp-border)">
            {isLoadingMovements ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : movements.length === 0 ? (
              <div className="py-12 text-center">
                <History className="mx-auto size-12 text-(--sp-text-muted)/50" />
                <h3 className="mt-3 text-base font-semibold text-(--sp-text)">Chưa có biến động kho</h3>
                <p className="mt-1 text-sm text-(--sp-text-muted)">
                  Lịch sử nhập, xuất và điều chỉnh kho sẽ hiển thị ở đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                    <tr>
                      <th className="px-4 py-3">Loại biến động</th>
                      <th className="px-4 py-3">Mã tham chiếu</th>
                      <th className="px-4 py-3 text-right">Biến động</th>
                      <th className="px-4 py-3 text-right">Trước / Sau</th>
                      <th className="px-4 py-3">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--sp-border)">
                    {movements.map((m) => {
                      const isPositive = Number(m.delta) > 0;
                      return (
                        <tr key={m.id} className="hover:bg-(--sp-bg-subtle)/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 font-medium text-xs">
                              {isPositive ? (
                                <ArrowDownRight className="size-4 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="size-4 text-amber-600" />
                              )}
                              <span>{m.type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-(--sp-text-muted)">
                            {m.referenceType}: {m.referenceId || "—"}
                          </td>
                          <td
                            className={`px-4 py-3.5 text-right font-bold ${
                              isPositive ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {isPositive ? `+${m.delta}` : m.delta}
                          </td>
                          <td className="px-4 py-3.5 text-right text-xs text-(--sp-text-muted)">
                            {m.beforeQuantity} → {m.afterQuantity}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-(--sp-text-muted)">
                            {new Date(m.createdAt).toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Modal Cân tồn nhanh */}
        <AuditAdjustmentModal
          open={isAuditModalOpen}
          onOpenChange={setIsAuditModalOpen}
          onSuccess={handleRefresh}
        />
      </div>
    </OwnerLayout>
  );
}
