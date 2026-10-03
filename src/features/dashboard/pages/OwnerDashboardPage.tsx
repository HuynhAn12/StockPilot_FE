import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Boxes,
  CheckCircle2,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { MetricCard } from "../../../components/data-display/MetricCard";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui";
import { useCurrentUser } from "../../auth/hooks/useAuth";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useDashboardMetrics } from "../hooks/useDashboard";

export function OwnerDashboardPage() {
  const { data: userData } = useCurrentUser();
  const { data: metricsData, isLoading, refetch, isFetching } = useDashboardMetrics();

  const user = userData?.data;
  const metrics = metricsData?.data;

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  return (
    <OwnerLayout title="Tổng quan cửa hàng" onRefresh={() => refetch()}>
      <div className="grid gap-6">
        {/* Welcome Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-(--sp-border) bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-white p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge tone="info">Chủ cửa hàng (SHOP_OWNER)</Badge>
              {user?.store?.code && (
                <span className="text-xs font-mono text-(--sp-text-muted)">
                  Domain: {user.store.code}.stockpilot.vn
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-(--sp-text) sm:text-3xl">
              Xin chào, {user?.fullName || "Chủ cửa hàng"}!
            </h1>
            <p className="mt-1 text-sm text-(--sp-text-muted)">
              {user?.store?.name
                ? `Hệ thống quản lý bán hàng & kho cho ${user.store.name}`
                : "Hệ thống quản lý tồn kho và hỗ trợ ra quyết định thông minh StockPilot."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/app/orders">
              <Button className="flex items-center gap-2 shadow-sm">
                <ShoppingCart className="size-4" />
                <span>Bán hàng / POS</span>
              </Button>
            </Link>
            <Link to="/app/assistant">
              <Button variant="secondary" className="flex items-center gap-2">
                <Bot className="size-4 text-purple-600" />
                <span>Hỏi AI Assistant</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-(--sp-text)">Chỉ số kinh doanh cốt lõi</h2>
            {isFetching && <span className="text-xs text-(--sp-primary) animate-pulse">Đang cập nhật từ máy chủ...</span>}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Doanh thu thuần"
                value={formatCurrency(metrics?.netRevenue)}
                delta={metrics?.refundedAmount ? `Đã hoàn: ${formatCurrency(metrics.refundedAmount)}` : "Doanh thu thực"}
                tone="success"
              />
              <MetricCard
                label="Số đơn hoàn tất"
                value={String(metrics?.completedOrdersCount ?? 0)}
                delta="Đơn hàng thành công"
                tone="neutral"
              />
              <MetricCard
                label="Tổng số lượng tồn kho"
                value={`${(metrics?.totalStockQuantity ?? 0).toLocaleString("vi-VN")} SP`}
                delta="Hiện có trong kho"
                tone="warning"
              />
              <MetricCard
                label="Tổng giá trị tồn kho (Giá vốn)"
                value={formatCurrency(metrics?.inventoryValuation)}
                delta={metrics?.inventoryRetailValuation ? `Giá bán lẻ: ${formatCurrency(metrics.inventoryRetailValuation)}` : "Định giá kho"}
                tone="info"
              />
            </section>
          )}
        </div>

        {/* Quick Operations & Decision Shortcuts */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 border border-(--sp-border) hover:border-(--sp-primary)/40 transition group">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-(--sp-primary)">
                <Boxes className="size-5" />
              </div>
              <Link to="/app/inventory" className="text-xs font-semibold text-(--sp-primary) flex items-center gap-0.5 hover:underline">
                <span>Vào kho</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <h3 className="mt-3 font-semibold text-(--sp-text)">Quản lý Tồn kho & Sổ cái</h3>
            <p className="mt-1 text-xs text-(--sp-text-muted)">
              Xem số dư theo SKU, thẻ kho, thực hiện nhập/xuất kho và kiểm kê định kỳ 4 bước.
            </p>
          </Card>

          <Card className="p-5 border border-(--sp-border) hover:border-amber-400/50 transition group">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <TrendingUp className="size-5" />
              </div>
              <Link to="/app/pricing" className="text-xs font-semibold text-amber-600 flex items-center gap-0.5 hover:underline">
                <span>Xem giá</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <h3 className="mt-3 font-semibold text-(--sp-text)">Đề xuất giá thông minh</h3>
            <p className="mt-1 text-xs text-(--sp-text-muted)">
              Thuật toán phân tích biên lợi nhuận và tốc độ bán để gợi ý tăng/giảm giá tối ưu.
            </p>
          </Card>

          <Card className="p-5 border border-(--sp-border) hover:border-red-400/50 transition group">
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="size-5" />
              </div>
              <Link to="/app/alerts" className="text-xs font-semibold text-red-600 flex items-center gap-0.5 hover:underline">
                <span>Cảnh báo</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <h3 className="mt-3 font-semibold text-(--sp-text)">Cảnh báo rủi ro hàng tồn</h3>
            <p className="mt-1 text-xs text-(--sp-text-muted)">
              Phát hiện sớm hàng sắp hết, tồn kho ứ đọng (Dead Stock) và biến động nhu cầu bất thường.
            </p>
          </Card>
        </div>

        {/* Getting Started / Onboarding Checklist for Fresh Store */}
        <Card className="p-5 border border-(--sp-border) bg-white">
          <div className="flex items-center justify-between border-b border-(--sp-border) pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-(--sp-primary)" />
              <h3 className="font-semibold text-(--sp-text)">Các bước vận hành cửa hàng</h3>
            </div>
            <span className="text-xs text-(--sp-text-muted)">Hệ thống bán lẻ StockPilot</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/app/catalog/products" className="flex items-start gap-3 rounded-lg border border-(--sp-border) p-3 hover:bg-(--sp-bg-subtle) transition">
              <CheckCircle2 className="size-5 text-(--sp-success) shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-(--sp-text)">1. Danh mục & Sản phẩm</p>
                <p className="text-xs text-(--sp-text-muted)">Tạo mã SKU, biến thể, giá bán và giá vốn.</p>
              </div>
            </Link>

            <Link to="/app/inventory" className="flex items-start gap-3 rounded-lg border border-(--sp-border) p-3 hover:bg-(--sp-bg-subtle) transition">
              <CheckCircle2 className="size-5 text-(--sp-success) shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-(--sp-text)">2. Nhập kho ban đầu</p>
                <p className="text-xs text-(--sp-text-muted)">Cập nhật số dư tồn kho thực tế vào sổ cái.</p>
              </div>
            </Link>

            <Link to="/app/orders" className="flex items-start gap-3 rounded-lg border border-(--sp-border) p-3 hover:bg-(--sp-bg-subtle) transition">
              <CheckCircle2 className="size-5 text-(--sp-success) shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-(--sp-text)">3. Bán lẻ tại quầy (POS)</p>
                <p className="text-xs text-(--sp-text-muted)">Tạo đơn, thanh toán tiền mặt & in hóa đơn.</p>
              </div>
            </Link>

            <Link to="/app/assistant" className="flex items-start gap-3 rounded-lg border border-(--sp-border) p-3 hover:bg-(--sp-bg-subtle) transition">
              <CheckCircle2 className="size-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-(--sp-text)">4. Hỏi Trợ lý AI</p>
                <p className="text-xs text-(--sp-text-muted)">Nhận phân tích tự nhiên về sức khỏe cửa hàng.</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </OwnerLayout>
  );
}
