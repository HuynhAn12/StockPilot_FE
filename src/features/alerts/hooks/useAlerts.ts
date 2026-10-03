import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { alertApi } from "../api/alertApi";

export function useAlerts(params?: { page?: number; limit?: number; status?: string; severity?: string }) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => alertApi.getAlerts(params),
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertApi.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertApi.resolveAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
