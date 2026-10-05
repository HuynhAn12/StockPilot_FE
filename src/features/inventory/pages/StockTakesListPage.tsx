import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Eye,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";

import { Breadcrumb } from "../../../components/data-display/Breadcrumb";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useStockTakes } from "../hooks/useInventory";
import type { StockTake, StockTakeStatus } from "../types";

type FilterTab = "ALL" | StockTakeStatus;

const FILTER_TABS: Array<{ id: FilterTab; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "DRAFT", label: "Bản nháp (DRAFT)" },
  { id: "IN_PROGRESS", label: "Đang kiểm (IN_PROGRESS)" },
  { id: "COMPLETED", label: "Hoàn tất (COMPLETED)" },
  { id: "CANCELED", label: "Đã hủy (CANCELED)" },
];

/**
 * Format ISO datetime string to "DD/MM/YYYY HH:mm"
 */
function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

/**
 * Maps StockTakeStatus to Badge tone and label
 */
function getStatusBadgeConfig(status: StockTakeStatus): {
  tone: "neutral" | "info" | "success" | "danger";
  label: string;
} {
  switch (status) {
    case "DRAFT":
      return { tone: "neutral", label: "Bản nháp" };
    case "IN_PROGRESS":
      return { tone: "info", label: "Đang kiểm đếm" };
    case "COMPLETED":
      return { tone: "success", label: "Hoàn tất" };
    case "CANCELED":
      return { tone: "danger", label: "Đã hủy" };
    default:
      return { tone: "neutral", label: status };
  }
}

