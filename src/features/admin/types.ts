export interface SystemHealthStatus {
  status: "OK" | "DEGRADED" | "UNHEALTHY";
  timestamp: string;
  database: "CONNECTED" | "DISCONNECTED";
  service: string;
}

export interface AdminUserListItem {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  storeId?: number | null;
}
