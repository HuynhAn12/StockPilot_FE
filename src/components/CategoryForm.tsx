import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Card, Input } from "./common";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/catalog";

const formSchema = z.object({
  name: z.string().min(1, "Tên danh mục không được trống"),
  code: z
    .string()
    .min(1, "Mã danh mục không được trống")
    .regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ chứa chữ, số, gạch nối, gạch dưới"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  mode: "create" | "edit";
  category?: Category;
  onSubmit: (
    values: CreateCategoryPayload | UpdateCategoryPayload
  ) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function CategoryForm({
  mode,
  category,
  onSubmit,
  isSubmitting,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (mode === "edit" && category) {
      reset({
        name: category.name,
        code: category.code,
        description: category.description ?? "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isActive: String(category.isActive) as any,
      });
    }
  }, [mode, category, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    if (mode === "create") {
      const payload: CreateCategoryPayload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description: values.description,
      };
      await onSubmit(payload);
    } else {
      const payload: UpdateCategoryPayload = {
        name: values.name.trim(),
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
          Thông tin danh mục
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--sp-text)">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <Input {...register("name")} placeholder="VD: Thời trang nam" />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--sp-text)">
              Mã danh mục <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("code")}
              placeholder="VD: FASHION-NAM"
              disabled={mode === "edit"}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
            )}
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
                <option value="true">Đang hoạt động</option>
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
              placeholder="Mô tả danh mục..."
              className="w-full rounded-lg border border-(--sp-border) bg-(--sp-surface) px-3 py-2 text-sm text-(--sp-text) focus:border-(--sp-primary) focus:outline-none"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Đang lưu..."
            : mode === "create"
            ? "Tạo danh mục"
            : "Cập nhật"}
        </Button>
      </div>
    </form>
  );
}