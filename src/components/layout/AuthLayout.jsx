import { Outlet } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export function AuthLayout() {
  const { language, setLanguage } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#e0e7ff] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Floating Ambient Glowing Orbs matching StockPilot brand */}
      <div className="absolute -top-28 -left-28 w-[520px] h-[520px] bg-sky-400/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-[560px] h-[560px] bg-indigo-500/25 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar Utilities - Only Language */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <button
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/80 text-xs font-bold text-slate-800 hover:bg-white transition-all shadow-[0_4px_12px_rgba(37,99,235,0.08)] cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span className="uppercase">{language}</span>
        </button>
      </div>

      {/* Centered Floating Card Container */}
      <div className="relative z-10 w-full max-w-[960px] mx-auto animate-in fade-in duration-300">
        <Outlet />
      </div>
    </div>
  );
}
