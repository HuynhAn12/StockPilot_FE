import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";

import { cn } from "../../lib/utils";

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { label: string }
>(({ label, className, ...props }, ref) => (
  <label className="flex items-center gap-2 text-sm text-(--sp-text)">
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "sp-focus grid size-4 place-items-center rounded-sm border border-(--sp-border-strong) bg-white data-[state=checked]:border-(--sp-primary) data-[state=checked]:bg-(--sp-primary)",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3 text-white" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    {label}
  </label>
));
Checkbox.displayName = "Checkbox";
