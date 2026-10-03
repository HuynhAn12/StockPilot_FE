import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./buttonVariants";

export type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export type IconButtonProps = ButtonProps & {
  label: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, className, size = "md", children, ...props }, ref) => (
    <Button
      ref={ref}
      aria-label={label}
      title={label}
      size={size}
      className={cn("aspect-square px-0", className)}
      {...props}
    >
      {children}
    </Button>
  ),
);
IconButton.displayName = "IconButton";

export function LoadingButton({
  children = "Đang lưu",
  className,
  ...props
}: ButtonProps) {
  return (
    <Button disabled className={className} {...props}>
      <Loader2 className="size-4 animate-spin" />
      {children}
    </Button>
  );
}
