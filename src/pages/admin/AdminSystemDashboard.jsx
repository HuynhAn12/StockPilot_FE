import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Users, FileText, UserCheck, RefreshCw, UserPlus, Download, ArrowRight,
  AlertTriangle, CheckCircle2, CircleAlert, Mail, Image, CreditCard, Gauge, X, Loader2,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import {
  apiGetAdminDashboard,
  apiGetAdminSystemConfig,
  apiExportAdminAuditLogs,
  apiCreateAdminUser,
  formatVNDateTime,
} from '../../services/adminService';
import { actionLabel, apiErrorMessage, formatRelativeTime, isSensitiveAction, roleLabel } from './adminLabels';
import { adminStyles } from './adminStyles';

function buildAttentionItems(data, config) {
  const items = [];
  if (config?.auth?.usingDefaultJwtSecrets) {
    items.push({ level: 'danger', text: 'Máy chủ đang dùng JWT secret mặc định. Cần đặt JWT_SECRET và JWT_REFRESH_SECRET trong file .env.', to: '/admin/system' });
  }
  if (config && !config.integrations?.smtp?.configured) {
    items.push({ level: 'warning', text: 'Chưa cấu hình email (SMTP), người dùng sẽ không nhận được mã OTP.', to: '/admin/system' });
  }
  if (data?.newLeads > 0) {
    items.push({ level: 'warning', text: `${data.newLeads} khách hàng tiềm năng đang chờ liên hệ.`, to: '/admin/leads' });
  }
  if (data?.stores?.inactive > 0) {
    items.push({ level: 'info', text: `${data.stores.inactive} cửa hàng đang tạm khóa.`, to: '/admin/stores' });
  }
  if (data?.users?.locked > 0) {
    items.push({ level: 'info', text: `${data.users.locked} tài khoản đang bị khóa.`, to: '/admin/users' });
  }
  return items;
}

