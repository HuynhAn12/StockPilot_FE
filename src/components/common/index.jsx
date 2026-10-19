import { useState } from 'react';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({ title, value, change, changeLabel, icon, iconColor, sparkline, onClick }) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-150',
        onClick && 'cursor-pointer hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground leading-tight">{title}</p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconColor)}>
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{value}</p>

      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : isNegative ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
          ) : null}
          <span
            className={cn(
              'text-xs font-semibold',
              isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
            )}
          >
            {isPositive ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-[11px] text-muted-foreground truncate">{changeLabel}</span>}
        </div>
      )}

      {sparkline && (
        <div className="flex items-end gap-0.5 h-8 mt-1">
          {sparkline.map((val, i) => {
            const max = Math.max(...sparkline);
            const heightPct = (val / max) * 100;
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 rounded-sm transition-all',
                  isNegative ? 'bg-red-400/60' : 'bg-indigo-400/60'
                )}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading = false,
  leftIcon,
  rightIcon,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 active:scale-95',
    secondary: 'bg-muted text-foreground hover:bg-muted/80 active:scale-95',
    outline: 'border border-border bg-transparent text-foreground hover:bg-muted active:scale-95',
    ghost: 'bg-transparent text-foreground hover:bg-muted active:scale-95',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  };

  return (
    <button
      className={cn(base, variants[variant] || variants.primary, sizes[size] || sizes.md, className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

export function Card({ children, className, ...props }) {
  return (
    <div className={cn('bg-card border border-border rounded-2xl', className)} {...props}>
      {children}
    </div>
  );
}

export function Input({ className, error, ...props }) {
  return (
    <div className="w-full">
      <input
        className={cn(
          'w-full px-3 py-2.5 text-sm bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors',
          error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral', className, ...props }) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        tones[tone] || tones.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function FormField({ label, hint, error, required, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ className, error, ...props }) {
  return (
    <div className="w-full">
      <textarea
        className={cn(
          'w-full px-3 py-2.5 text-sm bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors',
          error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Select({ placeholder, options = [], value, onValueChange, className, ...props }) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors',
        className
      )}
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Đồng ý',
  cancelLabel = 'Hủy',
  onConfirm,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-block cursor-pointer">
        {trigger}
      </span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted text-foreground"
                onClick={() => setOpen(false)}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  setOpen(false);
                  onConfirm?.();
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <span className="text-muted-foreground/50">/</span>}
          <span className={idx === items.length - 1 ? 'font-medium text-foreground' : ''}>{item}</span>
        </span>
      ))}
    </nav>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className || 'h-8 w-full')} />;
}
