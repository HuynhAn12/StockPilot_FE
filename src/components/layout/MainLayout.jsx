import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PlatformAnnouncement } from './PlatformAnnouncement';
import { AIChatBox } from '../common/AIChatBox';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { normalizeRole } from '../../config/permissions.config';
import { cn } from '../lib/utils';

export function MainLayout() {
  const { sidebarCollapsed } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = normalizeRole(user?.role) === 'admin';

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col font-sans transition-colors duration-200',
        isAdmin
          ? 'bg-[#FAFAFA] text-[#475569]'
          : 'bg-linear-to-br from-[#f0f6ff] via-[#f8fafc] to-[#eef4ff] text-foreground'
      )}
    >
      <Sidebar />

      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'lg:pl-18' : 'lg:pl-64'
        )}
      >
        <Topbar />
        <PlatformAnnouncement />

        <main
          className={cn(
            'flex-1 p-3 sm:p-5 lg:p-6 w-full mx-auto',
            'max-w-[1720px]'
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Floating AI Assistant Chat Box (Chỉ cho Chủ shop & Nhân viên kho có dữ liệu sản phẩm) */}
      {!isAdmin && <AIChatBox />}
    </div>
  );
}
