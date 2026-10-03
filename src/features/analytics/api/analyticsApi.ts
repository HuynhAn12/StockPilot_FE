import { httpClient } from "../../../services/api";
import type { ApiResponse } from "../../../types/common";
import type { DashboardMetricsData } from "../../dashboard/types";

export const analyticsApi = {
  getDashboardMetrics: () =>
    httpClient.get<ApiResponse<DashboardMetricsData>>("/analytics/dashboard"),
};
