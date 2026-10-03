import { ChevronsUpDown } from "lucide-react";

import { Input } from "./Input";

export function Combobox({
  placeholder,
  options,
}: {
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative">
      <Input list="stockpilot-combobox-options" placeholder={placeholder} className="pr-10" />
      <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-(--sp-text-soft)" />
      <datalist id="stockpilot-combobox-options">
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </div>
  );
}
