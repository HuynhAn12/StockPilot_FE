import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  UserPlus,
  Download,
  Loader2,
  X,
  Phone,
  Store,
  Users,
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
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../store/authStore';
import { usePolling } from '../../components/support/SupportChat';
import {
  apiGetAdminDashboard,
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
import { StatCard, LiveIndicator, Avatar, Modal } from './components/AdminUI';

/** Severity configurations with distinctive icon badges and styling */
const LEVEL_CONFIG = {
  danger: {
    border: 'border-l-4 border-l-red-500 bg-red-50/30',
    badge: 'bg-red-50 text-red-700 border-red-200',
    iconBg: 'bg-red-100 text-red-600',
    tag: 'Khẩn cấp',
  },
  warning: {
    border: 'border-l-4 border-l-amber-500 bg-amber-50/25',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBg: 'bg-amber-100 text-amber-700',
    tag: 'Cần chú ý',
  },
  info: {
    border: 'border-l-4 border-l-blue-500 bg-blue-50/20',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-600',
    tag: 'Thông tin',
  },
};

function buildAttention({ data, config, health, leads, support }) {
  const items = [];
  if (health && health.database?.status !== 'UP') {
    items.push({
      level: 'danger',
      icon: Database,
      title: 'Mất kết nối cơ sở dữ liệu',
      detail: 'Cửa hàng không thể bán hàng và ghi nhận dữ liệu cho tới khi máy chủ MySQL hoạt động lại.',
      to: '/admin/system',
      action: 'Xem sức khỏe',
    });
  }
  if (health?.http?.serverErrors > 0) {
    items.push({
      level: 'warning',
      icon: AlertTriangle,
      title: `${health.http.serverErrors} lỗi máy chủ (5xx) trong 24 giờ qua`,
      detail: 'Xem danh sách lỗi gần đây và mã tra cứu requestId để tìm nguyên nhân.',
      to: '/admin/system',
      action: 'Xem mã lỗi',
    });
  }
  if (config?.auth?.usingDefaultJwtSecrets) {
    items.push({
      level: 'danger',
      icon: ShieldAlert,
      title: 'Khóa bảo mật đăng nhập JWT đang dùng giá trị mặc định',
      detail: 'Cần đặt biến JWT_SECRET và JWT_REFRESH_SECRET an toàn trong file .env của máy chủ.',
      to: '/admin/system',
      action: 'Xem cấu hình',
    });
  }
  if (support?.unread > 0) {
    items.push({
      level: 'warning',
      icon: LifeBuoy,
      title: `${support.unread} yêu cầu hỗ trợ có tin nhắn mới`,
      detail: 'Cửa hàng đang chờ đội ngũ hỗ trợ kỹ thuật phản hồi.',
      to: '/admin/support',
      action: 'Trả lời ngay',
    });
  }
  if (leads?.waitingOver24h > 0) {
    items.push({
      level: 'warning',
      icon: UserCheck,
      title: `${leads.waitingOver24h} khách tiềm năng chờ quá 24 giờ`,
      detail: 'Họ đã để lại số điện thoại trên trang chủ nhưng chưa có nhân viên gọi lại.',
      to: '/admin/leads',
      action: 'Gọi khách ngay',
    });
  } else if (leads?.NEW > 0) {
    items.push({
      level: 'info',
      icon: UserCheck,
      title: `${leads.NEW} khách tiềm năng mới`,
      detail: 'Vừa đăng ký nhận tư vấn mở cửa hàng trên trang chủ.',
      to: '/admin/leads',
      action: 'Xem khách',
    });
  }
  if (config && !config.integrations?.smtp?.configured) {
    items.push({
      level: 'warning',
      icon: Mail,
      title: 'Chưa cấu hình máy chủ gửi email (SMTP)',
      detail: 'Người dùng sẽ không nhận được mã xác thực OTP khi đăng ký hoặc quên mật khẩu.',
      to: '/admin/system',
      action: 'Xem cấu hình',
    });
  }
  if (config && !config.integrations?.cloudinary?.configured) {
    items.push({
      level: 'info',
      icon: ImageIcon,
      title: 'Chưa cấu hình dịch vụ lưu trữ ảnh (Cloudinary)',
      detail: 'Cửa hàng sẽ không tải được ảnh sản phẩm và ảnh đính kèm lên hệ thống.',
      to: '/admin/system',
      action: 'Xem cấu hình',
    });
  }
  const idle = data?.growth?.idleStores ?? [];
  if (idle.length > 0) {
    items.push({
      level: 'info',
      icon: Clock,
      title:
        idle.length === 1
          ? `${idle[0].name} không đăng nhập ${idle[0].daysIdle} ngày`
          : `${idle.length} cửa hàng không đăng nhập từ 14 ngày trở lên`,
      detail: 'Nên liên hệ hỏi thăm trước khi cửa hàng ngừng gia hạn dịch vụ.',
      to: '/admin/stores',
      action: 'Xem cửa hàng',
    });
  }
  if (data?.stores?.inactive > 0) {
    items.push({
      level: 'info',
      icon: Store,
      title: `${data.stores.inactive} cửa hàng đang tạm khóa`,
      detail: 'Mở lại khi cửa hàng đã gia hạn dịch vụ hoặc khắc phục xong vi phạm.',
      to: '/admin/stores',
      action: 'Xem cửa hàng',
    });
  }
  return items;
}

function greeting(name) {
  const h = new Date().getHours();
  const part = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const fullName = String(name || '').replace(/\(.*?\)/g, '').trim();
  return fullName ? `${part}, ${fullName}` : part;
}

function todayLabel() {
  const s = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function CreateAdminDialog({ onClose, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', actorPassword: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({ type: 'warning', title: 'Mật khẩu quá ngắn', description: 'Mật khẩu mới cần ít nhất 8 ký tự.' });
      return;
    }
    setBusy(true);
    try {
      await apiCreateAdminUser(form);
      toast({ type: 'success', title: 'Đã tạo quản trị viên', description: `${form.email} có thể đăng nhập ngay.` });
      onCreated();
    } catch (err) {
      toast({ type: 'error', title: 'Không tạo được tài khoản', description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Tạo tài khoản Quản trị viên"
      description="Tài khoản Quản trị viên có toàn quyền kiểm soát nền tảng, quản lý mọi người dùng và cửa hàng."
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            Hủy
          </button>
          <button type="button" onClick={submit} disabled={busy} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Tạo tài khoản
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" autoComplete="off">
        <div>
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Họ và tên</label>
          <input
            type="text"
            required
            autoComplete="off"
            placeholder="Ví dụ: Nguyễn Văn An"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={ui.input}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Email đăng nhập</label>
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
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Mật khẩu ban đầu</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={ui.input}
          />
        </div>
        <div className="pt-3 border-t border-slate-200">
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Mật khẩu xác nhận của bạn</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Nhập mật khẩu của bạn để xác thực"
            value={form.actorPassword}
            onChange={(e) => setForm({ ...form, actorPassword: e.target.value })}
            className={ui.input}
          />
          <span className="block text-[12px] text-[#64748B] mt-1.5">
            Thao tác cấp quyền quản trị yêu cầu bạn nhập lại mật khẩu hiện tại.
          </span>
        </div>
      </form>
    </Modal>
  );
}

export function AdminSystemDashboard() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [state, setState] = useState({ data: null, config: null, health: null, leads: null, support: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');

  const load = useCallback(async () => {
    const [data, config, health, leads, support] = await Promise.allSettled([
      apiGetAdminDashboard(),
      apiGetAdminSystemConfig(),
      apiGetAdminSystemHealth(),
      apiListAdminLeads({ limit: 1 }),
      apiAdminListTickets({ limit: 1 }),
    ]);

    if (data.status === 'rejected') {
      toast({ type: 'error', title: 'Không tải được số liệu tổng quan', description: apiErrorMessage(data.reason) });
    }

    const value = (r) => (r.status === 'fulfilled' ? r.value : null);
    setState({
      data: value(data),
      config: value(config),
      health: value(health),
      leads: value(leads)?.summary ?? null,
      support: value(support)?.summary ?? null,
    });
    setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  usePolling(load, 60000);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await apiExportAdminAuditLogs({});
      toast({ type: 'success', title: 'Đã xuất nhật ký kiểm toán', description: 'File CSV đã được tải xuống máy.' });
    } catch (err) {
      toast({ type: 'error', title: 'Không xuất được nhật ký', description: apiErrorMessage(err) });
    } finally {
      setIsExporting(false);
    }
  };

  const { data, health, config, leads, support } = state;
  const attention = buildAttention(state);
  const stores = data?.stores ?? { total: 0, active: 0, inactive: 0 };
  const idleStores = data?.growth?.idleStores ?? [];
  const recentLogs = data?.recentAuditLogs ?? [];
  const openTickets = support ? support.OPEN + support.IN_PROGRESS + support.WAITING_STORE : 0;

  const isHealthy = health?.database?.status === 'UP' && !config?.auth?.usingDefaultJwtSecrets;

  return (
    <div className="w-full space-y-6 pb-16 text-[#334155]">
      {/* Header chỉ huy chính */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#0F172A] leading-tight">
              {greeting(user?.fullName)}
            </h1>
            <LiveIndicator
              status={isHealthy ? 'synced' : 'error'}
              lastUpdated={lastSyncTime}
              onRefresh={() => {
                setIsLoading(true);
                load();
              }}
              loading={isLoading}
            />
          </div>
          <p className="text-[13px] sm:text-[14px] text-[#64748B] mt-1">
            {todayLabel()} · {attention.length > 0 ? `Hiện có ${attention.length} vấn đề cần lưu ý` : 'Hệ thống vận hành trơn tru'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              load();
            }}
            disabled={isLoading}
            className={ui.btnSecondary}
            aria-label="Làm mới số liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button type="button" onClick={handleExport} disabled={isExporting} className={ui.btnSecondary}>
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Xuất nhật ký
          </button>
          <button type="button" onClick={() => setCreateOpen(true)} className={ui.btnPrimary}>
            <UserPlus className="w-3.5 h-3.5" />
            Tạo quản trị viên
          </button>
        </div>
      </div>

      {/* Danh sách việc cần chú ý (Attention Feed) */}
      {!isLoading && attention.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#475569]">
              Hành động cần ưu tiên ({attention.length})
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden">
            {attention.map((item, idx) => {
              const cfg = LEVEL_CONFIG[item.level] || LEVEL_CONFIG.info;
              const Icon = item.icon || AlertTriangle;
              return (
                <div
                  key={`${item.title}-${idx}`}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${cfg.border}`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-[#0F172A]">{item.title}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.2 rounded-full border ${cfg.badge}`}>
                          {cfg.tag}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#64748B] mt-0.5 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                  <Link to={item.to} className={`${ui.btnSecondary} shrink-0 self-start sm:self-center text-[12px]`}>
                    {item.action}
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Thẻ chỉ số chính (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cửa hàng hoạt động"
          value={`${stores.active} / ${stores.total}`}
          subtitle={idleStores.length ? `${idleStores.length} shop ít đăng nhập` : 'Tất cả hoạt động đều'}
          icon={Store}
          iconBg="bg-blue-50 text-[#2563EB] border-blue-100"
          alert={idleStores.length > 0}
          to="/admin/stores"
          loading={isLoading}
        />
        <StatCard
          title="Khách tiềm năng mới"
          value={leads?.NEW ?? 0}
          subtitle={leads?.waitingOver24h ? `${leads.waitingOver24h} khách chờ > 24h` : `Tổng ${leads?.total ?? 0} khách`}
          icon={UserCheck}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
          alert={leads?.waitingOver24h > 0}
          to="/admin/leads"
          loading={isLoading}
        />
        <StatCard
          title="Yêu cầu hỗ trợ mở"
          value={openTickets}
          subtitle={support?.unread ? `${support.unread} tin nhắn mới chưa đọc` : 'Đang xử lý ổn thỏa'}
          icon={LifeBuoy}
          iconBg="bg-amber-50 text-amber-600 border-amber-100"
          alert={support?.unread > 0}
          to="/admin/support"
          loading={isLoading}
        />
        <StatCard
          title="Thao tác hôm nay"
          value={(data?.auditEventsToday ?? 0).toLocaleString('vi-VN')}
          subtitle="Sự kiện kiểm toán ghi nhận"
          icon={Activity}
          iconBg="bg-purple-50 text-purple-600 border-purple-100"
          to="/admin/audit-log"
          loading={isLoading}
        />
      </div>

      {/* Bố cục 2 cột: Hoạt động gần đây + Cửa hàng cần quan tâm */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        {/* Panel 1: Hoạt động gần đây (Audit log stream) */}
        <section className={`${ui.card} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight">Hoạt động nền tảng gần đây</h2>
              <p className="text-[12px] text-[#64748B]">Trích xuất trực tiếp từ nhật ký kiểm toán</p>
            </div>
            <Link to="/admin/audit-log" className="text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1">
              Toàn bộ nhật ký <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 rounded bg-slate-100 animate-pulse w-3/4" />
                    <div className="h-3 rounded bg-slate-100 animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="p-8 text-center text-[13px] text-[#64748B]">Chưa có hoạt động nào được ghi nhận hôm nay.</p>
          ) : (
            <ul className="divide-y divide-[#F1F5F9]">
              {recentLogs.map((log) => {
                const name = log.user?.fullName || 'Hệ thống';
                const isAdmin = log.user?.role === 'ADMIN';
                const sensitive = isSensitiveAction(log.action);

                return (
                  <li key={log.id} className="p-4 flex items-center gap-3.5 hover:bg-slate-50/70 transition-colors">
                    <Avatar name={name} tone={isAdmin ? 'brand' : 'neutral'} size={34} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#334155] leading-snug truncate">
                        <span className="font-semibold text-[#0F172A]">{name}</span>{' '}
                        <span className={sensitive ? 'text-red-700 font-semibold' : 'text-[#475569]'}>
                          {actionLabel(log.action).toLowerCase()}
                        </span>
                      </p>
                      <p className="text-[12px] text-[#64748B] truncate mt-0.5">
                        {log.store?.name || (log.user ? roleLabel(log.user.role) : 'Tác vụ máy chủ')}
                      </p>
                    </div>
                    <time
                      className="text-[12px] text-[#94A3B8] shrink-0 font-medium whitespace-nowrap"
                      dateTime={log.createdAt}
                      title={formatVNDateTime(log.createdAt)}
                    >
                      {formatRelativeTime(log.createdAt) || formatVNDateTime(log.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Panel 2: Cửa hàng cần quan tâm (Churn Risk) */}
        <section className={`${ui.card} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight">Cửa hàng cần chăm sóc</h2>
              <p className="text-[12px] text-[#64748B]">Không có hoạt động trên 14 ngày</p>
            </div>
            <Link to="/admin/stores" className="text-[13px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {idleStores.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#64748B]">
              <span className="inline-block p-2 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <Store className="w-5 h-5" />
              </span>
              <p className="font-medium text-[#0F172A]">Tất cả cửa hàng đều đang hoạt động tốt</p>
              <p className="text-[12px] text-[#64748B] mt-0.5">Mọi cửa hàng đều có phiên đăng nhập trong 14 ngày qua.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#F1F5F9]">
              {idleStores.slice(0, 6).map((st) => (
                <li key={st.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#0F172A] truncate">{st.name}</p>
                    <p className="text-[12px] text-[#64748B] truncate mt-0.5">
                      Chủ shop: {st.owner?.fullName || 'Chưa liên kết'}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Clock className="w-3 h-3" /> {st.daysIdle} ngày chưa đăng nhập
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {st.phone && (
                      <a
                        href={`tel:${st.phone}`}
                        className={`${ui.btnSecondary} px-2.5 py-1.5 text-[12px]`}
                        title={`Gọi ${st.phone}`}
                        aria-label={`Gọi ${st.name}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Gọi</span>
                      </a>
                    )}
                    <Link
                      to={`/admin/stores?id=${st.id}`}
                      className={`${ui.btnGhost} p-2`}
                      title="Xem chi tiết cửa hàng"
                      aria-label="Xem chi tiết"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {createOpen && (
        <CreateAdminDialog
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export default AdminSystemDashboard;
