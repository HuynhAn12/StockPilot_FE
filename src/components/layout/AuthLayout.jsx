import { Outlet, Navigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../store/authStore';

export function AuthLayout() {
  const { language, toggleLanguage } = useTranslation();
  const { user, token, isHydrated } = useAuthStore();

  // Nếu đã đăng nhập, tự động chuyển về /dashboard
  if (isHydrated && user && token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#e0e7ff] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Floating Ambient Glowing Orbs matching StockPilot brand */}
      <div className="absolute -top-28 -left-28 w-[520px] h-[520px] bg-sky-400/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-[560px] h-[560px] bg-indigo-500/25 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar Utilities - Only Language */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
            language === 'en'
              ? 'border-blue-500 bg-white text-blue-700 ring-2 ring-blue-400/30'
              : 'border-slate-200 bg-white/90 text-slate-700 hover:bg-white hover:border-slate-300'
          }`}
          title={language === 'vi' ? 'Switch to English (EN)' : 'Chuyển sang Tiếng Việt (VI)'}
        >
          <Globe className={`w-3.5 h-3.5 ${language === 'en' ? 'text-blue-600' : 'text-slate-600'}`} />
          <span className="uppercase font-extrabold">{language}</span>
        </button>
      </div>

      {/* Centered Floating Card Container */}
      <div className="relative z-10 w-full max-w-[960px] mx-auto animate-in fade-in duration-300">
        <Outlet />
      </div>
    </div>
  );
}
