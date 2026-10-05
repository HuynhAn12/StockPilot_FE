import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FolderTree,
  Loader2,
  Package,
} from "lucide-react";

import { Breadcrumb } from "../../../components/data-display/Breadcrumb";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useCategories } from "../../catalog/hooks/useCatalog";
import { useCreateStockTake } from "../hooks/useInventory";
import {
  createStockTakeSchema,
  type CreateStockTakeFormValues,
  zodResolver,
} from "../schemas";

export function StockTakeNewPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Categories query
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  const categories = categoriesData?.items || [];

  // Create Stock Take mutation
  const createStockTakeMutation = useCreateStockTake();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateStockTakeFormValues>({
    resolver: zodResolver(createStockTakeSchema),
    defaultValues: {
      title: "",
      scope: "ALL",
      categoryId: undefined,
      note: "",
    },
  });

  const selectedScope = useWatch({ control, name: "scope" });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });

  const onSubmit = async (values: CreateStockTakeFormValues) => {
    setServerError(null);

    try {
      // TODO API-CONTRACT: Call POST /stock-takes
      const result = await createStockTakeMutation.mutateAsync({
        title: values.title.trim(),
        scope: values.scope,
        categoryId: values.scope === "CATEGORY" ? Number(values.categoryId) : undefined,
        note: values.note?.trim() || undefined,
      });

      setSuccessToast("Tạo đợt kiểm kê thành công!");
      // Navigate to detail page if ID is returned, otherwise to list
      const targetId = result?.id;
      setTimeout(() => {
        if (targetId) {
          navigate(`/app/stock-takes/${targetId}`);
        } else {
          navigate("/app/stock-takes");
        }
      }, 700);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể kết nối đến máy chủ hoặc API chưa sẵn sàng (Bad Gateway).";
      setServerError(message);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  return (
    <OwnerLayout title="Tạo đợt kiểm kê mới">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Breadcrumb & Titles */}
        <div className="space-y-1">
          <Breadcrumb items={["Kiểm kê kho", "Tạo mới đợt kiểm"]} />
          <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">
            Tạo Mới Đợt Kiểm Kê Kho
          </h1>
          {/* Subtitle with API identifier */}
          <p className="text-xs font-mono text-(--sp-text-muted)">
            API: POST /stock-takes
          </p>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg bg-emerald-600 px-4 py-3 text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="size-5 shrink-0" />
            <span className="text-sm font-medium">{successToast}</span>
          </div>
        )}

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Lỗi tạo đợt kiểm kê:</p>
              <p className="mt-0.5 text-xs text-red-600">{serverError}</p>
              <p className="mt-1 text-xs text-red-500 italic">
                (Lưu ý: Backend có thể đang bảo trì hoặc chưa hoàn thiện endpoint này)
              </p>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <Card className="p-6 border-(--sp-border)">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Tên đợt kiểm kê */}
            <FormField
              label="Tên đợt kiểm kê"
              hint="Ví dụ: Kiểm kê định kỳ Cuối tuần 1 Tháng 10, Kiểm kê kho đột xuất..."
              error={errors.title?.message}
            >
              <Input
                {...register("title")}
                placeholder="Nhập tên đợt kiểm kê..."
                disabled={createStockTakeMutation.isPending}
              />
            </FormField>

            {/* 2. Phạm vi kiểm kê */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-(--sp-text)">
                Phạm vi kiểm kê
              </label>
              <p className="text-xs text-(--sp-text-muted)">
                Chọn phạm vi các mặt hàng cần kiểm đếm trong đợt này.
              </p>

              <div className="grid gap-3 pt-1">
                {/* Option 1: ALL */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedScope === "ALL"
                      ? "border-(--sp-primary) bg-(--sp-primary)/5 ring-1 ring-(--sp-primary)"
                      : "border-(--sp-border) bg-white hover:bg-(--sp-bg-subtle)"
                  }`}
                >
                  <input
                    type="radio"
                    value="ALL"
                    {...register("scope")}
                    disabled={createStockTakeMutation.isPending}
                    className="mt-1 size-4 text-(--sp-primary) focus:ring-(--sp-primary)"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-(--sp-text)">
                      <Package className="size-4 text-(--sp-primary)" />
                      Toàn bộ sản phẩm trong kho
                    </div>
                    <p className="text-xs text-(--sp-text-muted) mt-0.5">
                      Hệ thống sẽ lấy toàn bộ danh mục SKU hiện hữu trong kho hàng vào danh sách kiểm.
                    </p>
                  </div>
                </label>

                {/* Option 2: CATEGORY */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedScope === "CATEGORY"
                      ? "border-(--sp-primary) bg-(--sp-primary)/5 ring-1 ring-(--sp-primary)"
                      : "border-(--sp-border) bg-white hover:bg-(--sp-bg-subtle)"
                  }`}
                >
                  <input
                    type="radio"
                    value="CATEGORY"
                    {...register("scope")}
                    disabled={createStockTakeMutation.isPending}
                    className="mt-1 size-4 text-(--sp-primary) focus:ring-(--sp-primary)"
                  />
                  <div className="w-full">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-(--sp-text)">
                      <FolderTree className="size-4 text-(--sp-primary)" />
                      Theo danh mục ngành hàng
                    </div>
                    <p className="text-xs text-(--sp-text-muted) mt-0.5">
                      Chỉ kiểm đếm các sản phẩm thuộc một danh mục cụ thể được lựa chọn.
                    </p>

                    {/* Sub-selection for Category */}
                    {selectedScope === "CATEGORY" && (
                      <div className="mt-3.5 pt-3 border-t border-(--sp-border)/60">
                        <FormField
                          label="Chọn danh mục"
                          hint="Chọn danh mục hàng hóa bạn muốn kiểm kê"
                          error={errors.categoryId?.message}
                        >
                          <Select
                            placeholder={
                              isLoadingCategories
                                ? "Đang tải danh mục..."
                                : "Chọn một ngành hàng..."
                            }
                            options={categoryOptions}
                            value={selectedCategoryId ? String(selectedCategoryId) : undefined}
                            onValueChange={(val) => {
                              setValue("categoryId", Number(val), {
                                shouldValidate: true,
                              });
                            }}
                          />
                        </FormField>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Ghi chú hướng dẫn */}
            <FormField
              label="Ghi chú hướng dẫn đếm (Tùy chọn)"
              hint="Ghi chú vị trí kệ, quy cách kiểm tra tem mác hoặc nhắc nhở nhân viên..."
              error={errors.note?.message}
            >
              <Textarea
                {...register("note")}
                rows={3}
                placeholder="Nhập ghi chú hướng dẫn kiểm kê nếu có..."
                disabled={createStockTakeMutation.isPending}
              />
            </FormField>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--sp-border)">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/app/stock-takes")}
                disabled={createStockTakeMutation.isPending}
                className="inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="size-4" />
                Hủy
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={createStockTakeMutation.isPending}
                className="inline-flex items-center gap-2"
              >
                {createStockTakeMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <ClipboardList className="size-4" />
                    Tạo bản nháp (DRAFT)
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </OwnerLayout>
  );
}
