export const DASHBOARD_DATE_RANGES = [
  { id: "today", label: "Hôm nay" },
  { id: "7d", label: "7 ngày" },
  { id: "30d", label: "30 ngày" },
  { id: "custom", label: "Tùy chọn" },
] as const;

export const DEFAULT_DASHBOARD_RANGE = "30d" as const;
