import { useQuery } from "@tanstack/react-query";

import { alertApi } from "../api/alertApi";

export function useAlerts(params?: { page?: number; limit?: number; status?: string; severity?: string }) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => alertApi.getAlerts(params),
  });
}
