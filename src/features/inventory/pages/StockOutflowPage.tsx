import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  PackageMinus,
  Plus,
  Trash2,
} from "lucide-react";

import { Breadcrumb } from "../../../components/data-display/Breadcrumb";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useProducts } from "../../catalog/hooks/useCatalog";
import { useCreateOutflow, useInventoryBalances } from "../hooks/useInventory";
import {
  outflowFormSchema,
  type OutflowFormValues,
  zodResolver,
} from "../schemas";
import type { ApiError } from "../../../services/api/apiError";

const OUTFLOW_REASONS: Array<{
  value: "SALE" | "DAMAGE" | "TRANSFER" | "RETURN_SUPPLIER" | "OTHER";
  label: string;
}> = [
  { value: "SALE", label: "Bán hàng (SALE)" },
  { value: "DAMAGE", label: "Hư hỏng / Hao hụt (DAMAGE)" },
  { value: "TRANSFER", label: "Chuyển kho nội bộ (TRANSFER)" },
  { value: "RETURN_SUPPLIER", label: "Trả nhà cung cấp (RETURN_SUPPLIER)" },
  { value: "OTHER", label: "Khác (OTHER)" },
];

/**
 * Generate a display reference code formatted as PX-YYYYMMDD-XXX
 */
function generateReferenceCode(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `PX-${yyyy}${mm}${dd}-${randomNum}`;
}

