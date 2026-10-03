import { httpClient } from "../../../services/api";
import type { PaginatedResponse } from "../../../types/common";
import type { PricingRecommendationItem } from "../types";

export const pricingApi = {
  getRecommendations: (params?: { page?: number; limit?: number; status?: string }) =>
    httpClient.get<PaginatedResponse<PricingRecommendationItem>>("/pricing", { params }),

  acceptRecommendation: (id: number) =>
    httpClient.post<PricingRecommendationItem>(`/pricing/${id}/accept`, { applyToStockItem: true }),

  rejectRecommendation: (id: number) =>
    httpClient.post<PricingRecommendationItem>(`/pricing/${id}/reject`),

  modifyRecommendation: (id: number, customPrice: number) =>
    httpClient.post<PricingRecommendationItem>(`/pricing/${id}/modify`, {
      customPrice,
      applyToStockItem: true,
    }),
};
