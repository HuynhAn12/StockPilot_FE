import { httpClient } from "../../../services/api";
import type { PaginatedResponse } from "../../../types/common";
import type { InventoryBalance, StockMovement } from "../types";

export const inventoryApi = {
  getBalances: (params?: { page?: number; limit?: number; warehouseId?: number }) =>
    httpClient.get<PaginatedResponse<InventoryBalance>>("/inventory/balances", { params }),

  getMovements: (params?: { page?: number; limit?: number; stockItemId?: number }) =>
    httpClient.get<PaginatedResponse<StockMovement>>("/inventory/movements", { params }),
};
