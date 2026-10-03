import { httpClient } from "../../../services/api";
import type { PaginatedResponse } from "../../../types/common";
import type { Category, Product } from "../types";

export const catalogApi = {
  getProducts: (params?: { page?: number; limit?: number; search?: string; categoryId?: number }) =>
    httpClient.get<PaginatedResponse<Product>>("/products", { params }),

  getCategories: (params?: { page?: number; limit?: number }) =>
    httpClient.get<PaginatedResponse<Category>>("/categories", { params }),
};
