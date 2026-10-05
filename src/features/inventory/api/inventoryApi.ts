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
};

