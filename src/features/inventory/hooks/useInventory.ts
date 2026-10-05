import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inventoryApi } from "../api/inventoryApi";
import type {
  CreateInflowPayload,
  CreateOutflowPayload,
  AuditAdjustmentPayload,
} from "../types";

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

export function useCreateInflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInflowPayload) => inventoryApi.createInflow(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useCreateOutflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOutflowPayload) => inventoryApi.createOutflow(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AuditAdjustmentPayload) => inventoryApi.adjustStock(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

