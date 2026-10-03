import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

export function RadioGroup({
  options,
  defaultValue,
}: {
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
}) {
  return (
    <RadioGroupPrimitive.Root className="grid gap-2" defaultValue={defaultValue}>
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm">
          <RadioGroupPrimitive.Item
            value={option.value}
            className="sp-focus grid size-4 place-items-center rounded-full border border-(--sp-border-strong) bg-white data-[state=checked]:border-(--sp-primary)"
          >
            <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-(--sp-primary)" />
          </RadioGroupPrimitive.Item>
          {option.label}
        </label>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
