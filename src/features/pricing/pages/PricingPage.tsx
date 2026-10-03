import { useState } from "react";
import { Check, Sparkles, TrendingDown, TrendingUp, X } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { PRICING_ACTION_LABELS } from "../constants";
import {
  useAcceptRecommendation,
  usePricingRecommendations,
  useRejectRecommendation,
} from "../hooks/usePricing";

export function PricingPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>("PENDING");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { data, isLoading, refetch } = usePricingRecommendations(
    selectedStatus ? { status: selectedStatus } : undefined
  );

  const acceptMutation = useAcceptRecommendation();
  const rejectMutation = useRejectRecommendation();

  const recommendations = data?.items || [];

  const handleAccept = (id: number) => {
    setActionMessage(null);
    acceptMutation.mutate(id, {
      onSuccess: () => {
        setActionMessage("Đã áp dụng mức giá mới cho sản phẩm thành công.");
      },
      onError: (err: unknown) => {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setActionMessage(apiErr?.response?.data?.message || "Không thể áp dụng giá");
      },
    });
  };

  const handleReject = (id: number) => {
    setActionMessage(null);
    rejectMutation.mutate(id, {
      onSuccess: () => {
        setActionMessage("Đã từ chối đề xuất điều chỉnh giá.");
      },
      onError: (err: unknown) => {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setActionMessage(apiErr?.response?.data?.message || "Không thể từ chối đề xuất");
      },
    });
  };

  return (
    <OwnerLayout title="Gợi ý giá bán" onRefresh={() => refetch()}>
      <div className="grid gap-6">
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">Đề xuất giá thông minh (AI Pricing)</h1>
            <p className="mt-1 text-sm text-(--sp-text-muted)">
              Thuật toán Decision Engine đề xuất mức giá tối ưu dựa trên tốc độ bán và biên lợi nhuận mục tiêu.
            </p>
          </div>
        </div>

        {/* Message Alert */}
        {actionMessage && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            {actionMessage}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-(--sp-border) pb-2">
          <button
            type="button"
            onClick={() => setSelectedStatus("PENDING")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === "PENDING"
                ? "bg-(--sp-primary) text-white shadow-xs"
                : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
            }`}
          >
            Chờ phê duyệt
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus(undefined)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === undefined
                ? "bg-(--sp-primary) text-white shadow-xs"
                : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
            }`}
          >
            Tất cả lịch sử đề xuất
          </button>
        </div>

        {/* Recommendations List / Table */}
        <Card className="overflow-hidden border-(--sp-border)">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="mx-auto size-12 text-indigo-400" />
              <h3 className="mt-3 text-base font-semibold text-(--sp-text)">Chưa có đề xuất giá mới</h3>
              <p className="mt-1 text-sm text-(--sp-text-muted) max-w-md mx-auto">
                Hiện tại giá bán của tất cả sản phẩm đang ở mức tối ưu hoặc chưa có biến động cần điều chỉnh.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm / SKU</th>
                    <th className="px-4 py-3 text-right">Giá hiện tại</th>
                    <th className="px-4 py-3 text-right">Giá đề xuất mới</th>
                    <th className="px-4 py-3">Hướng điều chỉnh</th>
                    <th className="px-4 py-3">Lý do gợi ý</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--sp-border)">
                  {recommendations.map((r) => {
                    const isIncrease = r.action === "INCREASE";
                    return (
                      <tr key={r.id} className="hover:bg-(--sp-bg-subtle)/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-(--sp-text)">
                            {r.stockItem?.name || `Mặt hàng #${r.stockItemId}`}
                          </p>
                          <p className="font-mono text-xs text-(--sp-text-muted)">
                            {r.stockItem?.sku || `SKU-${r.stockItemId}`}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-(--sp-text-muted)">
                          {Number(r.currentPrice).toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-indigo-600">
                          {Number(r.recommendedPrice).toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-xs font-semibold">
                            {isIncrease ? (
                              <span className="flex items-center text-blue-600">
                                <TrendingUp className="mr-1 size-3.5" />
                                {PRICING_ACTION_LABELS[r.action] || "Tăng giá"}
                              </span>
                            ) : (
                              <span className="flex items-center text-amber-600">
                                <TrendingDown className="mr-1 size-3.5" />
                                {PRICING_ACTION_LABELS[r.action] || "Giảm giá"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-(--sp-text-muted) max-w-xs">
                          {r.reasonJson ? JSON.stringify(r.reasonJson) : "Tối ưu hóa doanh thu và biên lợi nhuận"}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={r.status === "PENDING" ? "warning" : r.status === "ACCEPTED" ? "success" : "neutral"}>
                            {r.status === "PENDING" ? "Chờ duyệt" : r.status === "ACCEPTED" ? "Đã áp dụng" : "Đã từ chối"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {r.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleAccept(r.id)}
                                disabled={acceptMutation.isPending}
                              >
                                <Check className="mr-1 size-3.5" />
                                Áp dụng
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleReject(r.id)}
                                disabled={rejectMutation.isPending}
                              >
                                <X className="mr-1 size-3.5" />
                                Bỏ qua
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-(--sp-text-muted)">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </OwnerLayout>
  );
}
