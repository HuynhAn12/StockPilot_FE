import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "../api/dashboardApi";
import type { DashboardFilterState } from "../types";

export function useDashboardMetrics(_filter?: DashboardFilterState) {
  return useQuery({
    queryKey: ["dashboard", "metrics", _filter?.range, _filter?.categoryId],
    queryFn: () => dashboardApi.getMetrics(),
  });
}

export function useDecisionOverview(riskFilter = "ALL") {
  return useQuery({
    queryKey: ["dashboard", "decisionOverview", riskFilter],
    queryFn: () => dashboardApi.getDecisionOverview(riskFilter),
  });
}

export function useDashboardCategories() {
  return useQuery({
    queryKey: ["dashboard", "categories"],
    queryFn: () => dashboardApi.getCategories(),
  });
}
