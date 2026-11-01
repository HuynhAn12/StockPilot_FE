import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  ShieldAlert,
  Server,
  ShieldCheck,
  Gauge,
  Plug,
  Bot,
  Zap,
  Clock,
  AlertTriangle,
  Calendar,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { AdminHealthPanel } from './AdminHealthPanel';
import { AdminSettingsPanel } from './AdminSettingsPanel';
import { useToast } from '../../components/common/Toast';
import { apiGetAdminSystemConfig, apiGetAdminAiUsage, toVnStartOfDayISO, toVnEndOfDayISO } from '../../services/adminService';
import { apiErrorMessage } from './adminLabels';
import { currentAdminLang, useAdminText } from './useAdminText';
import { segmentedButton, segmentedWrapper } from './ops/opsShared';
import { adminStyles as ui } from './adminStyles';
import {
  PageHeader,
  Tabs,
  TableCard,
  Th,
  Td,
  StatCard,
  Badge,
  EmptyState,
  ErrorState,
} from './components/AdminUI';

const SYSTEM_TABS = [
  { value: 'health', vi: 'Sức khỏe', en: 'Health' },
  { value: 'settings', vi: 'Cài đặt nền tảng', en: 'Platform settings' },
  { value: 'config', vi: 'Cấu hình máy chủ', en: 'Server configuration' },
  { value: 'ai', vi: 'Trợ lý AI', en: 'AI assistant' },
];

