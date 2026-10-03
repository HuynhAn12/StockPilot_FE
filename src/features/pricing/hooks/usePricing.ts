import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pricingApi } from "../api/pricingApi";

export function usePricingRecommendations(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ["pricing", "recommendations", params],
    queryFn: () => pricingApi.getRecommendations(params),
  });
}

export function useAcceptRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pricingApi.acceptRecommendation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
}
