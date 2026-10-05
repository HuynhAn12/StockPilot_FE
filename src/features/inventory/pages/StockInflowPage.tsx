import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  PackagePlus,
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
import { useCreateInflow, useInventoryBalances } from "../hooks/useInventory";
import {
  inflowFormSchema,
  type InflowFormValues,
  zodResolver,
} from "../schemas";
import type { ApiError } from "../../../services/api/apiError";

/**
 * Generate a display reference code formatted as PN-YYYYMMDD-XXX
 */
function generateReferenceCode(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `PN-${yyyy}${mm}${dd}-${randomNum}`;
}

export function StockInflowPage() {
  const navigate = useNavigate();
  const [referenceCode] = useState(generateReferenceCode);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries for stock items & products
  const { data: balanceData, isLoading: isLoadingBalances } = useInventoryBalances();
  const { data: productData, isLoading: isLoadingProducts } = useProducts();

  // Mutation for creating inflow
  const createInflowMutation = useCreateInflow();

  // Aggregate selectable items
  const availableItems = useMemo(() => {
    const map = new Map<
      number,
      { id: number; name: string; sku: string; currentStock: number; costPrice: number }
    >();

    // From inventory balances
    (balanceData?.items || []).forEach((b) => {
      map.set(b.stockItemId, {
        id: b.stockItemId,
        name: b.stockItem?.name || `Mặt hàng #${b.stockItemId}`,
        sku: b.stockItem?.sku || `SKU-${b.stockItemId}`,
        currentStock: Number(b.quantity) || 0,
        costPrice: Number(b.stockItem?.costPrice) || 0,
      });
    });

    // From catalog products if not already in balances
    (productData?.items || []).forEach((p) => {
      if (!map.has(p.id)) {
        map.set(p.id, {
          id: p.id,
          name: p.name,
          sku: p.code,
          currentStock: 0,
          costPrice: 0,
        });
      }
    });

    // Fallback seed if empty
    if (map.size === 0) {
      map.set(1, { id: 1, name: "Áo thun Polo Classic", sku: "POLO-01", currentStock: 120, costPrice: 150000 });
      map.set(2, { id: 2, name: "Quần Jeans Slimfit", sku: "JEAN-02", currentStock: 45, costPrice: 280000 });
      map.set(3, { id: 3, name: "Giày Sneaker Sport", sku: "SHOE-03", currentStock: 30, costPrice: 450000 });
    }

    return Array.from(map.values());
  }, [balanceData, productData]);

  const defaultStockItemId = availableItems[0]?.id || 1;
  const defaultCostPrice = availableItems[0]?.costPrice || 0;

  // Form setup with Zod resolver
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InflowFormValues>({
    resolver: zodResolver(inflowFormSchema),
    defaultValues: {
      warehouseId: 1,
      supplierName: "",
      note: "",
      items: [
        {
          stockItemId: defaultStockItemId,
          quantity: 1,
          unitCost: defaultCostPrice,
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
  const totalAmount = watchedItems.reduce(
    (sum, item) =>
      sum + (Number(item?.quantity) || 0) * (Number(item?.unitCost) || 0),
    0
  );

  const onSubmit = (values: InflowFormValues) => {
    setActionError(null);

    // Prepare payload
    // TODO API-CONTRACT: POST /inventory/inflow
    createInflowMutation.mutate(
      {
        warehouseId: values.warehouseId,
        supplierName: values.supplierName?.trim() || undefined,
        note: values.note?.trim() || undefined,
        items: values.items.map((item) => ({
          stockItemId: Number(item.stockItemId),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      },
      {
        onSuccess: (res) => {
          setToastMessage(
            `Tạo phiếu nhập kho thành công! Mã: ${res?.referenceCode || referenceCode}`
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
            "Không thể tạo phiếu nhập kho. Vui lòng kiểm tra kết nối API.";
          setActionError(msg);
        },
      }
    );
  };

  return (
    <OwnerLayout title="Tạo phiếu nhập kho">
      <div className="grid gap-6">
        {/* Header: Breadcrumbs & Page Titles */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Breadcrumb items={["Quản lý kho", "Nhập kho"]} />
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">
              Tạo Phiếu Nhập Kho (Stock Inflow)
            </h1>
            <p className="text-xs font-mono text-(--sp-text-muted)">
              API: POST /inventory/inflow
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/app/inventory")}
              disabled={createInflowMutation.isPending}
              className="inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={createInflowMutation.isPending || fields.length === 0}
              className="inline-flex items-center gap-1.5"
            >
              {createInflowMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <PackagePlus className="size-4" />
                  Xác nhận Nhập kho
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
              <p className="font-semibold">Lỗi tạo phiếu nhập kho:</p>
              <p className="mt-0.5">{actionError}</p>
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
                  <FileText className="size-4 text-(--sp-primary)" />
                  <h2 className="text-base font-semibold text-(--sp-text)">
                    THÔNG TIN CHỨNG TỪ
                  </h2>
                </div>

                {/* Mã phiếu nhập (auto-generated read-only) */}
                <FormField
                  label="Mã phiếu nhập"
                  hint="Mã được tạo tự động cho giao dịch này"
                >
                  <Input
                    value={referenceCode}
                    readOnly
                    className="bg-(--sp-bg-subtle) font-mono text-xs font-semibold cursor-not-allowed text-(--sp-text-muted)"
                  />
                </FormField>

                {/* Kho hàng tiếp nhận */}
                <FormField label="Kho tiếp nhận">
                  <select
                    {...register("warehouseId", { valueAsNumber: true })}
                    className="w-full rounded-lg border border-(--sp-border) bg-white p-2.5 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
                  >
                    <option value={1}>Kho chính (Kho Trung Tâm #1)</option>
                    <option value={2}>Kho phụ (Chi nhánh 2)</option>
                  </select>
                </FormField>

                {/* Nhà cung cấp */}
                <FormField
                  label="Nhà cung cấp"
                  error={errors.supplierName?.message}
                >
                  <Input
                    {...register("supplierName")}
                    placeholder="VD: Công ty TNHH May Mặc ABC"
                  />
                </FormField>

                {/* Ghi chú */}
                <FormField
                  label="Ghi chú phiếu nhập"
                  hint="Tối đa 500 ký tự"
                  error={errors.note?.message}
                >
                  <Textarea
                    {...register("note")}
                    placeholder="Nhập ghi chú thêm cho lô hàng nhập..."
                    rows={4}
                  />
                </FormField>
              </Card>
            </div>

            {/* Right Panel: Mặt hàng nhập kho (8 cols) */}
            <div className="lg:col-span-8">
              <Card className="p-5 border-(--sp-border) space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-(--sp-border) pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-(--sp-text)">
                      MẶT HÀNG NHẬP KHO
                    </h2>
                    <p className="text-xs text-(--sp-text-muted)">
                      Chọn các mặt hàng và số lượng cần nhập vào kho
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
                        unitCost: firstItem?.costPrice || 0,
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
                      Bấm nút &quot;+ Thêm hàng&quot; ở trên để bắt đầu nhập hàng.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-semibold text-(--sp-text-muted) px-2">
                      <span className="sm:col-span-5">Sản phẩm / SKU</span>
                      <span className="sm:col-span-2 text-center">Tồn hiện tại</span>
                      <span className="sm:col-span-2 text-right">Số lượng</span>
                      <span className="sm:col-span-2 text-right">Đơn giá (₫)</span>
                      <span className="sm:col-span-1 text-center">Xóa</span>
                    </div>

                    <div className="divide-y divide-(--sp-border)">
                      {fields.map((field, index) => {
                        const currentItemId = watch(`items.${index}.stockItemId`);
                        const selectedItem = availableItems.find(
                          (it) => it.id === Number(currentItemId)
                        );
                        const itemQuantity = watch(`items.${index}.quantity`) || 0;
                        const itemUnitCost = watch(`items.${index}.unitCost`) || 0;
                        const rowTotal = itemQuantity * itemUnitCost;

                        const itemError = errors.items?.[index];

                        return (
                          <div
                            key={field.id}
                            className="py-3 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                          >
                            {/* SP Select */}
                            <div className="sm:col-span-5 space-y-1">
                              <select
                                {...register(`items.${index}.stockItemId`, {
                                  valueAsNumber: true,
                                  onChange: (e) => {
                                    const nextId = Number(e.target.value);
                                    const matched = availableItems.find(
                                      (it) => it.id === nextId
                                    );
                                    if (matched && matched.costPrice > 0) {
                                      setValue(
                                        `items.${index}.unitCost`,
                                        matched.costPrice
                                      );
                                    }
                                  },
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

                            {/* Tồn hiện tại */}
                            <div className="sm:col-span-2 flex sm:justify-center items-center gap-1.5 text-xs text-(--sp-text-muted)">
                              <span className="sm:hidden font-medium">Tồn:</span>
                              <Badge tone="neutral">
                                {selectedItem?.currentStock ?? 0} sp
                              </Badge>
                            </div>

                            {/* Số lượng */}
                            <div className="sm:col-span-2 space-y-1">
                              <div className="flex sm:block items-center gap-2">
                                <span className="sm:hidden text-xs text-(--sp-text-muted) w-20">
                                  Số lượng:
                                </span>
                                <Input
                                  type="number"
                                  min={1}
                                  {...register(`items.${index}.quantity`, {
                                    valueAsNumber: true,
                                  })}
                                  className="text-right"
                                />
                              </div>
                              {itemError?.quantity && (
                                <p className="text-[11px] text-(--sp-danger) text-right">
                                  {itemError.quantity.message}
                                </p>
                              )}
                            </div>

                            {/* Đơn giá */}
                            <div className="sm:col-span-2 space-y-1">
                              <div className="flex sm:block items-center gap-2">
                                <span className="sm:hidden text-xs text-(--sp-text-muted) w-20">
                                  Đơn giá:
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  step={1000}
                                  {...register(`items.${index}.unitCost`, {
                                    valueAsNumber: true,
                                  })}
                                  className="text-right"
                                />
                              </div>
                              {itemError?.unitCost && (
                                <p className="text-[11px] text-(--sp-danger) text-right">
                                  {itemError.unitCost.message}
                                </p>
                              )}
                            </div>

                            {/* Nút Xóa & Thành tiền nhỏ trên mobile */}
                            <div className="sm:col-span-1 flex items-center justify-between sm:justify-center pt-1 sm:pt-0">
                              <span className="sm:hidden text-xs text-(--sp-text-muted)">
                                Thành tiền:{" "}
                                <strong className="text-(--sp-text)">
                                  {rowTotal.toLocaleString("vi-VN")} ₫
                                </strong>
                              </span>
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
                        Tổng số lượng nhập:{" "}
                        <strong className="text-(--sp-text)">
                          {totalQuantity.toLocaleString("vi-VN")} sản phẩm
                        </strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-(--sp-text-muted)">
                        Tổng giá trị nhập ước tính:
                      </p>
                      <p className="text-lg font-bold text-(--sp-primary)">
                        {totalAmount.toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-(--sp-border)">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/app/inventory")}
                    disabled={createInflowMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createInflowMutation.isPending || fields.length === 0
                    }
                    className="inline-flex items-center gap-1.5"
                  >
                    {createInflowMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <PackagePlus className="size-4" />
                        Xác nhận Nhập kho
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
