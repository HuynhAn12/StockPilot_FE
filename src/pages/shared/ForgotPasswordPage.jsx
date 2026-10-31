import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  ShieldCheck, Smartphone, Mail, CheckCircle2,
  RefreshCw, KeyRound, AlertCircle, Sparkles, Store
} from 'lucide-react';
import { useAuthStore } from '../../components/store/authStore';
import { useToast } from '../../components/common/Toast';
import { useTranslation } from '../../i18n/useTranslation';
import { apiForgotPassword, apiVerifyOtp, apiResetPassword, getApiError } from '../../services/authService';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [resetToken, setResetToken] = useState(''); // token từ xác thực OTP

  // Active recovery method: 'email_otp' | 'phone_otp' (Ưu tiên Gmail OTP theo yêu cầu)
  const [method, setMethod] = useState('email_otp');

  // Multi-step Flow (Step 1: Input Gmail/Phone -> Step 2: Input 6-digit OTP -> Step 3: Set new password -> Step 4: Success)
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('0988 123 456');
  const [email, setEmail] = useState('');
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
      toast({
        type: 'success',
        title: isEn ? 'OTP Pasted' : 'Đã dán mã OTP',
        message: isEn ? `Verification code: ${pasted}` : `Mã xác nhận: ${pasted}`,
      });
    }
  };

  // STEP 1: Gửi mã OTP về Gmail hoặc Số điện thoại (SMS)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (method === 'phone_otp') {
        const targetPhone = phoneNumber.trim().replace(/\s+/g, '');
        if (!targetPhone || targetPhone.length < 9) {
          toast({
            type: 'error',
            title: isEn ? 'Invalid phone number' : 'Số điện thoại không hợp lệ',
            message: isEn ? 'Please enter a valid phone number (at least 9 digits)!' : 'Vui lòng nhập đúng số điện thoại đăng ký (ít nhất 9 chữ số)!',
          });
          setIsLoading(false);
          return;
        }
        result = await apiForgotPassword({ phone: targetPhone });
        toast({
          type: 'success',
          title: isEn ? 'OTP Sent to Phone!' : 'Đã gửi mã OTP đến số điện thoại!',
          message: isEn
            ? `A 6-digit OTP code has been sent to ${phoneNumber.trim()}. Please check SMS to get your code.`
            : `Hệ thống đã gửi mã OTP 6 số đến ${phoneNumber.trim()}. Vui lòng kiểm tra tin nhắn SMS để lấy mã.`,
        });
      } else {
        const targetEmail = email.trim();
        if (!targetEmail || !targetEmail.includes('@')) {
          toast({
            type: 'error',
            title: isEn ? 'Invalid email' : 'Email không hợp lệ',
            message: isEn ? 'Please enter your registered email address!' : 'Vui lòng nhập đúng địa chỉ Gmail / Email đăng ký!',
          });
          setIsLoading(false);
          return;
        }
        result = await apiForgotPassword({ email: targetEmail });
        toast({
          type: 'success',
          title: isEn ? 'OTP Sent to Email!' : 'Đã gửi mã OTP về Gmail!',
          message: isEn
            ? `A 6-digit OTP code has been sent to ${targetEmail}. Please check your inbox or spam folder.`
            : `Hệ thống đã gửi mã OTP 6 số đến ${targetEmail}. Vui lòng mở hộp thư Gmail (hoặc mục Spam) để lấy mã.`,
        });
      }

      setIsLoading(false);
      setStep(2);
      setResendCooldown(60);
      setCanResend(false);

      if (result?.data?.resetToken) setResetToken(result.data.resetToken);
    } catch (err) {
      toast({
        type: 'error',
        title: isEn ? 'Error sending OTP' : 'Lỗi gửi mã OTP',
        message: getApiError(err),
      });
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);

    setIsLoading(true);
    try {
      let result;
      if (method === 'phone_otp') {
        const targetPhone = phoneNumber.trim().replace(/\s+/g, '');
        result = await apiForgotPassword({ phone: targetPhone });
        toast({
          type: 'success',
          title: isEn ? 'SMS OTP Resent!' : 'Đã gửi lại mã OTP SMS!',
          message: isEn
            ? `A new verification code has been resent to ${phoneNumber.trim()}.`
            : `Mã xác thực mới đã được gửi lại tới ${phoneNumber.trim()}.`,
        });
      } else {
        result = await apiForgotPassword({ email: email.trim() });
        toast({
          type: 'success',
          title: isEn ? 'Email OTP Resent!' : 'Đã gửi lại mã OTP Gmail!',
          message: isEn
            ? `A new verification code has been resent to ${email.trim()}. Please check Gmail.`
            : `Hệ thống đã gửi mã xác thực mới đến ${email.trim()}. Vui lòng kiểm tra Gmail.`,
        });
      }

      setIsLoading(false);
      if (result?.data?.resetToken) setResetToken(result.data.resetToken);
    } catch (err) {
      setIsLoading(false);
      toast({
        type: 'error',
        title: isEn ? 'Unable to resend code' : 'Không thể gửi lại mã',
        message: getApiError(err),
      });
    }
  };

  // STEP 2: Xác thực mã OTP qua Backend
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) {
      toast({
        type: 'error',
        title: isEn ? '6 digits required' : 'Chưa đủ 6 số',
        message: isEn ? 'Please enter all 6 digits of the OTP code!' : 'Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số!',
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { otp: enteredCode };
      if (method === 'phone_otp') {
        payload.phone = phoneNumber.trim().replace(/\s+/g, '');
      } else {
        payload.email = email.trim();
      }

      const result = await apiVerifyOtp(payload);
      setIsLoading(false);
      if (result?.data?.resetToken) {
        setResetToken(result.data.resetToken);
      }
      setStep(3);
      toast({
        type: 'success',
        title: isEn ? 'OTP verified!' : 'Xác thực OTP thành công!',
        message: isEn ? 'OTP code is valid. Please create your new password.' : 'Mã OTP chính xác. Hãy thiết lập mật khẩu mới ngay.',
      });
    } catch (err) {
      setIsLoading(false);
      toast({
        type: 'error',
        title: isEn ? 'OTP verification failed' : 'Xác thực OTP thất bại',
        message: getApiError(err) || (isEn ? 'Invalid or expired OTP code. Please try again!' : 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại!'),
      });
    }
  };

  // STEP 3: Đặt lại mật khẩu (API thật)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast({
        type: 'error',
        title: isEn ? 'Password too short' : 'Mật khẩu quá ngắn',
        message: isEn ? 'New password must be at least 8 characters!' : 'Mật khẩu mới phải có ít nhất 8 ký tự!',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        type: 'error',
        title: isEn ? 'Passwords do not match' : 'Mật khẩu không khớp',
        message: isEn ? 'Password confirmation does not match!' : 'Mật khẩu xác nhận không trùng khớp!',
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        token: resetToken,
        otp: otp.join(''),
        newPassword,
      };
      if (method === 'phone_otp') {
        payload.phone = phoneNumber.trim().replace(/\s+/g, '');
      } else {
        payload.email = email.trim();
      }

      await apiResetPassword(payload);
      setIsLoading(false);
      setStep(4);
      toast({
        type: 'success',
        title: isEn ? 'Password reset successfully!' : 'Đổi mật khẩu thành công!',
        message: isEn ? 'Your password has been updated. Please sign in.' : 'Mật khẩu tài khoản đã được cập nhật. Hãy đăng nhập lại.',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: isEn ? 'Error' : 'Lỗi',
        message: getApiError(err),
      });
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

    if (score <= 2) return { score: 1, label: isEn ? 'Weak' : 'Yếu', color: 'bg-rose-500' };
    if (score <= 4) return { score: 2, label: isEn ? 'Medium' : 'Trung bình', color: 'bg-amber-500' };
    return { score: 3, label: isEn ? 'Strong' : 'Rất mạnh', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="w-full bg-white rounded-[28px] shadow-[0_25px_70px_-12px_rgba(30,58,138,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08)] border border-white/80 ring-1 ring-blue-900/5 overflow-hidden flex flex-col md:flex-row">

      {/* LEFT PANEL: Blue gradient matching LoginPage */}
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
            {isEn
              ? 'Password Recovery & Account Security Center'
              : 'Trung tâm Khôi phục Mật khẩu & Bảo vệ Tài khoản'}
          </p>
        </div>

        {/* Security highlights */}
        <div className="relative z-10 space-y-3 my-8 sm:my-10">
          {[
            {
              icon: ShieldCheck,
              text: isEn
                ? '2-Factor OTP verification via phone & SMS'
                : 'Xác thực OTP 2 lớp qua SMS / Zalo ZNS chính chủ',
            },
            {
              icon: Mail,
              text: isEn
                ? 'Secure 6-digit OTP sent directly to email inbox'
                : 'Gửi mã OTP bảo mật 6 số trực tiếp về hòm thư Gmail',
            },
            {
              icon: KeyRound,
              text: isEn
                ? 'Bank-grade AES-256 password encryption'
                : 'Mã hóa mật khẩu chuẩn ngân hàng AES-256 an toàn',
            },
            {
              icon: Store,
              text: isEn
                ? 'Guaranteed data integrity for retail operations'
                : 'Bảo vệ toàn vẹn dữ liệu kho hàng & doanh thu shop',
            },
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
          {isEn ? 'Emergency Support Hotline: ' : 'Tổng đài hỗ trợ xác minh khẩn cấp: '}
          <span className="underline font-black">1900 8888</span>
        </div>
      </div>

      {/* RIGHT PANEL: Form with Phone OTP or Gmail OTP */}
      <div className="md:w-[55%] p-8 sm:p-12 flex flex-col justify-between bg-white">
        <div className="max-w-md w-full mx-auto">

          {/* Back to Login Link */}
          <div className="mb-5 flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>{isEn ? 'Back to Sign In' : 'Quay lại Đăng nhập'}</span>
            </Link>

            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
              {isEn ? 'OTP Verification' : 'Xác thực OTP'}
            </span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
              {isEn ? 'Forgot Password?' : 'Quên Mật Khẩu?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isEn
                ? 'Choose to receive an OTP code via Phone Number or Email to reset your password.'
                : 'Chọn nhận mã xác thực OTP qua Số điện thoại hoặc gửi về Gmail để đặt lại mật khẩu.'}
            </p>
          </div>

          {/* 2 TABS: Phone OTP and Email OTP */}
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
              <span>{isEn ? 'Phone (OTP)' : 'Số điện thoại (OTP)'}</span>
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
              <span>{isEn ? 'Email (OTP)' : 'Gmail / Email (OTP)'}</span>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-between px-2 mb-4">
            {[
              { s: 1, label: method === 'phone_otp' ? (isEn ? 'Phone' : 'Nhập SĐT') : (isEn ? 'Email' : 'Nhập Gmail') },
              { s: 2, label: isEn ? '6-digit OTP' : 'Nhập OTP 6 số' },
              { s: 3, label: isEn ? 'New Password' : 'Đổi mật khẩu' },
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
                    {isEn ? 'Registered account phone number' : 'Số điện thoại đăng ký tài khoản'}
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
                    {isEn
                      ? 'A 6-digit OTP code will be sent via SMS message.'
                      : 'Mã xác thực OTP gồm 6 chữ số sẽ được gửi qua tin nhắn SMS hoặc Zalo ZNS.'}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isEn ? 'Registered email address' : 'Địa chỉ Gmail / Email đăng ký tài khoản'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isEn ? 'owner@store.com or user@gmail.com' : 'owner@demo.vn hoặc yourname@gmail.com'}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {isEn
                      ? 'A 6-digit OTP code will be sent directly to your email inbox.'
                      : 'Mã xác thực OTP gồm 6 chữ số sẽ được gửi thẳng về hòm thư Gmail của bạn.'}
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
                    <span>
                      {method === 'phone_otp'
                        ? (isEn ? 'Send OTP to Phone Number' : 'Gửi Mã OTP Đến Số Điện Thoại')
                        : (isEn ? 'Send OTP to Email' : 'Gửi Mã OTP Về Hòm Thư Gmail')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <div className="text-center p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <p className="text-xs text-slate-600 font-medium">
                  {method === 'phone_otp' ? (
                    <>
                      {isEn ? 'OTP code sent via SMS to: ' : 'Mã OTP đã gửi qua SMS tới: '}
                      <strong className="text-blue-700">{phoneNumber}</strong>
                    </>
                  ) : (
                    <>
                      {isEn ? 'OTP code sent to email: ' : 'Mã OTP đã gửi về Gmail: '}
                      <strong className="text-blue-700">{email}</strong>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-blue-600 underline font-semibold mt-0.5 inline-block cursor-pointer"
                >
                  {method === 'phone_otp'
                    ? (isEn ? 'Change phone number' : 'Đổi số điện thoại khác')
                    : (isEn ? 'Change email address' : 'Đổi địa chỉ Gmail khác')}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                  {isEn
                    ? 'Enter the 6-digit OTP verification code:'
                    : `Nhập mã OTP gồm 6 chữ số ${method === 'email_otp' ? 'trong Gmail' : 'trong tin nhắn'}`}
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

              {/* Resend and security notice */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {isEn ? 'Check your email inbox or spam folder' : 'Kiểm tra hộp thư Gmail của bạn'}
                </span>

                <button
                  type="button"
                  disabled={!canResend}
                  onClick={handleResendOtp}
                  className={`font-semibold flex items-center gap-1 transition-colors text-[11px] ${
                    canResend ? 'text-blue-600 hover:underline cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  {canResend
                    ? (isEn ? 'Resend OTP' : 'Gửi lại mã OTP')
                    : (isEn ? `Resend in (${resendCooldown}s)` : `Gửi lại sau (${resendCooldown}s)`)}
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
                    <span>{isEn ? 'Verify OTP Code' : 'Xác Nhận Mã OTP'}</span>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isEn ? 'New password' : 'Mật khẩu mới'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={isEn ? 'Enter new password (min 8 characters)' : 'Nhập mật khẩu mới (tối thiểu 8 ký tự)'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isEn ? 'Confirm new password' : 'Xác nhận lại mật khẩu mới'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={isEn ? 'Re-enter new password' : 'Nhập lại mật khẩu mới'}
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
                    <span>{isEn ? 'Save & Update Password' : 'Lưu & Cập Nhật Mật Khẩu'}</span>
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
                <h3 className="text-xl font-bold text-slate-900">
                  {isEn ? 'Password Reset Successful!' : 'Đặt Lại Mật Khẩu Thành Công!'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {isEn
                    ? 'Your account password has been safely updated. You can now sign in with your new password.'
                    : 'Mật khẩu tài khoản của bạn đã được thay đổi an toàn. Bạn có thể đăng nhập ngay với mật khẩu mới.'}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isEn ? 'Sign In Now' : 'Đăng Nhập Ngay'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 text-xs text-slate-600 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
                >
                  {isEn ? 'Return to sign in →' : 'Quay lại trang đăng nhập →'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-8 text-center text-xs text-slate-400">
          {isEn ? 'Version 1.0 • © 2026 StockPilot Vietnam' : 'Phiên bản 1.0 • © 2026 StockPilot Vietnam'}
        </div>
      </div>

    </div>
  );
}
