import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  Eye,
  EyeOff,
  Inbox,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
  useState,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "sp-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-[8px] border text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-[var(--sp-primary)] bg-[var(--sp-primary)] text-white hover:bg-[var(--sp-primary-hover)]",
        secondary:
          "border-[var(--sp-border)] bg-white text-[var(--sp-text)] hover:bg-[var(--sp-surface-hover)]",
        subtle:
          "border-transparent bg-[var(--sp-bg-subtle)] text-[var(--sp-text)] hover:bg-[#e9eef6]",
        ghost:
          "border-transparent bg-transparent text-[var(--sp-text-muted)] hover:bg-[var(--sp-bg-subtle)] hover:text-[var(--sp-text)]",
        danger:
          "border-[var(--sp-danger)] bg-[var(--sp-danger)] text-white hover:bg-[#b91c1c]",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-[38px] px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

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

const inputClasses =
  "sp-focus h-[38px] w-full rounded-[8px] border border-[var(--sp-border)] bg-white px-3 text-sm text-[var(--sp-text)] shadow-[var(--sp-shadow-sm)] transition-colors placeholder:text-[var(--sp-text-soft)] hover:border-[var(--sp-border-strong)] disabled:cursor-not-allowed disabled:bg-[var(--sp-bg-subtle)] disabled:text-[var(--sp-text-soft)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(inputClasses, className)} {...props} />,
);
Input.displayName = "Input";

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sp-text-soft)]" />
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
        className="sp-focus absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[6px] text-[var(--sp-text-muted)] hover:bg-[var(--sp-bg-subtle)]"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "sp-focus min-h-24 w-full resize-y rounded-[8px] border border-[var(--sp-border)] bg-white px-3 py-2 text-sm text-[var(--sp-text)] shadow-[var(--sp-shadow-sm)] placeholder:text-[var(--sp-text-soft)]",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <LabelPrimitive.Root className="text-sm font-medium text-[var(--sp-text)]">{label}</LabelPrimitive.Root>
      {children}
      {hint ? <p className="text-[13px] text-[var(--sp-text-muted)]">{hint}</p> : null}
      {error ? (
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--sp-danger)]">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

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
          <ChevronDown className="size-4 text-[var(--sp-text-soft)]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 overflow-hidden rounded-[8px] border border-[var(--sp-border)] bg-white shadow-[var(--sp-shadow-md)]">
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="sp-focus relative flex h-9 cursor-pointer select-none items-center rounded-[6px] px-8 text-sm outline-none data-[highlighted]:bg-[var(--sp-bg-subtle)]"
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
      <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sp-text-soft)]" />
      <datalist id="stockpilot-combobox-options">
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </div>
  );
}

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { label: string }
>(({ label, className, ...props }, ref) => (
  <label className="flex items-center gap-2 text-sm text-[var(--sp-text)]">
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "sp-focus grid size-4 place-items-center rounded-[4px] border border-[var(--sp-border-strong)] bg-white data-[state=checked]:border-[var(--sp-primary)] data-[state=checked]:bg-[var(--sp-primary)]",
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
            className="sp-focus grid size-4 place-items-center rounded-full border border-[var(--sp-border-strong)] bg-white data-[state=checked]:border-[var(--sp-primary)]"
          >
            <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-[var(--sp-primary)]" />
          </RadioGroupPrimitive.Item>
          {option.label}
        </label>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-[12px] font-medium",
  {
    variants: {
      tone: {
        neutral: "border-[var(--sp-border)] bg-[var(--sp-bg-subtle)] text-[var(--sp-text-muted)]",
        success: "border-[#bbf7d0] bg-[var(--sp-success-soft)] text-[var(--sp-success)]",
        warning: "border-[#fde68a] bg-[var(--sp-warning-soft)] text-[var(--sp-warning)]",
        danger: "border-[#fecaca] bg-[var(--sp-danger-soft)] text-[var(--sp-danger)]",
        info: "border-[#bae6fd] bg-[var(--sp-info-soft)] text-[var(--sp-info)]",
        ai: "border-[#ddd6fe] bg-[var(--sp-purple-soft)] text-[var(--sp-purple)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export function Badge({
  tone,
  className,
  children,
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: "active" | "pending" | "completed" | "failed" | "draft" }) {
  const map = {
    active: ["success", "Đang hoạt động"],
    pending: ["warning", "Đang chờ"],
    completed: ["success", "Hoàn tất"],
    failed: ["danger", "Thất bại"],
    draft: ["neutral", "Bản nháp"],
  } as const;
  const [tone, label] = map[status];
  return (
    <Badge tone={tone}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export function RiskBadge({ risk }: { risk: "low" | "medium" | "high" | "critical" }) {
  const map = {
    low: ["success", "Rủi ro thấp"],
    medium: ["warning", "Rủi ro vừa"],
    high: ["warning", "Rủi ro cao"],
    critical: ["danger", "Khẩn cấp"],
  } as const;
  const [tone, label] = map[risk];
  return (
    <Badge tone={tone}>
      <CircleAlert className="size-3" />
      {label}
    </Badge>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[8px] border border-[var(--sp-border)] bg-[var(--sp-surface)] shadow-[var(--sp-shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}

export function MetricCard({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <Card className="p-4">
      <p className="text-[13px] font-medium text-[var(--sp-text-muted)]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="sp-tabular text-2xl font-bold tracking-normal text-[var(--sp-text)]">{value}</p>
        <Badge tone={tone === "neutral" ? "neutral" : tone}>{delta}</Badge>
      </div>
    </Card>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="max-w-full overflow-hidden rounded-[8px] border border-[var(--sp-border)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-[var(--sp-bg-subtle)] text-[13px] text-[var(--sp-text-muted)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-[var(--sp-border)] px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-[var(--sp-surface-hover)]">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="h-12 border-b border-[var(--sp-border)] px-4 py-2 last:border-b-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--sp-border-strong)] bg-white p-6 text-center">
      <Inbox className="mx-auto size-9 text-[var(--sp-text-soft)]" />
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-[var(--sp-text-muted)]">{description}</p>
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[8px] border border-[#fecaca] bg-[var(--sp-danger-soft)] p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-[var(--sp-danger)]" />
        <div>
          <h3 className="font-semibold text-[var(--sp-danger)]">{title}</h3>
          <p className="mt-1 text-sm text-[#7f1d1d]">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[8px] bg-[#e5eaf1]", className)} />;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#0f172a]/35" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-[var(--sp-border)] bg-white p-5 shadow-[var(--sp-shadow-md)]">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm text-[var(--sp-text-muted)]">
            {description}
          </DialogPrimitive.Description>
          <div className="mt-5 flex justify-end gap-2">
            <DialogPrimitive.Close asChild>
              <Button variant="secondary">Hủy</Button>
            </DialogPrimitive.Close>
            <DialogPrimitive.Close asChild>
              <Button variant="danger">Xác nhận</Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Modal({ trigger, title, children }: { trigger: ReactNode; title: string; children: ReactNode }) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#0f172a]/35" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-[var(--sp-border)] bg-white p-5 shadow-[var(--sp-shadow-md)]">
          <div className="flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="sp-focus rounded-[6px] p-1 text-[var(--sp-text-muted)] hover:bg-[var(--sp-bg-subtle)]">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="mt-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Drawer({ trigger, title, children }: { trigger: ReactNode; title: string; children: ReactNode }) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#0f172a]/25" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 w-[min(420px,calc(100vw-24px))] border-l border-[var(--sp-border)] bg-white p-5 shadow-[var(--sp-shadow-md)]">
          <div className="flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="sp-focus rounded-[6px] p-1 text-[var(--sp-text-muted)] hover:bg-[var(--sp-bg-subtle)]">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="mt-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const Sheet = Drawer;

export function Tabs({
  defaultValue,
  tabs,
}: {
  defaultValue: string;
  tabs: Array<{ value: string; label: string; content: ReactNode }>;
}) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue}>
      <TabsPrimitive.List className="inline-flex rounded-[8px] border border-[var(--sp-border)] bg-white p-1">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className="sp-focus rounded-[6px] px-3 py-1.5 text-sm font-medium text-[var(--sp-text-muted)] data-[state=active]:bg-[var(--sp-primary)] data-[state=active]:text-white"
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-[var(--sp-text-muted)]">
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight className="size-3.5" /> : null}
          <span className={index === items.length - 1 ? "font-medium text-[var(--sp-text)]" : ""}>{item}</span>
        </span>
      ))}
    </nav>
  );
}

export function Pagination() {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-[var(--sp-text-muted)]">1-10 trong 128 mục</p>
      <div className="flex items-center gap-2">
        <IconButton label="Trang trước" variant="secondary">
          <ChevronLeft className="size-4" />
        </IconButton>
        <Button variant="secondary">Trang 1</Button>
        <IconButton label="Trang sau" variant="secondary">
          <ChevronRight className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

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
              "flex items-center gap-2 rounded-[8px] border p-2 text-sm",
              active || done
                ? "border-[var(--sp-primary)] bg-[var(--sp-primary-soft)] text-[var(--sp-primary-hover)]"
                : "border-[var(--sp-border)] bg-white text-[var(--sp-text-muted)]",
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

export function ChartCard() {
  const data = [
    { day: "T2", revenue: 18 },
    { day: "T3", revenue: 22 },
    { day: "T4", revenue: 19 },
    { day: "T5", revenue: 28 },
    { day: "T6", revenue: 31 },
    { day: "T7", revenue: 26 },
  ];

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Doanh thu mẫu</h3>
          <p className="text-sm text-[var(--sp-text-muted)]">Dữ liệu demo cho đánh giá biểu đồ.</p>
        </div>
        <Badge tone="info">Demo</Badge>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #dbe3ee",
                boxShadow: "var(--sp-shadow-sm)",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Triệu VND"
              stroke="var(--sp-primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-[var(--sp-text-muted)]">
        Tóm tắt: doanh thu demo tăng nhẹ vào cuối tuần, không dùng cho quyết định kinh doanh.
      </p>
    </Card>
  );
}

export function LoadingButton() {
  return (
    <Button disabled>
      <Loader2 className="size-4 animate-spin" />
      Đang lưu
    </Button>
  );
}
