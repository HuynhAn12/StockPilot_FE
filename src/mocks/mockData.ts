/**
 * StockPilot Mock Data
 * Isolated for visual demonstration and internal component tests only.
 * Production routes must consume real backend endpoints.
 */

export const mockDashboardMetrics = {
  revenue: "128,4tr",
  revenueDelta: "+8,2%",
  ordersCount: "342",
  ordersDelta: "Ổn định",
  inventoryAlertsCount: "18",
  inventoryAlertsDelta: "Cần xem",
  criticalRisksCount: "3",
  criticalRisksDelta: "Ưu tiên",
};

export const mockCategoryData = [
  { category: "Thực phẩm khô", revenue: 45.2 },
  { category: "Gia vị & Đồ hộp", revenue: 32.8 },
  { category: "Sữa & Bơ trứng", revenue: 28.4 },
  { category: "Đồ uống", revenue: 22.0 },
];
