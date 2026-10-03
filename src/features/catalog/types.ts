export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  categoryId?: number | null;
  category?: Category | null;
  isActive: boolean;
}

export interface StockItem {
  id: number;
  sku: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  isActive: boolean;
  productId: number;
}
