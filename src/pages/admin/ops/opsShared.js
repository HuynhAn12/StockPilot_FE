import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorMessage } from '../adminLabels';
import { currentAdminLang } from '../useAdminText';

const en = () => currentAdminLang() === 'en';

/**
 * Tải dữ liệu cho một panel: { data, loading, error, reload }.
 * `loader` được gọi lại mỗi khi `deps` đổi; kết quả cũ bị bỏ qua nếu một lượt tải mới đã bắt đầu.
 */
export function useOpsData(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const requestId = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await loaderRef.current();
      if (id === requestId.current) setState({ data, loading: false, error: '' });
    } catch (err) {
      if (id === requestId.current) setState({ data: null, loading: false, error: apiErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload };
}

export const formatNumber = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? '–'
    : new Intl.NumberFormat(en() ? 'en-US' : 'vi-VN').format(value);

/** 75 → "1 giờ 15 phút" / "1 h 15 min"; null → "–" */
export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '–';
  const E = en();
  const [MIN, HOUR, DAY] = E ? ['min', 'h', 'd'] : ['phút', 'giờ', 'ngày'];
  const m = Math.round(Number(minutes));
  if (m < 60) return `${m} ${MIN}`;
  if (m < 24 * 60) {
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h} ${HOUR} ${rest} ${MIN}` : `${h} ${HOUR}`;
  }
  const d = Math.floor(m / (24 * 60));
  const h = Math.floor((m % (24 * 60)) / 60);
  return h ? `${d} ${DAY} ${h} ${HOUR}` : `${d} ${DAY}`;
}

export function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

export function formatDuration(ms) {
  if (ms === null || ms === undefined) return '–';
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} ${en() ? 's' : 'giây'}`;
  return formatMinutes(ms / 60000);
}

const PRIORITY_VI = { HIGH: 'Cao', NORMAL: 'Bình thường', LOW: 'Thấp' };
const PRIORITY_EN = { HIGH: 'High', NORMAL: 'Normal', LOW: 'Low' };
export const priorityLabel = (p) => (en() ? PRIORITY_EN : PRIORITY_VI)[p] || p;
export const PRIORITY_TONES = { HIGH: 'danger', NORMAL: 'info', LOW: 'neutral' };

const SETTING_VI = {
  'signup.enabled': 'Cho phép cửa hàng tự đăng ký',
  'maintenance.banner': 'Thông báo hệ thống (banner)',
  'ai.dailyQuotaPerStore': 'Hạn mức Trợ lý AI mỗi ngày',
  'tax.eInvoiceRevenueThreshold': 'Ngưỡng doanh thu hóa đơn điện tử',
  'ops.security.loginLockout': 'Khóa đăng nhập tạm thời',
  'ops.support.firstResponseSlaHours': 'SLA phản hồi ticket',
  'ops.payments.pendingAlertMinutes': 'Ngưỡng giao dịch treo',
};
const SETTING_EN = {
  'signup.enabled': 'Allow store self sign-up',
  'maintenance.banner': 'System announcement (banner)',
  'ai.dailyQuotaPerStore': 'Daily AI assistant quota',
  'tax.eInvoiceRevenueThreshold': 'E-invoice revenue threshold',
  'ops.security.loginLockout': 'Temporary login lockout',
  'ops.support.firstResponseSlaHours': 'Ticket response SLA',
  'ops.payments.pendingAlertMinutes': 'Stuck payment threshold',
};
export const settingLabel = (key) => (en() ? SETTING_EN : SETTING_VI)[key] || key;
/** Danh sách khóa cài đặt (giá trị là nhãn tiếng Việt; dùng settingLabel() để hiển thị song ngữ). */
export const SETTING_LABELS = SETTING_VI;

/** Hiển thị giá trị cài đặt ngắn gọn cho bảng lịch sử. */
export function formatSettingValue(key, value) {
  const E = en();
  const ON = E ? 'On' : 'Bật';
  const OFF = E ? 'Off' : 'Tắt';
  if (value === null || value === undefined) return '–';
  if (typeof value === 'boolean') return value ? ON : OFF;
  if (key === 'maintenance.banner') return value.enabled ? `${ON}: "${value.message}"` : OFF;
  if (key === 'ops.security.loginLockout')
    return value.maxAttempts === 0 ? OFF : `${value.maxAttempts} ${E ? 'attempts' : 'lần'} / ${value.windowMinutes} ${E ? 'min' : 'phút'}`;
  if (key === 'ops.support.firstResponseSlaHours')
    return E
      ? `High ${value.HIGH}h · Normal ${value.NORMAL}h · Low ${value.LOW}h`
      : `Cao ${value.HIGH}h · TB ${value.NORMAL}h · Thấp ${value.LOW}h`;
  if (key === 'ops.payments.pendingAlertMinutes') return `${value} ${E ? 'min' : 'phút'}`;
  if (key === 'ai.dailyQuotaPerStore') return value === 0 ? (E ? 'Unlimited' : 'Không giới hạn') : `${value} ${E ? 'requests' : 'lượt'}`;
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/** Khoảng ngày từ preset (7/30/90 ngày) → { from, to } dạng ISO cho API. */
export function rangeFromPreset(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Nút chọn nhanh dạng segmented control, dùng chung cho các bộ lọc. */
export const segmentedButton = (active) =>
  `h-7 px-2.5 text-[13px] font-medium rounded-md transition-colors cursor-pointer tabular-nums ${
    active ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'
  }`;
export const segmentedWrapper = 'inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100';

