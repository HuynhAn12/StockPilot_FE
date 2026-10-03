import { useState } from "react";
import { CheckCircle2, Clock, DollarSign, Package, Plus, ShoppingBag, X } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { ORDER_STATUS_LABELS } from "../constants";
import {
  useCancelOrder,
  useConfirmOrder,
  useCreateOrder,
  useFulfillOrder,
  useOrders,
} from "../hooks/useOrders";
import { useInventoryBalances } from "../../inventory/hooks/useInventory";
import type { Order } from "../types";

export function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states for creating order
  const [customerName, setCustomerName] = useState("Nguyễn Văn A");
  const [customerPhone, setCustomerPhone] = useState("0901234567");
  const [customerAddress, setCustomerAddress] = useState("123 Nguyễn Huệ, Quận 1, TP.HCM");
  const [selectedStockItemId, setSelectedStockItemId] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [orderNote, setOrderNote] = useState("Đơn hàng đặt tại quầy");

  const { data, isLoading, refetch } = useOrders(
    selectedStatus ? { status: selectedStatus } : undefined
  );
  const { data: inventoryData } = useInventoryBalances();
  const balances = inventoryData?.items || [];

  const createOrderMutation = useCreateOrder();
  const confirmOrderMutation = useConfirmOrder();
  const fulfillOrderMutation = useFulfillOrder();
  const cancelOrderMutation = useCancelOrder();

  const orders: Order[] = data?.items || [];

  // Summary calculations
  const totalOrders = orders.length;
  const draftOrders = orders.filter((o) => o.status === "DRAFT").length;
  const fulfilledOrders = orders.filter((o) => o.status === "FULFILLED").length;
  const totalRevenue = orders
    .filter((o) => o.status === "FULFILLED" || o.status === "CONFIRMED")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const stockItemId = selectedStockItemId || balances[0]?.stockItemId;
    if (!stockItemId) {
      setActionError("Vui lòng chọn một mặt hàng trong kho để tạo đơn");
      return;
    }

    createOrderMutation.mutate(
      {
        customerName,
        customerPhone,
        customerAddress,
        note: orderNote,
        items: [
          {
            stockItemId,
            quantity: Number(quantity) || 1,
          },
        ],
      },
      {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          refetch();
        },
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
          setActionError(apiErr?.response?.data?.message || apiErr.message || "Không thể tạo đơn hàng");
        },
      }
    );
  };

  const handleConfirm = (id: number) => {
    setActionError(null);
    confirmOrderMutation.mutate(id, {
      onError: (err: unknown) => {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setActionError(apiErr?.response?.data?.message || "Không thể xác nhận đơn");
      },
    });
  };

  const handleFulfill = (id: number) => {
    setActionError(null);
    fulfillOrderMutation.mutate(id, {
      onError: (err: unknown) => {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setActionError(apiErr?.response?.data?.message || "Không thể hoàn tất đơn");
      },
    });
  };

  const handleCancel = (id: number) => {
    const reason = window.prompt("Nhập lý do hủy đơn hàng:", "Khách hàng đổi ý");
    if (!reason) return;
    setActionError(null);
    cancelOrderMutation.mutate(
      { id, cancelReason: reason },
      {
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: { message?: string } } };
          setActionError(apiErr?.response?.data?.message || "Không thể hủy đơn");
        },
      }
    );
  };

  const statusTone = (status: string) => {
    switch (status) {
      case "FULFILLED":
        return "success";
      case "CONFIRMED":
        return "info";
      case "DRAFT":
        return "warning";
      case "CANCELED":
        return "neutral";
      default:
        return "neutral";
    }
  };

  return (
    <OwnerLayout title="Quản lý đơn hàng" onRefresh={() => refetch()}>
      <div className="grid gap-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">Quản lý đơn hàng</h1>
            <p className="mt-1 text-sm text-(--sp-text-muted)">
              Theo dõi đơn bán, trạng thái xuất kho và quy trình xử lý thanh toán từ API thực tế.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-1.5 size-4" />
              Tạo đơn hàng mới
            </Button>
          </div>
        </div>

        {/* Action Error Alert */}
        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Đã có lỗi xảy ra:</p>
            <p>{actionError}</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Tổng số đơn</p>
                <p className="text-xl font-bold text-(--sp-text)">{totalOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Chờ xác nhận (Draft)</p>
                <p className="text-xl font-bold text-amber-700">{draftOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Đã hoàn thành</p>
                <p className="text-xl font-bold text-emerald-700">{fulfilledOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <DollarSign className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Doanh thu ghi nhận</p>
                <p className="text-lg font-bold text-indigo-700">
                  {totalRevenue.toLocaleString("vi-VN")} ₫
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-(--sp-border) pb-2">
          {[
            { label: "Tất cả đơn", value: undefined },
            { label: "Nháp (Draft)", value: "DRAFT" },
            { label: "Đã xác nhận (Confirmed)", value: "CONFIRMED" },
            { label: "Hoàn tất (Fulfilled)", value: "FULFILLED" },
            { label: "Đã hủy (Canceled)", value: "CANCELED" },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedStatus === tab.value
                  ? "bg-(--sp-primary) text-white shadow-xs"
                  : "bg-transparent text-(--sp-text-muted) hover:bg-(--sp-bg-subtle) hover:text-(--sp-text)"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Orders Table */}
        <Card className="overflow-hidden border-(--sp-border)">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto size-12 text-(--sp-text-muted)/50" />
              <h3 className="mt-3 text-base font-semibold text-(--sp-text)">Chưa có đơn hàng nào</h3>
              <p className="mt-1 text-sm text-(--sp-text-muted) max-w-md mx-auto">
                Cửa hàng hiện chưa có đơn hàng nào trong trạng thái này. Bạn có thể bấm nút dưới đây để tạo đơn mẫu ngay.
              </p>
              <div className="mt-5">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-1.5 size-4" />
                  Tạo đơn hàng mẫu ngay
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                  <tr>
                    <th className="px-4 py-3">Mã đơn hàng</th>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Số tiền</th>
                    <th className="px-4 py-3">Thời gian tạo</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác luồng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--sp-border)">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-(--sp-bg-subtle)/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-medium text-(--sp-text)">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-(--sp-text)">{order.customerName || "Khách lẻ tại quầy"}</p>
                        {order.customerPhone && (
                          <p className="text-xs text-(--sp-text-muted)">{order.customerPhone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-(--sp-text)">
                        {Number(order.totalAmount).toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="px-4 py-3.5 text-xs text-(--sp-text-muted)">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={statusTone(order.status)}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleConfirm(order.id)}
                              disabled={confirmOrderMutation.isPending}
                            >
                              Xác nhận & Xuất kho
                            </Button>
                          )}
                          {order.status === "CONFIRMED" && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleFulfill(order.id)}
                              disabled={fulfillOrderMutation.isPending}
                            >
                              Hoàn tất đơn
                            </Button>
                          )}
                          {(order.status === "DRAFT" || order.status === "CONFIRMED") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleCancel(order.id)}
                              disabled={cancelOrderMutation.isPending}
                            >
                              Hủy
                            </Button>
                          )}
                          {order.status === "FULFILLED" && (
                            <span className="text-xs text-emerald-600 font-medium">Đã xong</span>
                          )}
                          {order.status === "CANCELED" && (
                            <span className="text-xs text-(--sp-text-muted)">Đã hủy</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal Tạo đơn hàng */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-(--sp-border)">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute right-4 top-4 text-(--sp-text-muted) hover:text-(--sp-text)"
              >
                <X className="size-5" />
              </button>

              <h3 className="text-lg font-bold text-(--sp-text)">Tạo đơn hàng mới (POST /api/v1/orders)</h3>
              <p className="mt-1 text-xs text-(--sp-text-muted)">
                Tạo đơn hàng nháp và kết nối trực tiếp với luồng quản lý đơn hàng backend.
              </p>

              <form onSubmit={handleCreateOrder} className="mt-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-(--sp-text)">Tên khách hàng</label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-(--sp-text)">Số điện thoại</label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="090..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-(--sp-text)">Số lượng mua</label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-(--sp-text)">Chọn mặt hàng từ kho</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-(--sp-border) bg-white p-2 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
                    value={selectedStockItemId || balances[0]?.stockItemId || ""}
                    onChange={(e) => setSelectedStockItemId(Number(e.target.value))}
                  >
                    {balances.length === 0 ? (
                      <option value={1}>Mặt hàng mẫu (ID: 1)</option>
                    ) : (
                      balances.map((b) => (
                        <option key={b.stockItemId} value={b.stockItemId}>
                          {b.stockItem?.name || `Mặt hàng #${b.stockItemId}`} (Tồn: {b.quantity})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-(--sp-text)">Địa chỉ giao</label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Địa chỉ nhận hàng"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-(--sp-text)">Ghi chú đơn</label>
                  <Input
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Ghi chú thêm"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={createOrderMutation.isPending}>
                    {createOrderMutation.isPending ? "Đang tạo..." : "Xác nhận tạo đơn"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
