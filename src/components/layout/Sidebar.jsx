import { useMemo, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Layers, FolderTree, ShoppingCart, ShoppingBag, Boxes, TrendingUp,
  AlertTriangle, Tag, Bot, Settings, Users, FileText, ChevronLeft,
  ChevronRight, ChevronDown, LogOut, Sparkles, ShieldCheck, Store, Warehouse, X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useAlertsStore } from '../store/alertsStore';
import { usePricingStore } from '../store/pricingStore';
import { StockPilotLogoIcon } from '../common/StockPilotLogo';

const NAV_ITEM_CONFIG = [
  // Hệ thống
  { key: 'navDashboard', sectionKey: 'systemSection', defaultName: 'Tổng quan', defaultSection: 'Hệ thống', href: '/dashboard', icon: LayoutDashboard, roles: ['store_owner','warehouse_staff','admin'] },
  { key: 'navProducts', defaultName: 'Sản phẩm', href: '/products', icon: Package, roles: ['store_owner','warehouse_staff','admin'] },
  { key: 'navCategories', defaultName: 'Danh mục', href: '/categories', icon: Layers, roles: ['store_owner','warehouse_staff','admin'] },
  { key: 'navPos', defaultName: 'Thanh toán', href: '/pos', icon: ShoppingBag, roles: ['store_owner','warehouse_staff','admin'] },
  { key: 'navOrders', defaultName: 'Đơn hàng', href: '/orders', icon: ShoppingCart, roles: ['store_owner','admin'] },
  {
    key: 'navInventory',
    defaultName: 'Kho hàng',
    href: '/inventory',
    icon: Boxes,
    roles: ['store_owner','warehouse_staff','admin'],
    children: [
      { key: 'navInventoryBalance', defaultName: 'Bảng cân tồn', href: '/inventory' },
      { key: 'navInventoryMovements', defaultName: 'Lịch sử biến động', href: '/inventory/movements' },
      { key: 'navInventoryInflow', defaultName: 'Nhập kho', href: '/inventory/inflow' },
      { key: 'navInventoryOutflow', defaultName: 'Xuất kho', href: '/inventory/outflow' },
      { key: 'navStockTakes', defaultName: 'DS kiểm kê', href: '/stock-takes' },
      { key: 'navStockTakeNew', defaultName: 'Tạo đợt kiểm', href: '/stock-takes/new' },
    ],
  },
  // Hỗ trợ quyết định
  { key: 'navAlerts', sectionKey: 'decisionSupportSection', defaultName: 'Cảnh báo rủi ro', defaultSection: 'Hỗ trợ quyết định', href: '/alerts', icon: AlertTriangle, badgeKey: 'alerts', badgeVariant: 'error', roles: ['store_owner','warehouse_staff','admin'] },
  { key: 'navPricing', defaultName: 'Gợi ý giá bán', href: '/pricing', icon: Tag, badgeKey: 'pricing', badgeVariant: 'purple', roles: ['store_owner','admin'] },
  { key: 'navAnalytics', defaultName: 'Phân tích & Báo cáo', href: '/analytics', icon: TrendingUp, roles: ['store_owner','admin'] },
  { key: 'navAiPilot', defaultName: 'Trợ lý AI Pilot', href: '/ai-assistant', icon: Bot, roles: ['store_owner','warehouse_staff','admin'] },
  // Quản trị
  { key: 'navUsers', sectionKey: 'adminSection', defaultName: 'Người dùng & Quyền', defaultSection: 'Quản trị hệ thống', href: '/admin/users', icon: Users, roles: ['admin'] },
  { key: 'navAuditLog', defaultName: 'Nhật ký kiểm toán', href: '/admin/audit-log', icon: FileText, roles: ['admin'] },
  { key: 'navSettings', sectionKey: 'configSection', defaultName: 'Cài đặt hệ thống', defaultSection: 'Cấu hình', href: '/settings', icon: Settings, roles: ['store_owner','admin'] },
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
  const { t } = useTranslation();
  const { getOpenCount, fetchAlerts } = useAlertsStore();
  const { getPendingCount, fetchRecommendations } = usePricingStore();

  const currentRole = normalizeRole(user?.role);

  useEffect(() => {
    fetchAlerts?.().catch(() => {});
    if (currentRole !== 'warehouse_staff') {
      fetchRecommendations?.().catch(() => {});
    }
  }, [fetchAlerts, fetchRecommendations, currentRole]);

  const openAlertsCount = getOpenCount();
  const pendingPricingCount = getPendingCount();

  const isInventoryRoute =
    location.pathname === '/inventory' ||
    location.pathname.startsWith('/inventory/') ||
    location.pathname === '/stock-takes' ||
    location.pathname.startsWith('/stock-takes/');

  const [openMenus, setOpenMenus] = useState(() => ({
    navInventory: isInventoryRoute,
  }));

  useEffect(() => {
    if (isInventoryRoute) {
      setOpenMenus((prev) => ({ ...prev, navInventory: true }));
    }
  }, [isInventoryRoute]);

  const toggleSubmenu = (menuKey) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const visibleNavItems = useMemo(
    () =>
      NAV_ITEM_CONFIG.filter((item) => item.roles.includes(currentRole)).map((item) => {
        let badge = undefined;
        if (item.badgeKey === 'alerts') badge = openAlertsCount;
        if (item.badgeKey === 'pricing') badge = pendingPricingCount;

        const children = item.children?.map((child) => ({
          ...child,
          name: t(child.key, child.defaultName),
        }));

        return {
          ...item,
          name: t(item.key, item.defaultName),
          section: item.sectionKey ? t(item.sectionKey, item.defaultSection) : undefined,
          badge,
          children,
        };
      }),
    [currentRole, openAlertsCount, pendingPricingCount, t]
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

  let lastSection = '';

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: '#fff', borderColor: 'hsl(214 25% 89%)', boxShadow: '1px 0 16px rgb(0 0 0 / 0.05)' }}
      >
        {/* Brand Header */}
        <div
          className="h-16 flex items-center justify-between px-4 border-b"
          style={{
            background: 'linear-gradient(180deg, #fff 0%, #f8fafd 100%)',
            borderColor: 'hsl(214 25% 89%)'
          }}
        >
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group"
            onClick={() => setSidebarMobileOpen(false)}
          >
            <StockPilotLogoIcon size="md" />
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                  StockPilot
                </span>
                <span className="text-[11px] text-slate-400 truncate font-medium">
                  Smart Decision Support
                </span>
              </div>
            )}
          </NavLink>

          <button
            onClick={() => setSidebarMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition-all"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {visibleNavItems.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isSubmenuOpen = Boolean(openMenus[item.key]);

            const isParentActive = hasChildren
              ? item.children.some((child) =>
                  child.href === '/inventory'
                    ? location.pathname === '/inventory'
                    : location.pathname === child.href || location.pathname.startsWith(`${child.href}/`)
                ) || location.pathname.startsWith(`${item.href}/`)
              : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;
            const showSection = item.section && item.section !== lastSection;
            if (item.section) lastSection = item.section;

            return (
              <div key={item.href}>
                {showSection && !sidebarCollapsed && (
                  <div className="pt-5 pb-1.5 px-2.5 text-[10px] font-black uppercase tracking-widest" style={{ color: 'hsl(215 16% 62%)' }}>
                    {item.section}
                  </div>
                )}
                {showSection && sidebarCollapsed && (
                  <div className="my-2 mx-2" style={{ height: '1px', background: 'hsl(214 25% 91%)' }} />
                )}

                {hasChildren ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (sidebarCollapsed) {
                          navigate(item.href);
                        } else {
                          toggleSubmenu(item.key);
                        }
                      }}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 relative select-none w-full text-left cursor-pointer',
                        isParentActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900',
                        sidebarCollapsed && 'justify-center px-2'
                      )}
                      style={
                        isParentActive && (!isSubmenuOpen || sidebarCollapsed)
                          ? {
                              background: 'linear-gradient(135deg, hsl(213 100% 95%) 0%, hsl(221 100% 93%) 100%)',
                              boxShadow: 'inset 0 0 0 1px hsl(217 91% 85%)',
                            }
                          : isParentActive
                          ? {
                              background: 'hsl(214 30% 96%)',
                            }
                          : {}
                      }
                      onMouseEnter={(e) => {
                        if (!isParentActive) e.currentTarget.style.background = 'hsl(214 30% 96%)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isParentActive) e.currentTarget.style.background = '';
                      }}
                    >
                      {isParentActive && (!isSubmenuOpen || sidebarCollapsed) && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                          style={{ background: 'linear-gradient(180deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)' }}
                        />
                      )}
                      <Icon
                        className={cn(
                          'w-4.5 h-4.5 shrink-0 transition-all duration-150',
                          isParentActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        )}
                        style={{ width: '18px', height: '18px' }}
                      />

                      {!sidebarCollapsed && (
                        <span className={cn('truncate flex-1 text-[13px]', isParentActive ? 'font-bold text-slate-900' : 'font-medium')}>
                          {item.name}
                        </span>
                      )}

                      {!sidebarCollapsed && (
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-auto',
                            isSubmenuOpen && 'transform rotate-180 text-slate-600'
                          )}
                        />
                      )}
                    </button>

                    {/* Submenu Dropdown */}
                    {!sidebarCollapsed && isSubmenuOpen && (
                      <div className="ml-4 pl-3.5 border-l-2 border-slate-200/70 space-y-1 my-1.5 transition-all">
                        {item.children.map((child) => {
                          const isChildActive =
                            child.href === '/inventory'
                              ? location.pathname === '/inventory'
                              : child.href === '/stock-takes'
                              ? location.pathname === '/stock-takes' || (location.pathname.startsWith('/stock-takes/') && location.pathname !== '/stock-takes/new')
                              : location.pathname === child.href || location.pathname.startsWith(`${child.href}/`);

                          return (
                            <NavLink
                              key={child.href}
                              to={child.href}
                              onClick={() => setSidebarMobileOpen(false)}
                              className={cn(
                                'group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 select-none relative',
                                isChildActive
                                  ? 'text-blue-700 bg-blue-50/80 font-bold shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                              )}
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full transition-all shrink-0',
                                  isChildActive
                                    ? 'bg-blue-600 scale-125 ring-2 ring-blue-200'
                                    : 'bg-slate-300 group-hover:bg-slate-400'
                                )}
                              />
                              <span className="truncate">{child.name}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.href}
                    onClick={() => setSidebarMobileOpen(false)}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={cn(
                      'group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 relative select-none',
                      isParentActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900',
                      sidebarCollapsed && 'justify-center px-2'
                    )}
                    style={isParentActive ? {
                      background: 'linear-gradient(135deg, hsl(213 100% 95%) 0%, hsl(221 100% 93%) 100%)',
                      boxShadow: 'inset 0 0 0 1px hsl(217 91% 85%)',
                    } : {}}
                    onMouseEnter={e => { if (!isParentActive) e.currentTarget.style.background = 'hsl(214 30% 96%)'; }}
                    onMouseLeave={e => { if (!isParentActive) e.currentTarget.style.background = ''; }}
                  >
                    {isParentActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                        style={{ background: 'linear-gradient(180deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)' }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'w-4.5 h-4.5 shrink-0 transition-all duration-150',
                        isParentActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      )}
                      style={{ width: '18px', height: '18px' }}
                    />

                    {!sidebarCollapsed && (
                      <span className={cn('truncate flex-1 text-[13px]', isParentActive ? 'font-bold text-blue-700' : 'font-medium')}>
                        {item.name}
                      </span>
                    )}

                    {!sidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={cn(
                          'ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center',
                          isParentActive
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
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 0 2px #fff' }} />
                    )}
                  </NavLink>
                )}
              </div>
            );
          })}
        </div>

        {/* User Card Footer */}
        <div
          className="p-2.5 border-t"
          style={{ background: 'linear-gradient(180deg, #fff 0%, #f8fafd 100%)', borderColor: 'hsl(214 25% 89%)' }}
        >
          <div
            className={cn(
              'flex items-center gap-2.5 p-2.5 rounded-xl transition-all',
              sidebarCollapsed && 'justify-center p-2'
            )}
            style={{ background: 'hsl(214 30% 96%)', border: '1px solid hsl(214 25% 90%)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)',
                boxShadow: '0 2px 8px rgb(59 130 246 / 0.35)'
              }}
            >
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>

            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.fullName || user?.name || 'Người dùng'}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                  {getRoleIcon(currentRole)}
                  <span className="font-medium">{getRoleBadgeLabel(currentRole)}</span>
                </div>
              </div>
            )}

            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center justify-end mt-2">
            <button
              onClick={toggleSidebar}
              className={cn(
                'flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all w-full font-medium',
                sidebarCollapsed ? 'justify-center' : 'justify-start'
              )}
              title={sidebarCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Thu gọn menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
