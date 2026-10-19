import { httpClient } from "./api";
import type { PaginatedResponse } from "../types/common";
import type {
  Category,
  CreateCategoryPayload,
  CreateProductPayload,
  Product,
  UpdateCategoryPayload,
  UpdateProductPayload,
} from "../types/catalog";

export const catalogApi = {
  // === PRODUCT ===
  getProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
  }) => httpClient.get<PaginatedResponse<Product>>("/products", { params }),

  getProductById: (id: number) =>
    httpClient.get<{ success: true; data: Product }>(`/products/${id}`),

  createProduct: (body: CreateProductPayload) =>
    httpClient.post<{ success: true; data: Product }>("/products", body),

  updateProduct: (id: number, body: UpdateProductPayload) =>
    httpClient.put<{ success: true; data: Product }>(`/products/${id}`, body),

  // === CATEGORY ===
  getCategories: (params?: { page?: number; limit?: number }) =>
    httpClient.get<PaginatedResponse<Category>>("/categories", { params }),

  getCategoryById: (id: number) =>
    httpClient.get<{ success: true; data: Category }>(`/categories/${id}`),

  createCategory: (body: CreateCategoryPayload) =>
    httpClient.post<{ success: true; data: Category }>("/categories", body),

  updateCategory: (id: number, body: UpdateCategoryPayload) =>
    httpClient.put<{ success: true; data: Category }>(`/categories/${id}`, body),

  deleteCategory: (id: number) =>
    httpClient.delete<{ success: true }>(`/categories/${id}`),
};