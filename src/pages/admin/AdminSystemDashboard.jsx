import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
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
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../store/authStore';
import { usePolling } from '../../components/support/SupportChat';
import { useTranslation } from '../../i18n/useTranslation';
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
import { StatCard, Avatar, Modal } from './components/AdminUI';

/** Severity configurations with distinctive icon badges and styling */
const LEVEL_CONFIG = {
  danger: {
    border: 'border-l-4 border-l-rose-500 bg-rose-50/40',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-[0_1px_4px_rgba(244,63,94,0.15)]',
    iconBg: 'bg-rose-100/80 text-rose-600',
    tagVi: 'Khẩn cấp',
    tagEn: 'Critical',
  },
  warning: {
    border: 'border-l-4 border-l-amber-500 bg-amber-50/40',
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-[0_1px_4px_rgba(245,158,11,0.15)]',
    iconBg: 'bg-amber-100/80 text-amber-700',
    tagVi: 'Cần chú ý',
    tagEn: 'Warning',
  },
  info: {
    border: 'border-l-4 border-l-blue-500 bg-blue-50/30',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80 shadow-[0_1px_4px_rgba(59,130,246,0.15)]',
    iconBg: 'bg-blue-100/80 text-blue-600',
    tagVi: 'Thông tin',
    tagEn: 'Info',
  },
};

