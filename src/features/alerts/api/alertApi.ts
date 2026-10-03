import { httpClient } from "../../../services/api";
import type { PaginatedResponse } from "../../../types/common";
import type { AlertItem } from "../types";

export const alertApi = {
  getAlerts: (params?: { page?: number; limit?: number; status?: string; severity?: string }) =>
    httpClient.get<PaginatedResponse<AlertItem>>("/alerts", { params }),

  acknowledgeAlert: (id: number) =>
    httpClient.post<AlertItem>(`/alerts/${id}/acknowledge`),

  resolveAlert: (id: number) =>
    httpClient.post<AlertItem>(`/alerts/${id}/resolve`),
};
