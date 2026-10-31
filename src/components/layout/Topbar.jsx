import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, Sun, Moon, Globe, Check, CheckCheck,
  Store, Warehouse, ShieldCheck, AlertTriangle, Tag, Info, ChevronDown,
  User, Boxes, LogOut, Settings, UserPlus, HelpCircle, X, Lock, Mail, Phone, Building2, ShoppingBag, Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useToast } from '../common/Toast';
import { Breadcrumbs } from './Breadcrumbs';
import { apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead } from '../../services/analyticsService';
import { normalizeRole } from '../../config/permissions.config';

function formatRelativeTime(dateStr, isEn) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return isEn ? 'Just now' : 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isEn ? `${diffMin}m ago` : `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return isEn ? `${diffHour}h ago` : `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return isEn ? `${diffDay}d ago` : `${diffDay} ngày trước`;
}

function formatNotificationText(title, desc, isEn) {
  if (!isEn) return { title: title || '', desc: desc || '' };
  let t = title || '';
  let d = desc || '';

  // Title translation
  if (t.includes('Hết hàng:')) {
    t = t.replace('Hết hàng:', 'Out of Stock:');
  } else if (t.includes('Cảnh báo tồn kho thấp')) {
    t = t.replace('Cảnh báo tồn kho thấp:', 'Low Stock Alert:');
  } else if (t.includes('Cảnh báo thừa hàng')) {
    t = t.replace('Cảnh báo thừa hàng:', 'Overstock Alert:');
  } else if (t.includes('Đề xuất tăng giá') || t.includes('Gợi ý tăng giá')) {
    t = t.replace(/(Đề xuất|Gợi ý) tăng giá:/, 'Price Increase:');
  } else if (t.includes('Đề xuất giảm giá') || t.includes('Gợi ý giảm giá')) {
    t = t.replace(/(Đề xuất|Gợi ý) giảm giá:/, 'Price Markdown:');
  } else if (t.includes('Gợi ý giá mới')) {
    t = t.replace('Gợi ý giá mới:', 'New Price Suggestion:');
  } else if (t.includes('Đơn hàng mới')) {
    t = t.replace('Đơn hàng mới:', 'New Order:');
  } else if (t.includes('Hệ thống đồng bộ thành công') || t.includes('Đồng bộ dữ liệu')) {
    t = 'System Synchronized Successfully';
  }

  // Description translation
  if (d.includes('chỉ còn') && d.includes('khả dụng')) {
    d = d.replace(/Sản phẩm (\w+) chỉ còn (\d+) đơn vị khả dụng, dưới điểm đặt hàng (\d+)\./, 'Product $1 has only $2 units left, below reorder point of $3.');
  } else if (d.includes('hiện có sẵn 0 sản phẩm')) {
    d = d.replace(/Sản phẩm (\w+) hiện có sẵn 0 sản phẩm trong kho\. Cần nhập hàng khẩn cấp\./, 'Product $1 has 0 units in stock. Urgent restock required.');
  } else if (d.includes('vượt ngưỡng an toàn')) {
    d = d.replace(/Sản phẩm (\w+) có mức tồn kho vượt ngưỡng an toàn so với tốc độ tiêu thụ hiện tại\./, 'Product $1 stock exceeds safe threshold relative to sales velocity.');
  } else if (d.includes('AI đề xuất điều chỉnh giá từ') || d.includes('AI đề xuất điều chỉnh')) {
    d = d.replace(/AI đề xuất điều chỉnh (giá )?từ ([\d\.]+) đ lên ([\d\.]+) đ.*/, 'AI recommends adjusting price from $2 đ to $3 đ to achieve target margin.');
  } else if (d.includes('Hóa đơn bán lẻ trị giá')) {
    d = d.replace(/Hóa đơn bán lẻ trị giá ([\d\.]+) đ đã được (thanh toán thành công|lập thành công).*/, 'Retail order of $1 đ was successfully created.');
  } else if (d.includes('Dữ liệu tồn kho và số liệu')) {
    d = 'Inventory stock and business analytics synchronized with live database.';
  }

  return { title: t, desc: d };
}

