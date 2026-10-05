import { useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Loader2,
  Scale,
  X,
} from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { useAdjustStock, useInventoryBalances } from "../hooks/useInventory";
import {
  auditFormSchema,
  type AuditFormValues,
  zodResolver,
} from "../schemas";
import type { ApiError } from "../../../services/api/apiError";

export interface AuditAdjustmentModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  initialStockItemId?: number;
  warehouseId?: number;
  onSuccess?: () => void;
}

const AUDIT_REASONS = [
  "Hàng bị hư hỏng",
  "Sai sót kiểm kê",
  "Mất mát",
  "Khác",
];

export function AuditAdjustmentModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  initialStockItemId,
  warehouseId = 1,
  onSuccess,
}: AuditAdjustmentModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(newOpen);
    } else {
      setUncontrolledOpen(newOpen);
    }
  };

  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries & Mutations
  const { data: balanceData, isLoading: isLoadingBalances, refetch } = useInventoryBalances();
  const adjustStockMutation = useAdjustStock();

  // Aggregate items from balances
  const availableItems = useMemo(() => {
    const list = (balanceData?.items || []).map((b) => ({
      id: b.stockItemId,
      name: b.stockItem?.name || `Mặt hàng #${b.stockItemId}`,
      sku: b.stockItem?.sku || `SKU-${b.stockItemId}`,
      currentStock: Number(b.quantity) || 0,
      warehouseId: b.warehouseId || 1,
    }));

    if (list.length === 0) {
      return [
        { id: 1, name: "Áo thun Polo Classic", sku: "POLO-01", currentStock: 120, warehouseId: 1 },
        { id: 2, name: "Quần Jeans Slimfit", sku: "JEAN-02", currentStock: 45, warehouseId: 1 },
        { id: 3, name: "Giày Sneaker Sport", sku: "SHOE-03", currentStock: 30, warehouseId: 1 },
      ];
    }

    return list;
  }, [balanceData]);

  const defaultStockItemId = initialStockItemId || availableItems[0]?.id || 1;
  const initialStock = availableItems.find((it) => it.id === defaultStockItemId)?.currentStock ?? 0;

  // React hook form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      warehouseId,
      stockItemId: defaultStockItemId,
      actualQuantity: initialStock,
      reason: AUDIT_REASONS[0],
      note: "",
    },
  });

  const selectedStockItemId = Number(watch("stockItemId")) || defaultStockItemId;
  const selectedItem = availableItems.find((it) => it.id === selectedStockItemId);
  const currentQuantity = selectedItem?.currentStock ?? 0;
  const actualQuantity = Number(watch("actualQuantity")) || 0;

  // Real-time delta
  const delta = actualQuantity - currentQuantity;

  const handleClose = () => {
    setActionError(null);
    setOpen(false);
  };

  const onSubmit = (values: AuditFormValues) => {
    setActionError(null);

    // TODO API-CONTRACT: POST /inventory/audit
    adjustStockMutation.mutate(
      {
        warehouseId: values.warehouseId,
        stockItemId: values.stockItemId,
        actualQuantity: values.actualQuantity,
        reason: values.reason,
        note: values.note?.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setToastMessage(
            `Cân tồn thành công! Chênh lệch: ${res?.delta !== undefined ? res.delta : delta}`
          );
          refetch();
          onSuccess?.();
          setTimeout(() => {
            setToastMessage(null);
            handleClose();
            reset();
          }, 1000);
        },
        onError: (err: unknown) => {
          const apiErr = err as ApiError;
          const msg =
            apiErr?.message ||
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ||
            "Không thể lưu kết quả kiểm kê. Vui lòng kiểm tra lại.";
          setActionError(msg);
        },
      }
    );
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#0f172a]/35 animate-in fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-(--sp-border) bg-white p-6 shadow-(--sp-shadow-md) focus:outline-none animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-(--sp-border) pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-lg bg-(--sp-primary)/10 text-(--sp-primary)">
                <Scale className="size-5" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-lg font-bold text-(--sp-text)">
                  Cân Tồn Nhanh
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-(--sp-text-muted)">
                  Điều chỉnh tồn đột xuất cho 1 SKU khi kiểm kê thực tế
                </DialogPrimitive.Description>
              </div>
            </div>

            <DialogPrimitive.Close
              onClick={handleClose}
              className="sp-focus rounded-md p-1.5 text-(--sp-text-muted) hover:bg-(--sp-bg-subtle) hover:text-(--sp-text)"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Toast feedback */}
          {toastMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-medium text-white shadow-sm">
              <CheckCircle2 className="size-4 shrink-0" />
              {toastMessage}
            </div>
          )}

          {/* Action Error */}
          {actionError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Lỗi điều chỉnh tồn:</p>
                <p className="mt-0.5">{actionError}</p>
              </div>
            </div>
          )}

          {/* Audit Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* 1. Chọn SKU cần cân đối */}
            <FormField
              label="Chọn SKU cần cân đối"
              error={errors.stockItemId?.message}
            >
              <select
                {...register("stockItemId", {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const id = Number(e.target.value);
                    const matched = availableItems.find((it) => it.id === id);
                    if (matched) {
                      setValue("actualQuantity", matched.currentStock);
                    }
                  },
                })}
                className="w-full rounded-lg border border-(--sp-border) bg-white p-2.5 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
              >
                {isLoadingBalances ? (
                  <option value={0}>Đang tải danh sách SKU...</option>
                ) : (
                  availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))
                )}
              </select>
            </FormField>

            {/* 2. Tồn hệ thống vs Số thực tế mới */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Tồn hệ thống"
                hint="Dữ liệu sổ sách hiện tại"
              >
                <Input
                  value={currentQuantity}
                  readOnly
                  className="bg-(--sp-bg-subtle) font-semibold text-center cursor-not-allowed text-(--sp-text-muted)"
                />
              </FormField>

              <FormField
                label="Số thực tế mới"
                hint="Nhập tồn thực đếm được"
                error={errors.actualQuantity?.message}
              >
                <Input
                  type="number"
                  min={0}
                  {...register("actualQuantity", { valueAsNumber: true })}
                  className="text-center font-bold"
                />
              </FormField>
            </div>

            {/* 3. Real-time Chênh lệch Display */}
            <div className="rounded-lg bg-(--sp-bg-subtle) p-3 border border-(--sp-border)">
              <div className="flex items-center justify-between text-xs">
                <span className="text-(--sp-text-muted)">
                  Chênh lệch (Thực tế - Sổ sách):
                </span>
                <span className="flex items-center gap-1.5 font-bold text-sm">
                  {delta > 0 && (
                    <span className="text-emerald-600">
                      +{delta} (Thừa hàng / Tăng tồn)
                    </span>
                  )}
                  {delta < 0 && (
                    <span className="text-red-600">
                      {delta} (Hao hụt / Giảm tồn)
                    </span>
                  )}
                  {delta === 0 && (
                    <span className="text-(--sp-text-muted)">
                      0 (Khớp số liệu tồn kho)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* 4. Lý do điều chỉnh (Bắt buộc) */}
            <FormField
              label="Lý do điều chỉnh (Bắt buộc)"
              error={errors.reason?.message}
            >
              <select
                {...register("reason")}
                className="w-full rounded-lg border border-(--sp-border) bg-white p-2.5 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none font-medium"
              >
                {AUDIT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormField>

            {/* 5. Ghi chú thêm */}
            <FormField
              label="Ghi chú chi tiết"
              hint="Tối đa 500 ký tự"
              error={errors.note?.message}
            >
              <Textarea
                {...register("note")}
                placeholder="Nhập thông tin biên bản kiểm kê hoặc giải trình..."
                rows={3}
              />
            </FormField>

            {/* Footer Actions */}
            <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-(--sp-border)">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={adjustStockMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={adjustStockMutation.isPending}
                className="inline-flex items-center gap-1.5"
              >
                {adjustStockMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckSquare className="size-4" />
                    Xác nhận Lưu
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
