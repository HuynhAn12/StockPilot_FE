import { z } from "zod";

export const stockInflowSchema = z.object({
  warehouseId: z.number(),
  stockItemId: z.number(),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  note: z.string().optional(),
});

export type StockInflowInput = z.infer<typeof stockInflowSchema>;
