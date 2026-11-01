import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, FileWarning, Info, RefreshCw, TrendingUp, X } from 'lucide-react';
import { useAuthStore } from '../../../components/store/authStore';
import { useRevenueThreshold } from '../queries';

const vnd = (n) => (n == null ? '–' : `${new Intl.NumberFormat('vi-VN').format(Math.round(n))} đ`);
const vnDate = (key) => (key ? key.split('-').reverse().join('/') : '–');

// Mỗi mức một màu + luôn có chữ (không dùng màu làm tín hiệu duy nhất).
const LEVELS = {
  NONE: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', vi: 'Dưới ngưỡng', en: 'Below threshold' },
  WATCH: { bar: 'bg-blue-600', badge: 'bg-blue-50 text-blue-700 ring-blue-600/20', vi: 'Cần theo dõi', en: 'Watch' },
  WARNING: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', vi: 'Sắp chạm ngưỡng', en: 'Near threshold' },
  REACHED: { bar: 'bg-red-600', badge: 'bg-red-50 text-red-700 ring-red-600/20', vi: 'Đã đạt ngưỡng', en: 'Threshold reached' },
  PRIOR_YEAR_REACHED: { bar: 'bg-red-600', badge: 'bg-red-50 text-red-700 ring-red-600/20', vi: 'Năm trước đã đạt ngưỡng', en: 'Reached last year' },
};

function headline(d, isEn) {
  const pct = Math.floor(d.ratio * 100);
  switch (d.level) {
    case 'PRIOR_YEAR_REACHED':
      return isEn
        ? `Revenue in ${d.year - 1} was ${vnd(d.priorYearRevenue)} (1 billion VND or more). The store may need cash-register e-invoices in ${d.year}.`
        : `Doanh thu năm ${d.year - 1} đạt ${vnd(d.priorYearRevenue)} (từ 1 tỷ trở lên). Cửa hàng có thể thuộc diện dùng hóa đơn điện tử khởi tạo từ máy tính tiền trong năm ${d.year}.`;
    case 'REACHED':
      return isEn
        ? `Year-to-date revenue reached the threshold on ${vnDate(d.crossedOn)}. Suggested registration deadline: ${vnDate(d.registrationDeadlineHint)}.`
        : `Doanh thu lũy kế năm ${d.year} đã đạt ngưỡng từ ngày ${vnDate(d.crossedOn)}. Gợi ý đăng ký sử dụng hóa đơn điện tử trước ${vnDate(d.registrationDeadlineHint)}.`;
    case 'WARNING':
      return isEn
        ? `${pct}% of the threshold reached. Time to pick an e-invoice provider.`
        : `Đã đạt ${pct}% ngưỡng. Nên chuẩn bị chọn nhà cung cấp hóa đơn điện tử.`;
    case 'WATCH':
      return d.forecast.projectedCrossDate
        ? (isEn
            ? `At the pace of the last 90 days, revenue may reach the threshold around ${vnDate(d.forecast.projectedCrossDate)}.`
            : `Theo tốc độ bán 90 ngày gần nhất, doanh thu có thể chạm ngưỡng khoảng ngày ${vnDate(d.forecast.projectedCrossDate)}.`)
        : (isEn ? `${pct}% of the threshold reached.` : `Đã đạt ${pct}% ngưỡng.`);
    default:
      return null;
  }
}

const bannerKey = (userId, d) => `stockpilot:einvoice-banner:${userId}:${d.year}:${d.level}`;
const readDismissed = (key) => {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
};

