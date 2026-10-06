import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, Sun, Moon, Globe, Check, CheckCheck,
  Store, Warehouse, ShieldCheck, AlertTriangle, Tag, Info, ChevronDown,
  User, Boxes, LogOut, Settings, UserPlus, BellRing, HelpCircle, X, Lock, Mail, Phone, Building2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useToast } from '../common/Toast';
import { Breadcrumbs } from './Breadcrumbs';
import { apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead } from '../../services/analyticsService';

const INITIAL_NOTIFICATIONS = [
  { id: 'n-1', title: 'Hết hàng khẩn cấp', desc: 'Cà phê Arabica Đà Lạt đã chạm mức 0 hộp!', time: '10 phút trước', type: 'alert', isRead: false },
  { id: 'n-2', title: 'Gợi ý giá mới', desc: 'AI đề xuất giảm 10% Váy Maxi hoa nhí để giải phóng tồn kho.', time: '25 phút trước', type: 'pricing', isRead: false },
  { id: 'n-3', title: 'Tồn kho dư thừa', desc: 'Nồi chiên không dầu Lock&Lock tồn 92 ngày vượt ngưỡng.', time: '1 giờ trước', type: 'alert', isRead: false },
  { id: 'n-4', title: 'Đồng bộ dữ liệu thành công', desc: 'Hệ thống đã cập nhật số liệu bán hàng 24h qua.', time: '3 giờ trước', type: 'system', isRead: true },
];

