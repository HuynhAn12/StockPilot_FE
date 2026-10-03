/**
 * StockPilot Shared Formatter Utilities (Vietnamese Locale vi-VN)
 */

export function formatVND(
  amount: number | string | null | undefined,
  options?: { compact?: boolean }
): string {
  if (amount == null || isNaN(Number(amount))) return "0 ₫";
  const num = Number(amount);

  if (options?.compact) {
    if (Math.abs(num) >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ ₫`;
    }
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr ₫`;
    }
    if (Math.abs(num) >= 1_000) {
      return `${(num / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} k ₫`;
    }
  }

  return `${num.toLocaleString("vi-VN")} ₫`;
}

export function formatNumber(
  value: number | string | null | undefined,
  fractionDigits = 0
): string {
  if (value == null || isNaN(Number(value))) return "0";
  return Number(value).toLocaleString("vi-VN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatPercent(
  value: number | string | null | undefined,
  includeSign = false
): string {
  if (value == null || isNaN(Number(value))) return "0%";
  const num = Number(value);
  const formatted = num.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (includeSign && num > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
}

export function formatDateTime(
  date: Date | string | number | null | undefined
): string {
  if (!date) return "--";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--";

  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(
  date: Date | string | number | null | undefined
): string {
  if (!date) return "--:--";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--:--";

  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
