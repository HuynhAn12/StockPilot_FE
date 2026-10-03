import { useQuery } from "@tanstack/react-query";

import { orderApi } from "../api/orderApi";

export function useOrders(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => orderApi.getOrders(params),
  });
}
