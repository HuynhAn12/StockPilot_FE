import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorMessage } from '../adminLabels';

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
  value === null || value === undefined || Number.isNaN(Number(value)) ? '–' : new Intl.NumberFormat('vi-VN').format(value);

/** 75 → "1 giờ 15 phút"; null → "–" */
export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '–';
  const m = Math.round(Number(minutes));
  if (m < 60) return `${m} phút`;
  if (m < 24 * 60) {
    const h = Math.floor(m / 60);
    const rest = m % 60;
    return rest ? `${h} giờ ${rest} phút` : `${h} giờ`;
  }
  const d = Math.floor(m / (24 * 60));
  const h = Math.floor((m % (24 * 60)) / 60);
  return h ? `${d} ngày ${h} giờ` : `${d} ngày`;
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
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} giây`;
  return formatMinutes(ms / 60000);
}

export const PRIORITY_LABELS = { HIGH: 'Cao', NORMAL: 'Bình thường', LOW: 'Thấp' };
export const PRIORITY_TONES = { HIGH: 'danger', NORMAL: 'info', LOW: 'neutral' };

export const SETTING_LABELS = {
  'signup.enabled': 'Cho phép cửa hàng tự đăng ký',
  'maintenance.banner': 'Thông báo hệ thống (banner)',
  'ai.dailyQuotaPerStore': 'Hạn mức Trợ lý AI mỗi ngày',
  'ops.security.loginLockout': 'Khóa đăng nhập tạm thời',
  'ops.support.firstResponseSlaHours': 'SLA phản hồi ticket',
  'ops.payments.pendingAlertMinutes': 'Ngưỡng giao dịch treo',
};

/** Hiển thị giá trị cài đặt ngắn gọn cho bảng lịch sử. */
export function formatSettingValue(key, value) {
  if (value === null || value === undefined) return '–';
  if (typeof value === 'boolean') return value ? 'Bật' : 'Tắt';
  if (key === 'maintenance.banner') return value.enabled ? `Bật: "${value.message}"` : 'Tắt';
  if (key === 'ops.security.loginLockout') return value.maxAttempts === 0 ? 'Tắt' : `${value.maxAttempts} lần / ${value.windowMinutes} phút`;
  if (key === 'ops.support.firstResponseSlaHours') return `Cao ${value.HIGH}h · TB ${value.NORMAL}h · Thấp ${value.LOW}h`;
  if (key === 'ops.payments.pendingAlertMinutes') return `${value} phút`;
  if (key === 'ai.dailyQuotaPerStore') return value === 0 ? 'Không giới hạn' : `${value} lượt`;
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
  `px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors cursor-pointer ${
    active ? 'bg-white text-[#1D4ED8] shadow-xs border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
  }`;
export const segmentedWrapper = 'inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]';
