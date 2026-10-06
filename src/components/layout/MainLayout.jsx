import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AIChatBox } from '../common/AIChatBox';
import { useUIStore } from '../store/uiStore';
import { cn } from '../lib/utils';

export function MainLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f6ff] via-[#f8fafc] to-[#eef4ff] text-foreground flex flex-col font-sans">
      <Sidebar />

      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        )}
      >
        <Topbar />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Assistant Chat Box & Trigger */}
      <AIChatBox />
    </div>
  );
}
