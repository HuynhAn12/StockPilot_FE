import { z } from "zod";

export const modifyPriceSchema = z.object({
  customPrice: z.number().positive("Giá tùy chỉnh phải lớn hơn 0"),
  applyToStockItem: z.boolean().default(true),
});

export type ModifyPriceInput = z.infer<typeof modifyPriceSchema>;
