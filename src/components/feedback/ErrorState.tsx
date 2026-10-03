import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

export function ErrorState({
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
        "rounded-lg border border-[#fecaca] bg-(--sp-danger-soft) p-4",
        className,
      )}
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-(--sp-danger)" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-(--sp-danger)">{title}</h3>
          <p className="mt-1 text-sm text-[#7f1d1d]">{description}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