/** yyyy-mm-dd in local time (toISOString would shift to UTC). */
function localYMD(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const formatWindow = (limit) => {
  if (!limit) return '–';
  const en = currentAdminLang() === 'en';
  return en ? `${limit.max} req / ${limit.windowMs / 60000} min` : `${limit.max} lượt / ${limit.windowMs / 60000} phút`;
};

/** Tiêu đề thẻ cấu hình: icon trung tính · tên · badge trạng thái. */
function ConfigCardHeader({ icon: Icon, title, badge }) {
  return (
    <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
        <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
      </div>
      {badge}
    </div>
  );
}

function ConfigRow({ label, value, status, isDanger, mono = false, copyable = false, copyValue }) {
  const { t } = useAdminText();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = copyValue || value;
    if (!text || text === '–') return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-1 border-b border-slate-100 last:border-b-0 text-[13px] gap-2">
      <span className="text-slate-500 font-medium">{label}</span>
      <div className="flex items-center gap-2 self-start sm:self-auto font-medium">
        {status === 'ok' && (
          <Badge tone="success" dot={true}>
            {t('Hoạt động', 'Active')}
          </Badge>
        )}
        {status === 'warning' && (
          <Badge tone="warning" dot={true}>
            {t('Cần lưu ý', 'Attention')}
          </Badge>
        )}
        {status === 'danger' && (
          <Badge tone="danger" dot={true}>
            {t('Cảnh báo', 'Warning')}
          </Badge>
        )}

        <span
          className={`${mono ? 'font-mono text-[12px] bg-slate-50 px-1.5 py-0.5 rounded ring-1 ring-inset ring-slate-200' : ''} ${
            isDanger || status === 'danger'
              ? 'text-red-700 font-medium'
              : status === 'warning'
              ? 'text-amber-800 font-medium'
              : 'text-slate-800'
          }`}
        >
          {value}
        </span>

        {copyable && value && value !== '–' && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={t('Sao chép', 'Copy')}
            aria-label={t('Sao chép', 'Copy')}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminSystemPage() {
  const { t, isEn } = useAdminText();
  const { toast } = useToast();
  const locale = isEn ? 'en-US' : 'vi-VN';

  const [params, setParams] = useSearchParams();
  const activeTab = SYSTEM_TABS.some((tab) => tab.value === params.get('tab')) ? params.get('tab') : 'health';
  const setActiveTab = (tab) => setParams(tab === 'health' ? {} : { tab }, { replace: true });

  // System Config State (Read-only)
  const [configData, setConfigData] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState('');

  // AI Usage Monitoring State
  const [aiUsageData, setAiUsageData] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  // Mặc định 30 ngày qua: nút preset đang chọn khớp với ô ngày hiển thị.
  const [aiFromDate, setAiFromDate] = useState(() => localYMD(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [aiToDate, setAiToDate] = useState(() => localYMD(new Date()));
  const [aiPreset, setAiPreset] = useState(30);

  // Sorting state for AI byStore table
  const [aiSortKey, setAiSortKey] = useState('interactions');
  const [aiSortDirection, setAiSortDirection] = useState('desc');

  // 1. Fetch System Config Status
  const fetchConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    setConfigError('');
    try {
      const data = await apiGetAdminSystemConfig();
      setConfigData(data);
    } catch (err) {
      setConfigError(apiErrorMessage(err));
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  // 2. Fetch AI Usage
  const fetchAiUsage = useCallback(async () => {
    if (aiFromDate && aiToDate && aiFromDate > aiToDate) {
      toast({
        type: 'warning',
        title: t('Khoảng thời gian không hợp lệ', 'Invalid date range'),
        description: t('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.', 'The start date must be on or before the end date.'),
      });
      return;
    }

    setIsLoadingAi(true);
    try {
      const data = await apiGetAdminAiUsage({
        from: toVnStartOfDayISO(aiFromDate),
        to: toVnEndOfDayISO(aiToDate),
      });
      setAiUsageData(data);
    } catch (err) {
      toast({
        type: 'error',
        title: t('Lỗi tải số liệu AI', 'Could not load AI usage'),
        description: apiErrorMessage(err),
      });
    } finally {
      setIsLoadingAi(false);
    }
  }, [aiFromDate, aiToDate, toast]);

  useEffect(() => {
    if (activeTab === 'config') fetchConfig();
  }, [activeTab, fetchConfig]);

  useEffect(() => {
    if (activeTab === 'ai') {
      fetchAiUsage();
    }
  }, [activeTab, fetchAiUsage]);

  // Preset dates for AI
  const applyAiDatePreset = (days) => {
    setAiPreset(days);
    const today = new Date();
    const past = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    setAiFromDate(localYMD(past));
    setAiToDate(localYMD(today));
  };

  const auth = configData?.auth || {};
  const rateLimit = configData?.rateLimit || {};
  const integrations = configData?.integrations || {};

  const aiTotals = aiUsageData?.totals || {};
  const aiByStore = aiUsageData?.byStore || [];

  // Metrics from real backend data
  const totalInteractions = aiTotals.interactions ?? 0;
  const errorRatePercent = ((aiTotals.errorRate ?? 0) * 100).toFixed(1);
  const isHighError = Number(errorRatePercent) > 5;
  const avgLatencyText =
    aiTotals.avgLatencyMs !== null && aiTotals.avgLatencyMs !== undefined
      ? `${aiTotals.avgLatencyMs} ms`
      : '–';
  const inputTokensText = (aiTotals.inputTokens ?? 0).toLocaleString(locale);
  const outputTokensText = (aiTotals.outputTokens ?? 0).toLocaleString(locale);

  // Max interactions in byStore for ratio bar
  const maxStoreInteractions = useMemo(() => {
    if (aiByStore.length === 0) return 1;
    return Math.max(...aiByStore.map((r) => r.interactions || 0), 1);
  }, [aiByStore]);

  // Handle sort for AI byStore table
  const handleAiSort = (key) => {
    if (aiSortKey === key) {
      setAiSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setAiSortKey(key);
      setAiSortDirection('desc');
    }
  };

  // Sorted list of stores
  const sortedAiByStore = useMemo(() => {
    const list = [...aiByStore];
    list.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      if (aiSortKey === 'store') {
        aVal = a.store?.name || '';
        bVal = b.store?.name || '';
        return aiSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aiSortKey === 'interactions') {
        aVal = a.interactions || 0;
        bVal = b.interactions || 0;
      } else if (aiSortKey === 'failed') {
        aVal = a.failed || 0;
        bVal = b.failed || 0;
      } else if (aiSortKey === 'avgLatency') {
        aVal = a.avgLatencyMs || 0;
        bVal = b.avgLatencyMs || 0;
      } else if (aiSortKey === 'tokens') {
        aVal = (a.inputTokens || 0) + (a.outputTokens || 0);
        bVal = (b.inputTokens || 0) + (b.outputTokens || 0);
      }
      return aiSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [aiByStore, aiSortKey, aiSortDirection]);

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title={t('Hệ thống & AI', 'System & AI')}
        description={t('Giám sát sức khỏe máy chủ, cấu hình hạ tầng đang chạy, cài đặt nền tảng và hạn mức sử dụng Trợ lý AI. Khóa bí mật không bao giờ hiển thị ở đây.', 'Server health, running configuration, platform settings and AI assistant usage. Secrets are never shown here.')}
        actions={
          (activeTab === 'config' || activeTab === 'ai') && (
            <button
              type="button"
              onClick={activeTab === 'config' ? fetchConfig : fetchAiUsage}
              disabled={isLoadingConfig || isLoadingAi}
              className={ui.btnSecondary}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConfig || isLoadingAi ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('Làm mới', 'Refresh')}
            </button>
          )
        }
      >
        <Tabs value={activeTab} onChange={setActiveTab} tabs={SYSTEM_TABS.map((tab) => ({ value: tab.value, label: t(tab.vi, tab.en) }))} />
      </PageHeader>

      {activeTab === 'health' && <AdminHealthPanel />}
      {activeTab === 'settings' && <AdminSettingsPanel />}

      {/* ─── TAB: CẤU HÌNH (Chỉ xem, không có ô nhập hay nút lưu) ─── */}
      {activeTab === 'config' && configError && (
        <div className={ui.card}>
          <ErrorState message={configError} onRetry={fetchConfig} />
        </div>
      )}

      {activeTab === 'config' && !configError && (
        <div className={`space-y-5 ${isLoadingConfig && !configData ? 'opacity-60' : ''}`}>
          {/* Ghi chú đầu trang */}
          <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-600 flex items-start gap-3">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="leading-relaxed">
              <span className="font-medium text-slate-900">{t('Chỉ đọc:', 'Read-only:')}</span>{' '}
              {t(
                'Thông số được đọc trực tiếp từ máy chủ đang chạy. Muốn thay đổi, cập nhật file',
                'Values are read from the running server. To change them, update the'
              )}{' '}
              <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[12px]">.env</code>{' '}
              {t('trên máy chủ rồi khởi động lại backend.', 'file on the server and restart the backend.')}
            </div>
          </div>

          {/* Cảnh báo nếu JWT dùng mặc định */}
          {auth.usingDefaultJwtSecrets && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-800 flex items-start gap-3" role="alert">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">{t('Máy chủ đang dùng khóa JWT mặc định', 'The server is using the default JWT secrets')}</p>
                <p className="text-red-700 leading-relaxed">
                  {t('Khai báo ngay', 'Set')}{' '}
                  <code className="px-1 py-0.5 bg-red-100 rounded font-mono text-[12px]">JWT_SECRET</code> {t('và', 'and')}{' '}
                  <code className="px-1 py-0.5 bg-red-100 rounded font-mono text-[12px]">JWT_REFRESH_SECRET</code>{' '}
                  {t('trong file .env để không ai giả mạo được phiên đăng nhập quản trị.', 'in .env right away so nobody can forge admin sessions.')}
                </p>
              </div>
            </div>
          )}

          {/* 4 Nhóm Cấu hình */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Nhóm 1: Môi trường */}
            <div className={ui.card}>
              <ConfigCardHeader
                icon={Server}
                title={t('Môi trường máy chủ', 'Server environment')}
                badge={
                  configData?.environment && (
                    <Badge tone={configData.environment === 'production' ? 'success' : 'neutral'}>{configData.environment}</Badge>
                  )
                }
              />
              <div className="px-5 py-2">
                <ConfigRow
                  label={t('Môi trường hoạt động (NODE_ENV)', 'Environment (NODE_ENV)')}
                  value={configData?.environment || '–'}
                  mono={true}
                  status={configData?.environment === 'production' ? 'ok' : 'neutral'}
                />
                <ConfigRow
                  label={t('Múi giờ máy chủ (Timezone)', 'Server time zone')}
                  value={configData?.timezone || '–'}
                  mono={true}
                />
                <ConfigRow
                  label={t('Tên miền gốc (Root Tenant Domain)', 'Root tenant domain')}
                  value={configData?.tenantRootDomain || '–'}
                  mono={true}
                  copyable={true}
                />
              </div>
            </div>

            {/* Nhóm 2: Đăng nhập & Xác thực */}
            <div className={ui.card}>
              <ConfigCardHeader
                icon={ShieldCheck}
                title={t('Đăng nhập & phiên', 'Sign-in & sessions')}
                badge={
                  configData && (
                    <Badge tone={auth.usingDefaultJwtSecrets ? 'danger' : 'success'}>
                      {auth.usingDefaultJwtSecrets ? t('Khóa mặc định', 'Default secrets') : t('Đã cấu hình', 'Configured')}
                    </Badge>
                  )
                }
              />
              <div className="px-5 py-2">
                <ConfigRow
                  label={t('Thời hạn Access Token', 'Access token lifetime')}
                  value={auth.accessTokenTtl || '–'}
                  mono={true}
                />
                <ConfigRow
                  label={t('Thời hạn Refresh Token', 'Refresh token lifetime')}
                  value={auth.refreshTokenTtl || '–'}
                  mono={true}
                />
                <ConfigRow
                  label={t('Số phiên đăng nhập hoạt động', 'Active sessions')}
                  value={configData ? t(`${auth.activeSessions ?? 0} phiên`, `${auth.activeSessions ?? 0} sessions`) : '–'}
                />
                <ConfigRow
                  label={t('Khóa bảo mật JWT (Secret)', 'JWT signing secret')}
                  value={!configData ? '–' : auth.usingDefaultJwtSecrets ? t('Đang dùng mặc định', 'Using defaults') : t('Đã cấu hình', 'Configured')}
                  status={!configData ? 'neutral' : auth.usingDefaultJwtSecrets ? 'danger' : 'ok'}
                  isDanger={auth.usingDefaultJwtSecrets}
                />
              </div>
            </div>

            {/* Nhóm 3: Giới hạn truy cập (Rate Limit) */}
            <div className={ui.card}>
              <ConfigCardHeader
                icon={Gauge}
                title={t('Giới hạn tần suất (rate limit)', 'Rate limiting')}
                badge={
                  configData && (
                    <Badge tone={rateLimit.enabled ? 'success' : 'neutral'}>
                      {rateLimit.enabled ? t('Đang bật', 'On') : t('Đang tắt', 'Off')}
                    </Badge>
                  )
                }
              />
              <div className="px-5 py-2">
                <ConfigRow
                  label={t('Trạng thái phân tầng Rate Limit', 'Rate limiting')}
                  value={!configData ? '–' : rateLimit.enabled ? t('Đang bật', 'On') : t('Đang tắt', 'Off')}
                  status={rateLimit.enabled ? 'ok' : 'neutral'}
                />
                <ConfigRow
                  label={t('API chung (General Endpoints)', 'General endpoints')}
                  value={formatWindow(rateLimit.general)}
                  mono={true}
                />
                <ConfigRow
                  label={t('API bảo mật & OTP (Auth Endpoints)', 'Auth & OTP endpoints')}
                  value={formatWindow(rateLimit.auth)}
                  mono={true}
                />
              </div>
            </div>

            {/* Nhóm 4: Tích hợp dịch vụ ngoại vi */}
            <div className={ui.card}>
              <ConfigCardHeader icon={Plug} title={t('Tích hợp bên thứ ba', 'Third-party integrations')} />
              <div className="px-5 py-2">
                <ConfigRow
                  label={t('Máy chủ gửi Email OTP (SMTP)', 'OTP email server (SMTP)')}
                  value={
                    !configData
                      ? '–'
                      : integrations.smtp?.configured
                      ? `${integrations.smtp.host}:${integrations.smtp.port}`
                      : t('Chưa cấu hình', 'Not configured')
                  }
                  mono={integrations.smtp?.configured}
                  copyable={Boolean(integrations.smtp?.configured)}
                  status={integrations.smtp?.configured ? 'ok' : 'warning'}
                />
                <ConfigRow
                  label={t('Lưu trữ tài nguyên (Cloudinary)', 'Media storage (Cloudinary)')}
                  value={!configData ? '–' : integrations.cloudinary?.configured ? t('Đã cấu hình', 'Configured') : t('Chưa cấu hình', 'Not configured')}
                  status={integrations.cloudinary?.configured ? 'ok' : 'warning'}
                />
                <ConfigRow
                  label={t('Cổng tin nhắn SMS Brandname', 'SMS gateway')}
                  value={!configData ? '–' : integrations.sms?.configured ? integrations.sms.provider : t('Chế độ thử (sandbox)', 'Sandbox mode')}
                  status={integrations.sms?.configured ? 'ok' : 'neutral'}
                />
                <ConfigRow
                  label={t('Cổng thanh toán PayOS', 'PayOS payment gateway')}
                  value={
                    !configData
                      ? '–'
                      : integrations.payos?.encryptionKeyConfigured
                      ? t(
                          `Đã kích hoạt (${integrations.payos?.storesConfigured ?? 0} cửa hàng đã nạp key)`,
                          `Enabled (${integrations.payos?.storesConfigured ?? 0} stores connected)`
                        )
                      : t('Thiếu khóa mã hóa PAYOS_ENCRYPTION_KEY', 'Missing PAYOS_ENCRYPTION_KEY')
                  }
                  status={integrations.payos?.encryptionKeyConfigured ? 'ok' : 'warning'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: TRỢ LÝ AI (AI PILOT USAGE) ─── */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          {/* Thanh chọn khoảng thời gian */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                <span>{t('Khoảng thời gian:', 'Date range:')}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={aiFromDate}
                  onChange={(e) => {
                    setAiFromDate(e.target.value);
                    setAiPreset(null);
                  }}
                  aria-label={t('Từ ngày', 'From date')}
                  max={aiToDate || undefined}
                  className={`${ui.input} w-auto h-8 tabular-nums cursor-pointer`}
                />
                <span className="text-slate-400 text-[13px]" aria-hidden="true">→</span>
                <input
                  type="date"
                  value={aiToDate}
                  onChange={(e) => {
                    setAiToDate(e.target.value);
                    setAiPreset(null);
                  }}
                  aria-label={t('Đến ngày', 'To date')}
                  min={aiFromDate || undefined}
                  className={`${ui.input} w-auto h-8 tabular-nums cursor-pointer`}
                />
              </div>
            </div>

            <div className={`${segmentedWrapper} self-start md:self-auto`} role="group" aria-label={t('Khoảng thời gian', 'Date range')}>
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  aria-pressed={aiPreset === days}
                  onClick={() => applyAiDatePreset(days)}
                  className={segmentedButton(aiPreset === days)}
                >
                  {t(`${days} ngày`, `${days} days`)}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Thẻ số liệu chính (StatCard) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('Tổng lượt hỏi AI', 'AI requests')}
              value={isLoadingAi ? '–' : totalInteractions.toLocaleString(locale)}
              subtitle={t(`${aiTotals.SUCCESS ?? 0} phản hồi thành công`, `${aiTotals.SUCCESS ?? 0} successful replies`)}
              icon={Bot}
              iconBg="bg-slate-100 text-slate-600"
              loading={isLoadingAi}
            />

            <StatCard
              title={t('Tỉ lệ lỗi & Timeout', 'Error & timeout rate')}
              value={isLoadingAi ? '–' : totalInteractions ? `${errorRatePercent}%` : '–'}
              subtitle={t(
                `${(aiTotals.FAILED ?? 0) + (aiTotals.TIMEOUT ?? 0)} lượt thất bại / timeout`,
                `${(aiTotals.FAILED ?? 0) + (aiTotals.TIMEOUT ?? 0)} failed / timed out`
              )}
              alert={isHighError}
              icon={AlertTriangle}
              iconBg={isHighError ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}
              loading={isLoadingAi}
            />

            <StatCard
              title={t('Độ trễ trung bình', 'Average latency')}
              value={isLoadingAi ? '–' : avgLatencyText}
              subtitle={t('Thời gian suy luận của AI', 'AI response time')}
              icon={Clock}
              iconBg="bg-slate-100 text-slate-600"
              loading={isLoadingAi}
            />

            <StatCard
              title={t('Tổng Token tiêu thụ', 'Tokens used')}
              value={isLoadingAi ? '–' : ((aiTotals.inputTokens ?? 0) + (aiTotals.outputTokens ?? 0)).toLocaleString(locale)}
              subtitle={t(`Vào: ${inputTokensText} · Ra: ${outputTokensText}`, `In: ${inputTokensText} · Out: ${outputTokensText}`)}
              icon={Zap}
              iconBg="bg-slate-100 text-slate-600"
              loading={isLoadingAi}
            />
          </div>

          {/* Bảng Thống kê Theo cửa hàng */}
          <TableCard
            header={
              <>
                <div>
                  <h2 className="text-[14px] font-semibold text-slate-900">{t('Thống kê theo cửa hàng', 'By store')}</h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {t('Hiển thị danh sách cửa hàng phát sinh truy vấn AI trong khoảng thời gian đã chọn', 'Stores that used the AI assistant in the selected range')}
                  </p>
                </div>
                <div className="text-[12px] text-slate-500 tabular-nums shrink-0">
                  {t(`${sortedAiByStore.length} cửa hàng`, `${sortedAiByStore.length} stores`)}
                </div>
              </>
            }
          >
            <table className={ui.table}>
              <thead>
                <tr>
                  <Th
                    sortKey="store"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                  >
                    {t('Cửa hàng', 'Store')}
                  </Th>
                  <Th
                    sortKey="interactions"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                  >
                    {t('Lượt tương tác', 'Requests')}
                  </Th>
                  <Th
                    sortKey="failed"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                  >
                    {t('Số lượt lỗi', 'Errors')}
                  </Th>
                  <Th
                    sortKey="avgLatency"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                  >
                    {t('Độ trễ TB', 'Avg latency')}
                  </Th>
                  <Th
                    sortKey="tokens"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                    align="right"
                  >
                    {t('Tổng Token', 'Tokens')}
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingAi ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div
                            className="h-4 rounded bg-slate-100 animate-pulse"
                            style={{ width: `${50 + ((i + j) % 3) * 15}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sortedAiByStore.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title={t('Chưa có dữ liệu hội thoại AI', 'No AI conversations yet')}
                        description={t('Không ghi nhận lượt gọi API Trợ lý AI nào trong khoảng thời gian đã chọn.', 'No AI assistant requests in the selected range.')}
                      />
                    </td>
                  </tr>
                ) : (
                  sortedAiByStore.map((row, idx) => {
                    const count = row.interactions || 0;
                    const percent = Math.min(100, Math.round((count / maxStoreInteractions) * 100));

                    return (
                      <tr key={idx} className={ui.tr}>
                        {/* Cửa hàng */}
                        <Td>
                          <div className="font-semibold text-slate-900">
                            {row.store?.name || t(`Cửa hàng #${row.store?.id || idx + 1}`, `Store #${row.store?.id || idx + 1}`)}
                          </div>
                          {row.store?.code && (
                            <div className="text-[12px] text-slate-500 font-mono mt-0.5">
                              {row.store.code}
                            </div>
                          )}
                        </Td>

                        {/* Lượt hỏi kèm thanh tỉ lệ chuẩn SaaS */}
                        <Td className="min-w-45">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-900 tabular-nums min-w-9">
                              {count.toLocaleString(locale)}
                            </span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-30" aria-hidden="true">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[12px] text-slate-500 tabular-nums">
                              {percent}%
                            </span>
                          </div>
                        </Td>

                        {/* Lỗi */}
                        <Td>
                          {row.failed > 0 ? (
                            <Badge tone="danger" dot={true}>
                              {t(`${row.failed} lỗi`, `${row.failed} errors`)}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">–</span>
                          )}
                        </Td>

                        {/* Độ trễ TB */}
                        <Td>
                          {row.avgLatencyMs !== null && row.avgLatencyMs !== undefined ? (
                            <Badge
                              tone={
                                row.avgLatencyMs > 2500
                                  ? 'danger'
                                  : row.avgLatencyMs > 1000
                                  ? 'warning'
                                  : 'success'
                              }
                              dot={false}
                            >
                              {row.avgLatencyMs} ms
                            </Badge>
                          ) : (
                            <span className="text-slate-400">–</span>
                          )}
                        </Td>

                        {/* Token */}
                        <Td align="right">
                          <div className="font-mono text-[13px] font-semibold text-slate-900 tabular-nums">
                            {((row.inputTokens || 0) + (row.outputTokens || 0)).toLocaleString(locale)}
                          </div>
                          <div className="text-[12px] text-slate-500 tabular-nums mt-0.5">
                            {(row.inputTokens || 0).toLocaleString(locale)} in · {(row.outputTokens || 0).toLocaleString(locale)} out
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableCard>
        </div>
      )}
    </div>
  );
}

export default AdminSystemPage;
