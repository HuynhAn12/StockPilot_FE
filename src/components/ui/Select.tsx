import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "../../lib/utils";
import { inputClasses } from "./Input";

export function Select({
  value,
  onValueChange,
  placeholder,
  options,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className={cn(inputClasses, "flex items-center justify-between")}>
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-(--sp-text-soft)" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 overflow-hidden rounded-lg border border-(--sp-border) bg-white shadow-(--sp-shadow-md)">
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="sp-focus relative flex h-9 cursor-pointer select-none items-center rounded-md px-8 text-sm outline-none data-highlighted:bg-(--sp-bg-subtle)"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2">
                  <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
