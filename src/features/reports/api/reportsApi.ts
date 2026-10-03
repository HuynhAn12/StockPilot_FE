import { httpClient } from "../../../services/api";
import type { ExportReportInput } from "../schemas";
import type { ReportExportJob } from "../types";

export const reportsApi = {
  requestExport: (data: ExportReportInput) =>
    httpClient.post<ReportExportJob>("/export", data),
};
