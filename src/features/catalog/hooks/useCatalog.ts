import { useQuery } from "@tanstack/react-query";

import { catalogApi } from "../api/catalogApi";

export function useProducts(params?: { page?: number; limit?: number; search?: string; categoryId?: number }) {
  return useQuery({
    queryKey: ["catalog", "products", params],
    queryFn: () => catalogApi.getProducts(params),
  });
}

export function useCategories(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["catalog", "categories", params],
    queryFn: () => catalogApi.getCategories(params),
  });
}
