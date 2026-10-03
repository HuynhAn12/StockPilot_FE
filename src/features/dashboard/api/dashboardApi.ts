import { httpClient } from "../../../services/api";
import type { ApiResponse, PaginatedResponse } from "../../../types/common";
import type { DashboardMetricsData, DecisionOverviewSummary, SkuDecisionItem } from "../types";

export const dashboardApi = {
  getMetrics: () =>
    httpClient.get<ApiResponse<DashboardMetricsData>>("/analytics/dashboard"),

  getDecisionOverview: (riskFilter = "ALL") =>
    httpClient.get<{
      success: boolean;
      data: SkuDecisionItem[];
      summary: DecisionOverviewSummary;
    }>("/decision-engine/overview", {
      params: { riskFilter, page: 1, limit: 10 },
    }),

  getCategories: () =>
    httpClient.get<PaginatedResponse<{ id: number; name: string; code: string }>>(
      "/categories",
      { params: { page: 1, limit: 100 } }
    ),
};
