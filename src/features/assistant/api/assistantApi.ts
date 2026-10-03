import { httpClient } from "../../../services/api";
import type { ApiResponse } from "../../../types/common";
import type { AssistantExplanationResponse } from "../types";

export const assistantApi = {
  getOverviewExplanation: () =>
    httpClient.get<ApiResponse<AssistantExplanationResponse>>("/assistant/overview"),

  getSkuExplanation: (stockItemId: number) =>
    httpClient.get<ApiResponse<AssistantExplanationResponse>>(`/assistant/sku/${stockItemId}`),
};
