import { z } from "zod";

export const dashboardFilterSchema = z.object({
  range: z.enum(["today", "7d", "30d", "custom"]).default("30d"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional(),
});

export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;