export function StockOutflowPage() {
  const navigate = useNavigate();
  const [referenceCode] = useState(generateReferenceCode);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries for balances & products
  const { data: balanceData, isLoading: isLoadingBalances } = useInventoryBalances();
  const { data: productData, isLoading: isLoadingProducts } = useProducts();

  // Mutation for creating outflow
  const createOutflowMutation = useCreateOutflow();

  // Aggregate selectable items with available stock
  const availableItems = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        name: string;
        sku: string;
        totalStock: number;
        reservedStock: number;
        availableStock: number;
      }
    >();

    // From inventory balances
    (balanceData?.items || []).forEach((b) => {
      const total = Number(b.quantity) || 0;
      const reserved = Number(b.reservedQuantity) || 0;
      const available = Math.max(0, total - reserved);

      map.set(b.stockItemId, {
        id: b.stockItemId,
        name: b.stockItem?.name || `Mặt hàng #${b.stockItemId}`,
        sku: b.stockItem?.sku || `SKU-${b.stockItemId}`,
        totalStock: total,
        reservedStock: reserved,
        availableStock: available,
      });
    });

    // From catalog products if not already in balances
    (productData?.items || []).forEach((p) => {
      if (!map.has(p.id)) {
        map.set(p.id, {
          id: p.id,
          name: p.name,
          sku: p.code,
          totalStock: 0,
          reservedStock: 0,
          availableStock: 0,
        });
      }
    });

    // Fallback seed if empty
    if (map.size === 0) {
      map.set(1, {
        id: 1,
        name: "Áo thun Polo Classic",
        sku: "POLO-01",
        totalStock: 120,
        reservedStock: 20,
        availableStock: 100,
      });
      map.set(2, {
        id: 2,
        name: "Quần Jeans Slimfit",
        sku: "JEAN-02",
        totalStock: 45,
        reservedStock: 5,
        availableStock: 40,
      });
      map.set(3, {
        id: 3,
        name: "Giày Sneaker Sport",
        sku: "SHOE-03",
        totalStock: 30,
        reservedStock: 0,
        availableStock: 30,
      });
    }

    return Array.from(map.values());
  }, [balanceData, productData]);

  const defaultStockItemId = availableItems[0]?.id || 1;

  // Form setup with Zod resolver
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OutflowFormValues>({
    resolver: zodResolver(outflowFormSchema),
    defaultValues: {
      warehouseId: 1,
      reason: "SALE",
      note: "",
      items: [
        {
          stockItemId: defaultStockItemId,
          quantity: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];

  // Summary calculations
  const totalQuantity = watchedItems.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0),
    0
  );

  // Check if any row violates the available stock limit (Chặn xuất âm)
  const overStockItemIndexes = watchedItems
    .map((item, idx) => {
      const selectedItem = availableItems.find(
        (it) => it.id === Number(item?.stockItemId)
      );
      const available = selectedItem ? selectedItem.availableStock : 0;
      const qty = Number(item?.quantity) || 0;
      return qty > available ? idx : -1;
    })
    .filter((idx) => idx !== -1);

  const hasOverStockItem = overStockItemIndexes.length > 0;

  const onSubmit = (values: OutflowFormValues) => {
    // Chặn xuất âm tuyệt đối
    if (hasOverStockItem) {
      setActionError(
        "Không thể xuất kho: Có mặt hàng vượt quá tồn khả dụng trong kho."
      );
      return;
    }

    setActionError(null);

    // Prepare payload
    // TODO API-CONTRACT: POST /inventory/outflow
    createOutflowMutation.mutate(
      {
        warehouseId: values.warehouseId,
        reason: values.reason,
        note: values.note?.trim() || undefined,
        items: values.items.map((item) => ({
          stockItemId: Number(item.stockItemId),
          quantity: Number(item.quantity),
        })),
      },
      {
        onSuccess: (res) => {
          setToastMessage(
            `Tạo phiếu xuất kho thành công! Mã: ${res?.referenceCode || referenceCode}`
          );
          setTimeout(() => {
            navigate("/app/inventory");
          }, 1200);
        },
        onError: (err: unknown) => {
          const apiErr = err as ApiError;
          const msg =
            apiErr?.message ||
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ||
            "Không thể tạo phiếu xuất kho. Vui lòng kiểm tra kết nối API.";
          setActionError(msg);
        },
      }
    );
  };

  return (
    <OwnerLayout title="Tạo phiếu xuất kho">
      <div className="grid gap-6">
        {/* Header: Breadcrumbs & Page Titles */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Breadcrumb items={["Quản lý kho", "Xuất kho"]} />
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">
              Tạo Phiếu Xuất Kho (Stock Outflow)
            </h1>
            <p className="text-xs font-mono text-(--sp-text-muted)">
              API: POST /inventory/outflow
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/app/inventory")}
              disabled={createOutflowMutation.isPending}
              className="inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={
                createOutflowMutation.isPending ||
                fields.length === 0 ||
                hasOverStockItem
              }
              className="inline-flex items-center gap-1.5"
            >
              {createOutflowMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <PackageMinus className="size-4" />
                  Xác nhận Xuất kho
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg bg-emerald-600 px-4 py-3 text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="size-5 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {actionError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Lỗi tạo phiếu xuất kho:</p>
              <p className="mt-0.5">{actionError}</p>
            </div>
          </div>
        )}

        {/* Over-Stock Alert Warning Banner */}
        {hasOverStockItem && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Cảnh báo tồn kho khả dụng:</p>
              <p className="mt-0.5">
                Có một số mặt hàng có số lượng xuất vượt quá tồn khả dụng trong
                kho. Hệ thống đang chặn gửi yêu cầu để tránh xuất âm.
              </p>
            </div>
          </div>
        )}

        {/* Main 2-Column Form Layout */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Panel: Thông tin chứng từ (4 cols) */}
            <div className="lg:col-span-4">
              <Card className="p-5 border-(--sp-border) space-y-4">
                <div className="flex items-center gap-2 border-b border-(--sp-border) pb-3">
                  <FileSpreadsheet className="size-4 text-(--sp-primary)" />
                  <h2 className="text-base font-semibold text-(--sp-text)">
                    THÔNG TIN CHỨNG TỪ
                  </h2>
                </div>

                {/* Mã phiếu xuất (read-only auto-generated) */}
                <FormField
                  label="Mã phiếu xuất"
                  hint="Mã được tạo tự động cho giao dịch này"
                >
                  <Input
                    value={referenceCode}
                    readOnly
                    className="bg-(--sp-bg-subtle) font-mono text-xs font-semibold cursor-not-allowed text-(--sp-text-muted)"
                  />
                </FormField>

                {/* Kho hàng xuất */}
                <FormField label="Kho xuất">
                  <select
                    {...register("warehouseId", { valueAsNumber: true })}
                    className="w-full rounded-lg border border-(--sp-border) bg-white p-2.5 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
                  >
                    <option value={1}>Kho chính (Kho Trung Tâm #1)</option>
                    <option value={2}>Kho phụ (Chi nhánh 2)</option>
                  </select>
                </FormField>

                {/* Lý do xuất kho */}
                <FormField
                  label="Lý do xuất kho"
                  error={errors.reason?.message}
                >
                  <select
                    {...register("reason")}
                    className="w-full rounded-lg border border-(--sp-border) bg-white p-2.5 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none font-medium"
                  >
                    {OUTFLOW_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Ghi chú */}
                <FormField
                  label="Ghi chú phiếu xuất"
                  hint="Tối đa 500 ký tự"
                  error={errors.note?.message}
                >
                  <Textarea
                    {...register("note")}
                    placeholder="Nhập lý do chi tiết hoặc thông tin khách hàng/chi nhánh nhận..."
                    rows={4}
                  />
                </FormField>
              </Card>
            </div>

            {/* Right Panel: Mặt hàng xuất kho (8 cols) */}
            <div className="lg:col-span-8">
              <Card className="p-5 border-(--sp-border) space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-(--sp-border) pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-(--sp-text)">
                      MẶT HÀNG XUẤT KHO
                    </h2>
                    <p className="text-xs text-(--sp-text-muted)">
                      Chọn mặt hàng và số lượng xuất (chặn xuất vượt tồn khả dụng)
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const firstItem = availableItems[0];
                      append({
                        stockItemId: firstItem?.id || 1,
                        quantity: 1,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="size-4" />
                    Thêm hàng
                  </Button>
                </div>

                {errors.items?.root && (
                  <p className="text-xs text-(--sp-danger) flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    {errors.items.root.message}
                  </p>
                )}

                {/* Items Table / List */}
                {fields.length === 0 ? (
                  <div className="py-10 text-center text-(--sp-text-muted)">
                    <p className="text-sm">Chưa có mặt hàng nào trong danh sách.</p>
                    <p className="text-xs mt-1">
                      Bấm nút &quot;+ Thêm hàng&quot; ở trên để chọn mặt hàng xuất kho.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-semibold text-(--sp-text-muted) px-2">
                      <span className="sm:col-span-5">Sản phẩm / SKU</span>
                      <span className="sm:col-span-2 text-center">Tồn khả dụng</span>
                      <span className="sm:col-span-2 text-right">SL xuất</span>
                      <span className="sm:col-span-2 text-center">Trạng thái</span>
                      <span className="sm:col-span-1 text-center">Xóa</span>
                    </div>

                    <div className="divide-y divide-(--sp-border)">
                      {fields.map((field, index) => {
                        const currentItemId = watch(`items.${index}.stockItemId`);
                        const selectedItem = availableItems.find(
                          (it) => it.id === Number(currentItemId)
                        );
                        const available = selectedItem ? selectedItem.availableStock : 0;
                        const itemQuantity = Number(watch(`items.${index}.quantity`)) || 0;
                        const isOverStock = itemQuantity > available;

                        const itemError = errors.items?.[index];

                        return (
                          <div
                            key={field.id}
                            className={`py-3 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center rounded-lg transition-colors ${
                              isOverStock ? "bg-red-50/60 p-2 sm:p-0 sm:bg-transparent" : ""
                            }`}
                          >
                            {/* SP Select */}
                            <div className="sm:col-span-5 space-y-1">
                              <select
                                {...register(`items.${index}.stockItemId`, {
                                  valueAsNumber: true,
                                })}
                                className="w-full rounded-lg border border-(--sp-border) bg-white p-2 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
                              >
                                {isLoadingBalances || isLoadingProducts ? (
                                  <option value={0}>Đang tải danh sách SKU...</option>
                                ) : (
                                  availableItems.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.name} ({opt.sku})
                                    </option>
                                  ))
                                )}
                              </select>
                              {itemError?.stockItemId && (
                                <p className="text-[11px] text-(--sp-danger)">
                                  {itemError.stockItemId.message}
                                </p>
                              )}
                            </div>

                            {/* Tồn khả dụng */}
                            <div className="sm:col-span-2 flex sm:justify-center items-center gap-1.5 text-xs">
                              <span className="sm:hidden font-medium text-(--sp-text-muted)">
                                Tồn khả dụng:
                              </span>
                              <Badge tone={available > 0 ? "success" : "danger"}>
                                {available} sp
                              </Badge>
                            </div>

                            {/* Số lượng xuất */}
                            <div className="sm:col-span-2 space-y-1">
                              <div className="flex sm:block items-center gap-2">
                                <span className="sm:hidden text-xs text-(--sp-text-muted) w-20">
                                  SL xuất:
                                </span>
                                <Input
                                  type="number"
                                  min={1}
                                  {...register(`items.${index}.quantity`, {
                                    valueAsNumber: true,
                                  })}
                                  className={`text-right ${
                                    isOverStock
                                      ? "border-red-500 bg-red-50 text-red-700 font-bold focus:border-red-600"
                                      : ""
                                  }`}
                                />
                              </div>
                              {itemError?.quantity && (
                                <p className="text-[11px] text-(--sp-danger) text-right">
                                  {itemError.quantity.message}
                                </p>
                              )}
                            </div>

                            {/* Cảnh báo validation: Vượt tồn khả dụng */}
                            <div className="sm:col-span-2 flex items-center justify-start sm:justify-center">
                              {isOverStock ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                                  <AlertCircle className="size-3.5 shrink-0" />
                                  Vượt tồn khả dụng (Chặn submit)
                                </span>
                              ) : (
                                <span className="text-[11px] text-emerald-600 hidden sm:inline">
                                  Hợp lệ
                                </span>
                              )}
                            </div>

                            {/* Nút Xóa */}
                            <div className="sm:col-span-1 flex items-center justify-end sm:justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                title="Xóa dòng này"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary Box */}
                {fields.length > 0 && (
                  <div className="mt-4 rounded-lg bg-(--sp-bg-subtle) p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-(--sp-border)">
                    <div className="text-xs text-(--sp-text-muted) space-y-0.5">
                      <p>
                        Tổng số mặt hàng:{" "}
                        <strong className="text-(--sp-text)">{fields.length}</strong>
                      </p>
                      <p>
                        Tổng số lượng xuất:{" "}
                        <strong className="text-(--sp-text)">
                          {totalQuantity.toLocaleString("vi-VN")} sản phẩm
                        </strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-(--sp-text-muted)">
                        Trạng thái kiểm tra tồn kho:
                      </p>
                      {hasOverStockItem ? (
                        <p className="text-sm font-bold text-red-600 flex items-center gap-1 justify-end">
                          <AlertCircle className="size-4" />
                          Có dòng vượt tồn kho
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="size-4" />
                          Đủ hàng để xuất kho
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--sp-border)">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/app/inventory")}
                    disabled={createOutflowMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createOutflowMutation.isPending ||
                      fields.length === 0 ||
                      hasOverStockItem
                    }
                    className="inline-flex items-center gap-1.5"
                  >
                    {createOutflowMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <PackageMinus className="size-4" />
                        Xác nhận Xuất kho
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </OwnerLayout>
  );
}
