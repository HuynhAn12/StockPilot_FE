import { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, ShoppingBag, Boxes, TrendingUp,
  AlertTriangle, Tag, Bot, Settings, Users, FileText, ChevronLeft,
  ChevronRight, LogOut, Sparkles, ShieldCheck, Store, Warehouse, X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useAlertsStore } from '../store/alertsStore';
import { usePricingStore } from '../store/pricingStore';
import { StockPilotLogoIcon } from '../common/StockPilotLogo';

const ALL_NAV_ITEMS = [
  // Hệ thống
  { name: 'Tổng quan',          href: '/dashboard',       icon: LayoutDashboard, roles: ['store_owner','warehouse_staff','admin'], section: 'Hệ thống' },
  { name: 'Sản phẩm',           href: '/products',        icon: Package,         roles: ['store_owner','warehouse_staff','admin'] },
  { name: 'Thanh toán',         href: '/pos',             icon: ShoppingBag,     roles: ['store_owner','warehouse_staff','admin'] },
  { name: 'Đơn hàng',          href: '/orders',           icon: ShoppingCart,    roles: ['store_owner','admin'] },
  { name: 'Quản lý kho',        href: '/inventory',       icon: Boxes,           roles: ['store_owner','warehouse_staff','admin'] },
  // Hỗ trợ quyết định
  { name: 'Cảnh báo rủi ro',   href: '/alerts',           icon: AlertTriangle,   badgeKey: 'alerts', badgeVariant: 'error', roles: ['store_owner','warehouse_staff','admin'], section: 'Hỗ trợ quyết định' },
  { name: 'Gợi ý giá bán',     href: '/pricing',          icon: Tag,             badgeKey: 'pricing', badgeVariant: 'purple', roles: ['store_owner','admin'] },
  { name: 'Phân tích & Báo cáo',href: '/analytics',       icon: TrendingUp,      roles: ['store_owner','admin'] },
  { name: 'Trợ lý AI Pilot',   href: '/ai-assistant',     icon: Bot,             roles: ['store_owner','warehouse_staff','admin'] },
  // Quản trị
  { name: 'Người dùng & Quyền', href: '/admin/users',     icon: Users,           roles: ['admin'], section: 'Quản trị hệ thống' },
  { name: 'Nhật ký kiểm toán', href: '/admin/audit-log',  icon: FileText,        roles: ['admin'] },
  { name: 'Cài đặt hệ thống',  href: '/settings',         icon: Settings,        roles: ['store_owner','admin'], section: 'Cấu hình' },
];

function getRoleIcon(role) {
  if (role === 'store_owner')    return <Store className="w-3.5 h-3.5 text-blue-600" />;
  if (role === 'warehouse_staff') return <Warehouse className="w-3.5 h-3.5 text-amber-500" />;
  return <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />;
}

function getRoleBadgeLabel(role) {
  if (role === 'store_owner')    return 'Chủ cửa hàng';
  if (role === 'warehouse_staff') return 'Nhân viên kho';
  return 'Quản trị viên';
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const { getOpenCount } = useAlertsStore();
  const { getPendingCount } = usePricingStore();

  const openAlertsCount = getOpenCount();
  const pendingPricingCount = getPendingCount();

  const currentRole = user?.role || 'store_owner';

  const visibleNavItems = useMemo(
    () =>
      ALL_NAV_ITEMS.filter((item) => item.roles.includes(currentRole)).map((item) => {
        if (item.badgeKey === 'alerts') {
          return { ...item, badge: openAlertsCount };
        }
        if (item.badgeKey === 'pricing') {
          return { ...item, badge: pendingPricingCount };
        }
        return item;
      }),
    [currentRole, openAlertsCount, pendingPricingCount]
  );

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
                  <span
                    className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)' }}
                  >
                    AI Pilot
                  </span>
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
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(`${item.href}/`);
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
                <NavLink
                  to={item.href}
                  onClick={() => setSidebarMobileOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    'group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 relative select-none',
                    isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, hsl(213 100% 95%) 0%, hsl(221 100% 93%) 100%)',
                    boxShadow: 'inset 0 0 0 1px hsl(217 91% 85%)',
                  } : {}}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'hsl(214 30% 96%)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = ''; }}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                      style={{ background: 'linear-gradient(180deg, hsl(217 91% 52%) 0%, hsl(224 76% 48%) 100%)' }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-4.5 h-4.5 shrink-0 transition-all duration-150',
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                    style={{ width: '18px', height: '18px' }}
                  />

                  {!sidebarCollapsed && (
                    <span className={cn('truncate flex-1 text-[13px]', isActive ? 'font-bold text-blue-700' : 'font-medium')}>
                      {item.name}
                    </span>
                  )}

                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span
                      className={cn(
                        'ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center',
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
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 0 2px #fff' }} />
                  )}
                </NavLink>
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
