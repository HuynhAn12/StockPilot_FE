import { useMutation } from "@tanstack/react-query";

import { reportsApi } from "../api/reportsApi";
import type { ExportReportInput } from "../schemas";

export function useRequestReportExport() {
  return useMutation({
    mutationFn: (data: ExportReportInput) => reportsApi.requestExport(data),
  });
}
