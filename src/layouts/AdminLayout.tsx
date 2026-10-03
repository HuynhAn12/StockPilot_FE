import type { ReactNode } from "react";

import { RoleShell } from "./RoleShell";

export function AdminLayout({
  title = "Tổng quan hệ thống",
  children,
  onRefresh,
}: {
  title?: string;
  children: ReactNode;
  onRefresh?: () => void;
}) {
  return (
    <RoleShell role="admin" title={title} onRefresh={onRefresh}>
      {children}
    </RoleShell>
  );
}
