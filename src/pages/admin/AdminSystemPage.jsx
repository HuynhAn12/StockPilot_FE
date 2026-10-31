import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  CheckCircle2,
  CircleAlert,
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
  ExternalLink,
  Layers,
  Info,
} from 'lucide-react';
import { AdminHealthPanel } from './AdminHealthPanel';
import { AdminSettingsPanel } from './AdminSettingsPanel';
import { useToast } from '../../components/common/Toast';
import { apiGetAdminSystemConfig, apiGetAdminAiUsage, toVnStartOfDayISO, toVnEndOfDayISO } from '../../services/adminService';
import { apiErrorMessage } from './adminLabels';
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
  { value: 'health', label: 'Sức khỏe' },
  { value: 'settings', label: 'Cài đặt nền tảng' },
  { value: 'config', label: 'Cấu hình máy chủ' },
  { value: 'ai', label: 'Trợ lý AI' },
];

/** yyyy-mm-dd in local time (toISOString would shift to UTC). */
function localYMD(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const formatWindow = (limit) => (limit ? `${limit.max} lượt / ${limit.windowMs / 60000} phút` : '—');

function ConfigRow({ label, value, status, isDanger, mono = false, copyable = false, copyValue }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = copyValue || value;
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3.5 hover:bg-slate-50/70 rounded-lg transition-colors border-b border-[#F1F5F9] last:border-b-0 text-[13px] gap-2">
      <span className="text-[#64748B] font-medium">{label}</span>
      <div className="flex items-center gap-2 self-start sm:self-auto font-medium">
        {status === 'ok' && (
          <Badge tone="success" dot={true}>
            Hoạt động
          </Badge>
        )}
        {status === 'warning' && (
          <Badge tone="warning" dot={true}>
            Cần lưu ý
          </Badge>
        )}
        {status === 'danger' && (
          <Badge tone="danger" dot={true}>
            Cảnh báo
          </Badge>
        )}

        <span
          className={`${mono ? 'font-mono text-[12px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 text-[#334155]' : ''} ${
            isDanger || status === 'danger'
              ? 'text-[#DC2626] font-semibold'
              : status === 'warning'
              ? 'text-[#D97706] font-semibold'
              : status === 'ok'
              ? 'text-emerald-700'
              : 'text-[#1E293B]'
          }`}
        >
          {value}
        </span>

        {copyable && value && value !== '—' && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Sao chép"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminSystemPage() {
  const { toast } = useToast();

  const [params, setParams] = useSearchParams();
  const activeTab = SYSTEM_TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'health';
  const setActiveTab = (tab) => setParams(tab === 'health' ? {} : { tab }, { replace: true });

  // System Config State (Read-only)
  const [configData, setConfigData] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState('');

  // AI Usage Monitoring State
  const [aiUsageData, setAiUsageData] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiFromDate, setAiFromDate] = useState('');
  const [aiToDate, setAiToDate] = useState('');
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
        title: 'Khoảng thời gian không hợp lệ',
        description: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.',
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
        title: 'Lỗi tải số liệu AI',
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
      : '—';
  const inputTokensText = (aiTotals.inputTokens ?? 0).toLocaleString('vi-VN');
  const outputTokensText = (aiTotals.outputTokens ?? 0).toLocaleString('vi-VN');

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
        title="Hệ thống & AI"
        description="Giám sát sức khỏe máy chủ, cấu hình hạ tầng đang chạy, cài đặt nền tảng và hạn mức sử dụng Trợ lý AI. Khóa bí mật không bao giờ hiển thị ở đây."
        actions={
          (activeTab === 'config' || activeTab === 'ai') && (
            <button
              type="button"
              onClick={activeTab === 'config' ? fetchConfig : fetchAiUsage}
              disabled={isLoadingConfig || isLoadingAi}
              className={ui.btnSecondary}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConfig || isLoadingAi ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          )
        }
      >
        <Tabs value={activeTab} onChange={setActiveTab} tabs={SYSTEM_TABS} />
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
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-[13px] text-[#475569] flex items-start gap-3 shadow-2xs">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-[#0F172A]">Chế độ cấu hình chỉ đọc:</span> Bảng thông số được đọc trực tiếp từ tiến trình Node.js đang chạy. Để thay đổi các tham số này, hãy cập nhật file <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[#1E293B] font-mono text-[12px]">.env</code> trên máy chủ và khởi động lại dịch vụ backend.
            </div>
          </div>

          {/* Cảnh báo nếu JWT dùng mặc định */}
          {auth.usingDefaultJwtSecrets && (
            <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl text-[13px] text-[#DC2626] flex items-start gap-3 shadow-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[14px]">Cảnh báo an ninh cấp thiết: Máy chủ đang dùng khóa JWT mặc định!</p>
                <p className="text-red-700 leading-relaxed">
                  Hệ thống đang sử dụng khóa ký token mẫu của mã nguồn mở. Cần khai báo ngay lập tức biến môi trường{' '}
                  <code className="px-1.5 py-0.5 bg-red-100/80 font-mono text-[12px] font-semibold">JWT_SECRET</code> và{' '}
                  <code className="px-1.5 py-0.5 bg-red-100/80 font-mono text-[12px] font-semibold">JWT_REFRESH_SECRET</code>{' '}
                  trong file <code className="px-1.5 py-0.5 bg-red-100/80 font-mono text-[12px]">.env</code> để ngăn chặn nguy cơ giả mạo phiên đăng nhập quản trị viên.
                </p>
              </div>
            </div>
          )}

          {/* 4 Nhóm Cấu hình */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Nhóm 1: Môi trường */}
            <div className={ui.card}>
              <div className="px-5 py-3.5 border-b border-[#F1F5F9] bg-[#FAFBFC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-100 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-[#0F172A]">Môi trường máy chủ</h2>
                </div>
                {configData?.environment && (
                  <Badge tone={configData.environment === 'production' ? 'success' : 'neutral'}>
                    {configData.environment}
                  </Badge>
                )}
              </div>
              <div className="p-4 space-y-1">
                <ConfigRow
                  label="Môi trường hoạt động (NODE_ENV)"
                  value={configData?.environment || '—'}
                  mono={true}
                  status={configData?.environment === 'production' ? 'ok' : 'neutral'}
                />
                <ConfigRow
                  label="Múi giờ máy chủ (Timezone)"
                  value={configData?.timezone || '—'}
                  mono={true}
                />
                <ConfigRow
                  label="Tên miền gốc (Root Tenant Domain)"
                  value={configData?.tenantRootDomain || '—'}
                  mono={true}
                  copyable={true}
                />
              </div>
            </div>

            {/* Nhóm 2: Đăng nhập & Xác thực */}
            <div className={ui.card}>
              <div className="px-5 py-3.5 border-b border-[#F1F5F9] bg-[#FAFBFC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-[#0F172A]">Đăng nhập & Phiên xác thực</h2>
                </div>
                <Badge tone={auth.usingDefaultJwtSecrets ? 'danger' : 'success'}>
                  {auth.usingDefaultJwtSecrets ? 'Bảo mật kém' : 'Bảo mật cao'}
                </Badge>
              </div>
              <div className="p-4 space-y-1">
                <ConfigRow
                  label="Thời hạn Access Token"
                  value={auth.accessTokenTtl || '—'}
                  mono={true}
                />
                <ConfigRow
                  label="Thời hạn Refresh Token"
                  value={auth.refreshTokenTtl || '—'}
                  mono={true}
                />
                <ConfigRow
                  label="Số phiên đăng nhập hoạt động"
                  value={configData ? `${auth.activeSessions ?? 0} phiên` : '—'}
                />
                <ConfigRow
                  label="Khóa bảo mật JWT (Secret)"
                  value={!configData ? '—' : auth.usingDefaultJwtSecrets ? 'Đang dùng mặc định!' : 'Đã cấu hình an toàn'}
                  status={!configData ? 'neutral' : auth.usingDefaultJwtSecrets ? 'danger' : 'ok'}
                  isDanger={auth.usingDefaultJwtSecrets}
                />
              </div>
            </div>

            {/* Nhóm 3: Giới hạn truy cập (Rate Limit) */}
            <div className={ui.card}>
              <div className="px-5 py-3.5 border-b border-[#F1F5F9] bg-[#FAFBFC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-[#0F172A]">Giới hạn tần suất truy cập (Rate Limit)</h2>
                </div>
                <Badge tone={rateLimit.enabled ? 'success' : 'neutral'}>
                  {rateLimit.enabled ? 'Đang bật' : 'Đang tắt'}
                </Badge>
              </div>
              <div className="p-4 space-y-1">
                <ConfigRow
                  label="Trạng thái phân tầng Rate Limit"
                  value={!configData ? '—' : rateLimit.enabled ? 'Đang kích hoạt' : 'Đang tắt'}
                  status={rateLimit.enabled ? 'ok' : 'neutral'}
                />
                <ConfigRow
                  label="API chung (General Endpoints)"
                  value={formatWindow(rateLimit.general)}
                  mono={true}
                />
                <ConfigRow
                  label="API bảo mật & OTP (Auth Endpoints)"
                  value={formatWindow(rateLimit.auth)}
                  mono={true}
                />
              </div>
            </div>

            {/* Nhóm 4: Tích hợp dịch vụ ngoại vi */}
            <div className={ui.card}>
              <div className="px-5 py-3.5 border-b border-[#F1F5F9] bg-[#FAFBFC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                    <Plug className="w-4 h-4" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-[#0F172A]">Tích hợp dịch vụ bên thứ ba</h2>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <ConfigRow
                  label="Máy chủ gửi Email OTP (SMTP)"
                  value={
                    !configData
                      ? '—'
                      : integrations.smtp?.configured
                      ? `${integrations.smtp.host}:${integrations.smtp.port}`
                      : 'Chưa cấu hình'
                  }
                  mono={integrations.smtp?.configured}
                  copyable={Boolean(integrations.smtp?.configured)}
                  status={integrations.smtp?.configured ? 'ok' : 'warning'}
                />
                <ConfigRow
                  label="Lưu trữ tài nguyên (Cloudinary)"
                  value={!configData ? '—' : integrations.cloudinary?.configured ? 'Đã cấu hình kết nối' : 'Chưa cấu hình'}
                  status={integrations.cloudinary?.configured ? 'ok' : 'warning'}
                />
                <ConfigRow
                  label="Cổng tin nhắn SMS Brandname"
                  value={!configData ? '—' : integrations.sms?.configured ? integrations.sms.provider : 'Chế độ mô phỏng Dev (Sandbox)'}
                  status={integrations.sms?.configured ? 'ok' : 'neutral'}
                />
                <ConfigRow
                  label="Cổng thanh toán PayOS"
                  value={
                    !configData
                      ? '—'
                      : integrations.payos?.encryptionKeyConfigured
                      ? `Đã kích hoạt (${integrations.payos?.storesConfigured ?? 0} cửa hàng đã nạp key)`
                      : 'Thiếu khóa mã hóa PAYOS_ENCRYPTION_KEY'
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
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#475569]">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Khoảng thời gian:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={aiFromDate}
                  onChange={(e) => {
                    setAiFromDate(e.target.value);
                    setAiPreset(null);
                  }}
                  className={`${ui.input} w-auto h-8.5 text-[12px] py-1 cursor-pointer`}
                />
                <span className="text-[#94A3B8] text-[13px]">→</span>
                <input
                  type="date"
                  value={aiToDate}
                  onChange={(e) => {
                    setAiToDate(e.target.value);
                    setAiPreset(null);
                  }}
                  className={`${ui.input} w-auto h-8.5 text-[12px] py-1 cursor-pointer`}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start md:self-auto">
              {[
                { days: 7, label: '7 ngày' },
                { days: 30, label: '30 ngày' },
                { days: 90, label: '90 ngày' },
              ].map(({ days, label }) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => applyAiDatePreset(days)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                    aiPreset === days
                      ? 'bg-[#EFF4FF] text-[#2563EB] border border-blue-200'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Thẻ số liệu chính (StatCard) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Tổng lượt hỏi AI"
              value={isLoadingAi ? '—' : totalInteractions.toLocaleString('vi-VN')}
              subtitle={`${aiTotals.SUCCESS ?? 0} phản hồi thành công`}
              icon={Bot}
              iconBg="bg-blue-50 text-[#2563EB] border-blue-100"
              loading={isLoadingAi}
            />

            <StatCard
              title="Tỉ lệ lỗi & Timeout"
              value={isLoadingAi ? '—' : `${errorRatePercent}%`}
              subtitle={`${(aiTotals.FAILED ?? 0) + (aiTotals.TIMEOUT ?? 0)} lượt thất bại / timeout`}
              alert={isHighError}
              trend={isHighError ? 'up' : 'down'}
              icon={AlertTriangle}
              iconBg={isHighError ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
              loading={isLoadingAi}
            />

            <StatCard
              title="Độ trễ trung bình"
              value={isLoadingAi ? '—' : avgLatencyText}
              subtitle="Thời gian suy luận của AI"
              icon={Clock}
              iconBg="bg-indigo-50 text-indigo-600 border-indigo-100"
              loading={isLoadingAi}
            />

            <StatCard
              title="Tổng Token tiêu thụ"
              value={isLoadingAi ? '—' : ((aiTotals.inputTokens ?? 0) + (aiTotals.outputTokens ?? 0)).toLocaleString('vi-VN')}
              subtitle={`Vào: ${inputTokensText} · Ra: ${outputTokensText}`}
              icon={Zap}
              iconBg="bg-amber-50 text-amber-600 border-amber-100"
              loading={isLoadingAi}
            />
          </div>

          {/* Bảng Thống kê Theo cửa hàng */}
          <TableCard
            header={
              <>
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0F172A]">Thống kê theo cửa hàng</h2>
                  <p className="text-[12px] text-[#64748B] mt-0.5">
                    Hiển thị danh sách cửa hàng phát sinh truy vấn AI trong khoảng thời gian đã chọn
                  </p>
                </div>
                <div className="text-[12px] text-[#64748B] font-medium">
                  {sortedAiByStore.length} cửa hàng
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
                    Cửa hàng
                  </Th>
                  <Th
                    sortKey="interactions"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                  >
                    Lượt tương tác
                  </Th>
                  <Th
                    sortKey="failed"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                  >
                    Số lượt lỗi
                  </Th>
                  <Th
                    sortKey="avgLatency"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                  >
                    Độ trễ TB
                  </Th>
                  <Th
                    sortKey="tokens"
                    currentSortKey={aiSortKey}
                    sortDirection={aiSortDirection}
                    onSort={handleAiSort}
                    align="right"
                  >
                    Tổng Token
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {isLoadingAi ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-4">
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
                    <td colSpan={5} className="py-12">
                      <EmptyState
                        title="Chưa có dữ liệu hội thoại AI"
                        description="Không ghi nhận lượt gọi API Trợ lý AI nào trong khoảng thời gian đã chọn."
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
                          <div className="font-semibold text-[#0F172A]">
                            {row.store?.name || `Cửa hàng #${row.store?.id || idx + 1}`}
                          </div>
                          {row.store?.code && (
                            <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                              {row.store.code}
                            </div>
                          )}
                        </Td>

                        {/* Lượt hỏi kèm thanh tỉ lệ chuẩn SaaS */}
                        <Td className="min-w-45">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-[#0F172A] tabular-nums min-w-9">
                              {count.toLocaleString('vi-VN')}
                            </span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-30">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-[#94A3B8] tabular-nums">
                              {percent}%
                            </span>
                          </div>
                        </Td>

                        {/* Lỗi */}
                        <Td>
                          {row.failed > 0 ? (
                            <Badge tone="danger" dot={true}>
                              {row.failed} lỗi
                            </Badge>
                          ) : (
                            <span className="text-[#94A3B8] text-[12px] font-medium">—</span>
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
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </Td>

                        {/* Token */}
                        <Td align="right">
                          <div className="font-mono text-[13px] font-semibold text-[#0F172A] tabular-nums">
                            {((row.inputTokens || 0) + (row.outputTokens || 0)).toLocaleString('vi-VN')}
                          </div>
                          <div className="text-[11px] text-[#94A3B8] mt-0.5">
                            {(row.inputTokens || 0).toLocaleString('vi-VN')} in · {(row.outputTokens || 0).toLocaleString('vi-VN')} out
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
