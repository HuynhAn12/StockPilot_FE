export interface DashboardMetricsData {
  storeId: number;
  completedOrdersCount: number;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  totalStockQuantity: number;
  inventoryValuation: number;
  inventoryRetailValuation: number;
}

export interface DecisionOverviewSummary {
  totalSkus: number;
  stockoutRiskCount: number;
  overstockRiskCount: number;
  deadStockCount: number;
  totalDeadStockCostValue: number;
  totalDeadStockRetailValue: number;
}

export interface SkuDecisionItem {
  stockItemId: number;
  sku: string;
  productName: string;
  categoryName?: string | null;
  inventory: {
    onHand: number;
    reserved: number;
    available: number;
    minStockLevel: number;
    maxStockLevel: number;
  };
  coverage: {
    safetyStock: number;
    reorderPoint: number;
    daysOfCover: number | null;
  };
  risk: {
    stockout: number;
    stockoutSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    overstock: number;
    overstockSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    slowMoving: boolean;
    deadStock: boolean;
  };
  confidence: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH";
  };
}

export interface DashboardFilterState {
  range: "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}
