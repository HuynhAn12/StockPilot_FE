import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  href?: string;
  path?: string;
  icon: LucideIcon;
  children?: NavigationItem[];
};

export type MenuItem = NavigationItem;

export type ShellRole = "owner" | "warehouse" | "admin";

