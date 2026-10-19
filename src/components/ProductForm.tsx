import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button, Card, Input } from "./common";
import type {
  Category,
  CreateProductPayload,
  Product,
  UpdateProductPayload,
} from "../types/catalog";

const stockItemSchema = z.object({
  sku: z.string().min(1, "SKU không được trống"),
  name: z.string().min(1, "Tên biến thể không được trống"),
  barcode: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Giá vốn không được âm"),
  sellingPrice: z.coerce.number().min(0, "Giá bán không được âm"),
  minStockLevel: z.coerce.number().int().min(0).default(0),
  maxStockLevel: z.coerce.number().int().min(0).default(1000),
});

const createFormSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được trống"),
  code: z
    .string()
    .min(1, "Mã sản phẩm không được trống")
    .regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ chứa chữ, số, gạch nối, gạch dưới"),
  categoryId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  items: z.array(stockItemSchema),
});

type FormValues = z.infer<typeof createFormSchema>;

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
  categories: Category[];
  onSubmit: (
    values: CreateProductPayload | UpdateProductPayload
  ) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function ProductForm({
  mode,
  product,
  categories,
  onSubmit,
  isSubmitting,
}: ProductFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createFormSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      categoryId: undefined,
      description: "",
      isActive: true,
      items: [
        {
          sku: "",
          name: "",
          barcode: "",
          costPrice: 0,
          sellingPrice: 0,
          minStockLevel: 0,
          maxStockLevel: 1000,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (mode === "edit" && product) {
      reset({
        name: product.name,
        code: product.code,
        categoryId: product.categoryId ?? undefined,
        description: product.description ?? "",
        isActive: String(product.isActive) as any,
        items: [],
      });
    }
  }, [mode, product, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    if (mode === "create") {
      if (!values.items || values.items.length === 0) {
        alert("Phải có ít nhất 1 biến thể (SKU)");
        return;
      }
      const payload: CreateProductPayload = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      categoryId: values.categoryId && values.categoryId > 0 ? values.categoryId : undefined,
      description: values.description,
      items: values.items,
    };
      await onSubmit(payload);
    } else {
      const payload: UpdateProductPayload = {
      name: values.name.trim(),
      categoryId: values.categoryId && values.categoryId > 0 ? values.categoryId : null,
      description: values.description,
      isActive: values.isActive,
    };
      await onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-6">
      <Card className="p-6 border-(--sp-border)">
        <h2 className="mb-4 text-base font-semibold text-(--sp-text)">
          Thông tin sản phẩm
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--sp-text)">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <Input {...register("name")} placeholder="VD: Áo thun nam" />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--sp-text)">
              Mã sản phẩm <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("code")}
              placeholder="VD: SP001"
              disabled={mode === "edit"}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--sp-text)">
              Danh mục
            </label>
            <select
              {...register("categoryId")}
              className="w-full rounded-lg border border-(--sp-border) bg-(--sp-surface) px-3 py-2 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
            >
              <option value="">-- Chưa phân loại --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {mode === "edit" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-(--sp-text)">
                Trạng thái
              </label>
              <select
                {...register("isActive", {
                  setValueAs: (v) => v === "true",
                })}
                className="w-full rounded-lg border border-(--sp-border) bg-(--sp-surface) px-3 py-2 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
              >
                <option value="true">Đang kinh doanh</option>
                <option value="false">Tạm dừng</option>
              </select>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-(--sp-text)">
              Mô tả
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Mô tả chi tiết sản phẩm..."
              className="w-full rounded-lg border border-(--sp-border) bg-(--sp-surface) px-3 py-2 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {mode === "create" && (
        <Card className="p-6 border-(--sp-border)">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-(--sp-text)">
              Biến thể / SKU <span className="text-red-500">*</span>
            </h2>
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() =>
                append({
                  sku: "",
                  name: "",
                  barcode: "",
                  costPrice: 0,
                  sellingPrice: 0,
                  minStockLevel: 0,
                  maxStockLevel: 1000,
                })
              }
            >
              <Plus className="mr-1 size-4" /> Thêm biến thể
            </Button>
          </div>

          {errors.items && !Array.isArray(errors.items) && (
            <p className="mb-3 text-xs text-red-500">{errors.items.message}</p>
          )}

          <div className="grid gap-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-(--sp-border) bg-(--sp-bg-subtle)/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-(--sp-text-muted)">
                    Biến thể #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium">SKU *</label>
                    <Input
                      {...register(`items.${index}.sku` as const)}
                      placeholder="VD: SP001-RED-M"
                    />
                    {errors.items?.[index]?.sku && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.items[index]?.sku?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Tên biến thể *
                    </label>
                    <Input
                      {...register(`items.${index}.name` as const)}
                      placeholder="VD: Đỏ - Size M"
                    />
                    {errors.items?.[index]?.name && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.items[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Giá vốn (VND) *
                    </label>
                    <Input
                      type="number"
                      step="1000"
                      {...register(`items.${index}.costPrice` as const)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Giá bán (VND) *
                    </label>
                    <Input
                      type="number"
                      step="1000"
                      {...register(`items.${index}.sellingPrice` as const)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Tồn tối thiểu
                    </label>
                    <Input
                      type="number"
                      {...register(`items.${index}.minStockLevel` as const)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Tồn tối đa
                    </label>
                    <Input
                      type="number"
                      {...register(`items.${index}.maxStockLevel` as const)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Đang lưu..."
            : mode === "create"
            ? "Tạo sản phẩm"
            : "Cập nhật"}
        </Button>
      </div>
    </form>
  );
}