export function Topbar() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuthStore();
  const { theme, setTheme, setSidebarMobileOpen, openCommandPalette } = useUIStore();
  const { t, language, toggleLanguage } = useTranslation();
  const { toast } = useToast();
  const isEn = language === 'en';

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Modals triggered from User Menu
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const currentRole = normalizeRole(user?.role);

  // Fetch notifications từ API thật (bảng notifications trong MySQL) - Chỉ áp dụng cho người dùng thuộc Store
  const fetchRealNotifications = async () => {
    if (!user || currentRole === 'admin') return;
    try {
      const data = await apiGetNotifications({ page: 1, limit: 30 });
      const items = Array.isArray(data) ? data : (data.items || data.data || []);
      const mapped = items.map((n) => ({
        id: n.id,
        title: n.title || n.type || 'Thông báo',
        desc: n.message || n.body || '',
        rawTime: n.createdAt,
        type: n.type || 'system',
        entityType: n.entityType,
        entityId: n.entityId,
        isRead: Boolean(n.isRead),
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (currentRole === 'admin') return;
    fetchRealNotifications();
    // Live polling mỗi 12 giây để bắt đơn hàng mới hoặc cảnh báo kho thời gian thực
    const interval = setInterval(fetchRealNotifications, 12000);
    return () => clearInterval(interval);
  }, [user, currentRole]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast({ type: 'info', title: isEn ? 'Signed out' : 'Đã đăng xuất', message: isEn ? 'See you again!' : 'Hẹn gặp lại!' });
    navigate('/login');
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiMarkAllNotificationsRead();
    } catch (_) {}
    toast({
      type: 'success',
      title: isEn ? 'All caught up' : 'Đã đọc tất cả',
      message: isEn ? 'All notifications marked as read.' : 'Đã đánh dấu đã đọc tất cả thông báo.'
    });
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item));
      try {
        await apiMarkNotificationRead(n.id);
      } catch (_) {}
    }
    setNotificationsOpen(false);

    if (n.type === 'alert' || n.entityType === 'ALERT') {
      navigate('/alerts');
    } else if (n.type === 'pricing' || n.entityType === 'PRICING') {
      navigate('/pricing');
    } else if (n.type === 'order' || n.entityType === 'ORDER') {
      navigate('/orders');
    } else if (n.entityType === 'SUPPORT_TICKET') {
      navigate(`/support?ticket=${n.entityId}`);
    } else {
      navigate('/settings');
    }
  };

  const isAdmin = currentRole === 'admin';

  return (
    <header
      className={cn(
        'h-16 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 transition-colors',
        isAdmin
          ? 'bg-white border-b border-[#E5E7EB] text-[#475569]'
          : 'bg-white/95 backdrop-blur-md border-b border-blue-100/70 text-slate-900'
      )}
    >
      {/* Left: Mobile toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className={cn(
            'p-2 -ml-2 rounded-lg lg:hidden transition-colors',
            'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          aria-label="Mở thanh điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Badge (Phân định màu sắc chuẩn yêu cầu RBAC) */}
        <div
          className={cn(
            'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border select-none transition-colors',
            currentRole === 'store_owner' && 'bg-blue-600 text-white border-blue-700 shadow-xs font-bold',
            currentRole === 'warehouse_staff' && 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
            currentRole === 'admin' && 'bg-slate-700 text-white border-slate-700 font-medium'
          )}
        >
          {currentRole === 'store_owner' && <Store className="w-3.5 h-3.5" />}
          {currentRole === 'warehouse_staff' && <Warehouse className="w-3.5 h-3.5 text-emerald-600" />}
          {currentRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
          <span>
            {currentRole === 'store_owner'
              ? isEn
                ? 'Store Owner'
                : 'Chủ shop'
              : currentRole === 'warehouse_staff'
              ? isEn
                ? 'Staff'
                : 'Nhân viên'
              : isEn
              ? 'Admin'
              : 'Quản trị viên'}
          </span>
        </div>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer',
            language === 'en'
              ? 'border-blue-500 bg-blue-50/70 text-blue-700 shadow-xs ring-1 ring-blue-400/30'
              : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
          )}
          title={language === 'vi' ? 'Switch to English (EN)' : 'Chuyển sang Tiếng Việt (VI)'}
        >
          <Globe
            className={cn(
              'w-3.5 h-3.5',
              language === 'en'
                ? 'text-blue-600'
                : 'text-slate-600'
            )}
          />
          <span className="uppercase font-extrabold">{language}</span>
        </button>

        {/* Notification Bell (store users only) */}
        {!isAdmin && (
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-card" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{t('notifications', 'Thông báo')}</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} {t('new', 'mới')}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <CheckCheck className="w-3.5 h-3.5" />
                    {t('markAllRead', 'Đã đọc')}
                  </button>
                )}
              </div>

              <div className="max-h-84 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">{isEn ? 'No notifications yet' : 'Chưa có thông báo nào'}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{isEn ? 'New alerts and order events will appear here' : 'Cảnh báo kho và đơn hàng mới sẽ xuất hiện tại đây'}</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const formatted = formatNotificationText(n.title, n.desc, isEn);
                    const timeAgo = formatRelativeTime(n.rawTime, isEn);
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          'p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3',
                          !n.isRead && 'bg-blue-50/60 hover:bg-blue-50/90'
                        )}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.type === 'alert' && (
                            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.type === 'pricing' && (
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.type === 'order' && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.type === 'system' && (
                            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                              <Info className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={cn('text-xs truncate', !n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600')}>
                              {formatted.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">{timeAgo}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{formatted.desc}</p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2.5 bg-muted/30 border-t border-border text-center">
                <button onClick={() => { navigate('/alerts'); setNotificationsOpen(false); }} className="text-xs font-medium text-blue-600 hover:underline">
                  {isEn ? 'View all alerts center →' : 'Xem toàn bộ trung tâm cảnh báo →'}
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              'flex items-center gap-2 p-1 rounded-lg transition-colors cursor-pointer',
              'hover:bg-muted'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs',
                'bg-blue-600'
              )}
            >
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold truncate max-w-28 text-foreground">
                {user?.fullName || user?.name || (isEn ? 'User' : 'Người dùng')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {currentRole === 'store_owner'
                  ? isEn
                    ? 'Store Owner'
                    : 'Chủ cửa hàng'
                  : currentRole === 'warehouse_staff'
                  ? isEn
                    ? 'Warehouse Staff'
                    : 'Nhân viên kho'
                  : isEn
                  ? 'Admin'
                  : 'Quản trị viên'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div
              className={cn(
                'absolute right-0 mt-2 w-72 rounded-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 border shadow-2xl',
                'bg-white border-slate-200 text-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]'
              )}
            >
              {/* User Profile Header */}
              <div
                className={cn(
                  'p-3 rounded-xl border mb-2',
                  'bg-linear-to-r from-blue-50 to-indigo-50/60 border-blue-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full text-white font-extrabold text-sm flex items-center justify-center shadow-md shrink-0',
                      'bg-blue-600'
                    )}
                  >
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.name ? user.name.charAt(0) : 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate text-slate-900">
                      {user?.fullName || user?.name || 'Administrator'}
                    </p>
                    <p className="text-xs truncate text-slate-500">
                      {user?.email || 'admin@stockpilot.vn'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs',
                          'bg-blue-600 text-white'
                        )}
                      >
                        {currentRole === 'store_owner'
                          ? isEn
                            ? 'Store Owner (Full Access)'
                            : 'Chủ shop (Toàn quyền)'
                          : currentRole === 'warehouse_staff'
                          ? isEn
                            ? 'Warehouse Staff'
                            : 'NV Kho (Nhập/xuất)'
                          : isEn
                          ? 'Platform admin'
                          : 'Quản trị viên nền tảng'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Menu Items */}
              <div className="space-y-1 py-1">
                {/* THÔNG TIN TÀI KHOẢN */}
                <button
                  onClick={() => {
                    setAccountModalOpen(true);
                    setUserMenuOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer',
                    'text-slate-700 hover:text-blue-700 hover:bg-blue-50/80'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      'bg-blue-100 text-blue-600'
                    )}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-800">
                      {isEn ? 'Account Information' : 'Thông tin tài khoản'}
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate">
                      {isEn ? 'Personal profile, email & security' : 'Hồ sơ cá nhân, email & bảo mật'}
                    </span>
                  </div>
                </button>

                {!isAdmin && (
                  <button
                    onClick={() => {
                      navigate('/staff');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-bold text-slate-800">{isEn ? 'Staff' : 'Nhân viên'}</span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {isEn ? 'Staff list, add, edit & permissions' : 'Danh sách, thêm mới, sửa đổi & phân quyền'}
                      </span>
                    </div>
                  </button>
                )}

                {/* TRỢ GIÚP & HƯỚNG DẪN */}
                <button
                  onClick={() => {
                    setHelpModalOpen(true);
                    setUserMenuOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer',
                    'text-slate-700 hover:text-blue-700 hover:bg-blue-50/80'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      'bg-cyan-100 text-cyan-600'
                    )}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-800">
                      {isEn ? 'Help & Documentation' : 'Trợ giúp & Hướng dẫn'}
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate">
                      {isEn ? 'User guides & StockPilot AI assistant' : 'Tài liệu HDSD & trợ lý AI StockPilot'}
                    </span>
                  </div>
                </button>
              </div>

              {/* ĐĂNG XUẤT KHỎI HỆ THỐNG */}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>{isEn ? 'Sign Out' : 'Đăng xuất khỏi hệ thống'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: THÔNG TIN TÀI KHOẢN (Xếp thứ 1)                       */}
      {/* ============================================================== */}
      {accountModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{isEn ? 'Account Information' : 'Thông tin tài khoản'}</h3>
                  <p className="text-xs text-slate-400">{isEn ? 'Manage personal profile & security' : 'Quản lý hồ sơ cá nhân & bảo mật'}</p>
                </div>
              </div>
              <button onClick={() => setAccountModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Full name' : 'Họ và tên'}</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input type="text" defaultValue={user?.name || 'Trần Minh Hiếu'} className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Login email' : 'Email đăng nhập'}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input type="email" defaultValue={user?.email || 'hieunu999@gmail.com'} className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Contact phone number' : 'Số điện thoại liên hệ'}</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input type="text" defaultValue="0909324543" className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{isEn ? 'Current role' : 'Vai trò hiện tại'}</label>
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs flex items-center justify-between">
                  <span className="font-bold text-blue-700">
                    {currentRole === 'store_owner'
                      ? (isEn ? 'Store Owner (Full Administrative Access)' : 'Chủ cửa hàng (Toàn quyền quản trị)')
                      : currentRole === 'warehouse_staff'
                      ? (isEn ? 'Warehouse Staff & POS' : 'Nhân viên kho & POS')
                      : (isEn ? 'System Administrator' : 'Quản trị viên hệ thống')}
                  </span>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Admin Level</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setAccountModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                onClick={() => {
                  setAccountModalOpen(false);
                  toast({
                    type: 'success',
                    title: isEn ? 'Updated successfully' : 'Cập nhật thành công',
                    message: isEn ? 'Account information has been securely updated!' : 'Thông tin tài khoản đã được lưu an toàn!'
                  });
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
              >
                {isEn ? 'Save changes' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}




      {/* ============================================================== */}
      {/* MODAL 6: TRỢ GIÚP & HƯỚNG DẪN                                  */}
      {/* ============================================================== */}
      {helpModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{isEn ? 'Help & Documentation' : 'Trợ giúp & Hướng dẫn'}</h3>
                  <p className="text-xs text-slate-400">{isEn ? 'StockPilot AI operations support' : 'Hỗ trợ vận hành StockPilot AI'}</p>
                </div>
              </div>
              <button onClick={() => setHelpModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 my-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-1">{isEn ? '📘 Inventory Management Guide' : '📘 Hướng dẫn quản lý tồn kho'}</h4>
                <p className="text-[11px] text-slate-500">{isEn ? 'How to set DOI thresholds, tied-up capital alerts, and optimize cashflow.' : 'Cách thiết lập chỉ số DOI, cảnh báo đọng vốn và tối ưu dòng tiền lưu động.'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-1">{isEn ? '🤖 AI Pilot Assistant' : '🤖 Trợ lý AI Pilot'}</h4>
                <p className="text-[11px] text-slate-500">{isEn ? 'Click the floating button at bottom right or press ⌘K to query live store data.' : 'Bấm nút tròn góc dưới bên phải hoặc phím ⌘K để hỏi đáp số liệu với AI.'}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800">
                <h4 className="font-bold mb-1">{isEn ? '📞 Technical Support Hotline' : '📞 Hotline hỗ trợ kỹ thuật'}</h4>
                <p className="text-[11px]">{isEn ? 'Hotline: 1900 8888 (8:00 AM - 10:00 PM daily)' : 'Tổng đài: 1900 8888 (8:00 - 22:00 hàng ngày)'}</p>
              </div>
            </div>

            <button onClick={() => setHelpModalOpen(false)} className="w-full py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm">
              {isEn ? 'Got it' : 'Đã hiểu'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
