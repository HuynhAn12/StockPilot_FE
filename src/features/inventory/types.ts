export interface InventoryBalance {
  id: number;
  warehouseId: number;
  stockItemId: number;
  quantity: number;
  reservedQuantity: number;
  stockItem?: {
    id: number;
    sku: string;
    name: string;
    costPrice: number;
    sellingPrice: number;
  };
}

export interface StockMovement {
  id: number;
  type: "INFLOW" | "OUTFLOW" | "AUDIT_ADJUSTMENT" | "ORDER_FULFILL" | "ORDER_CANCEL_RESTOCK" | "RETURN_RESTOCK";
  delta: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}
