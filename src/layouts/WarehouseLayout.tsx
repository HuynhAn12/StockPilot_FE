import type { ReactNode } from "react";

import { RoleShell } from "./RoleShell";

export function WarehouseLayout({
  title = "Tổng quan kho",
  children,
  onRefresh,
}: {
  title?: string;
  children: ReactNode;
  onRefresh?: () => void;
}) {
  return (
    <RoleShell role="warehouse" title={title} onRefresh={onRefresh}>
      {children}
    </RoleShell>
  );
}
