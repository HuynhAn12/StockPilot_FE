import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-medium",
  {
    variants: {
      tone: {
        neutral: "border-(--sp-border) bg-(--sp-bg-subtle) text-(--sp-text-muted)",
        success: "border-[#bbf7d0] bg-(--sp-success-soft) text-(--sp-success)",
        warning: "border-[#fde68a] bg-(--sp-warning-soft) text-(--sp-warning)",
        danger: "border-[#fecaca] bg-(--sp-danger-soft) text-(--sp-danger)",
        info: "border-[#bae6fd] bg-(--sp-info-soft) text-(--sp-info)",
        ai: "border-[#ddd6fe] bg-(--sp-purple-soft) text-(--sp-purple)",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);
