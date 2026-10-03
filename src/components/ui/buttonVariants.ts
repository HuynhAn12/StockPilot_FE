import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "sp-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-(--sp-primary) bg-(--sp-primary) text-white hover:bg-(--sp-primary-hover)",
        secondary:
          "border-(--sp-border) bg-white text-(--sp-text) hover:bg-(--sp-surface-hover)",
        subtle:
          "border-transparent bg-(--sp-bg-subtle) text-(--sp-text) hover:bg-[#e9eef6]",
        ghost:
          "border-transparent bg-transparent text-(--sp-text-muted) hover:bg-(--sp-bg-subtle) hover:text-(--sp-text)",
        danger:
          "border-(--sp-danger) bg-(--sp-danger) text-white hover:bg-[#b91c1c]",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9.5 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);
