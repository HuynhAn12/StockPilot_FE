import { z } from "zod";

export const exportReportSchema = z.object({
  type: z.enum(["SALES", "INVENTORY", "DECISION_HISTORY"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ExportReportInput = z.infer<typeof exportReportSchema>;
