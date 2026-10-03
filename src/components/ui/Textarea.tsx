import { type ComponentPropsWithoutRef, forwardRef } from "react";

import { cn } from "../../lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "sp-focus min-h-24 w-full resize-y rounded-lg border border-(--sp-border) bg-white px-3 py-2 text-sm text-(--sp-text) shadow-(--sp-shadow-sm) placeholder:text-(--sp-text-soft)",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
