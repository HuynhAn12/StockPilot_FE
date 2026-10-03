import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-(--sp-border-strong) bg-white p-6 text-center",
        className,
      )}
    >
      <Inbox className="mx-auto size-9 text-(--sp-text-soft)" />
      <h3 className="mt-3 text-base font-semibold text-(--sp-text)">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-(--sp-text-muted)">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
