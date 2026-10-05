import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inventoryApi } from "../api/inventoryApi";
import type {
  CreateInflowPayload,
  CreateOutflowPayload,
  AuditAdjustmentPayload,
  StockTakeStatus,
  CreateStockTakePayload,
  UpdateStockTakeCountsPayload,
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

export function useStockTakes(params?: { page?: number; limit?: number; status?: StockTakeStatus }) {
  return useQuery({
    queryKey: ["stock-takes", "list", params],
    queryFn: () => inventoryApi.getStockTakes(params),
  });
}

export function useStockTake(id: number) {
  return useQuery({
    queryKey: ["stock-takes", "detail", id],
    queryFn: () => inventoryApi.getStockTake(id),
    enabled: !!id,
  });
}

export function useCreateStockTake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockTakePayload) => inventoryApi.createStockTake(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-takes"] }),
  });
}

export function useStartStockTake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventoryApi.startStockTake(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["stock-takes"] });
      qc.invalidateQueries({ queryKey: ["stock-takes", "detail", id] });
    },
  });
}

export function useUpdateStockTakeCounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateStockTakeCountsPayload }) =>
      inventoryApi.updateStockTakeCounts(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["stock-takes", "detail", id] });
    },
  });
}

export function useCompleteStockTake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventoryApi.completeStockTake(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["stock-takes"] });
      qc.invalidateQueries({ queryKey: ["stock-takes", "detail", id] });
    },
  });
}

export function useCancelStockTake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inventoryApi.cancelStockTake(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["stock-takes"] });
      qc.invalidateQueries({ queryKey: ["stock-takes", "detail", id] });
    },
  });
}

