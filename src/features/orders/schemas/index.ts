import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(
    z.object({
      stockItemId: z.number(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1, "Đơn hàng phải có ít nhất 1 sản phẩm"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
