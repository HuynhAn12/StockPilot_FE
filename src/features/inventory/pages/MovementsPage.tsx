import { useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  History,
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
import { useStockMovements } from "../hooks/useInventory";
import type { StockMovement } from "../types";

// Extended interface to safely access enriched movement fields if returned by backend API
export interface ExtendedStockMovement extends StockMovement {
  stockItem?: {
    id?: number;
    sku?: string;
    name?: string;
  };
  productName?: string;
  sku?: string;
  createdByName?: string;
  createdBy?: string;
  userName?: string;
  note?: string;
  notes?: string;
}

type MovementFilterType = "ALL" | "INFLOW" | "OUTFLOW" | "AUDIT" | "ORDER";

const FILTER_TABS: Array<{ id: MovementFilterType; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "INFLOW", label: "INFLOW" },
  { id: "OUTFLOW", label: "OUTFLOW" },
  { id: "AUDIT", label: "AUDIT" },
  { id: "ORDER", label: "ORDER" },
];

/**
 * Format ISO datetime string to "DD/MM/YYYY HH:mm" (e.g., 01/10/2026 14:30)
 */
function formatDateTime(dateStr?: string): string {
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
 * Maps movement type to corresponding Badge tone and label
 */
function getMovementBadgeConfig(type: string): {
  tone: "success" | "danger" | "warning" | "info" | "neutral";
  label: string;
} {
  switch (type) {
    case "INFLOW":
      return { tone: "success", label: "INFLOW" };
    case "OUTFLOW":
      return { tone: "danger", label: "OUTFLOW" };
    case "AUDIT_ADJUSTMENT":
      return { tone: "warning", label: "AUDIT" };
    case "ORDER_FULFILL":
      return { tone: "info", label: "ORDER" };
    case "ORDER_CANCEL_RESTOCK":
      return { tone: "info", label: "RESTOCK" };
    case "RETURN_RESTOCK":
      return { tone: "info", label: "RETURN" };
    default:
      return { tone: "neutral", label: type };
  }
}

export function MovementsPage() {
  const [filterType, setFilterType] = useState<MovementFilterType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Gọi API: GET /inventory/movements qua hook useStockMovements của team
  const { data, isLoading, error, refetch } = useStockMovements();

  const movements: ExtendedStockMovement[] = (data?.items as ExtendedStockMovement[]) || [];

  // Logic lọc theo filterType (Tabs) và từ khóa tìm kiếm (searchTerm)
  const filteredMovements = movements.filter((m) => {
    // Lọc theo loại biến động
    if (filterType === "INFLOW" && m.type !== "INFLOW") return false;
    if (filterType === "OUTFLOW" && m.type !== "OUTFLOW") return false;
    if (filterType === "AUDIT" && m.type !== "AUDIT_ADJUSTMENT" && !m.type.startsWith("AUDIT")) {
      return false;
    }
    if (filterType === "ORDER" && m.type !== "ORDER_FULFILL" && !m.type.startsWith("ORDER")) {
      return false;
    }

    // Lọc theo searchTerm (referenceId, SKU, productName)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const refId = (m.referenceId || "").toLowerCase();
      const refType = (m.referenceType || "").toLowerCase();
      const sku = (m.stockItem?.sku || m.sku || "").toLowerCase();
      const prodName = (m.stockItem?.name || m.productName || "").toLowerCase();
      const createdBy = (m.createdByName || m.createdBy || m.userName || "").toLowerCase();
      const note = (m.note || m.notes || "").toLowerCase();

      const matches =
        refId.includes(term) ||
        refType.includes(term) ||
        sku.includes(term) ||
        prodName.includes(term) ||
        createdBy.includes(term) ||
        note.includes(term);

      if (!matches) return false;
    }

    return true;
  });

  return (
    <OwnerLayout title="Lịch sử biến động kho" onRefresh={refetch}>
      <div className="grid gap-6">
        {/* Header: Breadcrumb + Title + Subtitle */}
        <div className="space-y-2">
          <Breadcrumb items={["Quản lý kho", "Lịch sử biến động"]} />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">
                Lịch Sử Biến Động Kho
              </h1>
              <p className="mt-1 text-sm text-(--sp-text-muted)">
                API: GET /inventory/movements
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar: Tabs filter & Search input */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-(--sp-border) pb-2 sm:border-b-0 sm:pb-0">
            {FILTER_TABS.map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
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

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-(--sp-text-muted)" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã tham chiếu, SKU, sản phẩm..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Content Section: 4 States (Loading, Error, Empty, Data) */}
        <Card className="overflow-hidden border-(--sp-border)">
          {/* 1. LOADING STATE: 5 skeleton rows */}
          {isLoading && (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          )}

          {/* 2. ERROR STATE: Icon + Error message + Nút Thử lại */}
          {!isLoading && error && (
            <div className="p-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-(--sp-danger-soft) text-(--sp-danger)">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-(--sp-text)">
                Không thể tải lịch sử biến động kho
              </h3>
              <p className="mt-1 text-sm text-(--sp-text-muted)">
                {error instanceof Error
                  ? error.message
                  : "Đã xảy ra lỗi khi kết nối với máy chủ API."}
              </p>
              <div className="mt-4 flex justify-center">
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

          {/* 3. EMPTY STATE: Icon History + Thông báo + Subtitle */}
          {!isLoading && !error && filteredMovements.length === 0 && (
            <div className="py-12 text-center">
              <History className="mx-auto size-12 text-(--sp-text-muted)/50" />
              <h3 className="mt-3 text-base font-semibold text-(--sp-text)">
                Chưa có biến động kho
              </h3>
              <p className="mt-1 text-sm text-(--sp-text-muted)">
                {searchTerm || filterType !== "ALL"
                  ? "Không tìm thấy biến động phù hợp với bộ lọc hiện tại."
                  : "Lịch sử nhập, xuất và điều chỉnh kho sẽ hiển thị ở đây."}
              </p>
              {(searchTerm || filterType !== "ALL") && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("ALL");
                    }}
                  >
                    Đặt lại bộ lọc
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 4. DATA STATE: Table (Desktop) & Card List (Mobile) */}
          {!isLoading && !error && filteredMovements.length > 0 && (
            <>
              {/* Desktop Table (>= 768px): 8 cột */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                    <tr>
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Loại</th>
                      <th className="px-4 py-3">Mã tham chiếu</th>
                      <th className="px-4 py-3">SP & SKU</th>
                      <th className="px-4 py-3 text-right">Biến động</th>
                      <th className="px-4 py-3 text-right">Tồn sau GD</th>
                      <th className="px-4 py-3">Người thực hiện</th>
                      <th className="px-4 py-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--sp-border)">
                    {filteredMovements.map((m) => {
                      const isPositive = Number(m.delta) > 0;
                      const badgeConfig = getMovementBadgeConfig(m.type);
                      const productName =
                        m.stockItem?.name || m.productName || `Mặt hàng kho #${m.id}`;
                      const sku =
                        m.stockItem?.sku ||
                        m.sku ||
                        ((m as unknown as { stockItemId?: number }).stockItemId
                          ? `SKU-${(m as unknown as { stockItemId?: number }).stockItemId}`
                          : "—");
                      const referenceDisplay = m.referenceId
                        ? m.referenceId.startsWith("#")
                          ? m.referenceId
                          : `#${m.referenceId}`
                        : "—";
                      const createdBy =
                        m.createdByName || m.createdBy || m.userName || "Hệ thống";
                      const noteText =
                        m.note ||
                        m.notes ||
                        (m.referenceType ? `${m.referenceType}` : "—");

                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-(--sp-bg-subtle)/50 transition-colors"
                        >
                          {/* 1. Thời gian */}
                          <td className="px-4 py-3.5 text-xs text-(--sp-text-muted) whitespace-nowrap">
                            {formatDateTime(m.createdAt)}
                          </td>

                          {/* 2. Loại */}
                          <td className="px-4 py-3.5">
                            <Badge tone={badgeConfig.tone}>{badgeConfig.label}</Badge>
                          </td>

                          {/* 3. Mã tham chiếu */}
                          <td className="px-4 py-3.5 font-mono text-xs text-(--sp-text) whitespace-nowrap">
                            {referenceDisplay}
                            {m.referenceType && (
                              <span className="block text-[11px] font-sans text-(--sp-text-muted)">
                                {m.referenceType}
                              </span>
                            )}
                          </td>

                          {/* 4. SP & SKU */}
                          <td className="px-4 py-3.5 max-w-[220px]">
                            <p className="font-medium text-(--sp-text) truncate" title={productName}>
                              {productName}
                            </p>
                            <p className="font-mono text-xs text-(--sp-text-muted) truncate">
                              {sku}
                            </p>
                          </td>

                          {/* 5. Biến động */}
                          <td
                            className={`px-4 py-3.5 text-right font-bold whitespace-nowrap ${
                              isPositive ? "text-emerald-600" : "text-(--sp-danger)"
                            }`}
                          >
                            <span className="inline-flex items-center justify-end gap-1">
                              {isPositive ? (
                                <ArrowDownRight className="size-4 shrink-0 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="size-4 shrink-0 text-(--sp-danger)" />
                              )}
                              {isPositive ? `+${m.delta}` : m.delta}
                            </span>
                          </td>

                          {/* 6. Tồn sau GD */}
                          <td className="px-4 py-3.5 text-right font-semibold text-(--sp-text) whitespace-nowrap">
                            {m.afterQuantity !== undefined
                              ? Number(m.afterQuantity).toLocaleString("vi-VN")
                              : "—"}
                          </td>

                          {/* 7. Người thực hiện */}
                          <td className="px-4 py-3.5 text-xs text-(--sp-text-muted) whitespace-nowrap">
                            {createdBy}
                          </td>

                          {/* 8. Ghi chú */}
                          <td className="px-4 py-3.5 text-xs text-(--sp-text-muted) max-w-[180px]">
                            <span className="block truncate" title={noteText}>
                              {noteText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (< 768px) */}
              <div className="md:hidden divide-y divide-(--sp-border)">
                {filteredMovements.map((m) => {
                  const isPositive = Number(m.delta) > 0;
                  const badgeConfig = getMovementBadgeConfig(m.type);
                  const productName =
                    m.stockItem?.name || m.productName || `Mặt hàng kho #${m.id}`;
                  const sku =
                    m.stockItem?.sku ||
                    m.sku ||
                    ((m as unknown as { stockItemId?: number }).stockItemId
                      ? `SKU-${(m as unknown as { stockItemId?: number }).stockItemId}`
                      : "—");
                  const referenceDisplay = m.referenceId
                    ? m.referenceId.startsWith("#")
                      ? m.referenceId
                      : `#${m.referenceId}`
                    : "—";
                  const createdBy =
                    m.createdByName || m.createdBy || m.userName || "Hệ thống";
                  const noteText =
                    m.note ||
                    m.notes ||
                    (m.referenceType ? `${m.referenceType}` : "—");

                  return (
                    <div key={m.id} className="p-4 space-y-3">
                      {/* Row 1: Loại + Biến động */}
                      <div className="flex items-center justify-between">
                        <Badge tone={badgeConfig.tone}>{badgeConfig.label}</Badge>
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-bold ${
                            isPositive ? "text-emerald-600" : "text-(--sp-danger)"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownRight className="size-4 shrink-0" />
                          ) : (
                            <ArrowUpRight className="size-4 shrink-0" />
                          )}
                          {isPositive ? `+${m.delta}` : m.delta}
                        </span>
                      </div>

                      {/* Row 2: SP & SKU + Mã tham chiếu */}
                      <div>
                        <p className="font-semibold text-sm text-(--sp-text)">
                          {productName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--sp-text-muted)">
                          <span className="font-mono">{sku}</span>
                          {m.referenceId && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{referenceDisplay}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Row 3: Thời gian + Tồn sau GD */}
                      <div className="flex items-center justify-between border-t border-(--sp-border)/60 pt-2 text-xs text-(--sp-text-muted)">
                        <span>{formatDateTime(m.createdAt)}</span>
                        <span>
                          Tồn sau GD:{" "}
                          <strong className="font-semibold text-(--sp-text)">
                            {m.afterQuantity !== undefined
                              ? Number(m.afterQuantity).toLocaleString("vi-VN")
                              : "—"}
                          </strong>
                        </span>
                      </div>

                      {/* Row 4: Người thực hiện + Note (nếu có) */}
                      <div className="flex items-center justify-between text-[11px] text-(--sp-text-muted)">
                        <span>Bởi: {createdBy}</span>
                        {noteText !== "—" && (
                          <span className="truncate max-w-[150px]" title={noteText}>
                            {noteText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </OwnerLayout>
  );
}
