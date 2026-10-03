export interface RevenueAnalyticsPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface CategoryPerformanceItem {
  categoryId: number;
  categoryName: string;
  revenue: number;
  percentage: number;
}
