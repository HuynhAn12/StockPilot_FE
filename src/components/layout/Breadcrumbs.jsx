import { useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';

const routeNameMap = {
  dashboard: 'Tổng quan',
  products: 'Sản phẩm',
  categories: 'Danh mục',
  orders: 'Đơn hàng & Bán lẻ',
  inventory: 'Quản lý kho',
  alerts: 'Cảnh báo rủi ro',
  pricing: 'Gợi ý giá bán',
  analytics: 'Phân tích & Báo cáo',
  'ai-assistant': 'Trợ lý AI Pilot',
  settings: 'Cài đặt',
  admin: 'Quản trị',
  users: 'Người dùng & Quyền',
  'audit-log': 'Nhật ký kiểm toán',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="hidden sm:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Home className="w-3.5 h-3.5 text-muted-foreground" />
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = routeNameMap[seg] || seg;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span
              className={cn(
                'font-medium truncate max-w-32',
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
