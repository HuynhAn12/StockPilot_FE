import { useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../../i18n/useTranslation';

const routeKeyMap = {
  dashboard: 'navDashboard',
  products: 'navProducts',
  categories: 'category',
  orders: 'navOrders',
  pos: 'navPos',
  inventory: 'navInventory',
  alerts: 'navAlerts',
  pricing: 'navPricing',
  analytics: 'navAnalytics',
  'ai-assistant': 'navAiPilot',
  settings: 'navSettings',
  staff: 'navStaff',
  admin: 'admin',
  users: 'navUsers',
  'audit-log': 'navAuditLog',
  support: 'navSupport',
  import: 'navImport',
};

// Admin pages share the /admin prefix; show only the page name, not a redundant "Admin" crumb.
const adminLabels = {
  users: 'Người dùng',
  stores: 'Cửa hàng',
  'audit-log': 'Nhật ký kiểm toán',
  leads: 'Khách hàng tiềm năng',
  system: 'Hệ thống',
  support: 'Hỗ trợ khách hàng',
};

export function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const allSegments = location.pathname.split('/').filter(Boolean);
  const isAdminPath = allSegments[0] === 'admin';
  const segments = isAdminPath ? allSegments.slice(1) : allSegments;

  if (segments.length === 0) return null;

  return (
    <nav className="hidden sm:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Home className="w-3.5 h-3.5 text-muted-foreground" />
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const key = routeKeyMap[seg];
        const label = isAdminPath && adminLabels[seg] ? adminLabels[seg] : key ? t(key, seg) : seg;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span
              className={cn(
                'font-medium truncate max-w-56',
                isLast ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
