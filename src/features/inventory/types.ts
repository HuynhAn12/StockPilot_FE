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

export interface CreateInflowPayload {
  warehouseId: number;
  supplierName?: string;
  note?: string;
  items: Array<{
    stockItemId: number;
    quantity: number;
    unitCost: number;
  }>;
}

export interface CreateOutflowPayload {
  warehouseId: number;
  reason: "SALE" | "DAMAGE" | "TRANSFER" | "RETURN_SUPPLIER" | "OTHER";
  note?: string;
  items: Array<{
    stockItemId: number;
    quantity: number;
  }>;
}

export interface AuditAdjustmentPayload {
  warehouseId: number;
  stockItemId: number;
  actualQuantity: number;
  reason: string;
  note?: string;
}

export interface StockInflowResponse {
  id: number;
  referenceCode: string;
  createdAt: string;
}

export interface StockOutflowResponse {
  id: number;
  referenceCode: string;
  createdAt: string;
}

export interface AuditAdjustmentResponse {
  id: number;
  beforeQuantity: number;
  afterQuantity: number;
  delta: number;
}

// TODO API-CONTRACT: Confirm với Sang về field name chính xác

