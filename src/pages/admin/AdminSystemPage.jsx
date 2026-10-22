import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Server, Bot, RefreshCw, CheckCircle2, CircleAlert,
  Calendar, Clock, ShieldCheck, ShieldAlert, HeartPulse, SlidersHorizontal,
} from 'lucide-react';
import { AdminHealthPanel } from './AdminHealthPanel';
import { AdminSettingsPanel } from './AdminSettingsPanel';

const SYSTEM_TABS = [
  { id: 'health', label: 'Sức khỏe', icon: HeartPulse },
  { id: 'settings', label: 'Cài đặt', icon: SlidersHorizontal },
  { id: 'config', label: 'Cấu hình máy chủ', icon: Server },
  { id: 'ai', label: 'Trợ lý AI', icon: Bot },
];
import { useToast } from '../../components/common/Toast';
import {
  apiGetAdminSystemConfig,
  apiGetAdminAiUsage,
  formatVNDateTime,
  toVnStartOfDayISO,
  toVnEndOfDayISO,
} from '../../services/adminService';
import { adminStyles } from './adminStyles';

function ConfigDetailRow({ label, value, status, isDanger }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-[#E5E7EB] last:border-b-0 text-[13px] gap-1">
      <span className="text-[#64748B]">{label}</span>
      <div className="flex items-center gap-1.5 font-medium">
        {status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
        {status === 'warning' && <CircleAlert className="w-3.5 h-3.5 text-[#D97706] shrink-0" />}
        {status === 'danger' && <CircleAlert className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />}
        <span
          className={
            isDanger || status === 'danger'
              ? 'text-[#DC2626]'
              : status === 'warning'
              ? 'text-[#D97706]'
              : status === 'ok'
              ? 'text-emerald-700'
              : 'text-[#334155]'
          }
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function AdminSystemPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('health');

  // System Config State (Read-only)
  const [configData, setConfigData] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // AI Usage Monitoring State
  const [aiUsageData, setAiUsageData] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiFromDate, setAiFromDate] = useState('');
  const [aiToDate, setAiToDate] = useState('');

  // 1. Fetch System Config Status
  const fetchConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const data = await apiGetAdminSystemConfig();
      setConfigData(data);
    } catch (err) {
      toast({
        type: 'error',
        title: 'Lỗi tải cấu hình hệ thống',
        description: err?.response?.data?.error?.message || err.message || 'Không thể lấy thông tin cấu hình.',
      });
    } finally {
      setIsLoadingConfig(false);
    }
  }, [toast]);

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
        description: err?.response?.data?.error?.message || err.message || 'Không thể lấy thống kê Trợ lý AI.',
      });
    } finally {
      setIsLoadingAi(false);
    }
  }, [aiFromDate, aiToDate, toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (activeTab === 'ai') {
      fetchAiUsage();
    }
  }, [activeTab, fetchAiUsage]);

  // Preset dates for AI
  const applyAiDatePreset = (days) => {
    const today = new Date();
    const formatYMD = (d) => d.toISOString().slice(0, 10);
    const past = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    setAiFromDate(formatYMD(past));
    setAiToDate(formatYMD(today));
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
  const avgLatencyText = aiTotals.avgLatencyMs !== null && aiTotals.avgLatencyMs !== undefined
    ? `${aiTotals.avgLatencyMs} ms`
    : '—';
  const inputTokensText = (aiTotals.inputTokens ?? 0).toLocaleString('vi-VN');
  const outputTokensText = (aiTotals.outputTokens ?? 0).toLocaleString('vi-VN');

  // Max interactions in byStore for ratio bar
  const maxStoreInteractions = useMemo(() => {
    if (aiByStore.length === 0) return 1;
    return Math.max(...aiByStore.map((r) => r.interactions || 0), 1);
  }, [aiByStore]);

  return (
    <div className={adminStyles.pageContainer}>
      {/* ─── Header ─── */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Hệ thống</h1>
          <p className={adminStyles.pageDesc}>
            Theo dõi sức khỏe máy chủ, đổi cài đặt nền tảng, xem cấu hình và mức dùng Trợ lý AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(activeTab === 'config' || activeTab === 'ai') && (
            <button
              type="button"
              onClick={activeTab === 'config' ? fetchConfig : fetchAiUsage}
              disabled={isLoadingConfig || isLoadingAi}
              className={adminStyles.btnSecondary}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isLoadingConfig || isLoadingAi) ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          )}
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5 overflow-x-auto max-w-full" role="tablist">
        {SYSTEM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? 'bg-slate-100 text-[#334155] font-medium' : 'text-[#64748B] hover:text-[#334155]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'health' && <AdminHealthPanel />}
      {activeTab === 'settings' && <AdminSettingsPanel />}

      {/* ─── TAB 1: CẤU HÌNH (Chỉ xem, không có ô nhập hay nút lưu) ─── */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {/* Ghi chú đầu trang */}
          <div className="p-3 bg-slate-50 border border-[#E5E7EB] rounded-lg text-[13px] text-[#64748B] flex items-center gap-2">
            <span className="font-medium text-[#334155]">Lưu ý:</span>
            <span>Bảng thông tin chỉ đọc. Muốn thay đổi, sửa file <code className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[#334155] font-mono text-[12px]">.env</code> trên máy chủ rồi khởi động lại.</span>
          </div>

          {/* Cảnh báo nếu JWT dùng mặc định */}
          {auth.usingDefaultJwtSecrets && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-[#DC2626] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Máy chủ đang dùng JWT secret mặc định!</p>
                <p className="text-[12px] text-red-600 mt-0.5">
                  Cần đặt biến môi trường <code>JWT_SECRET</code> và <code>JWT_REFRESH_SECRET</code> trong file <code>.env</code> để đảm bảo an ninh cho toàn bộ phiên đăng nhập.
                </p>
              </div>
            </div>
          )}

          {/* 4 Nhóm Cấu hình */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nhóm 1: Môi trường */}
            <div className={adminStyles.card}>
              <div className={adminStyles.cardHeader}>
                <h2 className={adminStyles.cardTitle}>Môi trường</h2>
              </div>
              <div className="p-4 space-y-0.5">
                <ConfigDetailRow
                  label="Môi trường hoạt động"
                  value={configData?.environment || 'development'}
                  status={configData?.environment === 'production' ? 'ok' : 'neutral'}
                />
                <ConfigDetailRow
                  label="Múi giờ máy chủ"
                  value={configData?.timezone || 'Asia/Ho_Chi_Minh'}
                />
                <ConfigDetailRow
                  label="Tên miền gốc"
                  value={configData?.tenantRootDomain || 'stockpilot.vn'}
                />
              </div>
            </div>

            {/* Nhóm 2: Đăng nhập */}
            <div className={adminStyles.card}>
              <div className={adminStyles.cardHeader}>
                <h2 className={adminStyles.cardTitle}>Đăng nhập & Xác thực</h2>
              </div>
              <div className="p-4 space-y-0.5">
                <ConfigDetailRow
                  label="Thời hạn phiên (Access Token)"
                  value={auth.accessTokenTtl || '1 ngày'}
                />
                <ConfigDetailRow
                  label="Thời hạn đăng nhập lại (Refresh Token)"
                  value={auth.refreshTokenTtl || '7 ngày'}
                />
                <ConfigDetailRow
                  label="Số phiên đang hoạt động"
                  value={`${auth.activeSessions ?? 0} phiên`}
                />
                <ConfigDetailRow
                  label="Khóa bảo mật JWT"
                  value={auth.usingDefaultJwtSecrets ? 'Đang dùng mặc định' : 'Đã đặt riêng'}
                  status={auth.usingDefaultJwtSecrets ? 'danger' : 'ok'}
                  isDanger={auth.usingDefaultJwtSecrets}
                />
              </div>
            </div>

            {/* Nhóm 3: Giới hạn truy cập (Rate Limit) */}
            <div className={adminStyles.card}>
              <div className={adminStyles.cardHeader}>
                <h2 className={adminStyles.cardTitle}>Giới hạn truy cập</h2>
              </div>
              <div className="p-4 space-y-0.5">
                <ConfigDetailRow
                  label="Trạng thái"
                  value={rateLimit.enabled ? 'Đang bật' : 'Tắt (môi trường dev)'}
                  status={rateLimit.enabled ? 'ok' : 'neutral'}
                />
                <ConfigDetailRow
                  label="Chung (General API)"
                  value={
                    rateLimit.general
                      ? `${rateLimit.general.max} lượt / ${rateLimit.general.windowMs / 60000} phút`
                      : '300 lượt / 15 phút'
                  }
                />
                <ConfigDetailRow
                  label="Đăng nhập & OTP (Auth)"
                  value={
                    rateLimit.auth
                      ? `${rateLimit.auth.max} lượt / ${rateLimit.auth.windowMs / 60000} phút`
                      : '10 lượt / 1 phút'
                  }
                />
              </div>
            </div>

            {/* Nhóm 4: Tích hợp dịch vụ ngoại vi */}
            <div className={adminStyles.card}>
              <div className={adminStyles.cardHeader}>
                <h2 className={adminStyles.cardTitle}>Tích hợp dịch vụ</h2>
              </div>
              <div className="p-4 space-y-0.5">
                <ConfigDetailRow
                  label="Email OTP (SMTP)"
                  value={
                    integrations.smtp?.configured
                      ? `${integrations.smtp.host}:${integrations.smtp.port}`
                      : 'Chưa cấu hình'
                  }
                  status={integrations.smtp?.configured ? 'ok' : 'warning'}
                />
                <ConfigDetailRow
                  label="Lưu trữ ảnh (Cloudinary)"
                  value={integrations.cloudinary?.configured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                  status={integrations.cloudinary?.configured ? 'ok' : 'warning'}
                />
                <ConfigDetailRow
                  label="SMS Brandname"
                  value={integrations.sms?.configured ? integrations.sms.provider : 'Mô phỏng (Simulation)'}
                  status="neutral"
                />
                <ConfigDetailRow
                  label="Cổng thanh toán PayOS"
                  value={
                    integrations.payos?.encryptionKeyConfigured
                      ? `Đã đặt khóa mã hóa (${integrations.payos?.storesConfigured ?? 0} shop dùng)`
                      : 'Thiếu khóa mã hóa'
                  }
                  status={integrations.payos?.encryptionKeyConfigured ? 'ok' : 'warning'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TRỢ LÝ AI (AI PILOT USAGE) ─── */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          {/* Thanh chọn khoảng thời gian */}
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-[13px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#64748B]">Khoảng ngày:</span>
              <input
                type="date"
                value={aiFromDate}
                onChange={(e) => setAiFromDate(e.target.value)}
                className="px-2.5 py-1 text-[12px] rounded-lg border border-[#E5E7EB] bg-white text-[#475569] cursor-pointer"
              />
              <span className="text-[#64748B]">đến</span>
              <input
                type="date"
                value={aiToDate}
                onChange={(e) => setAiToDate(e.target.value)}
                className="px-2.5 py-1 text-[12px] rounded-lg border border-[#E5E7EB] bg-white text-[#475569] cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => applyAiDatePreset(7)}
                className="px-2.5 py-1 rounded text-[12px] text-[#64748B] hover:text-[#334155] hover:bg-slate-100 cursor-pointer"
              >
                7 ngày
              </button>
              <button
                type="button"
                onClick={() => applyAiDatePreset(30)}
                className="px-2.5 py-1 rounded text-[12px] text-[#64748B] hover:text-[#334155] hover:bg-slate-100 cursor-pointer"
              >
                30 ngày
              </button>
              <button
                type="button"
                onClick={() => applyAiDatePreset(90)}
                className="px-2.5 py-1 rounded text-[12px] text-[#64748B] hover:text-[#334155] hover:bg-slate-100 cursor-pointer"
              >
                90 ngày
              </button>
            </div>
          </div>

          {/* 4 Thẻ số liệu chính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Lượt hỏi */}
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <span className="text-[13px] text-[#64748B]">Lượt hỏi</span>
              <div className="text-2xl font-semibold text-[#334155] mt-1 tabular-nums">
                {isLoadingAi ? '—' : totalInteractions.toLocaleString('vi-VN')}
              </div>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">
                {aiTotals.SUCCESS ?? 0} thành công
              </p>
            </div>

            {/* Tỉ lệ lỗi (đỏ nếu > 5%) */}
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <span className="text-[13px] text-[#64748B]">Tỉ lệ lỗi</span>
              <div
                className={`text-2xl font-semibold mt-1 tabular-nums ${
                  isHighError ? 'text-[#DC2626]' : 'text-[#334155]'
                }`}
              >
                {isLoadingAi ? '—' : `${errorRatePercent}%`}
              </div>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">
                {(aiTotals.FAILED ?? 0) + (aiTotals.TIMEOUT ?? 0)} lỗi timeout/kết nối
              </p>
            </div>

            {/* Độ trễ trung bình */}
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <span className="text-[13px] text-[#64748B]">Độ trễ trung bình</span>
              <div className="text-2xl font-semibold text-[#334155] mt-1 tabular-nums">
                {isLoadingAi ? '—' : avgLatencyText}
              </div>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">
                Thời gian sinh phản hồi
              </p>
            </div>

            {/* Token đã dùng */}
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
              <span className="text-[13px] text-[#64748B]">Token đã dùng</span>
              <div className="text-2xl font-semibold text-[#334155] mt-1 tabular-nums">
                {isLoadingAi ? '—' : ((aiTotals.inputTokens ?? 0) + (aiTotals.outputTokens ?? 0)).toLocaleString('vi-VN')}
              </div>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">
                Vào: {inputTokensText} · Ra: {outputTokensText}
              </p>
            </div>
          </div>

          {/* Bảng Theo cửa hàng */}
          <div className={adminStyles.tableContainer}>
            <div className={adminStyles.cardHeader}>
              <h2 className={adminStyles.cardTitle}>Theo cửa hàng</h2>
              <span className="text-[12px] text-[#64748B]">Sắp xếp theo lượt hỏi</span>
            </div>

            <div className="overflow-x-auto">
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th className={adminStyles.th}>Cửa hàng</th>
                    <th className={adminStyles.th}>Lượt hỏi</th>
                    <th className={adminStyles.th}>Lỗi</th>
                    <th className={adminStyles.th}>Độ trễ TB</th>
                    <th className={`${adminStyles.th} text-right`}>Tổng Token</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {isLoadingAi ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${50 + ((i + j) % 3) * 15}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : aiByStore.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-[#64748B]">
                        Chưa có dữ liệu hội thoại AI nào trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    aiByStore.map((row, idx) => {
                      const count = row.interactions || 0;
                      const percent = Math.round((count / maxStoreInteractions) * 100);

                      return (
                        <tr key={idx} className={adminStyles.tr}>
                          {/* Cửa hàng */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-[#334155]">
                              {row.store?.name || `Cửa hàng #${row.store?.id || idx + 1}`}
                            </div>
                            {row.store?.code && (
                              <div className="text-[12px] text-[#64748B]">{row.store.code}</div>
                            )}
                          </td>

                          {/* Lượt hỏi kèm thanh ngang xám tỉ lệ */}
                          <td className="px-4 py-3 whitespace-nowrap min-w-45">
                            <div className="flex items-center gap-3">
                              <span className="text-[#334155] font-medium tabular-nums min-w-8">
                                {count.toLocaleString('vi-VN')}
                              </span>
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-25">
                                <div
                                  className="h-full bg-slate-400 rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Lỗi */}
                          <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                            <span className={row.failed > 0 ? 'text-[#DC2626] font-medium' : 'text-[#64748B]'}>
                              {row.failed ?? 0}
                            </span>
                          </td>

                          {/* Độ trễ TB */}
                          <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#64748B]">
                            {row.avgLatencyMs !== null && row.avgLatencyMs !== undefined
                              ? `${row.avgLatencyMs} ms`
                              : '—'}
                          </td>

                          {/* Token */}
                          <td className="px-4 py-3 whitespace-nowrap text-right text-[12px] text-[#475569] tabular-nums font-medium">
                            {((row.inputTokens ?? 0) + (row.outputTokens ?? 0)).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSystemPage;
