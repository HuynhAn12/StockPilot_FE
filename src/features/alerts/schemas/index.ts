import { z } from "zod";

export const alertFilterSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional(),
  type: z.enum(["LOW_STOCK", "STOCKOUT", "OVERSTOCK", "SLOW_MOVING", "DEAD_STOCK", "UNUSUAL_DEMAND"]).optional(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
});

export type AlertFilterInput = z.infer<typeof alertFilterSchema>;
