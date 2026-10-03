import {
  Home,
  Menu,
  PanelLeft,
  RefreshCw,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge, Button, Card, IconButton, SearchInput } from "../components/ui/primitives";
import { cn } from "../lib/utils";
import type { NavigationItem, ShellRole } from "../types/navigation";
import { roleConfig } from "./navigation";

export function PublicAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[620px] overflow-hidden rounded-[10px] border border-[var(--sp-border)] bg-white shadow-[var(--sp-shadow-sm)] lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="flex flex-col justify-between bg-[#0f172a] p-6 text-white lg:p-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-[8px] bg-white text-sm font-bold text-[#0f172a]">
              SP
            </div>
            <div>
              <p className="font-semibold">StockPilot</p>
              <p className="text-sm text-white/65">Inventory decision support</p>
            </div>
          </div>
          <div className="mt-12 max-w-sm">
            <h2 className="text-2xl font-bold leading-tight lg:text-3xl">Kiểm soát tồn kho và gợi ý giá rõ ràng hơn.</h2>
            <p className="mt-4 text-sm leading-6 text-white/72">
              Giao diện nền tảng cho đăng nhập, đăng ký và onboarding chủ cửa hàng. Đây là shell, chưa phải flow đăng ký.
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-white/72">
          <div className="rounded-[8px] border border-white/12 p-3">Một cửa hàng MVP</div>
          <div className="rounded-[8px] border border-white/12 p-3">Một kho MVP</div>
        </div>
      </aside>
      <main className="flex items-center justify-center p-5 sm:p-8">{children}</main>
    </div>
  );
}

export function RoleShell({
  role,
  title,
  children,
}: {
  role: ShellRole;
  title: string;
  children: ReactNode;
}) {
  const config = roleConfig[role];

  return (
    <div className="min-h-[560px] overflow-hidden rounded-[10px] border border-[var(--sp-border)] bg-[var(--sp-bg)] shadow-[var(--sp-shadow-sm)]">
      <div className="flex min-h-[560px]">
        <aside className="hidden w-[var(--sp-sidebar-width)] shrink-0 border-r border-[var(--sp-border)] bg-white lg:block">
          <SidebarHeader accent={config.accent} roleLabel={config.label} scope={config.scope} />
          <SidebarNav items={config.nav} activeIndex={0} />
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-[var(--sp-header-height)] items-center justify-between gap-3 border-b border-[var(--sp-border)] bg-white/92 px-4 backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <IconButton label="Mở điều hướng" variant="ghost" className="lg:hidden">
                <Menu className="size-4" />
              </IconButton>
              <IconButton label="Thu gọn sidebar" variant="ghost" className="hidden lg:inline-flex">
                <PanelLeft className="size-4" />
              </IconButton>
              <div className="min-w-0">
                <p className="truncate text-sm text-[var(--sp-text-muted)]">{config.scope}</p>
                <h2 className="truncate text-base font-semibold">{title}</h2>
              </div>
            </div>
            <div className="hidden w-full max-w-xs md:block">
              <SearchInput placeholder="Tìm kiếm demo..." />
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={role === "admin" ? "ai" : role === "warehouse" ? "success" : "info"}>{config.label}</Badge>
              <IconButton label="Làm mới" variant="secondary">
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

function SidebarHeader({
  accent,
  roleLabel,
  scope,
}: {
  accent: string;
  roleLabel: string;
  scope: string;
}) {
  return (
    <div className="border-b border-[var(--sp-border)] p-4">
      <div className="flex items-center gap-2">
        <div className={cn("grid size-9 place-items-center rounded-[8px] text-sm font-bold text-white", accent)}>
          SP
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">StockPilot</p>
          <p className="truncate text-xs text-[var(--sp-text-muted)]">{roleLabel}</p>
        </div>
      </div>
      <div className="mt-4 rounded-[8px] border border-[var(--sp-border)] bg-[var(--sp-bg-subtle)] p-3">
        <p className="text-xs text-[var(--sp-text-muted)]">Phạm vi</p>
        <p className="mt-1 truncate text-sm font-medium">{scope}</p>
      </div>
    </div>
  );
}

function SidebarNav({ items, activeIndex }: { items: NavigationItem[]; activeIndex: number }) {
  return (
    <nav className="sp-scrollbar max-h-[440px] overflow-y-auto p-2" aria-label="Điều hướng chính">
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = index === activeIndex;
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "sp-focus flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm font-medium",
              active
                ? "bg-[var(--sp-primary-soft)] text-[var(--sp-primary-hover)]"
                : "text-[var(--sp-text-muted)] hover:bg-[var(--sp-bg-subtle)] hover:text-[var(--sp-text)]",
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

function MobileNav({ items }: { items: NavigationItem[] }) {
  return (
    <nav className="grid grid-cols-5 border-t border-[var(--sp-border)] bg-white lg:hidden" aria-label="Điều hướng di động">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            className="sp-focus flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-[var(--sp-text-muted)]"
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
            <p className="mt-1 max-w-2xl text-sm text-[var(--sp-text-muted)]">{copy.description}</p>
          </div>
          <Button variant="secondary">Hành động demo</Button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-[var(--sp-text-muted)]">Khu vực nội dung</p>
          <p className="mt-2 text-xl font-semibold">Không có logic thật</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--sp-text-muted)]">Trạng thái</p>
          <p className="mt-2 text-xl font-semibold">Chỉ để review shell</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[var(--sp-text-muted)]">Responsive</p>
          <p className="mt-2 text-xl font-semibold">Desktop + mobile</p>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--sp-border)] px-4 py-3">
            <h4 className="font-semibold">Danh sách demo</h4>
            <p className="text-sm text-[var(--sp-text-muted)]">Chỉ minh họa density, không có dữ liệu thật.</p>
          </div>
          <div className="divide-y divide-[var(--sp-border)]">
            {["Kiểm tra tồn kho thấp", "Xem đề xuất giá", "Đồng bộ trạng thái đơn"].map((item, index) => (
              <div key={item} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item}</p>
                  <p className="text-[13px] text-[var(--sp-text-muted)]">Demo item #{index + 1}</p>
                </div>
                <Badge tone={index === 0 ? "warning" : "neutral"}>{index === 0 ? "Cần xem" : "Demo"}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold">Ghi chú shell</p>
          <p className="mt-2 text-sm leading-6 text-[var(--sp-text-muted)]">
            Shell giữ navigation, header, scope label và vùng nội dung nhất quán cho từng vai trò.
          </p>
        </Card>
      </div>
    </div>
  );
}

export function PublicShellDemo() {
  return (
    <PublicAuthShell>
      <Card className="w-full max-w-md p-5">
        <div className="flex items-center gap-2">
          <Home className="size-5 text-[var(--sp-primary)]" />
          <h2 className="text-lg font-semibold">Auth shell demo</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--sp-text-muted)]">
          Khu vực form sẽ dùng cho đăng nhập và đăng ký ở phase sau. Chưa triển khai nghiệp vụ.
        </p>
        <div className="mt-5 grid gap-3">
          <div className="h-[38px] rounded-[8px] border border-[var(--sp-border)] bg-[var(--sp-bg-subtle)]" />
          <div className="h-[38px] rounded-[8px] border border-[var(--sp-border)] bg-[var(--sp-bg-subtle)]" />
          <Button>Tiếp tục demo</Button>
        </div>
      </Card>
    </PublicAuthShell>
  );
}
