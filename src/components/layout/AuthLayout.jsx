import { Outlet, Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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

      {/* Top Left: Home link */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all shadow-2xs"
          title={language === 'en' ? 'Back to Landing Page' : 'Quay lại Trang chủ'}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Home' : 'Trang chủ'}</span>
        </Link>
      </div>

      {/* Top Bar Utilities - Segmented Language Switcher */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <div
          onClick={toggleLanguage}
          className="relative flex items-center p-0.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 hover:border-slate-300 cursor-pointer select-none transition-colors shadow-2xs"
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          role="button"
          tabIndex={0}
        >
          <div
            className={`absolute top-0.5 bottom-0.5 w-8 rounded-full bg-blue-600 shadow-xs transition-transform duration-300 ease-out ${
              language === 'en' ? 'translate-x-8' : 'translate-x-0'
            }`}
          />
          <span
            className={`relative z-10 w-8 py-1 text-center text-xs font-bold transition-colors duration-200 ${
              language === 'vi' ? 'text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            VI
          </span>
          <span
            className={`relative z-10 w-8 py-1 text-center text-xs font-bold transition-colors duration-200 ${
              language === 'en' ? 'text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            EN
          </span>
        </div>
      </div>

      {/* Centered Floating Card Container */}
      <div className="relative z-10 w-full max-w-[960px] mx-auto animate-in fade-in duration-300">
        <Outlet />
      </div>
    </div>
  );
}

