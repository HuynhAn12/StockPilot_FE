export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
}

export interface StockItem {
  id: number;
  sku: string;
  name: string;
  barcode?: string | null;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  isActive: boolean;
  productId: number;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  categoryId?: number | null;
  category?: Category | null;
  isActive: boolean;
  stockItems?: StockItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StockItemPayload {
  sku: string;
  name: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
}

export interface CreateProductPayload {
  categoryId?: number;
  name: string;
  code: string;
  description?: string;
  items: StockItemPayload[];
}

export interface UpdateProductPayload {
  categoryId?: number | null;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}