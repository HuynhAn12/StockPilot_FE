import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm không được trống"),
  code: z.string().min(1, "Mã sản phẩm không được trống"),
  categoryId: z.number().optional(),
  description: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
