import {
  Bell,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileClock,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  Package,
  PackageCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

import type { NavigationItem, ShellRole } from "../types/navigation";

export const ownerNavigation: NavigationItem[] = [
  { label: "Tổng quan", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Bán hàng", href: "/app/orders", icon: ClipboardList },
  { label: "Sản phẩm", href: "/app/catalog/products", icon: Package },
  { label: "Kho hàng", href: "/app/inventory", icon: Warehouse },
  { label: "Phân tích", href: "/app/analytics", icon: LineChart },
  { label: "Cảnh báo", href: "/app/alerts", icon: Bell },
  { label: "Gợi ý giá", href: "/app/pricing", icon: Tags },
  { label: "AI Assistant", href: "/app/assistant", icon: Sparkles },
  { label: "Báo cáo", href: "/app/reports", icon: FileBarChart },
  { label: "Nhập/Xuất dữ liệu", href: "/app/import-export", icon: FileClock },
  { label: "Cài đặt", href: "/app/settings/store", icon: Settings },
];

export const warehouseNavigation: NavigationItem[] = [
  { label: "Tổng quan", href: "/app/warehouse/overview", icon: LayoutDashboard },
  { label: "Tồn kho", href: "/app/warehouse/inventory", icon: Boxes },
  { label: "Nhập kho", href: "/app/warehouse/stock-in", icon: PackageCheck },
  { label: "Xuất kho", href: "/app/warehouse/stock-out", icon: Truck },
  { label: "Kiểm kho", href: "/app/warehouse/stock-take", icon: ClipboardCheck },
  { label: "Đơn cần xử lý", href: "/app/warehouse/fulfillment", icon: ClipboardList },
  { label: "Cảnh báo kho", href: "/app/warehouse/alerts", icon: Bell },
  { label: "Thông báo", href: "/app/notifications", icon: Bell },
];

export const adminNavigation: NavigationItem[] = [
  { label: "Tổng quan hệ thống", href: "/admin/dashboard", icon: HeartPulse },
  { label: "Người dùng", href: "/admin/users", icon: Users },
  { label: "Cửa hàng", href: "/admin/stores", icon: Building2 },
  { label: "Vai trò & quyền", href: "/admin/roles-permissions", icon: ShieldCheck },
  { label: "Cấu hình hệ thống", href: "/admin/system-settings", icon: Settings },
  { label: "Nhật ký", href: "/admin/audit-logs", icon: FileClock },
  { label: "AI monitoring", href: "/admin/ai-monitoring", icon: Sparkles },
  { label: "System health", href: "/admin/system-health", icon: HeartPulse },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];

export const roleConfig: Record<
  ShellRole,
  {
    label: string;
    scope: string;
    nav: NavigationItem[];
    accent: string;
  }
> = {
  owner: {
    label: "Store Owner",
    scope: "An Phát Mini Mart",
    nav: ownerNavigation,
    accent: "bg-(--sp-primary)",
  },
  warehouse: {
    label: "Warehouse Staff",
    scope: "Kho chính",
    nav: warehouseNavigation,
    accent: "bg-(--sp-success)",
  },
  admin: {
    label: "System Administration",
    scope: "System Administration",
    nav: adminNavigation,
    accent: "bg-(--sp-purple)",
  },
};
