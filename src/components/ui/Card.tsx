import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-(--sp-border) bg-(--sp-surface) shadow-(--sp-shadow-sm)",
        className,
      )}
      {...props}
    />
  );
}