function StatCard({ icon: Icon, label, value, detail, onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-lg border border-[#E5E7EB] p-4 text-left hover:border-[#3B82F6]/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-normal text-[#64748B]">{label}</span>
        <span className="w-8 h-8 rounded-lg bg-slate-50 text-[#64748B] flex items-center justify-center border border-[#E5E7EB]">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-[#334155] tabular-nums">
        {loading ? <span className="inline-block w-12 h-7 rounded bg-slate-100 animate-pulse align-middle" /> : value}
      </div>
      <div className="mt-1 flex items-center justify-between text-[12px] text-[#64748B]">
        <span className="truncate">{detail}</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#3B82F6] transition-colors shrink-0" />
      </div>
    </button>
  );
}

function ConfigRow({ icon: Icon, label, ok, okText, badText }) {
  return (
    <li className="flex items-center gap-2.5 py-2">
      <Icon className="w-4 h-4 text-[#64748B] shrink-0" />
      <span className="flex-1 text-[13px] text-[#475569]">{label}</span>
      {ok ? (
        <span className="inline-flex items-center gap-1 text-[12px] text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {okText}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#D97706]">
          <CircleAlert className="w-3.5 h-3.5" />
          {badText}
        </span>
      )}
    </li>
  );
}

export function AdminSystemDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', actorPassword: '' });
  const [isCreating, setIsCreating] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashboard, cfg] = await Promise.all([apiGetAdminDashboard(), apiGetAdminSystemConfig().catch(() => null)]);
      setData(dashboard);
      setConfig(cfg);
    } catch (err) {
      toast({ type: 'error', title: 'Không tải được tổng quan', description: apiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await apiExportAdminAuditLogs({});
      toast({ type: 'success', title: 'Đã tải file nhật ký', description: 'File CSV đã được lưu vào máy.' });
    } catch (err) {
      toast({ type: 'error', title: 'Không xuất được nhật ký', description: apiErrorMessage(err) });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (createForm.password.length < 8) {
      toast({ type: 'warning', title: 'Mật khẩu quá ngắn', description: 'Mật khẩu cần ít nhất 8 ký tự.' });
      return;
    }
    setIsCreating(true);
    try {
      await apiCreateAdminUser(createForm);
      toast({ type: 'success', title: 'Đã tạo quản trị viên', description: `${createForm.email} có thể đăng nhập ngay.` });
      setCreateOpen(false);
      setCreateForm({ fullName: '', email: '', password: '', actorPassword: '' });
      fetchDashboard();
    } catch (err) {
      toast({ type: 'error', title: 'Không tạo được tài khoản', description: apiErrorMessage(err) });
    } finally {
      setIsCreating(false);
    }
  };

  const stores = data?.stores || { total: 0, active: 0, inactive: 0 };
  const users = data?.users || { total: 0, active: 0, locked: 0, byRole: {} };
  const recentLogs = data?.recentAuditLogs || [];
  const attention = buildAttentionItems(data, config);

  return (
    <div className={adminStyles.pageContainer}>
      {/* Header */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Tổng quan hệ thống</h1>
          <p className={adminStyles.pageDesc}>Tình hình các cửa hàng, tài khoản và hoạt động trên nền tảng.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={fetchDashboard} disabled={isLoading} className={adminStyles.btnSecondary}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button type="button" onClick={() => setCreateOpen(true)} className={adminStyles.btnPrimary}>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tạo quản trị viên</span>
          </button>
        </div>
      </div>

      {/* Việc cần xử lý: chỉ hiện khi có */}
      {!isLoading && attention.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#D97706]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cần xử lý ({attention.length})</span>
          </div>
          <ul className="mt-2 space-y-1">
            {attention.map((item) => (
              <li key={item.text}>
                <button
                  type="button"
                  onClick={() => navigate(item.to)}
                  className={`text-left text-[13px] hover:underline cursor-pointer ${
                    item.level === 'danger' ? 'text-[#DC2626] font-medium' : 'text-[#D97706]'
                  }`}
                >
                  • {item.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chỉ số chính: 4 thẻ đơn giản, icon xám, không tô mỗi thẻ một màu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <StatCard
          icon={Store}
          label="Cửa hàng"
          value={stores.total}
          detail={stores.inactive > 0 ? `${stores.active} hoạt động, ${stores.inactive} tạm khóa` : `${stores.active} đang hoạt động`}
          onClick={() => navigate('/admin/stores')}
          loading={isLoading}
        />
        <StatCard
          icon={Users}
          label="Tài khoản"
          value={users.total}
          detail={`${users.byRole?.SHOP_OWNER ?? 0} chủ shop, ${users.byRole?.WAREHOUSE_STAFF ?? 0} nhân viên`}
          onClick={() => navigate('/admin/users')}
          loading={isLoading}
        />
        <StatCard
          icon={FileText}
          label="Thao tác hôm nay"
          value={data?.auditEventsToday ?? 0}
          detail="Xem nhật ký kiểm toán"
          onClick={() => navigate('/admin/audit-log')}
          loading={isLoading}
        />
        <StatCard
          icon={UserCheck}
          label="Khách tiềm năng mới"
          value={data?.newLeads ?? 0}
          detail="Chưa được liên hệ"
          onClick={() => navigate('/admin/leads')}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Hoạt động gần đây */}
        <section className={`${adminStyles.card} xl:col-span-2 overflow-hidden`}>
          <div className={adminStyles.cardHeader}>
            <h2 className={adminStyles.cardTitle}>Hoạt động gần đây</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/audit-log')}
              className="text-[13px] text-[#3B82F6] hover:text-[#2563EB] cursor-pointer"
            >
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th className={adminStyles.th}>Thời gian</th>
                  <th className={adminStyles.th}>Người thực hiện</th>
                  <th className={adminStyles.th}>Hành động</th>
                  <th className={adminStyles.th}>Cửa hàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${50 + ((i + j) % 3) * 15}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[#64748B]">
                      Chưa có hoạt động nào.
                    </td>
                  </tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log.id} className={adminStyles.tr}>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="text-[#334155]">{formatRelativeTime(log.createdAt) || formatVNDateTime(log.createdAt)}</div>
                        <div className="text-[11px] text-[#94A3B8]">{formatVNDateTime(log.createdAt)}</div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="text-[#334155]">{log.user?.fullName || 'Hệ thống'}</div>
                        <div className="text-[11px] text-[#94A3B8]">{log.user ? roleLabel(log.user.role) : 'Tác vụ tự động'}</div>
                      </td>
                      <td className={`px-4 py-2.5 whitespace-nowrap ${isSensitiveAction(log.action) ? 'text-[#DC2626] font-medium' : 'text-[#475569]'}`}>
                        {actionLabel(log.action)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-[#64748B]">{log.store?.name || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          {/* Cấu hình hệ thống (số liệu thật từ máy chủ) */}
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2 className={adminStyles.cardTitle}>Cấu hình hệ thống</h2>
              <button
                type="button"
                onClick={() => navigate('/admin/system')}
                className="text-[13px] text-[#3B82F6] hover:text-[#2563EB] cursor-pointer"
              >
                Chi tiết
              </button>
            </div>
            <div className="p-4">
              {!config ? (
                <p className="text-[13px] text-[#64748B]">{isLoading ? 'Đang kiểm tra...' : 'Không đọc được cấu hình.'}</p>
              ) : (
                <ul className="divide-y divide-[#E5E7EB]">
                  <ConfigRow icon={Mail} label="Email OTP (SMTP)" ok={config.integrations?.smtp?.configured} okText="Đã cấu hình" badText="Chưa cấu hình" />
                  <ConfigRow icon={Image} label="Lưu trữ ảnh (Cloudinary)" ok={config.integrations?.cloudinary?.configured} okText="Đã cấu hình" badText="Chưa cấu hình" />
                  <ConfigRow
                    icon={CreditCard}
                    label="Thanh toán PayOS"
                    ok={config.integrations?.payos?.encryptionKeyConfigured}
                    okText={`${config.integrations?.payos?.storesConfigured ?? 0} cửa hàng dùng`}
                    badText="Thiếu khóa mã hóa"
                  />
                  <ConfigRow
                    icon={Gauge}
                    label="Giới hạn truy cập"
                    ok={config.rateLimit?.enabled || config.environment !== 'production'}
                    okText={config.rateLimit?.enabled ? 'Đang bật' : 'Tắt (môi trường dev)'}
                    badText="Đang tắt"
                  />
                </ul>
              )}
            </div>
          </section>

          {/* Lối tắt */}
          <section className={adminStyles.card}>
            <div className={adminStyles.cardHeader}>
              <h2 className={adminStyles.cardTitle}>Lối tắt</h2>
            </div>
            <div className="p-4 grid gap-2">
              <button type="button" onClick={handleExport} disabled={isExporting} className={`${adminStyles.btnSecondary} w-full justify-start`}>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-[#64748B]" /> : <Download className="w-4 h-4 text-[#64748B]" />}
                <span>Xuất nhật ký kiểm toán (CSV)</span>
              </button>
              <button type="button" onClick={() => navigate('/admin/stores')} className={`${adminStyles.btnSecondary} w-full justify-start`}>
                <Store className="w-4 h-4 text-[#64748B]" />
                <span>Quản lý cửa hàng</span>
              </button>
              <button type="button" onClick={() => navigate('/admin/users')} className={`${adminStyles.btnSecondary} w-full justify-start`}>
                <Users className="w-4 h-4 text-[#64748B]" />
                <span>Khóa / mở khóa tài khoản</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Hộp thoại tạo quản trị viên */}
      {createOpen && (
        <div className={adminStyles.modalBackdrop}>
          <div className={adminStyles.modalContent}>
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#334155]">Tạo quản trị viên</h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">Tài khoản này quản lý được toàn bộ nền tảng.</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1 rounded text-[#94A3B8] hover:text-[#334155] hover:bg-slate-100 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-5 space-y-3.5">
              {[
                { key: 'fullName', label: 'Họ và tên', type: 'text', placeholder: 'Nguyễn Văn A' },
                { key: 'email', label: 'Email đăng nhập', type: 'email', placeholder: 'ten@stockpilot.vn' },
                { key: 'password', label: 'Mật khẩu cho tài khoản mới', type: 'password', placeholder: 'Ít nhất 8 ký tự' },
                { key: 'actorPassword', label: 'Mật khẩu của bạn (xác nhận)', type: 'password', placeholder: '' },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="block text-[13px] font-medium text-[#334155] mb-1">{f.label}</span>
                  <input
                    type={f.type}
                    required
                    value={createForm[f.key]}
                    onChange={(e) => setCreateForm({ ...createForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className={adminStyles.input}
                  />
                </label>
              ))}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button type="button" onClick={() => setCreateOpen(false)} className={adminStyles.btnSecondary}>
                  Hủy
                </button>
                <button type="submit" disabled={isCreating} className={adminStyles.btnPrimary}>
                  {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Tạo tài khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSystemDashboard;