export function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, language, setLanguage, setSidebarMobileOpen, openCommandPalette } = useUIStore();
  const { toast } = useToast();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Modals triggered from User Menu
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [storeSettingsModalOpen, setStoreSettingsModalOpen] = useState(false);
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const currentRole = user?.role || 'store_owner';

  // Fetch notifications từ API thật (bảng notifications)
  useEffect(() => {
    if (user) {
      apiGetNotifications({ page: 1, limit: 20 })
        .then((data) => {
          const items = Array.isArray(data) ? data : (data.items || data.data || []);
          if (items.length > 0) {
            // Map backend format sang UI format
            const mapped = items.map((n) => ({
              id: n.id,
              title: n.title || n.type || 'Thông báo',
              desc: n.message || n.body || '',
              time: new Date(n.createdAt).toLocaleString('vi-VN'),
              type: n.type || 'system',
              isRead: n.isRead || false,
            }));
            setNotifications(mapped);
          }
        })
        .catch(() => {}); // giữ INITIAL_NOTIFICATIONS nếu lỗi
    }
  }, [user]);

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
    toast({ type: 'info', title: 'Đã đăng xuất', message: 'Hẹn gặp lại!' });
    navigate('/login');
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try { await apiMarkAllNotificationsRead(); } catch (_) {}
    toast({ type: 'info', title: 'Đã đánh dấu đã đọc tất cả thông báo' });
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-blue-100/70 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Mobile toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden"
          aria-label="Mở thanh điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <button
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-xs text-muted-foreground border border-border/80 transition-colors cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Tìm kiếm & Thao tác...</span>
          <kbd className="ml-2 font-mono text-[10px] bg-card px-1.5 py-0.5 rounded border">⌘K</kbd>
        </button>
        <button onClick={openCommandPalette} className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Tìm kiếm">
          <Search className="w-4 h-4" />
        </button>

        {/* Role Badge — hiển thị vai trò hiện tại, không click */}
        <div className={cn(
          'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border select-none',
          currentRole === 'store_owner' && 'bg-blue-50 text-blue-700 border-blue-200',
          currentRole === 'warehouse_staff' && 'bg-amber-50 text-amber-700 border-amber-200',
          currentRole === 'admin' && 'bg-blue-100 text-blue-800 border-blue-300'
        )}>
          {currentRole === 'store_owner' && <Store className="w-3.5 h-3.5" />}
          {currentRole === 'warehouse_staff' && <Warehouse className="w-3.5 h-3.5" />}
          {currentRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
          <span>
            {currentRole === 'store_owner' ? 'Chủ shop' : currentRole === 'warehouse_staff' ? 'NV Kho' : 'Admin'}
          </span>
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-semibold"
        >
          <Globe className="w-4 h-4" />
          <span className="uppercase">{language}</span>
        </button>


        {/* Notification Bell */}
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
                  <span className="font-semibold text-sm text-foreground">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Đọc tất cả
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'p-3 hover:bg-muted/50 transition-colors cursor-pointer flex items-start gap-3',
                      !n.isRead && 'bg-blue-50/50'
                    )}
                    onClick={() => {
                      if (n.type === 'alert') navigate('/alerts');
                      else if (n.type === 'pricing') navigate('/pricing');
                      setNotificationsOpen(false);
                    }}
                  >
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'alert' && <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5" /></div>}
                      {n.type === 'pricing' && <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Tag className="w-3.5 h-3.5" /></div>}
                      {n.type === 'system' && <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Info className="w-3.5 h-3.5" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn('text-xs font-semibold truncate', !n.isRead ? 'text-foreground' : 'text-muted-foreground')}>{n.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-muted/30 border-t border-border text-center">
                <button onClick={() => { navigate('/alerts'); setNotificationsOpen(false); }} className="text-xs font-medium text-blue-600 hover:underline">
                  Xem toàn bộ trung tâm cảnh báo →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground truncate max-w-28">{user?.name || 'Người dùng'}</span>
              <span className="text-[10px] text-muted-foreground">
                {currentRole === 'store_owner' ? 'Chủ cửa hàng' : currentRole === 'warehouse_staff' ? 'Nhân viên kho' : 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Profile Header */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-100 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shrink-0">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Nguyễn Thị Lan'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || 'owner@demo.vn'}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                        {currentRole === 'store_owner' ? 'Chủ shop (Toàn quyền)' : currentRole === 'warehouse_staff' ? 'NV Kho (Nhập/xuất)' : 'Admin hệ thống'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Menu Items - Ordered Exactly as Requested */}
              <div className="space-y-1 py-1">
                {/* 1. THÔNG TIN TÀI KHOẢN (Thứ 1) */}
                <button
                  onClick={() => { setAccountModalOpen(true); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-800">1. Thông tin tài khoản</span>
                    <span className="block text-[10px] text-slate-400 truncate">Hồ sơ cá nhân, email & đổi mật khẩu</span>
                  </div>
                </button>

                {/* 2. CÀI ĐẶT TÀI KHOẢN & CỬA HÀNG (Thứ 2) */}
                <button
                  onClick={() => { setStoreSettingsModalOpen(true); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-800">2. Cài đặt tài khoản & Cửa hàng</span>
                    <span className="block text-[10px] text-slate-400 truncate">Cấu hình shop, chi nhánh & kho hàng</span>
                  </div>
                </button>

                {/* 3. THÊM NHÂN VIÊN (Thứ 3) */}
                <button
                  onClick={() => { setAddStaffModalOpen(true); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-800">3. Thêm nhân viên</span>
                    <span className="block text-[10px] text-slate-400 truncate">Mời nhân viên kho, thu ngân & phân quyền</span>
                  </div>
                </button>

                {/* 4. CÀI ĐẶT THÔNG BÁO & CẢNH BÁO (Thứ 4) */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    toast({ type: 'info', title: 'Cài đặt thông báo', message: 'Hệ thống đang bật chế độ cảnh báo tự động tồn kho & đọng vốn.' });
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-800">4. Cài đặt thông báo & Cảnh báo</span>
                    <span className="block text-[10px] text-slate-400 truncate">Ngưỡng báo hết hàng & chuông thông báo</span>
                  </div>
                </button>

                {/* 5. PHÍM TẮT NHANH (Thứ 5) */}
                <button
                  onClick={() => { openCommandPalette(); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-colors flex items-center justify-between font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-slate-800">5. Phím tắt nhanh</span>
                      <span className="block text-[10px] text-slate-400 truncate">Tìm kiếm nhanh mọi chức năng</span>
                    </div>
                  </div>
                  <kbd className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded border border-slate-200 shrink-0">⌘K</kbd>
                </button>

                {/* 6. TRỢ GIÚP & HƯỚNG DẪN (Thứ 6) */}
                <button
                  onClick={() => { setHelpModalOpen(true); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-800">6. Trợ giúp & Hướng dẫn</span>
                    <span className="block text-[10px] text-slate-400 truncate">Tài liệu HDSD & trợ lý AI StockPilot</span>
                  </div>
                </button>
              </div>

              {/* 7. ĐĂNG XUẤT KHỎI HỆ THỐNG (Thứ 7) */}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors font-bold flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>7. Đăng xuất khỏi hệ thống</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: THÔNG TIN TÀI KHOẢN (Xếp thứ 1)                       */}
      {/* ============================================================== */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Thông tin tài khoản</h3>
                  <p className="text-xs text-slate-400">Quản lý hồ sơ cá nhân & bảo mật</p>
                </div>
              </div>
              <button onClick={() => setAccountModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và tên</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input type="text" defaultValue={user?.name || 'Nguyễn Thị Lan'} className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email đăng nhập</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input type="email" defaultValue={user?.email || 'owner@demo.vn'} className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại liên hệ</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input type="text" defaultValue="0912 345 678" className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vai trò hiện tại</label>
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs flex items-center justify-between">
                  <span className="font-bold text-blue-700">Chủ cửa hàng (Toàn quyền quản trị)</span>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Admin Level</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setAccountModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
                Đóng
              </button>
              <button
                onClick={() => {
                  setAccountModalOpen(false);
                  toast({ type: 'success', title: 'Cập nhật thành công', message: 'Thông tin tài khoản đã được lưu an toàn!' });
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CÀI ĐẶT TÀI KHOẢN & CỬA HÀNG (Xếp thứ 2)              */}
      {/* ============================================================== */}
      {storeSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cài đặt Cửa hàng & Kho hàng</h3>
                  <p className="text-xs text-slate-400">Cấu hình thông tin pháp lý & thông số kho</p>
                </div>
              </div>
              <button onClick={() => setStoreSettingsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên cửa hàng / Doanh nghiệp</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input type="text" defaultValue="Cửa hàng Thực phẩm Lan Mart" className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mã số thuế</label>
                  <input type="text" defaultValue="0318928392" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kho hàng chính</label>
                  <input type="text" defaultValue="Kho Tổng Cầu Diễn (Hà Nội)" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mức cảnh báo tồn an toàn mặc định (DOI)</label>
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={7} className="w-24 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 text-center" />
                  <span className="text-xs text-slate-500">ngày bán (Tự động kích hoạt cảnh báo hết hàng nếu tồn &lt; 7 ngày)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setStoreSettingsModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
                Đóng
              </button>
              <button
                onClick={() => {
                  setStoreSettingsModalOpen(false);
                  toast({ type: 'success', title: 'Đã lưu cấu hình cửa hàng', message: 'Thông tin cửa hàng & kho đã cập nhật thành công!' });
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: THÊM NHÂN VIÊN (Xếp thứ 3)                            */}
      {/* ============================================================== */}
      {addStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Thêm nhân viên mới</h3>
                  <p className="text-xs text-slate-400">Tạo tài khoản và phân quyền truy cập</p>
                </div>
              </div>
              <button onClick={() => setAddStaffModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và tên nhân viên *</label>
                <input type="text" placeholder="VD: Trần Văn Minh" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email tài khoản *</label>
                <input type="email" placeholder="VD: minh.tran@demo.vn" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vai trò & Phân quyền *</label>
                <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500">
                  <option value="warehouse_staff">Nhân viên kho (Nhập / Xuất / Kiểm kho)</option>
                  <option value="cashier">Thu ngân (Bán lẻ & Lên đơn hàng)</option>
                  <option value="manager">Quản lý chi nhánh (Xem báo cáo & Kho)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu tạm thời</label>
                <input type="password" defaultValue="password123" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800" readOnly />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Nhân viên sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setAddStaffModalOpen(false)} className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
                Hủy
              </button>
              <button
                onClick={() => {
                  setAddStaffModalOpen(false);
                  toast({ type: 'success', title: 'Thêm nhân viên thành công', message: 'Tài khoản nhân viên mới đã được kích hoạt!' });
                }}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: TRỢ GIÚP & HƯỚNG DẪN                                  */}
      {/* ============================================================== */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Trợ giúp & Hướng dẫn</h3>
                  <p className="text-xs text-slate-400">Hỗ trợ vận hành StockPilot AI</p>
                </div>
              </div>
              <button onClick={() => setHelpModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 my-4 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-1">📘 Hướng dẫn quản lý tồn kho</h4>
                <p className="text-[11px] text-slate-500">Cách thiết lập chỉ số DOI, cảnh báo đọng vốn và tối ưu dòng tiền lưu động.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-1">🤖 Trợ lý AI Pilot</h4>
                <p className="text-[11px] text-slate-500">Bấm nút tròn góc dưới bên phải hoặc phím ⌘K để hỏi đáp số liệu với AI.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800">
                <h4 className="font-bold mb-1">📞 Hotline hỗ trợ kỹ thuật</h4>
                <p className="text-[11px]">Tổng đài: 1900 8888 (8:00 - 22:00 hàng ngày)</p>
              </div>
            </div>

            <button onClick={() => setHelpModalOpen(false)} className="w-full py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm">
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
