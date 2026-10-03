import { z } from "zod";

export const analyticsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
  categoryId: z.number().optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
