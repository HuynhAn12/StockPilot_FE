import { z } from "zod";

export const stockInflowSchema = z.object({
  warehouseId: z.number(),
  stockItemId: z.number(),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  note: z.string().optional(),
});

export type StockInflowInput = z.infer<typeof stockInflowSchema>;

export const inflowItemSchema = z.object({
  stockItemId: z.number().int().positive("Vui lòng chọn sản phẩm"),
  quantity: z.number().int().positive("Số lượng phải > 0"),
  unitCost: z.number().nonnegative("Đơn giá không được âm"),
});

export const inflowFormSchema = z.object({
  warehouseId: z.number().int().positive(),
  supplierName: z.string().optional(),
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
  items: z.array(inflowItemSchema).min(1, "Phải có ít nhất 1 sản phẩm"),
});

export const outflowItemSchema = z.object({
  stockItemId: z.number().int().positive("Vui lòng chọn sản phẩm"),
  quantity: z.number().int().positive("Số lượng phải > 0"),
});

export const outflowFormSchema = z.object({
  warehouseId: z.number().int().positive(),
  reason: z.enum(["SALE", "DAMAGE", "TRANSFER", "RETURN_SUPPLIER", "OTHER"]),
  note: z.string().max(500).optional(),
  items: z.array(outflowItemSchema).min(1, "Phải có ít nhất 1 sản phẩm"),
});

export const auditFormSchema = z.object({
  warehouseId: z.number().int().positive(),
  stockItemId: z.number().int().positive(),
  actualQuantity: z.number().int().nonnegative("Số lượng không được âm"),
  reason: z.string().min(1, "Vui lòng chọn lý do").max(200),
  note: z.string().max(500).optional(),
});

export type InflowFormValues = z.infer<typeof inflowFormSchema>;
export type OutflowFormValues = z.infer<typeof outflowFormSchema>;
export type AuditFormValues = z.infer<typeof auditFormSchema>;

import { set, type FieldErrors, type FieldValues, type Resolver } from "react-hook-form";

export function zodResolver<T extends FieldValues>(
  schema: {
    safeParse: (values: unknown) =>
      | { success: true; data: T }
      | {
          success: false;
          error: {
            issues: Array<{
              path: PropertyKey[];
              code: string;
              message: string;
            }>;
          };
        };
  }
): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors: FieldErrors<T> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      set(errors, path || "root", {
        type: issue.code,
        message: issue.message,
      });
    }
    return { values: {} as Record<string, never>, errors };
  };
}