export function RevenueThresholdCard({ isEn }) {
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isPending, isError, refetch, isFetching } = useRevenueThreshold();
  const [dismissedKey, setDismissedKey] = useState(null);

  if (isPending) {
    return <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-busy="true" />;
  }
  if (isError) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <span>{isEn ? 'Could not load the e-invoice threshold tracker.' : 'Không tải được thông tin ngưỡng hóa đơn điện tử.'}</span>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-1.5 font-semibold underline disabled:opacity-50 cursor-pointer">
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden /> {isEn ? 'Try again' : 'Thử lại'}
        </button>
      </div>
    );
  }

  const d = data;
  const level = LEVELS[d.level] ?? LEVELS.NONE;
  const message = headline(d, isEn);
  const key = bannerKey(userId, d);
  const showBanner = d.level !== 'NONE' && dismissedKey !== key && !readDismissed(key);
  const pct = Math.min(100, d.ratio * 100);
  const noRevenue = d.ytdRevenue === 0 && d.priorYearRevenue === 0;

  const dismiss = () => {
    try { window.localStorage.setItem(key, '1'); } catch { /* chỉ là tiện ích hiển thị */ }
    setDismissedKey(key);
  };

  return (
    <section className="space-y-3" aria-labelledby="einvoice-threshold-title">
      {showBanner && message && (
        <div role="status" className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${d.level === 'WATCH' ? 'border-blue-200 bg-blue-50 text-blue-900' : d.level === 'WARNING' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
          <FileWarning className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="flex-1">{message}</p>
          <button type="button" onClick={dismiss} aria-label={isEn ? 'Dismiss' : 'Đã hiểu'} title={isEn ? 'Dismiss for this level' : 'Ẩn cho tới khi lên mức cao hơn'} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white/60 cursor-pointer">
            <X className="size-4" aria-hidden /> {isEn ? 'Got it' : 'Đã hiểu'}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 id="einvoice-threshold-title" className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <TrendingUp className="size-4 text-slate-500" aria-hidden />
              {isEn ? `E-invoice revenue threshold ${d.year}` : `Ngưỡng doanh thu hóa đơn điện tử ${d.year}`}
            </h2>
            <p className="text-sm text-slate-500">
              {isEn ? 'Year-to-date revenue vs. the 1 billion VND threshold (Decree 70/2025).' : 'Doanh thu lũy kế từ đầu năm so với ngưỡng 1 tỷ đồng (NĐ 70/2025).'}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${level.badge}`}>
            {isEn ? level.en : level.vi}
          </span>
        </div>

        {noRevenue ? (
          <p className="mt-4 text-sm text-slate-500">
            {isEn ? `No revenue recorded in ${d.year} yet.` : `Chưa có doanh thu ghi nhận trong năm ${d.year}.`}
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{vnd(d.ytdRevenue)}</p>
              <p className="text-sm tabular-nums text-slate-500">
                {Math.floor(d.ratio * 100)}% {isEn ? 'of' : 'của'} {vnd(d.threshold)}
              </p>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              aria-label={isEn ? 'Share of the threshold reached' : 'Tỷ lệ so với ngưỡng'}
              className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            >
              <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${pct}%` }} />
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">{isEn ? 'Year-end projection' : 'Dự báo cuối năm'}</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {d.forecast.sufficientData ? vnd(d.forecast.projectedYearEnd) : (isEn ? 'Not enough data' : 'Chưa đủ dữ liệu')}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{isEn ? 'Avg. per day (90 days)' : 'Trung bình/ngày (90 ngày)'}</dt>
                <dd className="font-medium tabular-nums text-slate-900">{d.forecast.sufficientData ? vnd(d.forecast.avgDailyRevenue) : '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{isEn ? `Revenue ${d.year - 1}` : `Doanh thu năm ${d.year - 1}`}</dt>
                <dd className="font-medium tabular-nums text-slate-900">{vnd(d.priorYearRevenue)}</dd>
              </div>
            </dl>
            {message && !showBanner && <p className="mt-3 text-sm text-slate-700">{message}</p>}
          </>
        )}

        <details className="group mt-4 border-t border-slate-100 pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
            <Info className="size-4" aria-hidden /> {isEn ? 'How is this calculated?' : 'Cách tính và lưu ý'}
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
            <li>{isEn
              ? 'Revenue = delivered orders + imported sales history − returns, by Vietnam calendar day.'
              : 'Doanh thu = đơn đã giao + lịch sử bán đã nhập − hàng trả lại, tính theo ngày giờ Việt Nam.'}</li>
            {d.notes.map((note) => <li key={note}>{note}</li>)}
            <li className="flex items-start gap-1.5 list-none -ml-5">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
              {isEn
                ? 'For reference only. StockPilot does not issue e-invoices; confirm your obligations with an accountant or the tax office.'
                : 'Chỉ để tham khảo. StockPilot không phát hành hóa đơn điện tử; hãy xác nhận nghĩa vụ với kế toán hoặc cơ quan thuế.'}
            </li>
          </ul>
        </details>
      </div>
    </section>
  );
}
