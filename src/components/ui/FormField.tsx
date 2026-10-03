import * as LabelPrimitive from "@radix-ui/react-label";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <LabelPrimitive.Root className="text-sm font-medium text-(--sp-text)">{label}</LabelPrimitive.Root>
      {children}
      {hint ? <p className="text-[13px] text-(--sp-text-muted)">{hint}</p> : null}
      {error ? (
        <p className="flex items-center gap-1.5 text-[13px] text-(--sp-danger)">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
