import { LogOut, Menu, PanelLeft, RefreshCw, Store } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SearchInput } from "../components/ui/Input";
import { useCurrentUser, useLogout } from "../features/auth/hooks/useAuth";
import { cn } from "../lib/utils";
import type { NavigationItem, ShellRole } from "../types/navigation";
import { roleConfig } from "./navigation";

export function RoleShell({
  role,
  title,
  children,
  onRefresh,
}: {
  role: ShellRole;
  title: string;
  children: ReactNode;
  onRefresh?: () => void;
}) {
  const config = roleConfig[role];
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: userResponse } = useCurrentUser();
  const user = userResponse?.data;
  const logoutMutation = useLogout();

  const activeStoreName =
    user?.store?.name ||
    localStorage.getItem("sp_store_name") ||
    (user?.fullName ? `Cửa hàng ${user.fullName}` : config.scope);

  const activeStoreCode = user?.store?.code || localStorage.getItem("sp_tenant_slug") || "";
  const activeUserName = user?.fullName || "Chủ Cửa Hàng";

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      queryClient.invalidateQueries();
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigate("/login");
      },
    });
  };

  return (
    <div className="min-h-screen bg-(--sp-bg)">
      <div className="flex min-h-screen">
        <aside className="hidden w-(--sp-sidebar-width) shrink-0 border-r border-(--sp-border) bg-white lg:flex lg:flex-col">
          <SidebarHeader
            accent={config.accent}
            roleLabel={config.label}
            storeName={activeStoreName}
            storeCode={activeStoreCode}
          />
          <div className="flex-1 overflow-y-auto">
            <SidebarNav items={config.nav} currentPath={location.pathname} />
          </div>
          <div className="border-t border-(--sp-border) p-3">
            <div className="flex items-center justify-between rounded-lg bg-(--sp-bg-subtle) px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-(--sp-primary) text-xs font-bold text-white">
                  {activeUserName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-(--sp-text)">{activeUserName}</p>
                  <p className="truncate text-[11px] text-(--sp-text-muted)">{user?.email || "owner"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất"
                className="rounded p-1 text-(--sp-text-muted) hover:bg-white hover:text-(--sp-danger) transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-(--sp-header-height) items-center justify-between gap-3 border-b border-(--sp-border) bg-white/95 px-4 backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <IconButton label="Mở điều hướng" variant="ghost" className="lg:hidden">
                <Menu className="size-4" />
              </IconButton>
              <IconButton label="Thu gọn sidebar" variant="ghost" className="hidden lg:inline-flex">
                <PanelLeft className="size-4" />
              </IconButton>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-(--sp-text-muted)">
                  <Store className="size-3.5 shrink-0 text-(--sp-primary)" />
                  <span className="truncate font-medium text-(--sp-text)">{activeStoreName}</span>
                  {activeStoreCode && (
                    <span className="rounded bg-(--sp-bg-subtle) px-1.5 py-0.5 text-[10px] font-mono text-(--sp-text-muted)">
                      {activeStoreCode}
                    </span>
                  )}
                </div>
                <h2 className="truncate text-base font-semibold text-(--sp-text)">{title}</h2>
              </div>
            </div>
            <div className="hidden w-full max-w-xs md:block">
              <SearchInput placeholder="Tìm kiếm mặt hàng, đơn hàng..." />
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={role === "admin" ? "ai" : role === "warehouse" ? "success" : "info"}>
                {config.label}
              </Badge>
              <IconButton label="Làm mới dữ liệu" variant="secondary" onClick={handleRefresh}>
                <RefreshCw className="size-4" />
              </IconButton>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:inline-flex text-xs text-(--sp-text-muted) hover:text-(--sp-danger)"
              >
                <LogOut className="mr-1 size-3.5" />
                Đăng xuất
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-5 lg:p-6">{children}</main>
        </div>
      </div>
      <MobileNav items={config.nav.slice(0, 5)} currentPath={location.pathname} />
    </div>
  );
}

export function SidebarHeader({
  accent,
  roleLabel,
  storeName,
  storeCode,
}: {
  accent: string;
  roleLabel: string;
  storeName: string;
  storeCode?: string;
}) {
  return (
    <div className="border-b border-(--sp-border) p-4">
      <div className="flex items-center gap-2.5">
        <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white shadow-sm", accent)}>
          SP
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold tracking-tight text-(--sp-text)">StockPilot</p>
          <p className="truncate text-xs text-(--sp-text-muted)">{roleLabel}</p>
        </div>
      </div>
      <div className="mt-3.5 rounded-lg border border-(--sp-border) bg-(--sp-bg-subtle) p-2.5">
        <p className="text-[11px] font-medium text-(--sp-text-muted)">Cửa hàng đang hoạt động</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-(--sp-text)">{storeName}</p>
        {storeCode && (
          <p className="mt-0.5 text-[10px] font-mono text-(--sp-text-muted)">Mã: {storeCode}</p>
        )}
      </div>
    </div>
  );
}

export function SidebarNav({ items, currentPath }: { items: NavigationItem[]; currentPath: string }) {
  return (
    <nav className="sp-scrollbar p-2 space-y-0.5" aria-label="Điều hướng chính">
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentPath === item.href || (item.href !== "/app/dashboard" && currentPath.startsWith(item.href));
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "sp-focus flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-(--sp-primary-soft) text-(--sp-primary-hover) font-semibold shadow-xs"
                : "text-(--sp-text-muted) hover:bg-(--sp-bg-subtle) hover:text-(--sp-text)",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-(--sp-primary)" : "text-(--sp-text-muted)")} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items, currentPath }: { items: NavigationItem[]; currentPath: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-(--sp-border) bg-white/95 backdrop-blur lg:hidden" aria-label="Điều hướng di động">
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentPath === item.href || (item.href !== "/app/dashboard" && currentPath.startsWith(item.href));
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "sp-focus flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors",
              active ? "text-(--sp-primary) font-semibold" : "text-(--sp-text-muted)"
            )}
          >
            <Icon className="size-4" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ShellPreviewContent({ role }: { role: ShellRole }) {
  const copy = {
    owner: {
      title: "Ưu tiên hôm nay",
      description: "Shell chủ cửa hàng tập trung vào chỉ số, cảnh báo và quyết định cần xem xét.",
    },
    warehouse: {
      title: "Công việc kho",
      description: "Shell nhân viên kho ưu tiên thao tác tồn kho, đơn cần xử lý và cảnh báo vận hành.",
    },
    admin: {
      title: "Giám sát hệ thống",
      description: "Shell admin tách rõ phạm vi hệ thống, người dùng, cửa hàng, nhật ký và AI monitoring.",
    },
  }[role];

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{copy.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-(--sp-text-muted)">{copy.description}</p>
          </div>
          <Button variant="secondary">Hành động demo</Button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-(--sp-text-muted)">Khu vực nội dung</p>
          <p className="mt-2 text-xl font-semibold">Không có logic thật</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-(--sp-text-muted)">Trạng thái</p>
          <p className="mt-2 text-xl font-semibold">Chỉ để review shell</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-(--sp-text-muted)">Responsive</p>
          <p className="mt-2 text-xl font-semibold">Desktop + mobile</p>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <div className="border-b border-(--sp-border) px-4 py-3">
            <h4 className="font-semibold">Danh sách demo</h4>
            <p className="text-sm text-(--sp-text-muted)">Chỉ minh họa density, không có dữ liệu thật.</p>
          </div>
          <div className="divide-y divide-(--sp-border)">
            {["Kiểm tra tồn kho thấp", "Xem đề xuất giá", "Đồng bộ trạng thái đơn"].map((item, index) => (
              <div key={item} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item}</p>
                  <p className="text-[13px] text-(--sp-text-muted)">Demo item #{index + 1}</p>
                </div>
                <Badge tone={index === 0 ? "warning" : "neutral"}>{index === 0 ? "Cần xem" : "Demo"}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold">Ghi chú shell</p>
          <p className="mt-2 text-sm leading-6 text-(--sp-text-muted)">
            Shell giữ navigation, header, scope label và vùng nội dung nhất quán cho từng vai trò.
          </p>
        </Card>
      </div>
    </div>
  );
}
