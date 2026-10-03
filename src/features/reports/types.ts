export interface ReportExportJob {
  id: string;
  type: "SALES" | "INVENTORY" | "DECISION_HISTORY";
  status: "PENDING" | "READY" | "FAILED";
  downloadUrl?: string;
  createdAt: string;
}
