import { Check } from "lucide-react";

import { cn } from "../../lib/utils";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <li
            key={step}
            className={cn(
              "flex items-center gap-2 rounded-lg border p-2 text-sm",
              active || done
                ? "border-(--sp-primary) bg-(--sp-primary-soft) text-(--sp-primary-hover)"
                : "border-(--sp-border) bg-white text-(--sp-text-muted)",
            )}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-[12px] font-semibold">
              {done ? <Check className="size-3" /> : index + 1}
            </span>
            <span className="truncate">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
