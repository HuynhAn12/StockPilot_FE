import React, { useMemo, useState } from 'react';
import { BookOpenText, Download, Info, Loader2 } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { apiDownloadRevenueBook } from '../api';
import { useRevenueBookPreview } from '../queries';

const vnd = (n) => (n == null ? '–' : `${new Intl.NumberFormat('vi-VN').format(n)} đ`);
const vnDate = (key) => (key ? key.split('-').reverse().join('/') : '');

// Ngày hôm nay theo giờ Việt Nam (máy người dùng có thể đặt múi giờ khác).
function todayVN() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [y, m] = parts.split('-').map(Number);
  return { year: y, month: m, quarter: Math.ceil(m / 3) };
}

const selectCls = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export function RevenueBookExport({ isEn }) {
  const { toast } = useToast();
  const now = useMemo(todayVN, []);
  const [template, setTemplate] = useState('S1A');
  const [period, setPeriod] = useState('quarter');
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [quarter, setQuarter] = useState(now.quarter);
  const [granularity, setGranularity] = useState('day');
  const [downloading, setDownloading] = useState(false);

  const params = useMemo(() => {
    const p = { template, period, year, granularity };
    if (period === 'month') p.month = month;
    if (period === 'quarter') p.quarter = quarter;
    return p;
  }, [template, period, year, month, quarter, granularity]);

  const preview = useRevenueBookPreview(params);
  const years = Array.from({ length: 6 }, (_, i) => now.year - i);
  const isFutureMonth = (m) => year === now.year && m > now.month;
  const isFutureQuarter = (q) => year === now.year && q > now.quarter;

  const changeYear = (y) => {
    setYear(y);
    // Đổi về năm hiện tại mà đang chọn tháng/quý tương lai → kéo về kỳ hiện tại.
    if (y === now.year) {
      setMonth((m) => Math.min(m, now.month));
      setQuarter((q) => Math.min(q, now.quarter));
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const fileName = await apiDownloadRevenueBook(params);
      toast({ type: 'success', title: isEn ? 'Revenue book downloaded' : 'Đã tải sổ doanh thu', message: fileName });
    } catch (err) {
      toast({
        type: 'error',
        title: isEn ? 'Could not export the revenue book' : 'Không xuất được sổ doanh thu',
        message: err?.response?.data?.error?.message || (isEn ? 'Please try again.' : 'Vui lòng thử lại.'),
      });
    } finally {
      setDownloading(false);
    }
  };

  const previewError = preview.isError ? (preview.error?.response?.data?.error?.message || (isEn ? 'Could not load the preview.' : 'Không tải được bản xem trước.')) : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]" aria-labelledby="revenue-book-title">
      <div className="mb-4 space-y-1">
        <h2 id="revenue-book-title" className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <BookOpenText className="size-4 text-slate-500" aria-hidden />
          {isEn ? 'Revenue book for household businesses' : 'Sổ doanh thu cho hộ kinh doanh'}
        </h2>
        <p className="text-sm text-slate-500">
          {isEn
            ? 'Export the sales revenue book (forms S1a-HKD / S2a-HKD, Circular 152/2025/TT-BTC) as a CSV file that opens in Excel.'
            : 'Xuất sổ doanh thu bán hàng (mẫu S1a-HKD / S2a-HKD, Thông tư 152/2025/TT-BTC) ra file CSV mở được bằng Excel.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="rb-template" className={labelCls}>{isEn ? 'Form' : 'Mẫu sổ'}</label>
          <select id="rb-template" className={selectCls} value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="S1A">{isEn ? 'S1a-HKD — not paying VAT/PIT' : 'S1a-HKD — hộ không phải nộp thuế GTGT, TNCN'}</option>
            <option value="S2A">{isEn ? 'S2a-HKD — tax on revenue' : 'S2a-HKD — hộ nộp thuế theo doanh thu'}</option>
          </select>
        </div>
        <div>
          <label htmlFor="rb-period" className={labelCls}>{isEn ? 'Period' : 'Kỳ'}</label>
          <select id="rb-period" className={selectCls} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="month">{isEn ? 'Month' : 'Tháng'}</option>
            <option value="quarter">{isEn ? 'Quarter' : 'Quý'}</option>
            <option value="year">{isEn ? 'Year' : 'Năm'}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {period !== 'year' && (
            <div>
              <label htmlFor="rb-sub" className={labelCls}>{period === 'month' ? (isEn ? 'Month' : 'Tháng') : (isEn ? 'Quarter' : 'Quý')}</label>
              {period === 'month' ? (
                <select id="rb-sub" className={selectCls} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} disabled={isFutureMonth(m)}>{m}</option>
                  ))}
                </select>
              ) : (
                <select id="rb-sub" className={selectCls} value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q} disabled={isFutureQuarter(q)}>{q}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className={period === 'year' ? 'col-span-2' : ''}>
            <label htmlFor="rb-year" className={labelCls}>{isEn ? 'Year' : 'Năm'}</label>
            <select id="rb-year" className={selectCls} value={year} onChange={(e) => changeYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="rb-granularity" className={labelCls}>{isEn ? 'One line per' : 'Mỗi dòng là'}</label>
          <select id="rb-granularity" className={selectCls} value={granularity} onChange={(e) => setGranularity(e.target.value)}>
            <option value="day">{isEn ? 'Day (summary)' : 'Một ngày (tổng hợp)'}</option>
            <option value="order">{isEn ? 'Order / return' : 'Một đơn / phiếu trả'}</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
        {previewError ? (
          <p role="alert" className="text-sm text-red-700">{previewError}</p>
        ) : preview.isPending ? (
          <div className="h-10 w-64 animate-pulse rounded bg-slate-200" aria-busy="true" />
        ) : (
          <div className="text-sm text-slate-700">
            <p className="font-medium text-slate-900">
              {preview.data.periodLabel}
              {preview.data.partialUntil && (
                <span className="ml-1 font-normal text-amber-700">
                  — {isEn ? 'provisional to' : 'tạm tính đến'} {vnDate(preview.data.partialUntil)}
                </span>
              )}
            </p>
            <p className="tabular-nums">
              {isEn ? 'Total' : 'Tổng doanh thu'}: <span className="font-semibold text-slate-900">{vnd(preview.data.total)}</span>
              {' · '}{preview.data.lineCount} {isEn ? 'lines' : 'dòng'}
              {preview.data.breakdown.returns > 0 && <> · {isEn ? 'returns' : 'hàng trả'} −{vnd(preview.data.breakdown.returns)}</>}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={download}
          disabled={downloading || preview.isError}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
          {downloading ? (isEn ? 'Exporting…' : 'Đang xuất…') : (isEn ? 'Download CSV' : 'Tải file CSV')}
        </button>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {isEn
          ? 'Includes delivered orders, imported sales history and returns recorded in StockPilot. Tax rates and tax amounts on S2a-HKD are left blank for your accountant. This book does not replace e-invoices.'
          : 'Gồm đơn đã giao, lịch sử bán đã nhập và hàng trả lại ghi nhận trên StockPilot. Tỷ lệ % và số thuế ở mẫu S2a-HKD để trống cho kế toán xác định. Sổ này không thay thế hóa đơn điện tử.'}
      </p>
    </section>
  );
}
