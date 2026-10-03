import { Menu, PanelLeft, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { SearchInput } from "../components/ui/Input";
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

  return (
    <div className="min-h-140 overflow-hidden rounded-[10px] border border-(--sp-border) bg-(--sp-bg) shadow-(--sp-shadow-sm)">
      <div className="flex min-h-140">
        <aside className="hidden w-(--sp-sidebar-width) shrink-0 border-r border-(--sp-border) bg-white lg:block">
          <SidebarHeader accent={config.accent} roleLabel={config.label} scope={config.scope} />
          <SidebarNav items={config.nav} activeIndex={0} />
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-(--sp-header-height) items-center justify-between gap-3 border-b border-(--sp-border) bg-white/92 px-4 backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <IconButton label="Mở điều hướng" variant="ghost" className="lg:hidden">
                <Menu className="size-4" />
              </IconButton>
              <IconButton label="Thu gọn sidebar" variant="ghost" className="hidden lg:inline-flex">
                <PanelLeft className="size-4" />
              </IconButton>
              <div className="min-w-0">
                <p className="truncate text-sm text-(--sp-text-muted)">{config.scope}</p>
                <h2 className="truncate text-base font-semibold">{title}</h2>
              </div>
            </div>
            <div className="hidden w-full max-w-xs md:block">
              <SearchInput placeholder="Tìm kiếm..." />
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={role === "admin" ? "ai" : role === "warehouse" ? "success" : "info"}>{config.label}</Badge>
              <IconButton label="Làm mới" variant="secondary" onClick={onRefresh}>
                <RefreshCw className="size-4" />
              </IconButton>
            </div>
          </header>
          <main className="p-4 sm:p-5 lg:p-6">{children}</main>
        </div>
      </div>
      <MobileNav items={config.nav.slice(0, 5)} />
    </div>
  );
}

export function SidebarHeader({
  accent,
  roleLabel,
  scope,
}: {
  accent: string;
  roleLabel: string;
  scope: string;
}) {
  return (
    <div className="border-b border-(--sp-border) p-4">
      <div className="flex items-center gap-2">
        <div className={cn("grid size-9 place-items-center rounded-lg text-sm font-bold text-white", accent)}>
          SP
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">StockPilot</p>
          <p className="truncate text-xs text-(--sp-text-muted)">{roleLabel}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-(--sp-border) bg-(--sp-bg-subtle) p-3">
        <p className="text-xs text-(--sp-text-muted)">Phạm vi</p>
        <p className="mt-1 truncate text-sm font-medium">{scope}</p>
      </div>
    </div>
  );
}

export function SidebarNav({ items, activeIndex }: { items: NavigationItem[]; activeIndex: number }) {
  return (
    <nav className="sp-scrollbar max-h-110 overflow-y-auto p-2" aria-label="Điều hướng chính">
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = index === activeIndex;
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "sp-focus flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium",
              active
                ? "bg-(--sp-primary-soft) text-(--sp-primary-hover)"
                : "text-(--sp-text-muted) hover:bg-(--sp-bg-subtle) hover:text-(--sp-text)",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items }: { items: NavigationItem[] }) {
  return (
    <nav className="grid grid-cols-5 border-t border-(--sp-border) bg-white lg:hidden" aria-label="Điều hướng di động">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            className="sp-focus flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-(--sp-text-muted)"
          >
            <Icon className="size-4" />
            <span className="max-w-full truncate">{item.label}</span>
          </a>
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
