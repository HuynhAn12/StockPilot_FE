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
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
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
