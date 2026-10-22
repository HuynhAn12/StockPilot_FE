import { useMemo, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, ShoppingBag, Boxes, TrendingUp,
  AlertTriangle, Tag, Bot, Settings, Users, FileText, ChevronLeft,
  ChevronRight, LogOut, Sparkles, ShieldCheck, Store, Warehouse, X,
  UserCheck, Server, LifeBuoy, FileUp,
} from 'lucide-react';
import { apiAdminListTickets } from '../../services/supportService';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useAlertsStore } from '../store/alertsStore';
import { usePricingStore } from '../store/pricingStore';
import { StockPilotLogoIcon } from '../common/StockPilotLogo';

const NAV_ITEM_CONFIG = [
  // Hệ thống & Nghiệp vụ Cửa hàng (Chủ shop & Nhân viên)
  { key: 'navDashboard', sectionKey: 'systemSection', defaultName: 'Tổng quan', defaultSection: 'Hệ thống', href: '/dashboard', icon: LayoutDashboard, roles: ['store_owner','warehouse_staff','admin'] },
  { key: 'navProducts', defaultName: 'Sản phẩm', href: '/products', icon: Package, roles: ['store_owner','warehouse_staff'] },
  { key: 'navPos', defaultName: 'Thanh toán', href: '/pos', icon: ShoppingBag, roles: ['store_owner','warehouse_staff'] },
  { key: 'navOrders', defaultName: 'Đơn hàng', href: '/orders', icon: ShoppingCart, roles: ['store_owner'] },
  { key: 'navStaff', defaultName: 'Nhân viên', href: '/staff', icon: Users, roles: ['store_owner'] },
  { key: 'navInventory', defaultName: 'Quản lý kho', href: '/inventory', icon: Boxes, roles: ['store_owner','warehouse_staff'] },
  // Hỗ trợ quyết định (Chủ shop & Nhân viên)
  { key: 'navAlerts', sectionKey: 'decisionSupportSection', defaultName: 'Cảnh báo rủi ro', defaultSection: 'Hỗ trợ quyết định', href: '/alerts', icon: AlertTriangle, badgeKey: 'alerts', badgeVariant: 'error', roles: ['store_owner','warehouse_staff'] },
  { key: 'navPricing', defaultName: 'Gợi ý giá bán', href: '/pricing', icon: Tag, badgeKey: 'pricing', badgeVariant: 'purple', roles: ['store_owner'] },
  { key: 'navAnalytics', defaultName: 'Phân tích & Báo cáo', href: '/analytics', icon: TrendingUp, roles: ['store_owner'] },
  { key: 'navAiPilot', defaultName: 'Trợ lý AI Pilot', href: '/ai-assistant', icon: Bot, roles: ['store_owner','warehouse_staff'] },
  // Cấu hình (Chủ shop)
  { key: 'navSettings', sectionKey: 'configSection', defaultName: 'Cài đặt hệ thống', defaultSection: 'Cấu hình', href: '/settings', icon: Settings, roles: ['store_owner'] },
  { key: 'navImport', defaultName: 'Nhập dữ liệu', href: '/import', icon: FileUp, roles: ['store_owner'] },
  { key: 'navSupport', defaultName: 'Hỗ trợ', href: '/support', icon: LifeBuoy, roles: ['store_owner','warehouse_staff'] },
  // Quản trị hệ thống (Chỉ dành cho Admin)
  { key: 'navUsers', sectionKey: 'adminSection', defaultName: 'Người dùng & Quyền', defaultSection: 'Quản trị hệ thống', href: '/admin/users', icon: Users, roles: ['admin'] },
  { key: 'navStores', defaultName: 'Cửa hàng', href: '/admin/stores', icon: Store, roles: ['admin'] },
  { key: 'navAuditLog', defaultName: 'Nhật ký kiểm toán', href: '/admin/audit-log', icon: FileText, roles: ['admin'] },
  { key: 'navAdminSupport', defaultName: 'Hỗ trợ khách hàng', href: '/admin/support', icon: LifeBuoy, badgeKey: 'support', badgeVariant: 'error', roles: ['admin'] },
  { key: 'navLeads', defaultName: 'Khách hàng tiềm năng', href: '/admin/leads', icon: UserCheck, roles: ['admin'] },
  { key: 'navSystem', defaultName: 'Hệ thống & AI', href: '/admin/system', icon: Server, roles: ['admin'] },
];

import { normalizeRole } from '../../config/permissions.config';

