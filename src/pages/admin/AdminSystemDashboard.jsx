import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import {
  RefreshCw,
  UserPlus,
  Download,
  Loader2,
  Store,
  LifeBuoy,
  UserCheck,
  Activity,
  ShieldAlert,
  AlertTriangle,
  Database,
  Mail,
  ImageIcon,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Server,
  KeyRound,
  Users,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../store/authStore';
import { usePolling } from '../../components/support/SupportChat';
import { useTranslation } from '../../i18n/useTranslation';
import {
  apiGetAdminDashboard,
  apiGetAdminActivityTrend,
  apiGetAdminSystemConfig,
  apiGetAdminSystemHealth,
  apiListAdminLeads,
  apiExportAdminAuditLogs,
  apiCreateAdminUser,
  formatVNDateTime,
} from '../../services/adminService';
import { apiAdminListTickets } from '../../services/supportService';
import { actionLabel, apiErrorMessage, formatRelativeTime, isSensitiveAction, roleLabel } from './adminLabels';
import { adminStyles as ui } from './adminStyles';
import { StatCard, Avatar, Modal } from './components/AdminUI';

/**
 * Phân cấp mức độ cảnh báo đồng bộ với LEVEL_CONFIG
 * danger: Mất kết nối DB, lỗi 500, khóa JWT mặc định
 * warning: Chưa cấu hình SMTP/Cloudinary, khách chờ > 24h
 * info: Shop lâu không đăng nhập, ticket chờ xử lý, khách mới
 */
const LEVEL_CONFIG = {
  danger: {
    border: 'border-l-4 border-l-red-500',
    badge: 'bg-red-50 text-red-700 ring-red-600/20',
    iconBg: 'bg-red-50 text-red-600',
    tagVi: 'Khẩn cấp',
    tagEn: 'Critical',
    priority: 1,
  },
  warning: {
    border: 'border-l-4 border-l-amber-500',
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    iconBg: 'bg-amber-50 text-amber-700',
    tagVi: 'Cần chú ý',
    tagEn: 'Warning',
    priority: 2,
  },
  info: {
    border: 'border-l-4 border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    iconBg: 'bg-blue-50 text-blue-600',
    tagVi: 'Thông tin',
    tagEn: 'Info',
    priority: 3,
  },
};

/**
 * Xây dựng danh sách cảnh báo từ dữ liệu API thực tế
 * Đảm bảo phân định rõ:
 * - danger: DB disconnect, 5xx server errors, default JWT
 * - warning: Cloudinary/SMTP not configured, leads waiting > 24h
 * - info: inactive/idle stores, pending support tickets, new leads
 */
function buildAttention({ data, config, health, leads, support }, isEn) {
  const items = [];

  // 1. DANGER: MySQL connection
  if (health && health.database?.status !== 'UP') {
    items.push({
      level: 'danger',
      icon: Database,
      title: isEn ? 'MySQL Database Connection Lost' : 'Mất kết nối cơ sở dữ liệu MySQL',
      detail: isEn
        ? 'Stores cannot process sales or record transactions until MySQL server is back online.'
        : 'Cửa hàng không thể bán hàng và ghi nhận dữ liệu cho tới khi máy chủ MySQL hoạt động lại.',
      to: '/admin/system',
      action: isEn ? 'View Health' : 'Xem sức khỏe',
    });
  }

  // 2. DANGER: 5xx server errors in last 24h
  if (health?.http?.serverErrors > 0) {
    items.push({
      level: 'danger',
      icon: AlertTriangle,
      title: isEn
        ? `${health.http.serverErrors} server errors (5xx) in the past 24 hours`
        : `${health.http.serverErrors} lỗi máy chủ (5xx) trong 24 giờ qua`,
      detail: isEn
        ? 'Review recent error logs and request IDs to diagnose the root cause.'
        : 'Xem danh sách lỗi gần đây và mã tra cứu requestId để tìm nguyên nhân.',
      to: '/admin/system',
      action: isEn ? 'View Errors' : 'Xem mã lỗi',
    });
  }

  // 3. DANGER: Default JWT Secrets
  if (config?.auth?.usingDefaultJwtSecrets) {
    items.push({
      level: 'danger',
      icon: ShieldAlert,
      title: isEn
        ? 'JWT Authentication Secrets are using default fallback values'
        : 'Khóa bảo mật đăng nhập JWT đang dùng giá trị mặc định',
      detail: isEn
        ? 'Configure secure JWT_SECRET and JWT_REFRESH_SECRET in your server .env file.'
        : 'Cần đặt biến JWT_SECRET và JWT_REFRESH_SECRET an toàn trong file .env của máy chủ.',
      to: '/admin/system',
      action: isEn ? 'View Config' : 'Xem cấu hình',
    });
  }

  // 4. WARNING: Email SMTP unconfigured
  if (config && !config.integrations?.smtp?.configured) {
    items.push({
      level: 'warning',
      icon: Mail,
      title: isEn ? 'Email SMTP Server not configured' : 'Chưa cấu hình máy chủ gửi email (SMTP)',
      detail: isEn
        ? 'Users will not receive OTP authentication codes during registration or password recovery.'
        : 'Người dùng sẽ không nhận được mã xác thực OTP khi đăng ký hoặc quên mật khẩu.',
      to: '/admin/system',
      action: isEn ? 'View Config' : 'Xem cấu hình',
    });
  }

  // 5. WARNING: Cloudinary unconfigured
  if (config && !config.integrations?.cloudinary?.configured) {
    items.push({
      level: 'warning',
      icon: ImageIcon,
      title: isEn ? 'Cloudinary Media Storage not configured' : 'Chưa cấu hình dịch vụ lưu trữ ảnh (Cloudinary)',
      detail: isEn
        ? 'Stores will not be able to upload product photos and ticket attachments.'
        : 'Cửa hàng sẽ không tải được ảnh sản phẩm và ảnh đính kèm lên hệ thống.',
      to: '/admin/system',
      action: isEn ? 'View Config' : 'Xem cấu hình',
    });
  }

  // 6. WARNING: Leads waiting > 24h
  if (leads?.waitingOver24h > 0) {
    items.push({
      level: 'warning',
      icon: UserCheck,
      title: isEn
        ? `${leads.waitingOver24h} inbound leads waiting over 24 hours`
        : `${leads.waitingOver24h} khách tiềm năng chờ quá 24 giờ`,
      detail: isEn
        ? 'Phone numbers submitted on landing page have not been contacted by sales yet.'
        : 'Họ đã để lại số điện thoại trên trang chủ nhưng chưa có nhân viên gọi lại.',
      to: '/admin/leads',
      action: isEn ? 'Contact Lead' : 'Gọi khách ngay',
    });
  }

  // 7. INFO: Support tickets pending / unread
  if (support?.unread > 0) {
    items.push({
      level: 'info',
      icon: LifeBuoy,
      title: isEn
        ? `${support.unread} support tickets have new unread messages`
        : `${support.unread} yêu cầu hỗ trợ có tin nhắn mới`,
      detail: isEn
        ? 'Stores are waiting for technical support team response.'
        : 'Cửa hàng đang chờ đội ngũ hỗ trợ kỹ thuật phản hồi.',
      to: '/admin/support',
      action: isEn ? 'Reply Now' : 'Trả lời ngay',
    });
  }

  // 8. INFO: New leads
  if (!leads?.waitingOver24h && leads?.NEW > 0) {
    items.push({
      level: 'info',
      icon: UserCheck,
      title: isEn ? `${leads.NEW} new inbound leads` : `${leads.NEW} khách tiềm năng mới`,
      detail: isEn
        ? 'Just registered for consulting on the landing page.'
        : 'Vừa đăng ký nhận tư vấn mở cửa hàng trên trang chủ.',
      to: '/admin/leads',
      action: isEn ? 'View Leads' : 'Xem khách',
    });
  }

  // 9. INFO: Idle stores
  const idle = data?.growth?.idleStores ?? [];
  if (idle.length > 0) {
    items.push({
      level: 'info',
      icon: Clock,
      title: isEn
        ? idle.length === 1
          ? `${idle[0].name} has not signed in for ${idle[0].daysIdle} days`
          : `${idle.length} stores inactive for 14+ days`
        : idle.length === 1
        ? `${idle[0].name} không đăng nhập ${idle[0].daysIdle} ngày`
        : `${idle.length} cửa hàng không đăng nhập từ 14 ngày trở lên`,
      detail: isEn
        ? 'Reach out proactively before subscription lapse or churn occurs.'
        : 'Nên liên hệ hỏi thăm trước khi cửa hàng ngừng gia hạn dịch vụ.',
      to: '/admin/stores',
      action: isEn ? 'View Stores' : 'Xem cửa hàng',
    });
  }

  // 10. INFO: Locked stores
  if (data?.stores?.inactive > 0) {
    items.push({
      level: 'info',
      icon: Store,
      title: isEn
        ? `${data.stores.inactive} stores are currently locked`
        : `${data.stores.inactive} cửa hàng đang tạm khóa`,
      detail: isEn
        ? 'Re-activate when payment is renewed or compliance violation is cleared.'
        : 'Mở lại khi cửa hàng đã gia hạn dịch vụ hoặc khắc phục xong vi phạm.',
      to: '/admin/stores',
      action: isEn ? 'View Stores' : 'Xem cửa hàng',
    });
  }

  // Sắp xếp ưu tiên: danger -> warning -> info
  return items.sort((a, b) => LEVEL_CONFIG[a.level].priority - LEVEL_CONFIG[b.level].priority);
}

/**
 * Gom nhóm các sự kiện trùng lặp liên tiếp của cùng 1 đối tượng
 * Kết quả: [Đối tượng]: X lần [Hành động] liên tiếp (thời gian gần nhất)
 */
function aggregateConsecutiveLogs(logs) {
  if (!logs || logs.length === 0) return [];
  const aggregated = [];

  for (const log of logs) {
    const actorKey = log.user?.id ? `u-${log.user.id}` : (log.user?.fullName || 'system');
    const actionKey = log.action || 'UNKNOWN';
    const storeKey = log.store?.id ? `s-${log.store.id}` : 'no-store';
    const groupKey = `${actorKey}:${actionKey}:${storeKey}`;

    const prev = aggregated[aggregated.length - 1];
    if (prev && prev.groupKey === groupKey) {
      prev.count += 1;
    } else {
      aggregated.push({
        ...log,
        groupKey,
        count: 1,
        latestTime: log.createdAt,
      });
    }
  }

  return aggregated;
}

function greeting(name, isEn) {
  const h = new Date().getHours();
  const part = isEn
    ? h < 12
      ? 'Good morning'
      : h < 18
      ? 'Good afternoon'
      : 'Good evening'
    : h < 11
    ? 'Chào buổi sáng'
    : h < 14
    ? 'Chào buổi trưa'
    : h < 18
    ? 'Chào buổi chiều'
    : 'Chào buổi tối';
  const fullName = String(name || '').replace(/\(.*?\)/g, '').trim();
  return fullName ? `${part}, ${fullName}` : part;
}

function todayLabel(isEn) {
  const s = new Date().toLocaleDateString(isEn ? 'en-US' : 'vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Biểu đồ xu hướng hoạt động tương tác (SVG thuần B2B SaaS, không dependency ngoài)
 */
function ActivityTrendChart({ trendData, daysRange, onChangeRange, isEn, loading }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const days = trendData?.days ?? [];
  const summary = trendData?.summary ?? {
    totalEvents: 0,
    averageDailyEvents: 0,
    peakEvents: 0,
    peakDate: null,
    activeStoresWindow: 0,
  };

  // Dimensions
  const W = 640;
  const H = 200;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  const maxVal = useMemo(() => {
    if (!days.length) return 10;
    const peak = Math.max(...days.map((d) => Math.max(d.auditEvents, d.activeStores)), 5);
    return Math.ceil(peak * 1.15);
  }, [days]);

  const points = useMemo(() => {
    if (!days.length) return [];
    return days.map((d, i) => {
      const x = padLeft + (i / Math.max(days.length - 1, 1)) * plotW;
      const yAudit = padTop + plotH - (d.auditEvents / maxVal) * plotH;
      const yStores = padTop + plotH - (d.activeStores / maxVal) * plotH;
      return { x, yAudit, yStores, ...d };
    });
  }, [days, maxVal, plotW, plotH, padLeft, padTop]);

  // SVG Area path for audit events
  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const lineCommands = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yAudit.toFixed(1)}`).join(' ');
    const lastX = points[points.length - 1].x.toFixed(1);
    const firstX = points[0].x.toFixed(1);
    const bottomY = (padTop + plotH).toFixed(1);
    return `${lineCommands} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [points, padTop, plotH]);

  // SVG Stroke path for audit events
  const linePathAudit = useMemo(() => {
    if (!points.length) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yAudit.toFixed(1)}`).join(' ');
  }, [points]);

  // SVG Stroke path for active stores
  const linePathStores = useMemo(() => {
    if (!points.length) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yStores.toFixed(1)}`).join(' ');
  }, [points]);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  const activeHover = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <div className={`${ui.card} p-5 space-y-4`}>
      {/* Header card with metrics toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            {isEn ? 'Platform Activity & Trend' : 'Hoạt động nền tảng & Xu hướng'}
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {isEn
              ? 'Real-time audit events and active shops from MySQL ledger'
              : 'Dữ liệu thao tác kiểm toán và số shop hoạt động từ cơ sở dữ liệu'}
          </p>
        </div>

        {/* Range Selector Pill */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onChangeRange(7)}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-md transition-colors ${
              daysRange === 7
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isEn ? '7 Days' : '7 ngày'}
          </button>
          <button
            type="button"
            onClick={() => onChangeRange(14)}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-md transition-colors ${
              daysRange === 14
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isEn ? '14 Days' : '14 ngày'}
          </button>
        </div>
      </div>

      {/* Summary strip with real KPI metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-[12px]">
        <div>
          <span className="text-slate-500 block">{isEn ? 'Total Events' : 'Tổng thao tác'}</span>
          <span className="text-[16px] font-semibold tabular-nums text-slate-900">
            {summary.totalEvents.toLocaleString(isEn ? 'en-US' : 'vi-VN')}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{isEn ? 'Daily Average' : 'Trung bình/ngày'}</span>
          <span className="text-[16px] font-semibold tabular-nums text-slate-900">
            {summary.averageDailyEvents.toLocaleString(isEn ? 'en-US' : 'vi-VN')}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{isEn ? 'Peak Volume' : 'Ngày cao điểm'}</span>
          <span className="text-[16px] font-semibold tabular-nums text-slate-900 truncate">
            {summary.peakDate ? (
              <>
                {summary.peakEvents} <span className="text-[11px] font-normal text-slate-500">({formatDateLabel(summary.peakDate)})</span>
              </>
            ) : (
              '–'
            )}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{isEn ? 'Active Shops in Period' : 'Shop có hoạt động'}</span>
          <span className="text-[16px] font-semibold tabular-nums text-emerald-600">
            {summary.activeStoresWindow} {isEn ? 'shops' : 'cửa hàng'}
          </span>
        </div>
      </div>

      {/* SVG Chart Area */}
      {loading ? (
        <div className="h-[200px] flex items-center justify-center bg-slate-50/50 rounded-lg">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            {isEn ? 'Loading activity trend...' : 'Đang tải xu hướng hoạt động...'}
          </div>
        </div>
      ) : days.length === 0 ? (
        <div className="h-[200px] flex flex-col items-center justify-center bg-slate-50/50 rounded-lg text-slate-400">
          <Activity className="w-6 h-6 mb-1 text-slate-300" />
          <p className="text-[13px]">{isEn ? 'No trend data recorded yet' : 'Chưa có dữ liệu hoạt động trong kỳ'}</p>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-[200px] overflow-visible select-none"
            aria-label={isEn ? 'Activity trend chart' : 'Biểu đồ xu hướng hoạt động'}
          >
            <defs>
              <linearGradient id="auditAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.5, 1].map((pct, idx) => {
              const y = padTop + plotH * (1 - pct);
              const val = Math.round(maxVal * pct);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={W - padRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray={idx === 0 ? '' : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            {areaPath && <path d={areaPath} fill="url(#auditAreaGrad)" />}

            {/* Audit Line */}
            {linePathAudit && (
              <path
                d={linePathAudit}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Active Stores Line */}
            {linePathStores && (
              <path
                d={linePathStores}
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points & Hover Guides */}
            {points.map((p, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <g key={idx}>
                  {/* X Axis Label */}
                  <text
                    x={p.x}
                    y={H - 8}
                    textAnchor="middle"
                    className={`text-[10px] font-mono ${isHovered ? 'fill-blue-600 font-semibold' : 'fill-slate-400'}`}
                  >
                    {formatDateLabel(p.date)}
                  </text>

                  {/* Vertical Hover Line */}
                  {isHovered && (
                    <line
                      x1={p.x}
                      y1={padTop}
                      x2={p.x}
                      y2={padTop + plotH}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Dot for Audit Events */}
                  <circle
                    cx={p.x}
                    cy={p.yAudit}
                    r={isHovered ? 4.5 : 2.5}
                    fill={isHovered ? '#1d4ed8' : '#2563eb'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />

                  {/* Dot for Active Stores */}
                  <circle
                    cx={p.x}
                    cy={p.yStores}
                    r={isHovered ? 3.5 : 2}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />

                  {/* Invisible Hitbox for Mouse Events */}
                  <rect
                    x={p.x - plotW / days.length / 2}
                    y={0}
                    width={plotW / days.length}
                    height={H}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip */}
          {activeHover && (
            <div
              className="absolute z-20 pointer-events-none bg-slate-900 text-white rounded-lg p-2.5 shadow-lg text-[11px] space-y-1 transition-all duration-100"
              style={{
                left: Math.min(Math.max(activeHover.x - 70, 10), W - 160),
                top: Math.max(activeHover.yAudit - 75, 10),
              }}
            >
              <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1">
                {activeHover.date}
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {isEn ? 'Audit Events' : 'Sự kiện kiểm toán'}:
                </span>
                <span className="font-semibold tabular-nums text-white">{activeHover.auditEvents}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {isEn ? 'Active Stores' : 'Cửa hàng hoạt động'}:
                </span>
                <span className="font-semibold tabular-nums text-white">{activeHover.activeStores}</span>
              </div>
              {activeHover.failedLogins > 0 && (
                <div className="flex items-center justify-between gap-4 text-red-300">
                  <span>{isEn ? 'Failed Logins' : 'Đăng nhập sai'}:</span>
                  <span className="font-semibold tabular-nums">{activeHover.failedLogins}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2 text-[12px] text-slate-600 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
          {isEn ? 'Audit Events' : 'Thao tác kiểm toán'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-600 rounded-full border-t border-dashed" />
          {isEn ? 'Active Stores' : 'Cửa hàng hoạt động'}
        </span>
      </div>
    </div>
  );
}

/**
 * Một dòng trạng thái hạ tầng. `state`: 'ok' | 'bad' | null — null nghĩa là chưa có dữ liệu
 * (đang tải hoặc gọi API lỗi) và hiển thị "–", không bao giờ suy đoán thành "ổn" hay "hỏng".
 */
function InfraRow({ icon: Icon, label, state, okText, badText, badTone = 'warning', value, isEn }) {
  const TONE = {
    ok: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/20',
  };
  const unknown = value === undefined ? state == null : value == null;
  return (
    <div className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100">
      <span className="text-slate-600 flex items-center gap-2 min-w-0">
        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      {unknown ? (
        <span className="text-[12px] text-slate-400" title={isEn ? 'Status unavailable' : 'Chưa có dữ liệu'}>
          –
        </span>
      ) : value !== undefined ? (
        <span className="text-[13px] font-medium tabular-nums text-slate-900">{value}</span>
      ) : (
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ring-1 ring-inset ${state === 'ok' ? TONE.ok : TONE[badTone]}`}>
          {state === 'ok' ? okText : badText}
        </span>
      )}
    </div>
  );
}

/**
 * Modal tạo tài khoản Quản trị viên hệ thống
 */
function CreateAdminDialog({ onClose, onCreated }) {
  const { toast } = useToast();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [form, setForm] = useState({ fullName: '', email: '', password: '', actorPassword: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({
        type: 'warning',
        title: isEn ? 'Password too short' : 'Mật khẩu quá ngắn',
        description: isEn ? 'New password requires at least 8 characters.' : 'Mật khẩu mới cần ít nhất 8 ký tự.',
      });
      return;
    }
    setBusy(true);
    try {
      await apiCreateAdminUser(form);
      toast({
        type: 'success',
        title: isEn ? 'Administrator created successfully' : 'Đã tạo quản trị viên',
        description: isEn ? `${form.email} can now sign in immediately.` : `${form.email} có thể đăng nhập ngay.`,
      });
      onCreated();
    } catch (err) {
      toast({
        type: 'error',
        title: isEn ? 'Failed to create administrator' : 'Không tạo được tài khoản',
        description: apiErrorMessage(err),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isEn ? 'Create System Administrator' : 'Tạo tài khoản Quản trị viên'}
      description={
        isEn
          ? 'Administrators have full operational control over all stores, user accounts, and platform configurations.'
          : 'Tài khoản Quản trị viên có toàn quyền kiểm soát nền tảng, quản lý mọi người dùng và cửa hàng.'
      }
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            {isEn ? 'Cancel' : 'Hủy'}
          </button>
          <button type="submit" form="create-admin-dialog-form" disabled={busy} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEn ? 'Create Account' : 'Tạo tài khoản'}
          </button>
        </>
      }
    >
      <form id="create-admin-dialog-form" onSubmit={submit} className="space-y-4" autoComplete="off">
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
            {isEn ? 'Full Name' : 'Họ và tên'}
          </label>
          <input
            type="text"
            required
            autoComplete="off"
            placeholder={isEn ? 'e.g. John Doe' : 'Ví dụ: Nguyễn Văn An'}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={ui.input}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
            {isEn ? 'Login Email' : 'Email đăng nhập'}
          </label>
          <input
            type="email"
            required
            autoComplete="off"
            placeholder="admin@stockpilot.vn"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={ui.input}
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
            {isEn ? 'Initial Password' : 'Mật khẩu ban đầu'}
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder={isEn ? 'Minimum 8 characters' : 'Tối thiểu 8 ký tự'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={ui.input}
          />
        </div>
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
            {isEn ? 'Your Confirmation Password' : 'Mật khẩu xác nhận của bạn'}
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder={isEn ? 'Enter your current password to authenticate' : 'Nhập mật khẩu của bạn để xác thực'}
            value={form.actorPassword}
            onChange={(e) => setForm({ ...form, actorPassword: e.target.value })}
            className={ui.input}
          />
          <span className="block text-[12px] text-slate-500 mt-1.5 font-normal">
            {isEn
              ? 'Granting administrator privileges requires re-authenticating with your current password.'
              : 'Thao tác cấp quyền quản trị yêu cầu bạn nhập lại mật khẩu hiện tại.'}
          </span>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Trang Admin System Dashboard nâng cấp chuẩn sản xuất
 */
export function AdminSystemDashboard() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const navigate = useNavigate();
  const isEn = language === 'en';

  const [state, setState] = useState({
    data: null,
    config: null,
    health: null,
    leads: null,
    support: null,
  });
  const [trendState, setTrendState] = useState({
    data: null,
    days: 14,
    loading: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [quickSearch, setQuickSearch] = useState('');

  // Tải dữ liệu xu hướng hoạt động
  const loadTrend = useCallback(async (days = 14) => {
    setTrendState((prev) => ({ ...prev, loading: true, days }));
    try {
      const res = await apiGetAdminActivityTrend({ days });
      setTrendState({ data: res, days, loading: false });
    } catch {
      setTrendState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Tải toàn bộ chỉ số tổng quan
  const load = useCallback(async () => {
    setLoadError(null);
    const [data, config, health, leads, support] = await Promise.allSettled([
      apiGetAdminDashboard(),
      apiGetAdminSystemConfig(),
      apiGetAdminSystemHealth(),
      apiListAdminLeads({ limit: 1 }),
      apiAdminListTickets({ limit: 1 }),
    ]);

    if (data.status === 'rejected') {
      const errMsg = apiErrorMessage(data.reason);
      setLoadError(errMsg);
      toast({
        type: 'error',
        title: isEn ? 'Failed to load dashboard metrics' : 'Không tải được số liệu tổng quan',
        description: errMsg,
      });
    }

    const value = (r) => (r.status === 'fulfilled' ? r.value : null);
    setState({
      data: value(data),
      config: value(config),
      health: value(health),
      leads: value(leads)?.summary ?? null,
      support: value(support)?.summary ?? null,
    });
    setLastSyncTime(
      new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    setIsLoading(false);
  }, [toast, isEn]);

  useEffect(() => {
    load();
    loadTrend(14);
  }, [load, loadTrend]);

  usePolling(() => {
    load();
    loadTrend(trendState.days);
  }, 60000);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await apiExportAdminAuditLogs({});
      toast({
        type: 'success',
        title: isEn ? 'Audit log exported successfully' : 'Đã xuất nhật ký kiểm toán',
        description: isEn ? 'CSV file has been downloaded to your computer.' : 'File CSV đã được tải xuống máy.',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: isEn ? 'Failed to export audit log' : 'Không xuất được nhật ký',
        description: apiErrorMessage(err),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    const q = quickSearch.trim();
    if (!q) return;
    navigate(`/admin/stores?q=${encodeURIComponent(q)}`);
  };

  const { data, health, config, leads, support } = state;
  const attention = useMemo(() => buildAttention(state, isEn), [state, isEn]);
  const stores = data?.stores ?? { total: 0, active: 0, inactive: 0 };
  const idleStores = data?.growth?.idleStores ?? [];
  const rawAuditLogs = data?.recentAuditLogs ?? [];
  const aggregatedLogs = useMemo(() => aggregateConsecutiveLogs(rawAuditLogs), [rawAuditLogs]);
  const openTickets = support ? support.OPEN + support.IN_PROGRESS + support.WAITING_STORE : 0;

  // null = chưa biết (đang tải hoặc API lỗi) — không được hiển thị như "ổn" hay "hỏng".
  const isHealthy = !health || !config ? null : health.database?.status === 'UP' && !config.auth?.usingDefaultJwtSecrets;
  // Không có số liệu sức khỏe/cấu hình thì "không có cảnh báo" KHÔNG có nghĩa là hệ thống ổn.
  const statusUnknown = !isLoading && isHealthy === null;

  return (
    <div className="w-full space-y-6 pb-16 text-slate-700">
      {/* ─── 1. TOP HEADER ──────────────────────────────────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-slate-900 leading-tight">
              {greeting(user?.fullName, isEn)}
            </h1>
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-white border border-slate-200 text-[12px] text-slate-600 shadow-2xs">
              <span
                className={`inline-flex rounded-full h-1.5 w-1.5 ${isHealthy === null ? 'bg-slate-300' : isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}
                aria-hidden="true"
              />
              <span className="tabular-nums">
                {lastSyncTime
                  ? `${isEn ? 'Synced at' : 'Đồng bộ lúc'} ${lastSyncTime}`
                  : isEn ? 'Real-time' : 'Thời gian thực'}
              </span>
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] text-slate-500 max-w-[70ch]">
            {todayLabel(isEn)} ·{' '}
            {attention.length > 0
              ? isEn
                ? `${attention.length} issues require operational attention`
                : `Hiện có ${attention.length} vấn đề cần lưu ý xử lý`
              : statusUnknown
              ? isEn
                ? 'System status could not be checked — refresh to try again'
                : 'Chưa kiểm tra được trạng thái hệ thống — bấm Làm mới để thử lại'
              : isEn
              ? 'All infrastructure and services are operating normally'
              : 'Toàn bộ hạ tầng và dịch vụ đang vận hành ổn định'}
          </p>
        </div>

        {/* Top Actions: Quick Search, Refresh, Export, Add Admin */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Quick Search */}
          <form onSubmit={handleQuickSearch} className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder={isEn ? 'Search store, code... ↵' : 'Tìm shop, mã shop... ↵'}
              className="w-full pl-8.5 pr-3 py-1.5 h-9 text-[13px] rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
            />
          </form>

          {/* Làm mới dữ liệu */}
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              load();
              loadTrend(trendState.days);
            }}
            disabled={isLoading}
            className={ui.btnSecondary}
            title={isEn ? 'Refresh metrics' : 'Làm mới số liệu'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline">{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>

          {/* Xuất báo cáo / nhật ký */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={ui.btnSecondary}
            title={isEn ? 'Export Audit Logs' : 'Xuất nhật ký kiểm toán'}
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{isEn ? 'Export Logs' : 'Xuất nhật ký'}</span>
          </button>

          {/* Thao tác phụ: Tạo quản trị viên */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={ui.btnSecondary}
            title={isEn ? 'Create System Administrator' : 'Tạo tài khoản Quản trị viên'}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
            <span>{isEn ? 'Add Admin' : 'Thêm Admin'}</span>
          </button>
        </div>
      </header>

      {/* ─── 2. ERROR STATE NẾU API THẤT BẠI ────────────────────────────── */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-slate-900">
                {isEn ? 'Failed to Load Dashboard Data' : 'Không tải được số liệu tổng quan'}
              </h3>
              <p className="text-[13px] text-slate-600 mt-0.5">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              load();
              loadTrend(trendState.days);
            }}
            className={ui.btnPrimary}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isEn ? 'Retry Now' : 'Thử lại ngay'}
          </button>
        </div>
      )}

      {/* ─── 3. 4 THẺ CHỈ SỐ KPI CHÍNH ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={isEn ? 'Active Stores' : 'Cửa hàng hoạt động'}
          value={`${stores.active} / ${stores.total}`}
          subtitle={
            idleStores.length
              ? isEn
                ? `${idleStores.length} low-activity shops`
                : `${idleStores.length} shop ít đăng nhập`
              : isEn
              ? 'All stores active'
              : 'Tất cả hoạt động đều'
          }
          icon={Store}
          iconBg="bg-slate-100 text-slate-600"
          alert={idleStores.length > 0}
          to="/admin/stores"
          loading={isLoading}
        />
        <StatCard
          title={isEn ? 'New Inbound Leads' : 'Khách tiềm năng mới'}
          value={leads?.NEW ?? 0}
          subtitle={
            leads?.waitingOver24h
              ? isEn
                ? `${leads.waitingOver24h} leads waiting > 24h`
                : `${leads.waitingOver24h} khách chờ > 24h`
              : isEn
              ? `Total ${leads?.total ?? 0} leads`
              : `Tổng ${leads?.total ?? 0} khách`
          }
          icon={UserCheck}
          iconBg="bg-slate-100 text-slate-600"
          alert={leads?.waitingOver24h > 0}
          to="/admin/leads"
          loading={isLoading}
        />
        <StatCard
          title={isEn ? 'Open Support Tickets' : 'Yêu cầu hỗ trợ mở'}
          value={openTickets}
          subtitle={
            support?.unread
              ? isEn
                ? `${support.unread} new unread replies`
                : `${support.unread} tin nhắn mới chưa đọc`
              : isEn
              ? 'All queues healthy'
              : 'Đang xử lý ổn thỏa'
          }
          icon={LifeBuoy}
          iconBg="bg-slate-100 text-slate-600"
          alert={support?.unread > 0}
          to="/admin/support"
          loading={isLoading}
        />
        <StatCard
          title={isEn ? "Today's Audit Events" : 'Thao tác hôm nay'}
          value={(data?.auditEventsToday ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
          subtitle={isEn ? 'Recorded audit events' : 'Sự kiện kiểm toán ghi nhận'}
          icon={Activity}
          iconBg="bg-slate-100 text-slate-600"
          to="/admin/audit-log"
          loading={isLoading}
        />
      </div>

      {/* ─── 4. BỐ CỤC TÁI CÂN BẰNG: CỘT CHÍNH (8) VÀ CỘT PHỤ (4) ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── CỘT CHÍNH: BIỂU ĐỒ XU HƯỚNG + BẢNG NHẬT KÝ ĐÃ GOM NHÓM (8 cols) ── */}
        <div className="xl:col-span-8 space-y-6">
          {/* 4.1 Biểu đồ trực quan xu hướng hoạt động */}
          <ActivityTrendChart
            trendData={trendState.data}
            daysRange={trendState.days}
            onChangeRange={(d) => loadTrend(d)}
            isEn={isEn}
            loading={trendState.loading}
          />

          {/* 4.2 Nhật ký hoạt động gần đây (đã gom nhóm sự kiện trùng lặp) */}
          <section className={`${ui.card} overflow-hidden`}>
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-900">
                  {isEn ? 'Recent Platform Activities' : 'Hoạt động nền tảng gần đây'}
                </h2>
                <p className="text-[12px] text-slate-500">
                  {isEn
                    ? 'Consecutive duplicate events aggregated for clear overview'
                    : 'Tự động gom nhóm các thao tác liên tiếp cùng đối tượng'}
                </p>
              </div>
              <Link
                to="/admin/audit-log"
                className="text-[13px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group shrink-0"
              >
                {isEn ? 'View Full Log' : 'Toàn bộ nhật ký'}{' '}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 rounded bg-slate-100 animate-pulse w-3/4" />
                      <div className="h-3 rounded bg-slate-100 animate-pulse w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : aggregatedLogs.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <Activity className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <p className="text-[13px] font-medium text-slate-800">
                  {isEn ? 'No administrative events recorded today yet.' : 'Chưa có hoạt động nào được ghi nhận hôm nay.'}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {isEn ? 'New actions will appear in this stream in real-time.' : 'Thao tác mới sẽ xuất hiện tại đây theo thời gian thực.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {aggregatedLogs.map((log) => {
                  const name = log.user?.fullName || (isEn ? 'System' : 'Hệ thống');
                  const isAdmin = log.user?.role === 'ADMIN';
                  const sensitive = isSensitiveAction(log.action);
                  const isMulti = log.count > 1;

                  return (
                    <li key={log.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/70 transition-colors">
                      <Avatar name={name} tone={isAdmin ? 'brand' : 'neutral'} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] text-slate-700 leading-snug">
                            <span className="font-semibold text-slate-900">{name}</span>
                            {isMulti ? (
                              <span className={sensitive ? 'text-red-700 font-medium ml-1.5' : 'text-slate-700 ml-1.5'}>
                                : {log.count} {isEn ? 'consecutive' : 'lần'}{' '}
                                <span className="font-medium">{actionLabel(log.action, language).toLowerCase()}</span>{' '}
                                {isEn ? 'actions' : 'liên tiếp'}
                              </span>
                            ) : (
                              <span className={sensitive ? 'text-red-700 font-medium ml-1.5' : 'text-slate-600 ml-1.5'}>
                                {actionLabel(log.action, language).toLowerCase()}
                              </span>
                            )}
                          </p>

                          {isMulti && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20">
                              {log.count}x
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] text-slate-500 truncate mt-0.5 flex items-center gap-2">
                          {log.store?.name ? (
                            <span className="inline-flex items-center gap-1">
                              <Store className="w-3 h-3 text-slate-400" />
                              {log.store.name}
                            </span>
                          ) : log.user ? (
                            <span>{roleLabel(log.user.role, language)}</span>
                          ) : (
                            <span>{isEn ? 'Server Background Task' : 'Tác vụ máy chủ'}</span>
                          )}
                          {log.entityType && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="font-mono text-slate-400 text-[11px]">{log.entityType}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <time
                        className="text-[12px] text-slate-500 shrink-0 tabular-nums whitespace-nowrap"
                        dateTime={log.latestTime}
                        title={formatVNDateTime(log.latestTime)}
                      >
                        {formatRelativeTime(log.latestTime, language) || formatVNDateTime(log.latestTime)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ── CỘT PHỤ: CẢNH BÁO + CHĂM SÓC SHOP + GIÁM SÁT HẠ TẦNG (4 cols) ──── */}
        <div className="xl:col-span-4 space-y-6">
          {/* 4.3 Hành động ưu tiên (Priority Actions Widget) */}
          <section className={`${ui.card} overflow-hidden`}>
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    attention.some((a) => a.level === 'danger')
                      ? 'bg-red-500'
                      : attention.length > 0
                      ? 'bg-amber-500'
                      : statusUnknown
                      ? 'bg-slate-300'
                      : 'bg-emerald-500'
                  }`}
                  aria-hidden="true"
                />
                {isEn ? `Priority Actions (${attention.length})` : `Hành động ưu tiên (${attention.length})`}
              </h2>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-7 h-7 rounded-md bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 rounded bg-slate-100 animate-pulse w-4/5" />
                      <div className="h-3 rounded bg-slate-100 animate-pulse w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : attention.length === 0 && statusUnknown ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="text-[13px] font-semibold text-slate-900">
                  {isEn ? 'Status unavailable' : 'Chưa kiểm tra được trạng thái'}
                </p>
                <p className="text-[12px] text-slate-500 leading-relaxed max-w-[32ch] mx-auto">
                  {isEn
                    ? 'Health and configuration data did not load, so alerts cannot be evaluated.'
                    : 'Không tải được số liệu sức khỏe và cấu hình nên chưa đánh giá được cảnh báo.'}
                </p>
              </div>
            ) : attention.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-semibold text-slate-900">
                  {isEn ? 'All Systems Operational' : 'Hạ tầng & Dịch vụ ổn định'}
                </p>
                <p className="text-[12px] text-slate-500 leading-relaxed max-w-[32ch] mx-auto">
                  {isEn
                    ? 'No critical alerts or pending issues requiring attention.'
                    : 'Không có cảnh báo hoặc sự cố nào cần xử lý khẩn cấp.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {attention.map((item, idx) => {
                  const cfg = LEVEL_CONFIG[item.level] || LEVEL_CONFIG.info;
                  const Icon = item.icon || AlertTriangle;
                  return (
                    <div
                      key={`${item.title}-${idx}`}
                      className={`p-4 space-y-2.5 ${cfg.border} hover:bg-slate-50/50 transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ring-1 ring-inset ${cfg.badge}`}>
                              {isEn ? cfg.tagEn : cfg.tagVi}
                            </span>
                            <p className="text-[13px] font-semibold text-slate-900 leading-tight">
                              {item.title}
                            </p>
                          </div>
                          <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Link
                          to={item.to}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700 group"
                        >
                          {item.action}
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4.4 Cửa hàng cần chăm sóc (Churn Risk Widget) */}
          <section className={`${ui.card} overflow-hidden`}>
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-900">
                  {isEn ? 'Stores Requiring Care' : 'Cửa hàng cần chăm sóc'}
                </h2>
                <p className="text-[12px] text-slate-500">
                  {isEn ? 'Inactive for over 14 days' : 'Không có hoạt động trên 14 ngày'}
                </p>
              </div>
              <Link
                to="/admin/stores"
                className="text-[13px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group shrink-0"
              >
                {isEn ? 'View All' : 'Xem tất cả'}{' '}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 rounded bg-slate-100 animate-pulse w-2/3" />
                      <div className="h-3 rounded bg-slate-100 animate-pulse w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : idleStores.length === 0 ? (
              <div className="p-6 text-center text-slate-500 space-y-1">
                <Store className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                <p className="text-[13px] font-semibold text-slate-800">
                  {isEn ? 'All stores actively operating' : 'Tất cả cửa hàng đều hoạt động thường xuyên'}
                </p>
                <p className="text-[12px] text-slate-500">
                  {isEn ? 'No stores are currently at risk of abandonment.' : 'Không có cửa hàng nào bị gián đoạn hoạt động.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {idleStores.slice(0, 5).map((store) => (
                  <li key={store.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-semibold text-[13px]">
                        {store.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/admin/stores?q=${encodeURIComponent(store.code)}`}
                          className="text-[13px] font-medium text-slate-900 hover:text-blue-600 truncate block"
                        >
                          {store.name}
                        </Link>
                        <p className="text-[12px] text-slate-500 truncate">
                          {isEn ? 'Code: ' : 'Mã: '}
                          <span className="font-mono text-slate-700">{store.code}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-amber-800 bg-amber-50 ring-1 ring-inset ring-amber-600/20 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {store.daysIdle} {isEn ? 'days ago' : 'ngày trước'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 4.5 Giám sát hạ tầng & Dịch vụ nhanh (Quick Infrastructure Glance) */}
          <section className={`${ui.card} p-5 space-y-3.5`}>
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-500" />
                {isEn ? 'System Status Overview' : 'Hạ tầng & Dịch vụ nhanh'}
              </h2>
              <Link to="/admin/system" className="text-[12px] font-medium text-blue-600 hover:text-blue-700">
                {isEn ? 'Details' : 'Chi tiết'}
              </Link>
            </div>

            <div className="space-y-2 text-[13px]">
              <InfraRow
                icon={Database}
                label="MySQL Database"
                state={!health ? null : health.database?.status === 'UP' ? 'ok' : 'bad'}
                okText="Online"
                badText="Offline"
                badTone="danger"
                isEn={isEn}
              />
              <InfraRow
                icon={Users}
                label={isEn ? 'Active sign-in sessions' : 'Phiên đăng nhập mở'}
                value={data ? `${data.activeSessionsCount ?? 0} ${isEn ? 'sessions' : 'phiên'}` : null}
                isEn={isEn}
              />
              <InfraRow
                icon={Mail}
                label="Email SMTP"
                state={!config ? null : config.integrations?.smtp?.configured ? 'ok' : 'bad'}
                okText={isEn ? 'Configured' : 'Đã cấu hình'}
                badText={isEn ? 'Missing' : 'Chưa cấu hình'}
                isEn={isEn}
              />
              <InfraRow
                icon={ImageIcon}
                label="Cloudinary Media"
                state={!config ? null : config.integrations?.cloudinary?.configured ? 'ok' : 'bad'}
                okText={isEn ? 'Configured' : 'Đã cấu hình'}
                badText={isEn ? 'Missing' : 'Chưa cấu hình'}
                isEn={isEn}
              />
              <InfraRow
                icon={KeyRound}
                label="JWT Auth Secrets"
                state={!config ? null : config.auth?.usingDefaultJwtSecrets ? 'bad' : 'ok'}
                okText={isEn ? 'Configured' : 'Đã cấu hình'}
                badText={isEn ? 'Default' : 'Mặc định'}
                badTone="danger"
                isEn={isEn}
              />
            </div>
          </section>
        </div>
      </div>

      {/* ─── 5. MODAL TẠO QUẢN TRỊ VIÊN ──────────────────────────────────── */}
      <AnimatePresence>
        {createOpen && (
          <CreateAdminDialog
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