function buildAttention({ data, config, health, leads, support }, isEn) {
  const items = [];
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
  if (health?.http?.serverErrors > 0) {
    items.push({
      level: 'warning',
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
  if (support?.unread > 0) {
    items.push({
      level: 'warning',
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
  } else if (leads?.NEW > 0) {
    items.push({
      level: 'info',
      icon: UserCheck,
      title: isEn ? `${leads.NEW} new inbound leads` : `${leads.NEW} khách tiềm năng mới`,
      detail: isEn
        ? 'Just registered for consulting consultation on the landing page.'
        : 'Vừa đăng ký nhận tư vấn mở cửa hàng trên trang chủ.',
      to: '/admin/leads',
      action: isEn ? 'View Leads' : 'Xem khách',
    });
  }
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
  if (config && !config.integrations?.cloudinary?.configured) {
    items.push({
      level: 'info',
      icon: ImageIcon,
      title: isEn ? 'Cloudinary Media Storage not configured' : 'Chưa cấu hình dịch vụ lưu trữ ảnh (Cloudinary)',
      detail: isEn
        ? 'Stores will not be able to upload product photos and ticket attachments.'
        : 'Cửa hàng sẽ không tải được ảnh sản phẩm và ảnh đính kèm lên hệ thống.',
      to: '/admin/system',
      action: isEn ? 'View Config' : 'Xem cấu hình',
    });
  }
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
  return items;
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
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
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
          <button type="button" onClick={submit} disabled={busy} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEn ? 'Create Account' : 'Tạo tài khoản'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" autoComplete="off">
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

export function AdminSystemDashboard() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isEn = language === 'en';

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
      toast({
        type: 'error',
        title: isEn ? 'Failed to load dashboard metrics' : 'Không tải được số liệu tổng quan',
        description: apiErrorMessage(data.reason),
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
  }, [load]);

  usePolling(load, 60000);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await apiExportAdminAuditLogs({});
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
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

  const { data, health, config, leads, support } = state;
  const attention = buildAttention(state, isEn);
  const stores = data?.stores ?? { total: 0, active: 0, inactive: 0 };
  const idleStores = data?.growth?.idleStores ?? [];
  const recentLogs = data?.recentAuditLogs ?? [];
  const openTickets = support ? support.OPEN + support.IN_PROGRESS + support.WAITING_STORE : 0;

  const isHealthy = health?.database?.status === 'UP' && !config?.auth?.usingDefaultJwtSecrets;

  return (
    <div className="w-full space-y-7 pb-20 text-slate-700 animate-fade-in">
      {/* Executive Command Center Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-slate-800/80"
      >
        {/* Ambient radial blur glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-24 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-300 text-[11px] font-bold tracking-widest uppercase backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Platform Command Center
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[26px] sm:text-[34px] font-black tracking-[-0.03em] text-white leading-tight">
                {greeting(user?.fullName, isEn)}
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[12px] font-semibold text-slate-200">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isHealthy ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </span>
                <span>
                  {lastSyncTime
                    ? `${isEn ? 'Synced at' : 'Đồng bộ lúc'} ${lastSyncTime}`
                    : isEn ? 'Real-time' : 'Thời gian thực'}
                </span>
              </div>
            </div>
            <p className="text-[13px] sm:text-[14px] text-slate-300 font-normal max-w-[65ch] leading-relaxed">
              {todayLabel(isEn)} ·{' '}
              {attention.length > 0
                ? isEn
                  ? `${attention.length} issues require attention`
                  : `Hiện có ${attention.length} vấn đề cần lưu ý xử lý`
                : isEn
                ? 'All infrastructure and services are operating normally'
                : 'Toàn bộ hạ tầng và dịch vụ đang vận hành ổn định'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                load();
              }}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/15 border border-white/15 text-white text-[13px] font-semibold backdrop-blur-md transition-all duration-200 cursor-pointer disabled:opacity-50"
              aria-label={isEn ? 'Refresh metrics' : 'Làm mới số liệu'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isEn ? 'Refresh' : 'Làm mới'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/15 border border-white/15 text-white text-[13px] font-semibold backdrop-blur-md transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isEn ? 'Export Logs' : 'Xuất nhật ký'}
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-400 hover:via-indigo-400 hover:to-blue-500 text-white text-[13px] font-bold shadow-[0_0_24px_rgba(59,130,246,0.45)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isEn ? 'Create Administrator' : 'Tạo quản trị viên'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Danh sách việc cần chú ý (Attention Feed) */}
      {!isLoading && attention.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {isEn ? `Priority Actions (${attention.length})` : `Hành động cần ưu tiên (${attention.length})`}
            </h2>
          </div>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] overflow-hidden">
            {attention.map((item, idx) => {
              const cfg = LEVEL_CONFIG[item.level] || LEVEL_CONFIG.info;
              const Icon = item.icon || AlertTriangle;
              return (
                <div
                  key={`${item.title}-${idx}`}
                  className={`p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${cfg.border}`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${cfg.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-slate-900">{item.title}</p>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                          {isEn ? cfg.tagEn : cfg.tagVi}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed font-normal">{item.detail}</p>
                    </div>
                  </div>
                  <Link to={item.to} className={`${ui.btnSecondary} shrink-0 self-start sm:self-center text-[12px] px-3.5 py-1.5 group`}>
                    {item.action}
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 4 Thẻ chỉ số chính (KPI Cards) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
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
          iconBg="bg-blue-50 text-blue-600 border-blue-200/80 shadow-[0_1px_4px_rgba(59,130,246,0.15)]"
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
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-200/80 shadow-[0_1px_4px_rgba(16,185,129,0.15)]"
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
          iconBg="bg-amber-50 text-amber-600 border-amber-200/80 shadow-[0_1px_4px_rgba(245,158,11,0.15)]"
          alert={support?.unread > 0}
          to="/admin/support"
          loading={isLoading}
        />
        <StatCard
          title={isEn ? "Today's Audit Events" : 'Thao tác hôm nay'}
          value={(data?.auditEventsToday ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
          subtitle={isEn ? 'Recorded audit events' : 'Sự kiện kiểm toán ghi nhận'}
          icon={Activity}
          iconBg="bg-purple-50 text-purple-600 border-purple-200/80 shadow-[0_1px_4px_rgba(168,85,247,0.15)]"
          to="/admin/audit-log"
          loading={isLoading}
        />
      </motion.div>

      {/* Bố cục 2 cột: Hoạt động gần đây + Cửa hàng cần quan tâm */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-6 items-start"
      >
        {/* Panel 1: Hoạt động gần đây (Audit log stream) */}
        <section className={`${ui.card} overflow-hidden`}>
          <div className="px-5 py-4.5 border-b border-slate-100/90 bg-linear-to-r from-slate-50/50 via-white to-transparent flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                {isEn ? 'Recent Platform Activities' : 'Hoạt động nền tảng gần đây'}
              </h2>
              <p className="text-[12px] text-slate-500 font-normal">
                {isEn ? 'Real-time stream directly from audit log' : 'Trích xuất trực tiếp từ nhật ký kiểm toán'}
              </p>
            </div>
            <Link to="/admin/audit-log" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              {isEn ? 'View Full Log' : 'Toàn bộ nhật ký'}{' '}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
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
            <p className="p-10 text-center text-[13px] text-slate-500">
              {isEn ? 'No administrative events recorded today yet.' : 'Chưa có hoạt động nào được ghi nhận hôm nay.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentLogs.map((log) => {
                const name = log.user?.fullName || (isEn ? 'System' : 'Hệ thống');
                const isAdmin = log.user?.role === 'ADMIN';
                const sensitive = isSensitiveAction(log.action);

                return (
                  <li key={log.id} className="p-4 flex items-center gap-3.5 hover:bg-slate-50/70 transition-colors">
                    <Avatar name={name} tone={isAdmin ? 'brand' : 'neutral'} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-700 leading-snug truncate">
                        <span className="font-bold text-slate-900">{name}</span>{' '}
                        <span className={sensitive ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {actionLabel(log.action, language).toLowerCase()}
                        </span>
                      </p>
                      <p className="text-[12px] text-slate-500 truncate mt-0.5 font-normal">
                        {log.store?.name || (log.user ? roleLabel(log.user.role, language) : isEn ? 'Server Background Task' : 'Tác vụ máy chủ')}
                      </p>
                    </div>
                    <time
                      className="text-[11px] text-slate-400 shrink-0 font-semibold whitespace-nowrap bg-slate-100/80 px-2 py-0.5 rounded-md"
                      dateTime={log.createdAt}
                      title={formatVNDateTime(log.createdAt)}
                    >
                      {formatRelativeTime(log.createdAt, language) || formatVNDateTime(log.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Panel 2: Cửa hàng cần quan tâm (Churn Risk) */}
        <section className={`${ui.card} overflow-hidden`}>
          <div className="px-5 py-4.5 border-b border-slate-100/90 bg-linear-to-r from-slate-50/50 via-white to-transparent flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                {isEn ? 'Stores Requiring Care' : 'Cửa hàng cần chăm sóc'}
              </h2>
              <p className="text-[12px] text-slate-500 font-normal">
                {isEn ? 'No activity for over 14 days' : 'Không có hoạt động trên 14 ngày'}
              </p>
            </div>
            <Link to="/admin/stores" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              {isEn ? 'View All' : 'Xem tất cả'}{' '}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 rounded bg-slate-100 animate-pulse w-2/3" />
                    <div className="h-3 rounded bg-slate-100 animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : idleStores.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <span className="mx-auto w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-2">
                <Store className="w-5 h-5" />
              </span>
              <p className="text-[13px] font-semibold text-slate-800">
                {isEn ? 'All stores are actively operating' : 'Tất cả cửa hàng đều hoạt động thường xuyên'}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5 font-normal">
                {isEn ? 'No stores are currently at risk of abandonment.' : 'Không có cửa hàng nào bị gián đoạn hoạt động.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {idleStores.slice(0, 6).map((store) => (
                <li key={store.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-600 font-bold">
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{store.name}</p>
                      <p className="text-[12px] text-slate-500 truncate font-normal">
                        {isEn ? 'Code: ' : 'Mã: '}
                        <span className="font-mono text-slate-700 font-semibold">{store.code}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {store.daysIdle} {isEn ? 'days ago' : 'ngày trước'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </motion.div>

      {/* Modal tạo nhanh quản trị viên */}
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
