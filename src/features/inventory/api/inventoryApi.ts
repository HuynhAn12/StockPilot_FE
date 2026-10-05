import { httpClient } from "../../../services/api";
import type { PaginatedResponse } from "../../../types/common";
import type {
  InventoryBalance,
  StockMovement,
  CreateInflowPayload,
  CreateOutflowPayload,
  AuditAdjustmentPayload,
  StockInflowResponse,
  StockOutflowResponse,
  AuditAdjustmentResponse,
  StockTakeStatus,
  StockTake,
  StockTakeDetail,
  CreateStockTakePayload,
  UpdateStockTakeCountsPayload,
} from "../types";

export const inventoryApi = {
  getBalances: (params?: { page?: number; limit?: number; warehouseId?: number }) =>
    httpClient.get<PaginatedResponse<InventoryBalance>>("/inventory/balances", { params }),

  getMovements: (params?: { page?: number; limit?: number; stockItemId?: number }) =>
    httpClient.get<PaginatedResponse<StockMovement>>("/inventory/movements", { params }),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  createInflow: (payload: CreateInflowPayload) =>
    httpClient.post<StockInflowResponse>("/inventory/inflow", payload),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  createOutflow: (payload: CreateOutflowPayload) =>
    httpClient.post<StockOutflowResponse>("/inventory/outflow", payload),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  adjustStock: (payload: AuditAdjustmentPayload) =>
    httpClient.post<AuditAdjustmentResponse>("/inventory/audit", payload),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  getStockTakes: (params?: { page?: number; limit?: number; status?: StockTakeStatus }) =>
    httpClient.get<PaginatedResponse<StockTake>>("/stock-takes", { params }),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  getStockTake: (id: number) =>
    httpClient.get<StockTakeDetail>(`/stock-takes/${id}`),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  createStockTake: (payload: CreateStockTakePayload) =>
    httpClient.post<StockTake>("/stock-takes", payload),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  startStockTake: (id: number) =>
    httpClient.post<StockTake>(`/stock-takes/${id}/start`),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  updateStockTakeCounts: (id: number, payload: UpdateStockTakeCountsPayload) =>
    httpClient.put<StockTakeDetail>(`/stock-takes/${id}/counts`, payload),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  completeStockTake: (id: number) =>
    httpClient.post<StockTake>(`/stock-takes/${id}/complete`),

  // TODO API-CONTRACT: Confirm với Sang về field name chính xác
  cancelStockTake: (id: number) =>
    httpClient.post<StockTake>(`/stock-takes/${id}/cancel`),
};

