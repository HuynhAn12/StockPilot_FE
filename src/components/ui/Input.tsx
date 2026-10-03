import { Eye, EyeOff, Search } from "lucide-react";
import {
  type InputHTMLAttributes,
  forwardRef,
  useState,
} from "react";

import { cn } from "../../lib/utils";

export const inputClasses =
  "sp-focus h-9.5 w-full rounded-lg border border-(--sp-border) bg-white px-3 text-sm text-(--sp-text) shadow-(--sp-shadow-sm) transition-colors placeholder:text-(--sp-text-soft) hover:border-(--sp-border-strong) disabled:cursor-not-allowed disabled:bg-(--sp-bg-subtle) disabled:text-(--sp-text-soft)";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(inputClasses, className)} {...props} />,
);
Input.displayName = "Input";

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--sp-text-soft)" />
      <Input ref={ref} className={cn("pl-9", className)} {...props} />
    </div>
  ),
);
SearchInput.displayName = "SearchInput";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-10", props.className)} />
      <button
        type="button"
        className="sp-focus absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-(--sp-text-muted) hover:bg-(--sp-bg-subtle)"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
