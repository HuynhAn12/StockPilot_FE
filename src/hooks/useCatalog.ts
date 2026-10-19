import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { catalogApi } from "../services/catalogApi";
import type {
  CreateCategoryPayload,
  CreateProductPayload,
  UpdateCategoryPayload,
  UpdateProductPayload,
} from "../types/catalog";

// === PRODUCT HOOKS ===
export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
}) {
  return useQuery({
    queryKey: ["catalog", "products", params],
    queryFn: () => catalogApi.getProducts(params),
  });
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: ["catalog", "product", id],
    queryFn: () => catalogApi.getProductById(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductPayload) => catalogApi.createProduct(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateProductPayload }) =>
      catalogApi.updateProduct(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
      queryClient.invalidateQueries({
        queryKey: ["catalog", "product", variables.id],
      });
    },
  });
}

// === CATEGORY HOOKS ===
export function useCategories(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["catalog", "categories", params],
    queryFn: () => catalogApi.getCategories(params),
  });
}

export function useCategory(id: number | undefined) {
  return useQuery({
    queryKey: ["catalog", "category", id],
    queryFn: () => catalogApi.getCategoryById(id!),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryPayload) =>
      catalogApi.createCategory(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCategoryPayload }) =>
      catalogApi.updateCategory(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "categories"] });
      queryClient.invalidateQueries({
        queryKey: ["catalog", "category", variables.id],
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => catalogApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "categories"] });
    },
  });
}