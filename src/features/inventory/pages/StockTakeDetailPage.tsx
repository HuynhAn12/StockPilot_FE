import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Play,
  RotateCcw,
  Save,
  Scale,
  XCircle,
} from "lucide-react";

import { Breadcrumb } from "../../../components/data-display/Breadcrumb";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import {
  useCancelStockTake,
  useCompleteStockTake,
  useStartStockTake,
  useStockTake,
  useUpdateStockTakeCounts,
} from "../hooks/useInventory";
import type {
  StockTakeCount,
  StockTakeStatus,
  UpdateStockTakeCountsPayload,
} from "../types";

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
 * Format currency in VNĐ with optional leading sign
 */
function formatVND(value: number): string {
  return `${value.toLocaleString("vi-VN")} đ`;
}

/**
 * Status badge configurations
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
      return { tone: "success", label: "Đã hoàn tất" };
    case "CANCELED":
      return { tone: "danger", label: "Đã hủy" };
    default:
      return { tone: "neutral", label: status };
  }
}

/**
 * Inline State Machine Stepper Component
 * Visualizing: ① DRAFT ──→ ② IN_PROGRESS ──→ ③ COMPLETED
 */
function StockTakeStepper({ status }: { status: StockTakeStatus }) {
  const steps = [
    {
      num: 1,
      title: "DRAFT",
      label: "Bản nháp",
      desc: "Khóa ô đếm",
    },
    {
      num: 2,
      title: "IN_PROGRESS",
      label: "Đang kiểm",
      desc: "Cho phép nhập",
    },
    {
      num: 3,
      title: "COMPLETED",
      label: "Hoàn tất",
      desc: "Cân tồn & Chốt số",
    },
  ];

  const getStepStatus = (index: number) => {
    if (status === "CANCELED") return "canceled";
    const currentIndex = status === "DRAFT" ? 0 : status === "IN_PROGRESS" ? 1 : 2;
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "active";
    return "pending";
  };

  return (
    <Card className="p-4 border-(--sp-border) bg-(--sp-surface)">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {steps.map((step, idx) => {
          const stepState = getStepStatus(idx);
          const isLast = idx === steps.length - 1;

          return (
            <div
              key={step.num}
              className="flex items-center gap-3 w-full sm:w-auto flex-1 last:flex-initial"
            >
              <div className="flex items-center gap-3">
                {/* Step Circle Indicator */}
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    stepState === "completed"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : stepState === "active"
                      ? "bg-(--sp-primary) text-white ring-4 ring-(--sp-primary)/15"
                      : stepState === "canceled"
                      ? "bg-slate-200 text-slate-500"
                      : "bg-(--sp-bg-subtle) border border-(--sp-border) text-(--sp-text-muted)"
                  }`}
                >
                  {stepState === "completed" ? (
                    <Check className="size-4 stroke-[3]" />
                  ) : (
                    <span>{step.num}</span>
                  )}
                </div>

                {/* Step Label & Subtext */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        stepState === "active"
                          ? "text-(--sp-primary)"
                          : stepState === "completed"
                          ? "text-emerald-700"
                          : "text-(--sp-text-muted)"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="font-mono text-[10px] text-(--sp-text-soft)">
                      ({step.title})
                    </span>
                  </div>
                  <p className="text-[11px] text-(--sp-text-muted) truncate">
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Connecting line to next step (desktop) */}
              {!isLast && (
                <div className="hidden sm:block flex-1 mx-3 h-0.5 bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      stepState === "completed" ? "bg-emerald-500 w-full" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function StockTakeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = Number(id);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local state for counts editing: stockItemId -> { actualQuantity, note }
  const [editedCounts, setEditedCounts] = useState<
    Record<number, { actualQuantity: string; note: string }>
  >({});

  // Query detail
  // TODO API-CONTRACT: Query GET /stock-takes/:id
  const { data: stockTake, isLoading, error, refetch } = useStockTake(numericId);

  // Mutations
  const startMutation = useStartStockTake();
  const updateCountsMutation = useUpdateStockTakeCounts();
  const completeMutation = useCompleteStockTake();
  const cancelMutation = useCancelStockTake();

  // Helper to get effective actual quantity string for a count row
  const getEffectiveActual = (count: StockTakeCount): string => {
    const local = editedCounts[count.stockItemId];
    if (local?.actualQuantity !== undefined) {
      return local.actualQuantity;
    }
    return count.actualQuantity !== null && count.actualQuantity !== undefined
      ? String(count.actualQuantity)
      : "";
  };

  // Helper to get effective note string for a count row
  const getEffectiveNote = (count: StockTakeCount): string => {
    const local = editedCounts[count.stockItemId];
    if (local?.note !== undefined) {
      return local.note;
    }
    return count.note || "";
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State flags
  const isDraft = stockTake?.status === "DRAFT";
  const isInProgress = stockTake?.status === "IN_PROGRESS";
  const isCompleted = stockTake?.status === "COMPLETED";
  const isCanceled = stockTake?.status === "CANCELED";

  // Handle actual quantity change for a row
  const handleQuantityChange = (stockItemId: number, rawVal: string) => {
    setEditedCounts((prev) => ({
      ...prev,
      [stockItemId]: {
        actualQuantity: rawVal,
        note: prev[stockItemId]?.note !== undefined ? prev[stockItemId].note : (stockTake?.counts.find((c) => c.stockItemId === stockItemId)?.note || ""),
      },
    }));
  };

  // Handle note change for a row
  const handleNoteChange = (stockItemId: number, noteVal: string) => {
    setEditedCounts((prev) => ({
      ...prev,
      [stockItemId]: {
        actualQuantity: prev[stockItemId]?.actualQuantity !== undefined ? prev[stockItemId].actualQuantity : (stockTake?.counts.find((c) => c.stockItemId === stockItemId)?.actualQuantity !== null && stockTake?.counts.find((c) => c.stockItemId === stockItemId)?.actualQuantity !== undefined ? String(stockTake?.counts.find((c) => c.stockItemId === stockItemId)?.actualQuantity) : ""),
        note: noteVal,
      },
    }));
  };

  // Action: Bắt đầu kiểm kê (POST /start)
  const handleStartStockTake = async () => {
    setErrorMessage(null);
    try {
      // TODO API-CONTRACT: Call POST /stock-takes/:id/start
      await startMutation.mutateAsync(numericId);
      showToast("Đã bắt đầu đợt kiểm kê! Giờ bạn có thể nhập số lượng đếm.");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể bắt đầu đợt kiểm kê."
      );
    }
  };

  // Action: Lưu nháp số đếm (PUT /counts)
  const handleSaveCounts = async () => {
    if (!stockTake?.counts) return;
    setErrorMessage(null);

    const payload: UpdateStockTakeCountsPayload = {
      counts: stockTake.counts.map((c) => {
        const valStr = getEffectiveActual(c);
        const actual =
          valStr !== "" && !isNaN(Number(valStr))
            ? Number(valStr)
            : c.actualQuantity ?? 0;
        const note = getEffectiveNote(c);

        return {
          stockItemId: c.stockItemId,
          actualQuantity: actual,
          note,
        };
      }),
    };

    try {
      // TODO API-CONTRACT: Call PUT /stock-takes/:id/counts
      await updateCountsMutation.mutateAsync({ id: numericId, payload });
      showToast("Đã lưu nháp kết quả kiểm đếm thành công!");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Lỗi lưu số lượng kiểm đếm."
      );
    }
  };

  // Action: Hoàn tất & Cân tồn (POST /complete)
  const handleCompleteStockTake = async () => {
    setErrorMessage(null);
    try {
      // First save current edited counts if any
      if (stockTake?.counts && isInProgress) {
        const payload: UpdateStockTakeCountsPayload = {
          counts: stockTake.counts.map((c) => {
            const valStr = getEffectiveActual(c);
            const actual =
              valStr !== "" && !isNaN(Number(valStr))
                ? Number(valStr)
                : c.actualQuantity ?? 0;
            return {
              stockItemId: c.stockItemId,
              actualQuantity: actual,
              note: getEffectiveNote(c),
            };
          }),
        };
        await updateCountsMutation.mutateAsync({ id: numericId, payload });
      }

      // TODO API-CONTRACT: Call POST /stock-takes/:id/complete
      await completeMutation.mutateAsync(numericId);
      showToast("Đã chốt đợt kiểm kê và cân chỉnh tồn kho thành công!");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Lỗi khi hoàn tất đợt kiểm kê."
      );
    }
  };

  // Action: Hủy đợt kiểm (POST /cancel)
  const handleCancelStockTake = async () => {
    setErrorMessage(null);
    try {
      // TODO API-CONTRACT: Call POST /stock-takes/:id/cancel
      await cancelMutation.mutateAsync(numericId);
      showToast("Đã hủy đợt kiểm kê.");
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Lỗi khi hủy đợt kiểm kê."
      );
    }
  };

  // Calculate real-time summary statistics
  const summary = useMemo(() => {
    const counts = stockTake?.counts || [];
    let matchCount = 0;
    let mismatchCount = 0;
    let totalLossValue = 0;
    let totalGainValue = 0;

    counts.forEach((c) => {
      const local = editedCounts[c.stockItemId];
      const valStr = local?.actualQuantity !== undefined
        ? local.actualQuantity
        : (c.actualQuantity !== null && c.actualQuantity !== undefined ? String(c.actualQuantity) : "");
      const actual =
        valStr !== "" && !isNaN(Number(valStr))
          ? Number(valStr)
          : c.actualQuantity;

      const system = c.systemQuantity;
      const costPrice = c.stockItem?.costPrice || 0;

      if (actual !== null && actual !== undefined) {
        const variance = actual - system;
        if (variance === 0) {
          matchCount++;
        } else {
          mismatchCount++;
          if (variance < 0) {
            // Thiếu hàng (mất mát)
            totalLossValue += Math.abs(variance) * costPrice;
          } else {
            // Thừa hàng
            totalGainValue += variance * costPrice;
          }
        }
      }
    });

    return {
      totalItems: counts.length,
      matchCount,
      mismatchCount,
      totalLossValue,
      totalGainValue,
      netVarianceValue: totalGainValue - totalLossValue,
    };
  }, [stockTake?.counts, editedCounts]);

  const isAnyActionPending =
    startMutation.isPending ||
    updateCountsMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending;

  return (
    <OwnerLayout title={`Kiểm kê: ${stockTake?.code || id}`} onRefresh={refetch}>
      <div className="space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Breadcrumb
              items={[
                "Kiểm kê kho",
                stockTake?.code || `STK-${stockTake?.id || id}`,
              ]}
            />
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">
                {stockTake?.title || "Chi tiết đợt kiểm kê"}
              </h1>
              {stockTake && (
                <Badge tone={getStatusBadgeConfig(stockTake.status).tone}>
                  {getStatusBadgeConfig(stockTake.status).label}
                </Badge>
              )}
            </div>
            {/* Subtitle with API identifier */}
            <p className="text-xs font-mono text-(--sp-text-muted)">
              API: GET /stock-takes/{id}
            </p>
          </div>

          {/* Top Quick Actions per State Machine */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate("/app/stock-takes")}
              disabled={isAnyActionPending}
              className="inline-flex items-center gap-1.5 text-xs"
            >
              <ArrowLeft className="size-3.5" />
              Danh sách
            </Button>

            {/* State 1: DRAFT buttons */}
            {isDraft && (
              <>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isAnyActionPending}
                      className="inline-flex items-center gap-1.5 text-xs"
                    >
                      <XCircle className="size-3.5" />
                      Hủy đợt
                    </Button>
                  }
                  title="Xác nhận hủy đợt kiểm kê"
                  description="Bạn có chắc chắn muốn hủy đợt kiểm kê này không? Hành động này sẽ chuyển trạng thái sang CANCELED."
                  confirmLabel="Đồng ý hủy"
                  cancelLabel="Đóng"
                  onConfirm={handleCancelStockTake}
                />

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartStockTake}
                  disabled={isAnyActionPending}
                  className="inline-flex items-center gap-1.5 text-xs"
                >
                  <Play className="size-3.5" />
                  Bắt đầu kiểm kê
                </Button>
              </>
            )}

            {/* State 2: IN_PROGRESS buttons */}
            {isInProgress && (
              <>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isAnyActionPending}
                      className="inline-flex items-center gap-1.5 text-xs"
                    >
                      <XCircle className="size-3.5" />
                      Hủy đợt
                    </Button>
                  }
                  title="Xác nhận hủy đợt kiểm kê"
                  description="Đợt kiểm kê đang diễn ra. Khi hủy bỏ, toàn bộ tiến trình sẽ không được cân tồn kho."
                  confirmLabel="Hủy đợt kiểm"
                  cancelLabel="Đóng"
                  onConfirm={handleCancelStockTake}
                />

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveCounts}
                  disabled={isAnyActionPending}
                  className="inline-flex items-center gap-1.5 text-xs"
                >
                  <Save className="size-3.5" />
                  Lưu nháp số đếm
                </Button>

                <ConfirmDialog
                  trigger={
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isAnyActionPending}
                      className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Scale className="size-3.5" />
                      Hoàn tất & Cân tồn
                    </Button>
                  }
                  title="Xác nhận Hoàn tất & Cân tồn kho"
                  description="Sau khi hoàn tất, hệ thống sẽ chốt sổ kiểm kê và tự động điều chỉnh số lượng tồn kho theo số đếm thực tế. Bạn không thể hoàn tác hành động này."
                  confirmLabel="Xác nhận & Cân tồn"
                  cancelLabel="Kiểm tra lại"
                  onConfirm={handleCompleteStockTake}
                />
              </>
            )}
          </div>
        </div>

        {/* Success Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg bg-emerald-600 px-4 py-3 text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="size-5 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Thao tác thất bại:</p>
              <p className="mt-0.5 text-xs text-red-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* CANCELED Banner */}
        {isCanceled && (
          <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <Ban className="size-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold text-base">Đợt kiểm kê này đã bị hủy bỏ (CANCELED)</p>
              <p className="mt-1 text-xs text-red-700">
                Đợt kiểm kê đã kết thúc mà không chốt số hoặc cân chỉnh tồn kho. Toàn bộ ô đếm đã bị khóa và chỉ dùng để xem lại.
              </p>
            </div>
          </div>
        )}

        {/* 1. LOADING STATE */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        )}

        {/* 2. ERROR STATE */}
        {!isLoading && error && (
          <Card className="p-8 text-center border-(--sp-border)">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
              <AlertCircle className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-(--sp-text)">
              Không tìm thấy đợt kiểm kê #{id}
            </h3>
            <p className="mt-1 text-sm text-(--sp-text-muted) max-w-md mx-auto">
              {error instanceof Error ? error.message : "Đã có lỗi xảy ra hoặc máy chủ chưa phản hồi."}
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/app/stock-takes")}
              >
                Quay lại danh sách
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5"
              >
                <RotateCcw className="size-4" />
                Thử lại
              </Button>
            </div>
          </Card>
        )}

        {/* 3. DATA STATE */}
        {!isLoading && !error && stockTake && (
          <div className="space-y-6">
            {/* State Machine Stepper */}
            <StockTakeStepper status={stockTake.status} />

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 border-(--sp-border)">
                <span className="text-xs text-(--sp-text-muted) font-medium">Tổng số SKU</span>
                <p className="mt-1 text-2xl font-bold text-(--sp-text)">
                  {summary.totalItems}
                </p>
                <span className="text-[11px] text-(--sp-text-muted)">
                  {stockTake.scope === "ALL" ? "Toàn bộ kho" : `Danh mục: ${stockTake.categoryName || "—"}`}
                </span>
              </Card>

              <Card className="p-4 border-(--sp-border)">
                <span className="text-xs text-(--sp-success) font-medium">Khớp số lượng</span>
                <p className="mt-1 text-2xl font-bold text-(--sp-success)">
                  {summary.matchCount} <span className="text-xs font-normal text-(--sp-text-muted)">SKU</span>
                </p>
                <span className="text-[11px] text-(--sp-text-muted)">
                  Chênh lệch bằng 0
                </span>
              </Card>

              <Card className="p-4 border-(--sp-border)">
                <span className="text-xs text-(--sp-danger) font-medium">Lệch số lượng</span>
                <p className="mt-1 text-2xl font-bold text-(--sp-danger)">
                  {summary.mismatchCount} <span className="text-xs font-normal text-(--sp-text-muted)">SKU</span>
                </p>
                <span className="text-[11px] text-(--sp-text-muted)">
                  Thừa hoặc thiếu hàng
                </span>
              </Card>

              <Card className="p-4 border-(--sp-border)">
                <span className="text-xs text-(--sp-text-muted) font-medium">Tổng giá trị thất thoát</span>
                <p className={`mt-1 text-2xl font-bold ${summary.totalLossValue > 0 ? "text-red-600" : "text-(--sp-text)"}`}>
                  {formatVND(summary.totalLossValue)}
                </p>
                <span className="text-[11px] text-(--sp-text-muted)">
                  Tính theo giá vốn SKU thiếu
                </span>
              </Card>
            </div>

            {/* Meta details bar */}
            <Card className="p-4 border-(--sp-border) bg-(--sp-bg-subtle)/40">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-(--sp-text-muted)">Người tạo:</span>{" "}
                  <span className="font-semibold text-(--sp-text)">
                    {stockTake.createdBy || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-(--sp-text-muted)">Ngày tạo:</span>{" "}
                  <span className="font-medium text-(--sp-text)">
                    {formatDateTime(stockTake.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-(--sp-text-muted)">Bắt đầu đếm:</span>{" "}
                  <span className="font-medium text-(--sp-text)">
                    {formatDateTime(stockTake.startedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-(--sp-text-muted)">Hoàn tất chốt:</span>{" "}
                  <span className="font-medium text-(--sp-text)">
                    {formatDateTime(stockTake.completedAt)}
                  </span>
                </div>
              </div>
              {stockTake.note && (
                <div className="mt-2.5 pt-2 border-t border-(--sp-border)/60 text-xs">
                  <span className="font-semibold text-(--sp-text-muted)">Ghi chú đợt kiểm:</span>{" "}
                  <span className="text-(--sp-text)">{stockTake.note}</span>
                </div>
              )}
            </Card>

            {/* Main Counts Table / Mobile Cards */}
            <Card className="overflow-hidden border-(--sp-border)">
              <div className="p-4 border-b border-(--sp-border) flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-(--sp-text)">
                    Danh Sách Hàng Hóa Kiểm Đếm
                  </h3>
                  <p className="text-xs text-(--sp-text-muted) mt-0.5">
                    {isDraft && "Trạng thái DRAFT: Nhấn 'Bắt đầu kiểm kê' ở trên để mở khóa ô đếm."}
                    {isInProgress && "Trạng thái IN_PROGRESS: Nhập số lượng thực tế đếm được vào từng mặt hàng."}
                    {isCompleted && "Trạng thái COMPLETED: Đợt kiểm đã chốt sổ thành công, dữ liệu chỉ đọc."}
                    {isCanceled && "Trạng thái CANCELED: Đợt kiểm đã hủy bỏ."}
                  </p>
                </div>

                {isInProgress && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSaveCounts}
                    disabled={isAnyActionPending}
                    className="inline-flex items-center gap-1.5 text-xs"
                  >
                    <Save className="size-3.5" />
                    Lưu nháp
                  </Button>
                )}
              </div>

              {/* Empty state for counts */}
              {(!stockTake.counts || stockTake.counts.length === 0) ? (
                <div className="p-8 text-center text-sm text-(--sp-text-muted)">
                  Chưa có danh mục sản phẩm nào trong đợt kiểm kê này.
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted) uppercase border-b border-(--sp-border)">
                        <tr>
                          <th className="py-3 px-4 w-[28%]">Sản phẩm & SKU</th>
                          <th className="py-3 px-4 text-right w-[10%]">Tồn HT</th>
                          <th className="py-3 px-4 text-right w-[15%]">Thực tế đếm</th>
                          <th className="py-3 px-4 text-right w-[12%]">Chênh lệch</th>
                          <th className="py-3 px-4 text-right w-[15%]">Giá trị thất thoát</th>
                          <th className="py-3 px-4 w-[20%]">Ghi chú hàng hóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--sp-border)">
                        {stockTake.counts.map((count: StockTakeCount) => {
                          const inputVal = getEffectiveActual(count);
                          const noteVal = getEffectiveNote(count);

                          // Parse actual quantity
                          const parsedActual =
                            inputVal !== "" && !isNaN(Number(inputVal))
                              ? Number(inputVal)
                              : count.actualQuantity;

                          const systemQty = count.systemQuantity;
                          const costPrice = count.stockItem?.costPrice || 0;

                          // Compute real-time variance
                          const hasActual = parsedActual !== null && parsedActual !== undefined;
                          const variance = hasActual ? parsedActual - systemQty : null;
                          const lossOrGainValue = variance !== null ? variance * costPrice : null;

                          return (
                            <tr
                              key={count.id || count.stockItemId}
                              className="hover:bg-(--sp-bg-subtle)/40 transition-colors"
                            >
                              {/* Sản phẩm & SKU */}
                              <td className="py-3 px-4">
                                <div className="font-medium text-(--sp-text)">
                                  {count.stockItem?.name || `Mặt hàng #${count.stockItemId}`}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-(--sp-text-muted)">
                                  <span className="font-mono">{count.stockItem?.sku || "SKU-N/A"}</span>
                                  <span>•</span>
                                  <span>Giá vốn: {formatVND(costPrice)}</span>
                                </div>
                              </td>

                              {/* Tồn HT (System Quantity) */}
                              <td className="py-3 px-4 text-right font-mono font-semibold text-(--sp-text)">
                                {systemQty}
                              </td>

                              {/* Thực tế đếm (Input or display) */}
                              <td className="py-3 px-4 text-right">
                                {isInProgress ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={inputVal}
                                    onChange={(e) =>
                                      handleQuantityChange(count.stockItemId, e.target.value)
                                    }
                                    placeholder="Nhập SL"
                                    className="h-8 text-right font-mono font-medium max-w-[110px] ml-auto"
                                    disabled={isAnyActionPending}
                                  />
                                ) : (
                                  <span className="font-mono font-semibold text-(--sp-text)">
                                    {count.actualQuantity !== null && count.actualQuantity !== undefined
                                      ? count.actualQuantity
                                      : isDraft
                                      ? <span className="text-slate-400 italic font-normal text-xs">Chưa đếm</span>
                                      : "—"}
                                  </span>
                                )}
                              </td>

                              {/* Chênh lệch */}
                              <td className="py-3 px-4 text-right">
                                {hasActual && variance !== null ? (
                                  variance === 0 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      0 (Khớp)
                                    </span>
                                  ) : variance < 0 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                      {variance} (Thiếu)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                      +{variance} (Thừa)
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>

                              {/* Giá trị thất thoát */}
                              <td className="py-3 px-4 text-right font-mono text-xs">
                                {lossOrGainValue !== null ? (
                                  lossOrGainValue === 0 ? (
                                    <span className="text-(--sp-text-muted)">0 đ</span>
                                  ) : lossOrGainValue < 0 ? (
                                    <span className="font-bold text-red-600">
                                      -{formatVND(Math.abs(lossOrGainValue))}
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-emerald-600">
                                      +{formatVND(lossOrGainValue)}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* Ghi chú hàng hóa */}
                              <td className="py-3 px-4">
                                {isInProgress ? (
                                  <Input
                                    type="text"
                                    value={noteVal}
                                    onChange={(e) =>
                                      handleNoteChange(count.stockItemId, e.target.value)
                                    }
                                    placeholder="Ghi chú hỏng, móp..."
                                    className="h-8 text-xs w-full"
                                    disabled={isAnyActionPending}
                                  />
                                ) : (
                                  <span className="text-xs text-(--sp-text-muted)">
                                    {count.note || "—"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="block lg:hidden divide-y divide-(--sp-border)">
                    {stockTake.counts.map((count: StockTakeCount) => {
                      const inputVal = getEffectiveActual(count);
                      const noteVal = getEffectiveNote(count);

                      const parsedActual =
                        inputVal !== "" && !isNaN(Number(inputVal))
                          ? Number(inputVal)
                          : count.actualQuantity;

                      const systemQty = count.systemQuantity;
                      const costPrice = count.stockItem?.costPrice || 0;

                      const hasActual = parsedActual !== null && parsedActual !== undefined;
                      const variance = hasActual ? parsedActual - systemQty : null;
                      const lossOrGainValue = variance !== null ? variance * costPrice : null;

                      return (
                        <div key={count.id || count.stockItemId} className="p-4 space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm text-(--sp-text)">
                              {count.stockItem?.name || `Mặt hàng #${count.stockItemId}`}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-(--sp-text-muted)">
                              <span className="font-mono">{count.stockItem?.sku || "SKU-N/A"}</span>
                              <span>•</span>
                              <span>Giá vốn: {formatVND(costPrice)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs bg-(--sp-bg-subtle)/60 p-2.5 rounded-lg">
                            <div>
                              <span className="text-(--sp-text-muted)">Tồn hệ thống:</span>
                              <p className="font-mono font-bold text-sm text-(--sp-text)">
                                {systemQty}
                              </p>
                            </div>

                            <div>
                              <span className="text-(--sp-text-muted)">Thực tế đếm:</span>
                              {isInProgress ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={inputVal}
                                  onChange={(e) =>
                                    handleQuantityChange(count.stockItemId, e.target.value)
                                  }
                                  placeholder="Nhập SL"
                                  className="h-8 text-right font-mono font-bold text-sm mt-0.5"
                                  disabled={isAnyActionPending}
                                />
                              ) : (
                                <p className="font-mono font-bold text-sm text-(--sp-text)">
                                  {count.actualQuantity !== null && count.actualQuantity !== undefined
                                    ? count.actualQuantity
                                    : "—"}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Variance and Value Row */}
                          <div className="flex items-center justify-between text-xs pt-1">
                            <div>
                              <span className="text-(--sp-text-muted) mr-1.5">Chênh lệch:</span>
                              {hasActual && variance !== null ? (
                                variance === 0 ? (
                                  <span className="font-semibold text-emerald-700">0 (Khớp)</span>
                                ) : variance < 0 ? (
                                  <span className="font-semibold text-red-600">{variance} (Thiếu)</span>
                                ) : (
                                  <span className="font-semibold text-amber-600">+{variance} (Thừa)</span>
                                )
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>

                            <div>
                              <span className="text-(--sp-text-muted) mr-1.5">Giá trị:</span>
                              {lossOrGainValue !== null ? (
                                lossOrGainValue < 0 ? (
                                  <span className="font-bold text-red-600">
                                    -{formatVND(Math.abs(lossOrGainValue))}
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-600">
                                    +{formatVND(lossOrGainValue)}
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                          </div>

                          {/* Mobile Note Input */}
                          {isInProgress ? (
                            <Input
                              type="text"
                              value={noteVal}
                              onChange={(e) =>
                                handleNoteChange(count.stockItemId, e.target.value)
                              }
                              placeholder="Ghi chú hàng hóa..."
                              className="h-8 text-xs w-full"
                              disabled={isAnyActionPending}
                            />
                          ) : count.note ? (
                            <p className="text-xs text-(--sp-text-muted) italic">
                              Ghi chú: {count.note}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>

            {/* Bottom Actions for IN_PROGRESS */}
            {isInProgress && (
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={handleSaveCounts}
                  disabled={isAnyActionPending}
                  className="inline-flex items-center gap-1.5"
                >
                  <Save className="size-4" />
                  Lưu nháp số đếm
                </Button>

                <ConfirmDialog
                  trigger={
                    <Button
                      variant="primary"
                      disabled={isAnyActionPending}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Scale className="size-4" />
                      Hoàn tất & Cân tồn
                    </Button>
                  }
                  title="Xác nhận Hoàn tất & Cân tồn kho"
                  description="Sau khi hoàn tất, hệ thống sẽ chốt sổ kiểm kê và tự động điều chỉnh số lượng tồn kho theo số đếm thực tế. Bạn không thể hoàn tác hành động này."
                  confirmLabel="Xác nhận & Cân tồn"
                  cancelLabel="Kiểm tra lại"
                  onConfirm={handleCompleteStockTake}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