function getRoleIcon(role) {
  if (role === 'store_owner')    return <Store className="w-3.5 h-3.5 text-blue-600" />;
  if (role === 'warehouse_staff') return <Warehouse className="w-3.5 h-3.5 text-emerald-600" />;
  return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const { t, language } = useTranslation();
  const { getOpenCount, fetchAlerts } = useAlertsStore();
  const { getPendingCount, fetchRecommendations } = usePricingStore();

  const currentRole = normalizeRole(user?.role);

  useEffect(() => {
    // Không gọi API nghiệp vụ shop khi là Admin
    if (currentRole === 'store_owner' || currentRole === 'warehouse_staff') {
      fetchAlerts?.().catch(() => {});
    }
    if (currentRole === 'store_owner') {
      fetchRecommendations?.().catch(() => {});
    }
  }, [fetchAlerts, fetchRecommendations, currentRole]);

  // Admin: số yêu cầu hỗ trợ chưa ai trả lời, làm mới khi đổi trang.
  const [unansweredTickets, setUnansweredTickets] = useState(0);
  useEffect(() => {
    if (currentRole !== 'admin') return;
    apiAdminListTickets({ status: 'OPEN', limit: 1 })
      .then((res) => setUnansweredTickets(res.summary?.unanswered ?? 0))
      .catch(() => {});
  }, [currentRole, location.pathname]);

  const openAlertsCount = getOpenCount();
  const pendingPricingCount = getPendingCount();

  const visibleNavItems = useMemo(
    () =>
      NAV_ITEM_CONFIG.filter((item) => item.roles.includes(currentRole)).map((item) => {
        let badge = undefined;
        if (item.badgeKey === 'alerts') badge = openAlertsCount;
        if (item.badgeKey === 'pricing') badge = pendingPricingCount;
        if (item.badgeKey === 'support') badge = unansweredTickets || undefined;

        return {
          ...item,
          name: t(item.key, item.defaultName),
          section: item.sectionKey ? t(item.sectionKey, item.defaultSection) : undefined,
          badge,
        };
      }),
    [currentRole, openAlertsCount, pendingPricingCount, unansweredTickets, t]
  );

  const getRoleBadgeLabel = (role) => {
    if (role === 'store_owner')    return t('storeOwnerLong', 'Chủ cửa hàng');
    if (role === 'warehouse_staff') return t('warehouseStaffLong', 'Nhân viên kho & POS');
    return t('administrator', 'Quản trị viên hệ thống');
  };

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  const isAdmin = currentRole === 'admin';
  let lastSection = '';

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r transition-all duration-200 ease-in-out bg-white border-[#E5E7EB]',
          sidebarCollapsed ? 'w-18' : 'w-64',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E5E7EB] bg-white">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group"
            onClick={() => setSidebarMobileOpen(false)}
          >
            <StockPilotLogoIcon size="md" />
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-base tracking-tight text-[#334155]">StockPilot</span>
                <span className="text-[11px] truncate font-normal text-[#64748B]">
                  {isAdmin ? 'Quản trị nền tảng' : 'Smart Decision Support'}
                </span>
              </div>
            )}
          </NavLink>

          <button
            onClick={() => setSidebarMobileOpen(false)}
            className={cn(
              'p-1.5 rounded-lg lg:hidden transition-all',
              'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            )}
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {visibleNavItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showSection = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;

            return (
              <div key={item.href}>
                {showSection && !sidebarCollapsed && (
                  <div className="pt-4 pb-1.5 px-2.5 text-[11px] font-medium text-[#94A3B8]">
                    {item.section}
                  </div>
                )}
                {showSection && sidebarCollapsed && (
                  <div className="my-2 mx-2 h-px bg-[#E5E7EB]" />
                )}
                <NavLink
                  to={item.href}
                  onClick={() => setSidebarMobileOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors relative select-none',
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
                      : 'text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC] font-normal',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[#3B82F6]" />
                  )}
                  <Icon
                    className={cn(
                      'w-4.5 h-4.5 shrink-0 transition-colors',
                      isActive ? 'text-[#3B82F6]' : 'text-[#94A3B8] group-hover:text-[#64748B]'
                    )}
                    style={{ width: '18px', height: '18px' }}
                  />

                  {!sidebarCollapsed && (
                    <span
                      className={cn(
                        'truncate flex-1 text-[13px]',
                        isActive ? 'font-bold text-blue-700' : 'font-medium'
                      )}
                    >
                      {item.name}
                    </span>
                  )}

                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span
                      className={cn(
                        'ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-4.5 text-center',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : item.badgeVariant === 'error'
                          ? 'bg-red-500 text-white'
                          : 'bg-blue-500 text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  {sidebarCollapsed && item.badge !== undefined && (
                    <span
                      className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"
                      style={{ boxShadow: '0 0 0 2px #fff' }}
                    />
                  )}
                </NavLink>
              </div>
            );
          })}
        </div>

        {/* User Card Footer */}
        <div className="p-2.5 border-t border-[#E5E7EB] bg-white">
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-lg transition-colors bg-slate-50 border border-[#E5E7EB]',
              sidebarCollapsed && 'justify-center p-1.5'
            )}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#3B82F6] text-white font-medium text-xs shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>

            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-[#334155]">
                  {user?.fullName || user?.name || (isAdmin ? 'Platform Admin' : 'Người dùng')}
                </p>
                <div className="flex items-center gap-1 text-[11px] mt-0.5">
                  {getRoleIcon(currentRole)}
                  <span className="font-normal text-[#64748B]">{getRoleBadgeLabel(currentRole)}</span>
                </div>
              </div>
            )}

            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                title={language === 'en' ? 'Sign out' : 'Đăng xuất'}
                className="p-1.5 rounded-md transition-colors text-[#94A3B8] hover:text-[#DC2626] hover:bg-red-50 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center justify-end mt-2">
            <button
              onClick={toggleSidebar}
              className={cn(
                'flex items-center gap-1.5 text-xs p-1.5 rounded-lg transition-all w-full font-medium',
                'text-slate-400 hover:text-slate-700 hover:bg-slate-100',
                sidebarCollapsed ? 'justify-center' : 'justify-start'
              )}
              title={
                sidebarCollapsed
                  ? language === 'en'
                    ? 'Expand menu'
                    : 'Mở rộng thanh menu'
                  : language === 'en'
                  ? 'Collapse menu'
                  : 'Thu gọn menu'
              }
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>{language === 'en' ? 'Collapse menu' : 'Thu gọn menu'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
