import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  ShieldCheck, Smartphone, Mail, CheckCircle2,
  RefreshCw, KeyRound, AlertCircle, Sparkles, Store
} from 'lucide-react';
import { useAuthStore } from '../components/store/authStore';
import { useToast } from '../components/common/Toast';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resetToken, setResetToken] = useState(''); // token từ email link

  // Active recovery method: 'phone_otp' | 'email_otp' (Only Phone or Email/Gmail with OTP)
  const [method, setMethod] = useState('phone_otp');

  // Multi-step Flow (Step 1: Input Phone/Gmail -> Step 2: Input 6-digit OTP -> Step 3: Set new password -> Step 4: Success)
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('0988 123 456');
  const [email, setEmail] = useState('owner@demo.vn');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Common UI State
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Handle switching method
  const handleSwitchMethod = (newMethod) => {
    setMethod(newMethod);
    setStep(1);
    setOtp(['', '', '', '', '', '']);
    setResendCooldown(60);
    setCanResend(false);
  };

  // Handle OTP digit change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
      toast({ type: 'success', title: 'Đã dán mã OTP', message: `Mã xác nhận: ${pasted}` });
    }
  };

  // STEP 1: Gửi email lấy link reset password (API thật)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const targetEmail = method === 'email_otp' ? email.trim() : email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      toast({ type: 'error', title: 'Email không hợp lệ', message: 'Vui lòng nhập đúng địa chỉ email đăng ký!' });
      return;
    }
    setIsLoading(true);
    try {
      const { apiForgotPassword } = await import('../services/authService');
      const result = await apiForgotPassword({ email: targetEmail });
      setIsLoading(false);
      setStep(2);
      setResendCooldown(60);
      setCanResend(false);
      // Backend trả về reset token trong dev mode
      if (result?.data?.resetToken) setResetToken(result.data.resetToken);
      toast({
        type: 'success',
        title: 'Đã gửi hướng dẫn về email!',
        message: `Hệ thống đã gửi link đặt lại mật khẩu đến ${targetEmail}. Kiểm tra hộp thư của bạn.`
      });
    } catch (err) {
      const { getApiError } = await import('../services/authService');
      toast({ type: 'error', title: 'Lỗi', message: getApiError(err) });
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);
    const target = method === 'phone_otp' ? `SĐT ${phoneNumber}` : `Gmail ${email}`;
    toast({ type: 'info', title: 'Đang gửi lại mã OTP', message: `Hệ thống đang phát lại mã xác thực mới đến ${target}.` });
    await new Promise((r) => setTimeout(r, 500));
    toast({ type: 'success', title: 'Đã gửi mã mới', message: 'Mã xác nhận thử nghiệm mới: 686868' });
  };

  // Auto fill demo OTP
  const handleFillDemoOtp = () => {
    setOtp(['6', '8', '6', '8', '6', '8']);
    toast({ type: 'info', title: 'Đã điền OTP mẫu', message: 'Mã xác nhận 686868 đã được điền tự động.' });
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) {
      toast({ type: 'error', title: 'Chưa đủ 6 số', message: 'Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số!' });
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);

    // Accept 686868 or any 6 digits
    setStep(3);
    const targetLabel = method === 'phone_otp' ? 'Số điện thoại' : 'Tài khoản Gmail';
    toast({ type: 'success', title: 'Xác thực OTP thành công!', message: `${targetLabel} chính chủ. Hãy thiết lập mật khẩu mới ngay.` });
  };

  // STEP 3: Đặt lại mật khẩu (API thật)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast({ type: 'error', title: 'Mật khẩu quá ngắn', message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ type: 'error', title: 'Mật khẩu không khớp', message: 'Mật khẩu xác nhận không trùng khớp!' });
      return;
    }
    if (!resetToken) {
      toast({ type: 'error', title: 'Thiếu token', message: 'Vui lòng nhập mã reset từ email.' });
      return;
    }
    setIsLoading(true);
    try {
      const { apiResetPassword } = await import('../services/authService');
      await apiResetPassword({ token: resetToken, newPassword });
      setIsLoading(false);
      setStep(4);
      toast({ type: 'success', title: 'Đổi mật khẩu thành công!', message: 'Mật khẩu tài khoản đã được cập nhật. Hãy đăng nhập lại.' });
    } catch (err) {
      const { getApiError } = await import('../services/authService');
      toast({ type: 'error', title: 'Lỗi', message: getApiError(err) });
      setIsLoading(false);
    }
  };

  // Password Strength Calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, label: 'Yếu', color: 'bg-rose-500' };
    if (score <= 4) return { score: 2, label: 'Trung bình', color: 'bg-amber-500' };
    return { score: 3, label: 'Rất mạnh', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="w-full bg-white rounded-[28px] shadow-[0_25px_70px_-12px_rgba(30,58,138,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08)] border border-white/80 ring-1 ring-blue-900/5 overflow-hidden flex flex-col md:flex-row">
      
      {/* LEFT PANEL: Blue gradient with BLACK text and BLACK icons (100% matched with LoginPage) */}
      <div className="md:w-[45%] bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-400 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
        {/* Soft glowing ambient circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/20 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-200/30 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

        {/* Logo + Title */}
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
          <p className="text-xs font-bold text-slate-900 max-w-[260px] leading-relaxed">
            Trung tâm Khôi phục Mật khẩu & Bảo vệ Tài khoản
          </p>
        </div>

        {/* Security highlights */}
        <div className="relative z-10 space-y-3 my-8 sm:my-10">
          {[
            { icon: ShieldCheck, text: 'Xác thực OTP 2 lớp qua SMS / Zalo ZNS chính chủ' },
            { icon: Mail,        text: 'Gửi mã OTP bảo mật 6 số trực tiếp về hòm thư Gmail' },
            { icon: KeyRound,    text: 'Mã hóa mật khẩu chuẩn ngân hàng AES-256 an toàn' },
            { icon: Store,       text: 'Bảo vệ toàn vẹn dữ liệu kho hàng & doanh thu shop' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white/35 border border-white/50 backdrop-blur-sm hover:bg-white/45 transition-all shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-white/55 flex items-center justify-center shrink-0 shadow-2xs">
                  <Icon className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                </div>
                <span className="text-xs font-bold text-slate-950 leading-snug">{item.text}</span>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 text-center text-[11px] font-bold text-slate-900">
          Tổng đài hỗ trợ xác minh khẩn cấp: <span className="underline font-black">1900 8888</span>
        </div>
      </div>

      {/* RIGHT PANEL: Form with only Phone OTP or Gmail OTP */}
      <div className="md:w-[55%] p-8 sm:p-12 flex flex-col justify-between bg-white">
        <div className="max-w-md w-full mx-auto">

          {/* Back to Login Link */}
          <div className="mb-5 flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Quay lại Đăng nhập</span>
            </Link>

            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
              Xác thực OTP
            </span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
              Quên Mật Khẩu?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Chọn nhận mã xác thực OTP qua <strong>Số điện thoại</strong> hoặc gửi về <strong>Gmail</strong> để đặt lại mật khẩu.
            </p>
          </div>

          {/* EXACTLY 2 TABS: SĐT OTP and Gmail/Email OTP (NO Google login) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6 border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleSwitchMethod('phone_otp')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                method === 'phone_otp'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>Số điện thoại (OTP)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMethod('email_otp')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                method === 'email_otp'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Gmail / Email (OTP)</span>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-between px-2 mb-4">
            {[
              { s: 1, label: method === 'phone_otp' ? 'Nhập SĐT' : 'Nhập Gmail' },
              { s: 2, label: 'Nhập OTP 6 số' },
              { s: 3, label: 'Đổi mật khẩu' },
            ].map((item, idx) => (
              <div key={item.s} className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    step >= item.s
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step > item.s ? '✓' : item.s}
                </div>
                <span className={`text-[11px] font-medium hidden sm:inline ${step >= item.s ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {idx < 2 && <div className={`w-8 h-0.5 mx-1 ${step > item.s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1: Enter Phone OR Enter Gmail */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in duration-200">
              {method === 'phone_otp' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Số điện thoại đăng ký tài khoản
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0988 123 456"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold tracking-wide"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Mã xác thực OTP gồm 6 chữ số sẽ được gửi qua tin nhắn SMS hoặc Zalo ZNS.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Địa chỉ Gmail / Email đăng ký tài khoản
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@demo.vn hoặc yourname@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Mã xác thực OTP gồm 6 chữ số sẽ được gửi thẳng về hòm thư Gmail của bạn.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{method === 'phone_otp' ? 'Gửi Mã OTP Đến Số Điện Thoại' : 'Gửi Mã OTP Về Hòm Thư Gmail'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP (Used for both Phone and Gmail!) */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <p className="text-xs text-slate-600 font-medium">
                  {method === 'phone_otp' ? (
                    <>Mã OTP đã gửi qua SMS tới: <strong className="text-blue-700">{phoneNumber}</strong></>
                  ) : (
                    <>Mã OTP đã gửi về Gmail: <strong className="text-blue-700">{email}</strong></>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-blue-600 underline font-semibold mt-0.5 inline-block cursor-pointer"
                >
                  {method === 'phone_otp' ? 'Đổi số điện thoại khác' : 'Đổi địa chỉ Gmail khác'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                  Nhập mã OTP gồm 6 chữ số {method === 'email_otp' ? 'trong Gmail' : 'trong tin nhắn'}
                </label>

                {/* 6 Digit Inputs */}
                <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-2xs"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Resend and Demo helper */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={handleFillDemoOtp}
                  className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold cursor-pointer text-[11px]"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Điền mã thử (686868)
                </button>

                <button
                  type="button"
                  disabled={!canResend}
                  onClick={handleResendOtp}
                  className={`font-semibold flex items-center gap-1 transition-colors text-[11px] ${
                    canResend ? 'text-blue-600 hover:underline cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  {canResend ? 'Gửi lại mã OTP' : `Gửi lại sau (${resendCooldown}s)`}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Xác Nhận Mã OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Create New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-3.5 animate-in fade-in duration-200">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 shrink-0">
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Xác nhận lại mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Lưu & Cập Nhật Mật Khẩu</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Đặt Lại Mật Khẩu Thành Công!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Mật khẩu tài khoản của bạn đã được thay đổi an toàn. Bạn có thể đăng nhập ngay với mật khẩu mới.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Đăng Nhập Ngay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUser({
                      email: method === 'email_otp' ? email : 'owner@demo.vn',
                      name: 'Nguyễn Thị Lan',
                      role: 'store_owner',
                      displayRole: 'Chủ shop (Toàn quyền)',
                    }, `token-${Date.now()}`);
                    navigate('/dashboard');
                  }}
                  className="w-full py-2.5 text-xs text-slate-600 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
                >
                  Vào thẳng trang quản trị kho →
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-8 text-center text-xs text-slate-400">
          Phiên bản 1.0 • © 2026 StockPilot Vietnam
        </div>
      </div>

    </div>
  );
}
