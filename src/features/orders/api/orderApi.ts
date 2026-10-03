import { httpClient } from "../../../services/api";
import type { PaginatedResponse } from "../../../types/common";
import type { Order } from "../types";

export const orderApi = {
  getOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    httpClient.get<PaginatedResponse<Order>>("/orders", { params }),

  getOrderById: (id: number) =>
    httpClient.get<Order>(`/orders/${id}`),
};
