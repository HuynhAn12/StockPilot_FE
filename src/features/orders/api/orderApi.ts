import { httpClient } from "../../../services/api";
import type { PaginatedResponse } from "../../../types/common";
import type { Order } from "../types";

export interface CreateOrderPayload {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  discountAmount?: number;
  taxAmount?: number;
  note?: string;
  items: Array<{
    stockItemId: number;
    quantity: number;
  }>;
}

export const orderApi = {
  getOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    httpClient.get<PaginatedResponse<Order>>("/orders", { params }),

  getOrderById: (id: number) =>
    httpClient.get<Order>(`/orders/${id}`),

  createOrder: (data: CreateOrderPayload) =>
    httpClient.post<Order>("/orders", data),

  confirmOrder: (id: number) =>
    httpClient.post<Order>(`/orders/${id}/confirm`),

  fulfillOrder: (id: number) =>
    httpClient.post<Order>(`/orders/${id}/fulfill`),

  cancelOrder: (id: number, cancelReason: string) =>
    httpClient.post<Order>(`/orders/${id}/cancel`, { cancelReason }),
};
