export interface PricingRecommendationItem {
  id: number;
  storeId: number;
  stockItemId: number;
  currentPrice: number;
  recommendedPrice: number;
  discountPct: number;
  action: "INCREASE" | "DECREASE" | "MAINTAIN";
  riskScore?: number | null;
  confidence?: number | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "MODIFIED" | "EXPIRED";
  reasonJson?: Record<string, unknown>;
  stockItem?: {
    id: number;
    sku: string;
    name: string;
    costPrice: number;
    sellingPrice: number;
    product?: {
      id: number;
      name: string;
    };
  };
}
