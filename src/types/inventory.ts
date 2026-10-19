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

export type StockTakeStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

export interface StockTake {
  id: number;
  code: string;
  title: string;
  scope: "ALL" | "CATEGORY";
  categoryId?: number | null;
  categoryName?: string | null;
  note?: string | null;
  status: StockTakeStatus;
  createdBy: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  canceledAt?: string | null;
  totalItems?: number;
  countedItems?: number;
}

export interface StockTakeCount {
  id: number;
  stockTakeId: number;
  stockItemId: number;
  stockItem?: {
    id: number;
    sku: string;
    name: string;
    costPrice: number;
  };
  systemQuantity: number;
  actualQuantity: number | null;
  variance: number | null;
  note?: string | null;
}

export interface StockTakeDetail extends StockTake {
  counts: StockTakeCount[];
}

export interface CreateStockTakePayload {
  title: string;
  scope: "ALL" | "CATEGORY";
  categoryId?: number | null;
  note?: string;
}

export interface UpdateStockTakeCountsPayload {
  counts: Array<{
    stockItemId: number;
    actualQuantity: number;
    note?: string;
  }>;
}

// TODO API-CONTRACT: Confirm với Sang về field name chính xác
