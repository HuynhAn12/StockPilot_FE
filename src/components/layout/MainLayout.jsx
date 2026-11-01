import { Outlet, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const isAIAssistant = location.pathname.startsWith('/ai-assistant');

  return (
    <div
      className={cn(
        'font-sans transition-colors duration-200',
        isAIAssistant
          ? 'h-screen overflow-hidden flex flex-col'
          : 'min-h-screen flex flex-col',
        isAdmin
          ? 'admin-ui bg-[#F7F8FA] text-[#475569]'
          : 'bg-linear-to-br from-[#f0f6ff] via-[#f8fafc] to-[#eef4ff] text-foreground'
      )}
    >
      <Sidebar />

      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-200 ease-in-out min-h-0',
          isAIAssistant && 'h-full overflow-hidden',
          sidebarCollapsed ? 'lg:pl-18' : 'lg:pl-64'
        )}
      >
        <Topbar />
        <PlatformAnnouncement />

        <main
          className={cn(
            'flex-1 w-full mx-auto flex flex-col min-h-0',
            isAIAssistant ? 'p-0 max-w-none h-[calc(100vh-64px)] overflow-hidden' : 'p-3 sm:p-5 lg:p-6 max-w-[1720px]'
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
