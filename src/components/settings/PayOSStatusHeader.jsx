import React from 'react';
import { AlertTriangle, Loader2, QrCode } from 'lucide-react';

const TZ = 'Asia/Ho_Chi_Minh';

export const formatDateTime = (iso, isEn) => {
  if (!iso) return '–';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '–';
  return new Intl.DateTimeFormat(isEn ? 'en-GB' : 'vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: TZ }).format(date);
};

function StatusBadge({ config, isEn }) {
  if (config.needsReentry) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        <AlertTriangle className="size-3.5" aria-hidden /> {isEn ? 'Re-entry required' : 'Cần nhập lại khóa'}
      </span>
    );
  }
  if (!config.configured) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <AlertTriangle className="size-3.5" aria-hidden /> {isEn ? 'Not configured' : 'Chưa cấu hình'}
      </span>
    );
  }
  if (config.active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden /> {isEn ? 'Active' : 'Đang hoạt động'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
      <span className="size-1.5 rounded-full bg-slate-400" aria-hidden /> {isEn ? 'Connected · paused on POS' : 'Đã kết nối · đang tắt trên POS'}
    </span>
  );
}

export function PayOSStatusHeader({ config, isEn, toggling, onToggle }) {
  const canToggle = config.configured && !toggling;
  const lastUpdate = config.updatedAt || config.configuredAt;
  const switchLabel = isEn ? 'VietQR on POS checkout' : 'VietQR tại quầy POS';

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/10">
          <QrCode className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">PayOS · VietQR</h2>
            <StatusBadge config={config} isEn={isEn} />
          </div>
          <p className="text-sm text-slate-500">
            {config.configured
              ? <>{isEn ? 'Last updated' : 'Cập nhật gần nhất'}: <span className="tabular-nums text-slate-700">{formatDateTime(lastUpdate, isEn)}</span></>
              : (isEn ? 'Connect your PayOS channel to accept dynamic VietQR payments at the counter.' : 'Kết nối kênh PayOS để nhận thanh toán VietQR động ngay tại quầy.')}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:justify-end">
        <div className="text-right">
          <p id="payos-pos-switch-label" className="text-sm font-medium text-slate-900">{switchLabel}</p>
          <p className="text-xs text-slate-500">
            {!config.configured
              ? (isEn ? 'Save credentials first' : 'Cần lưu khóa trước')
              : config.active ? (isEn ? 'On' : 'Đang bật') : (isEn ? 'Off' : 'Đang tắt')}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={config.active}
          aria-labelledby="payos-pos-switch-label"
          onClick={onToggle}
          disabled={!canToggle}
          title={!config.configured ? (isEn ? 'Save PayOS credentials to enable VietQR' : 'Lưu thông tin PayOS để bật VietQR') : switchLabel}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${config.active ? 'bg-emerald-600' : 'bg-slate-300'}`}
        >
          <span className={`flex size-5 items-center justify-center rounded-full bg-white shadow transition-transform ${config.active ? 'translate-x-5' : 'translate-x-0.5'}`}>
            {toggling && <Loader2 className="size-3 animate-spin text-slate-500" aria-hidden />}
          </span>
        </button>
      </div>
    </div>
  );
}
