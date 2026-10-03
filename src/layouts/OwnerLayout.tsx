import type { ReactNode } from "react";

import { RoleShell } from "./RoleShell";

export function OwnerLayout({
  title = "Tổng quan cửa hàng",
  children,
  onRefresh,
}: {
  title?: string;
  children: ReactNode;
  onRefresh?: () => void;
}) {
  return (
    <RoleShell role="owner" title={title} onRefresh={onRefresh}>
      {children}
    </RoleShell>
  );
}
