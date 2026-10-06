import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Eye, EyeOff, ArrowRight,
  Package, DollarSign, AlertTriangle, Sparkles,
  Store, Warehouse, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../components/store/authStore';
import { useToast } from '../components/common/Toast';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!email.trim()) {
      setLoginError('Vui lòng nhập email!');
      return;
    }
    if (!password) {
      setLoginError('Vui lòng nhập mật khẩu!');
      return;
    }
    setIsLoading(true);
    const result = await login({ email: email.trim(), password });
    setIsLoading(false);
    if (result.success) {
      toast({ type: 'success', title: 'Đăng nhập thành công!', message: `Chào mừng ${result.user?.name || result.user?.fullName} trở lại!` });
      navigate('/dashboard');
    } else {
      setLoginError(result.error || 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="w-full bg-white rounded-[28px] shadow-[0_25px_70px_-12px_rgba(30,58,138,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08)] border border-white/80 ring-1 ring-blue-900/5 overflow-hidden flex flex-col md:flex-row">

      {/* LEFT: Blue gradient panel with BLACK text and BLACK icons as requested */}
      <div className="md:w-[45%] bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-400 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
        {/* Soft glowing ambient circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/20 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-200/30 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

        {/* Logo + title */}
        <div className="relative z-10 flex flex-col items-center text-center pt-2 sm:pt-4">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center shadow-md">
              <svg className="w-11 h-11 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-white/70 text-slate-950 border border-slate-900/20 whitespace-nowrap uppercase tracking-wider shadow-xs">
              AI Pilot
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 mb-2">StockPilot</h1>
          <p className="text-xs font-bold text-slate-900 max-w-[250px] leading-relaxed">
            Hệ thống hỗ trợ quyết định Tồn kho, Giá bán & Doanh thu thông minh
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 space-y-3 my-8 sm:my-10">
          {[
            { icon: Package,       text: 'Quản lý thông tin & phân loại sản phẩm' },
            { icon: DollarSign,    text: 'Tối ưu giá bán & phân tích biên lợi nhuận' },
            { icon: AlertTriangle, text: 'Cảnh báo tự động về rủi ro tồn dư & đọng vốn' },
            { icon: Sparkles,      text: 'Trợ lý AI Pilot phân tích số liệu kinh doanh' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white/35 border border-white/50 backdrop-blur-sm hover:bg-white/45 transition-all shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-white/55 flex items-center justify-center shrink-0 shadow-2xs">
                  <Icon className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-slate-950">{item.text}</span>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 text-center text-[11px] font-bold text-slate-900">
          Hệ thống chỉ gợi ý • Chủ shop toàn quyền quyết định
        </div>
      </div>

      {/* RIGHT: White form */}
      <div className="md:w-[55%] p-8 sm:p-12 flex flex-col justify-between bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-7">
            <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">Đăng Nhập</h2>
            <p className="text-sm text-slate-500 mt-1">Chào mừng bạn quay trở lại với StockPilot!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email / Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@cuahang.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Inline error message */}
            {loginError && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <p className="text-xs font-medium">{loginError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>Đăng Nhập</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative px-3 bg-white text-[11px] font-semibold text-slate-400 uppercase">
              Dành cho
            </span>
          </div>

          {/* Role info cards — display only, not clickable */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Chủ cửa hàng', sub: 'Quản lý toàn bộ hệ thống', icon: Store,        color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-100' },
              { label: 'Nhân viên kho', sub: 'Nhập / xuất / kiểm hàng',  icon: Warehouse,    color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Quản trị viên', sub: 'Hệ thống & kiểm toán',     icon: ShieldCheck,  color: 'text-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-100' },
            ].map(({ label, sub, icon: Icon, color, bg, border }) => (
              <div
                key={label}
                className={`p-2.5 rounded-xl border ${border} ${bg} text-left select-none`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className={`w-3 h-3 ${color} shrink-0`} />
                  <div className="text-[11px] font-bold text-slate-700 truncate">{label}</div>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{sub}</div>
              </div>
            ))}
          </div>

        </div>

        {/* Register link */}
        <div className="mt-5 text-center text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <a
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Đăng ký cửa hàng
          </a>
        </div>

        <div className="pt-4 text-center text-xs text-slate-400">
          Phiên bản 1.0 • © 2026 StockPilot Vietnam
        </div>
      </div>
    </div>
  );
}
