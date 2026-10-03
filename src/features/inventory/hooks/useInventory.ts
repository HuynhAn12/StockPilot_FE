import { useQuery } from "@tanstack/react-query";

import { inventoryApi } from "../api/inventoryApi";

export function useInventoryBalances(params?: { page?: number; limit?: number; warehouseId?: number }) {
  return useQuery({
    queryKey: ["inventory", "balances", params],
    queryFn: () => inventoryApi.getBalances(params),
  });
}

export function useStockMovements(params?: { page?: number; limit?: number; stockItemId?: number }) {
  return useQuery({
    queryKey: ["inventory", "movements", params],
    queryFn: () => inventoryApi.getMovements(params),
  });
}