export function StockTakesListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // TODO API-CONTRACT: Query GET /stock-takes with optional status & pagination
  const { data, isLoading, error, refetch } = useStockTakes(
    activeTab !== "ALL" ? { status: activeTab } : undefined
  );

  const stockTakes: StockTake[] = data?.items || [];

  // Filter list by tab and search keyword
  const filteredList = stockTakes.filter((item) => {
    if (activeTab !== "ALL" && item.status !== activeTab) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const code = (item.code || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const creator = (item.createdBy || "").toLowerCase();
      const category = (item.categoryName || "").toLowerCase();
      const note = (item.note || "").toLowerCase();

      const matches =
        code.includes(term) ||
        title.includes(term) ||
        creator.includes(term) ||
        category.includes(term) ||
        note.includes(term);

      if (!matches) return false;
    }

    return true;
  });

  return (
    <OwnerLayout title="Kiểm kê kho" onRefresh={refetch}>
      <div className="grid gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Breadcrumb items={["Kiểm kê kho", "Danh sách đợt kiểm"]} />
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">
              Quản Lý Các Đợt Kiểm Kê (Stock Takes)
            </h1>
            {/* Subtitle with API identifier */}
            <p className="text-xs font-mono text-(--sp-text-muted)">
              API: GET /stock-takes
            </p>
          </div>

          <Button
            type="button"
            onClick={() => navigate("/app/stock-takes/new")}
            className="inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Tạo đợt kiểm mới
          </Button>
        </div>

        {/* Filter bar: Tabs + Search input */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-(--sp-border) pb-2 sm:border-b-0 sm:pb-0">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-(--sp-primary) text-white shadow-xs"
                      : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-(--sp-text-muted)" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã đợt, tên phiếu, người tạo..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Content Section: 4 States */}
        <Card className="overflow-hidden border-(--sp-border)">
          {/* 1. LOADING STATE */}
          {isLoading && (
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            </div>
          )}

          {/* 2. ERROR STATE */}
          {!isLoading && error && (
            <div className="p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-(--sp-text)">
                Không thể tải danh sách đợt kiểm kê
              </h3>
              <p className="mt-1 text-sm text-(--sp-text-muted) max-w-md mx-auto">
                {error instanceof Error ? error.message : "Đã có lỗi xảy ra từ máy chủ hoặc kết nối mạng."}
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="size-4" />
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          {/* 3. EMPTY STATE */}
          {!isLoading && !error && filteredList.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-(--sp-bg-subtle) text-(--sp-text-muted) mb-3">
                <ClipboardList className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-(--sp-text)">
                {searchTerm || activeTab !== "ALL"
                  ? "Không tìm thấy đợt kiểm kê phù hợp"
                  : "Chưa có đợt kiểm kê nào"}
              </h3>
              <p className="mt-1 text-sm text-(--sp-text-muted) max-w-md mx-auto">
                {searchTerm || activeTab !== "ALL"
                  ? "Hãy thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm."
                  : "Bắt đầu tạo đợt kiểm kê kho định kỳ hoặc đột xuất để đối soát số lượng hàng thực tế."}
              </p>
              <div className="mt-5">
                <Button
                  onClick={() => navigate("/app/stock-takes/new")}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="size-4" />
                  Tạo đợt kiểm mới
                </Button>
              </div>
            </div>
          )}

          {/* 4. DATA STATE */}
          {!isLoading && !error && filteredList.length > 0 && (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted) uppercase border-b border-(--sp-border)">
                    <tr>
                      <th className="py-3 px-4">Mã đợt</th>
                      <th className="py-3 px-4">Tiêu đề & Phạm vi</th>
                      <th className="py-3 px-4">Người tạo</th>
                      <th className="py-3 px-4">Ngày tạo</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4">Tiến độ kiểm đếm</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--sp-border)">
                    {filteredList.map((st) => {
                      const badgeConfig = getStatusBadgeConfig(st.status);
                      const totalItems = st.totalItems || 0;
                      const countedItems = st.countedItems || 0;
                      const percent =
                        totalItems > 0 ? Math.min(100, Math.round((countedItems / totalItems) * 100)) : 0;

                      const isOngoing = st.status === "DRAFT" || st.status === "IN_PROGRESS";

                      return (
                        <tr
                          key={st.id}
                          className="hover:bg-(--sp-bg-subtle)/50 transition-colors"
                        >
                          {/* Mã đợt */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-(--sp-text)">
                            {st.code || `STK-${st.id}`}
                          </td>

                          {/* Tiêu đề & Phạm vi */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-(--sp-text)">{st.title}</div>
                            <div className="text-xs text-(--sp-text-muted) mt-0.5">
                              {st.scope === "ALL"
                                ? "Toàn bộ kho"
                                : `Danh mục: ${st.categoryName || `ID #${st.categoryId}`}`}
                            </div>
                          </td>

                          {/* Người tạo */}
                          <td className="py-3.5 px-4 text-(--sp-text-muted)">
                            {st.createdBy || "—"}
                          </td>

                          {/* Ngày tạo */}
                          <td className="py-3.5 px-4 text-(--sp-text-muted) whitespace-nowrap">
                            {formatDateTime(st.createdAt)}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3.5 px-4 text-center">
                            <Badge tone={badgeConfig.tone}>
                              {badgeConfig.label}
                            </Badge>
                          </td>

                          {/* Tiến độ */}
                          <td className="py-3.5 px-4 min-w-[180px]">
                            {st.status === "COMPLETED" ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-(--sp-success) font-medium">
                                  <span>Đã chốt sổ</span>
                                  <span>100%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                                  <div className="h-full bg-(--sp-success) w-full rounded-full" />
                                </div>
                              </div>
                            ) : st.status === "CANCELED" ? (
                              <span className="text-xs text-(--sp-danger) italic">
                                Đợt kiểm đã hủy
                              </span>
                            ) : st.status === "DRAFT" ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-(--sp-text-muted)">
                                  <span>Chưa bắt đầu</span>
                                  <span>0%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-(--sp-bg-subtle) overflow-hidden">
                                  <div className="h-full bg-slate-300 w-0" />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-(--sp-text)">
                                  <span>
                                    {totalItems > 0
                                      ? `${countedItems} / ${totalItems} SKU`
                                      : `${countedItems} SKU`}
                                  </span>
                                  <span className="text-(--sp-info)">{percent}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full bg-(--sp-primary) rounded-full transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 px-4 text-right">
                            {isOngoing ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => navigate(`/app/stock-takes/${st.id}`)}
                                className="inline-flex items-center gap-1 text-xs"
                              >
                                Vào kiểm đếm
                                <ArrowRight className="size-3.5" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate(`/app/stock-takes/${st.id}`)}
                                className="inline-flex items-center gap-1 text-xs"
                              >
                                <Eye className="size-3.5" />
                                Xem kết quả
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-(--sp-border)">
                {filteredList.map((st) => {
                  const badgeConfig = getStatusBadgeConfig(st.status);
                  const isOngoing = st.status === "DRAFT" || st.status === "IN_PROGRESS";
                  const totalItems = st.totalItems || 0;
                  const countedItems = st.countedItems || 0;
                  const percent =
                    totalItems > 0 ? Math.min(100, Math.round((countedItems / totalItems) * 100)) : 0;

                  return (
                    <div key={st.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-(--sp-text)">
                          {st.code || `STK-${st.id}`}
                        </span>
                        <Badge tone={badgeConfig.tone}>{badgeConfig.label}</Badge>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm text-(--sp-text)">{st.title}</h4>
                        <p className="text-xs text-(--sp-text-muted) mt-0.5">
                          {st.scope === "ALL"
                            ? "Toàn bộ kho"
                            : `Danh mục: ${st.categoryName || `ID #${st.categoryId}`}`}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-(--sp-text-muted)">
                        <span>Người tạo: {st.createdBy || "—"}</span>
                        <span>{formatDateTime(st.createdAt)}</span>
                      </div>

                      {/* Progress bar on mobile */}
                      {st.status === "IN_PROGRESS" && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-(--sp-text-muted)">
                              {totalItems > 0
                                ? `${countedItems} / ${totalItems} SKU`
                                : `${countedItems} SKU`}
                            </span>
                            <span className="text-(--sp-primary)">{percent}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-(--sp-primary) rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        {isOngoing ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => navigate(`/app/stock-takes/${st.id}`)}
                            className="w-full inline-flex items-center justify-center gap-1.5"
                          >
                            Vào kiểm đếm
                            <ArrowRight className="size-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/app/stock-takes/${st.id}`)}
                            className="w-full inline-flex items-center justify-center gap-1.5"
                          >
                            <Eye className="size-3.5" />
                            Xem kết quả
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </OwnerLayout>
  );
}
