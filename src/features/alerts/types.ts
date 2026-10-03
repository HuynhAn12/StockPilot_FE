export interface AlertItem {
  id: number;
  storeId: number;
  stockItemId: number;
  type: "LOW_STOCK" | "STOCKOUT" | "OVERSTOCK" | "SLOW_MOVING" | "DEAD_STOCK" | "UNUSUAL_DEMAND";
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  riskScore?: number | null;
  confidence?: number | null;
  title: string;
  message: string;
  openedAt: string;
  stockItem?: {
    id: number;
    sku: string;
    name: string;
    costPrice: number;
    sellingPrice: number;
  };
}
