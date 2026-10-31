import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight, Store,
  Phone, Globe2, MapPin, CheckCircle2, Circle, Shield,
  Sparkles, Package, DollarSign, AlertTriangle, Check,
  ChevronRight, Building2, Tag, KeyRound, RefreshCw, X
} from 'lucide-react';
import { useAuthStore } from '../../components/store/authStore';
import { useToast } from '../../components/common/Toast';
import { useTranslation } from '../../i18n/useTranslation';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function getPasswordStrength(pw, isEn) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: isEn ? 'Very weak' : 'Quá yếu', color: 'bg-red-500' };
  if (score === 2) return { score, label: isEn ? 'Weak' : 'Yếu', color: 'bg-orange-400' };
  if (score === 3) return { score, label: isEn ? 'Medium' : 'Trung bình', color: 'bg-yellow-400' };
  if (score === 4) return { score, label: isEn ? 'Strong' : 'Mạnh', color: 'bg-emerald-400' };
  return { score, label: isEn ? 'Very strong' : 'Rất mạnh', color: 'bg-emerald-600' };
}

// ─── Reusable form field ────────────────────────────────────────────────────────

function Field({ label, required, error, icon: Icon, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[13px] font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        {children}
      </div>
      {hint && !error && <p className="text-[11px] text-slate-400 pl-0.5">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 font-medium pl-0.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

function TextInput({ icon, className = '', ...props }) {
  const hasIcon = !!icon;
  return (
    <input
      className={`w-full ${hasIcon ? 'pl-10' : 'pl-3.5'} pr-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium ${className}`}
      {...props}
    />
  );
}

// ─── Password input with toggle ──────────────────────────────────────────────────

function PasswordInput({ id, placeholder, value, onChange, showMatch }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Lock className="w-4 h-4" />
      </div>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
      />
      {showMatch && (
        <div className="absolute inset-y-0 right-8 flex items-center pr-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
      )}
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── STEP 1: Account credentials ────────────────────────────────────────────────

function StepAccount({ form, errors, onChange, isEn }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const strength = useMemo(() => getPasswordStrength(form.password, isEn), [form.password, isEn]);

  const checks = [
    { ok: form.password.length >= 8,         text: isEn ? 'At least 8 characters' : 'Ít nhất 8 ký tự' },
    { ok: /[A-Z]/.test(form.password),        text: isEn ? 'Uppercase letter (A-Z)' : 'Có chữ hoa (A-Z)' },
    { ok: /[0-9]/.test(form.password),        text: isEn ? 'Number (0-9)' : 'Có chữ số (0-9)' },
    { ok: /[^A-Za-z0-9]/.test(form.password), text: isEn ? 'Special symbol (!@#...)' : 'Có ký tự đặc biệt (!@#...)' },
  ];

  return (
    <div className="space-y-4">
      {/* Honeypot inputs hidden */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <input type="text" name="username" tabIndex={-1} />
        <input type="email" name="email" tabIndex={-1} />
        <input type="password" name="password" tabIndex={-1} />
      </div>

      {/* Row: Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={isEn ? 'Store owner full name' : 'Họ và tên chủ cửa hàng'}
          required
          error={errors.name}
          icon={User}
        >
          <TextInput
            id="reg-fullname"
            name="sp_owner_name_x7k"
            autoComplete="new-password"
            icon
            type="text"
            placeholder={isEn ? 'John Doe' : 'Nguyễn Văn A'}
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </Field>

        <Field
          label={isEn ? 'Contact phone number' : 'Số điện thoại liên hệ'}
          error={errors.phone}
          icon={Phone}
        >
          <TextInput
            id="reg-phonenumber"
            name="sp_owner_phone_x7k"
            autoComplete="new-password"
            icon
            type="tel"
            placeholder="0901234567"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </Field>
      </div>

      {/* Row: Email + Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={isEn ? 'Login email address' : 'Email đăng nhập'}
          required
          error={errors.email}
          icon={Mail}
        >
          <TextInput
            id="reg-emailaddress"
            name="sp_owner_email_x7k"
            autoComplete="new-password"
            icon
            type="text"
            placeholder={isEn ? 'owner@store.com' : 'chushop@cuahang.vn'}
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
        </Field>

        <Field
          label={isEn ? 'Account password' : 'Mật khẩu khởi tạo'}
          required
          error={errors.password}
        >
          <input
            id="reg-passwordfield"
            name="sp_owner_pw_x7k"
            autoComplete="new-password"
            type={showPw ? 'text' : 'password'}
            placeholder={isEn ? 'At least 8 characters' : 'Tối thiểu 8 ký tự'}
            value={form.password}
            onChange={(e) => onChange('password', e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
          />
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </Field>
      </div>

      {/* Password Strength meter */}
      {form.password.length > 0 && (
        <div className="space-y-2 p-3.5 rounded-xl border border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {isEn ? 'Password strength:' : 'Độ mạnh mật khẩu:'}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${strength.color}`}>
              {strength.label}
            </span>
          </div>

          {/* Meter bars */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength.score ? strength.color : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-2 gap-1 mt-1">
            {checks.map((c, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {c.ok
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                }
                <span className={`text-[11px] font-medium ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {c.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Password */}
      <Field
        label={isEn ? 'Confirm password' : 'Xác nhận mật khẩu'}
        required
        error={errors.confirmPassword}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Shield className="w-4 h-4" />
          </div>
          <input
            id="reg-confirmpassword"
            name="sp_confirm_pw_x7k"
            autoComplete="new-password"
            type={showConfirm ? 'text' : 'password'}
            placeholder={isEn ? 'Re-enter password to confirm' : 'Nhập lại mật khẩu để xác nhận'}
            value={form.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 font-medium"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {form.confirmPassword && form.password === form.confirmPassword && (
            <div className="absolute inset-y-0 right-8 flex items-center pr-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}

// ─── STEP 2: Store info ─────────────────────────────────────────────────────────

function StepStore({ form, errors, onChange, isEn }) {
  const handleStoreNameChange = (val) => {
    onChange('storeName', val);
    if (!form.storeSlugManual) {
      onChange('storeSlug', slugify(val));
    }
  };

  return (
    <div className="space-y-4">
      {/* Row: Store name + Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label={isEn ? 'Store name' : 'Tên cửa hàng'}
          required
          error={errors.storeName}
          icon={Building2}
        >
          <TextInput
            id="reg-storename"
            icon
            type="text"
            placeholder={isEn ? 'An Phat Retail' : 'Thời Trang An Phát'}
            value={form.storeName}
            onChange={(e) => handleStoreNameChange(e.target.value)}
          />
        </Field>

        <Field
          label={isEn ? 'Store URL Slug' : 'Mã định danh Slug cửa hàng'}
          required
          error={errors.storeSlug}
          icon={Globe2}
          hint={
            isEn
              ? `Used in URL: stockpilot.vn/${form.storeSlug || 'store-name'}`
              : `Được dùng trong URL: stockpilot.vn/${form.storeSlug || 'ten-cua-hang'}`
          }
        >
          <TextInput
            id="reg-slug"
            icon
            type="text"
            placeholder="an-phat-store"
            value={form.storeSlug}
            onChange={(e) => {
              onChange('storeSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              onChange('storeSlugManual', true);
            }}
          />
        </Field>
      </div>

      {/* Address */}
      <Field
        label={isEn ? 'Store / Warehouse Address' : 'Địa chỉ cửa hàng / Kho hàng'}
        error={errors.storeAddress}
        icon={MapPin}
        hint={
          isEn
            ? 'Printed on packing slips & warehouse delivery notes'
            : 'Dùng để in trên phiếu giao hàng và phiếu kho'
        }
      >
        <TextInput
          id="reg-address"
          icon
          type="text"
          placeholder={
            isEn
              ? 'Street address, ward/district, province/city'
              : 'Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố'
          }
          value={form.storeAddress}
          onChange={(e) => onChange('storeAddress', e.target.value)}
        />
      </Field>

      {/* Industry category */}
      <Field label={isEn ? 'Primary Business Category' : 'Ngành hàng kinh doanh chính'} icon={Tag}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Tag className="w-4 h-4" />
          </div>
          <select
            id="reg-industry"
            value={form.industry}
            onChange={(e) => onChange('industry', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium appearance-none cursor-pointer"
          >
            <option value="">{isEn ? '-- Select business category --' : '-- Chọn ngành hàng --'}</option>
            <option value="tap-hoa">{isEn ? 'Grocery / Multi-category Retail' : 'Tạp hóa / Bán lẻ đa ngành'}</option>
            <option value="thoi-trang">{isEn ? 'Fashion / Apparel / Accessories' : 'Thời trang / Quần áo / Phụ kiện'}</option>
            <option value="thuc-pham">{isEn ? 'Food / Beverage / F&B' : 'Thực phẩm / Đồ uống / F&B'}</option>
            <option value="dien-tu">{isEn ? 'Electronics / Phones / Computers' : 'Điện tử / Điện thoại / Máy tính'}</option>
            <option value="my-pham">{isEn ? 'Cosmetics / Personal Care' : 'Mỹ phẩm / Chăm sóc cá nhân'}</option>
            <option value="gia-dung">{isEn ? 'Home Goods / Furniture' : 'Đồ gia dụng / Nội thất'}</option>
            <option value="van-phong">{isEn ? 'Stationery / Education' : 'Văn phòng phẩm / Học tập'}</option>
            <option value="khac">{isEn ? 'Other Industries' : 'Ngành hàng khác'}</option>
          </select>
        </div>
      </Field>

      {/* Terms agreement */}
      <label className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/50 cursor-pointer group hover:bg-blue-50 transition-colors">
        <input
          type="checkbox"
          id="reg-terms"
          checked={form.agreeTerms}
          onChange={(e) => onChange('agreeTerms', e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
        />
        <span className="text-xs leading-relaxed text-slate-600">
          {isEn ? 'I have read and agree to the ' : 'Tôi đã đọc và đồng ý với '}
          <a href="/dieu-khoan/dieu-khoan-su-dung" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">
            {isEn ? 'Terms of Service' : 'Điều khoản Dịch vụ'}
          </a>{' '}
          {isEn ? 'and ' : 'và '}
          <a href="/dieu-khoan/chinh-sach-bao-mat" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">
            {isEn ? 'Privacy Policy' : 'Chính sách Bảo mật Dữ liệu'}
          </a>{' '}
          {isEn
            ? 'of StockPilot. Your business data is always strictly secured.'
            : 'của StockPilot. Dữ liệu cửa hàng của bạn luôn được bảo mật tuyệt đối.'}
        </span>
      </label>
      {errors.agreeTerms && (
        <p className="text-[11px] text-red-500 font-medium pl-0.5 flex items-center gap-1">
          <span>⚠</span>{errors.agreeTerms}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [step, setStep] = useState(1); // 1 | 2
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Admin "Tạo cửa hàng" from a lead opens /register?fullName&phone&email&storeName to prefill the form.
  const [searchParams] = useSearchParams();
  const prefill = (key, max) => (searchParams.get(key) || '').trim().slice(0, max);

  const [form, setForm] = useState(() => ({
    // Step 1
    name: prefill('fullName', 255),
    phone: prefill('phone', 20),
    email: prefill('email', 255),
    password: '',
    confirmPassword: '',
    // Step 2
    storeName: prefill('storeName', 255),
    storeSlug: slugify(prefill('storeName', 255)),
    storeSlugManual: false,
    storeAddress: '',
    industry: '',
    agreeTerms: false,
  }));

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Validate step 1
  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = isEn ? 'Please enter your full name' : 'Vui lòng nhập họ và tên đầy đủ';
    }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = isEn ? 'Invalid email address' : 'Địa chỉ email không hợp lệ';
    }
    if (form.password.length < 8) {
      errs.password = isEn ? 'Password must be at least 8 characters' : 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = isEn ? 'Passwords do not match' : 'Mật khẩu xác nhận chưa khớp';
    }
    if (form.phone && !/^(0|\+84)[0-9]{9}$/.test(form.phone.replace(/\s/g, ''))) {
      errs.phone = isEn ? 'Phone number must be 10 digits' : 'Số điện thoại không đúng định dạng (10 chữ số)';
    }
    return errs;
  };

  // Validate step 2
  const validateStep2 = () => {
    const errs = {};
    if (!form.storeName.trim()) {
      errs.storeName = isEn ? 'Please enter your store name' : 'Vui lòng nhập tên cửa hàng';
    }
    if (!form.storeSlug.trim()) {
      errs.storeSlug = isEn ? 'Please enter store URL slug' : 'Vui lòng nhập mã định danh slug';
    }
    if (!/^[a-z0-9-]+$/.test(form.storeSlug)) {
      errs.storeSlug = isEn
        ? 'Slug only allows lowercase letters, numbers, and hyphens'
        : 'Slug chỉ được dùng chữ thường, số và dấu gạch ngang';
    }
    if (!form.agreeTerms) {
      errs.agreeTerms = isEn
        ? 'You must agree to the Terms of Service to continue'
        : 'Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục';
    }
    return errs;
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(2);
  };

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputsRef = useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (showOtpModal && resendCooldown > 0) {
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
  }, [showOtpModal, resendCooldown]);

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

  // Bước 1: Khi bấm "Đăng ký" -> Kiểm tra form và Gửi OTP về Email
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const { apiSendRegisterOtp } = await import('../../services/authService');
      await apiSendRegisterOtp({
        fullName: form.name.trim(),
        email: form.email.trim(),
        storeCode: form.storeSlug.trim(),
      });

      setIsLoading(false);
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(60);
      setCanResend(false);
      setShowOtpModal(true);

      toast({
        type: 'success',
        title: isEn ? 'OTP Code Sent to Email!' : 'Đã gửi mã OTP về Gmail!',
        message: isEn
          ? `A 6-digit verification code has been sent to ${form.email.trim()}. Please check your inbox to complete registration!`
          : `Mã xác thực gồm 6 chữ số đã được gửi tới ${form.email.trim()}. Vui lòng kiểm tra hộp thư để hoàn tất đăng ký!`,
      });
    } catch (err) {
      const { getApiError } = await import('../../services/authService');
      const msg = getApiError(err);
      toast({
        type: 'error',
        title: isEn ? 'Unable to send OTP' : 'Không thể gửi mã OTP',
        message: msg,
      });
      setIsLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);

    try {
      const { apiSendRegisterOtp } = await import('../../services/authService');
      await apiSendRegisterOtp({
        fullName: form.name.trim(),
        email: form.email.trim(),
        storeCode: form.storeSlug.trim(),
      });

      toast({
        type: 'success',
        title: isEn ? 'Resent OTP code!' : 'Đã gửi lại mã OTP!',
        message: isEn
          ? `A new verification code has been sent to ${form.email.trim()}.`
          : `Hệ thống đã gửi lại mã xác thực mới đến ${form.email.trim()}.`,
      });
    } catch (err) {
      const { getApiError } = await import('../../services/authService');
      toast({
        type: 'error',
        title: isEn ? 'Unable to resend code' : 'Không thể gửi lại mã',
        message: getApiError(err),
      });
    }
  };

  // Bước 2: Xác thực mã OTP và hoàn tất tạo tài khoản
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) {
      toast({
        type: 'error',
        title: isEn ? '6 digits required' : 'Chưa đủ 6 số',
        message: isEn ? 'Please enter all 6 digits of the OTP code!' : 'Vui lòng nhập đầy đủ 6 chữ số mã OTP!',
      });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const { apiRegister } = await import('../../services/authService');
      await apiRegister({
        fullName: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        storeName: form.storeName.trim(),
        storeCode: form.storeSlug.trim(),
        phone: form.phone || undefined,
        address: form.storeAddress || undefined,
        otp: enteredCode,
      });

      // Tự động đăng nhập sau khi đăng ký thành công
      await login({ email: form.email.trim(), password: form.password });

      toast({
        type: 'success',
        title: isEn ? 'Registration successful!' : 'Đăng ký thành công!',
        message: isEn ? `Welcome ${form.name} to StockPilot!` : `Chào mừng ${form.name} đến với StockPilot!`,
      });

      setIsVerifyingOtp(false);
      setShowOtpModal(false);
      navigate('/dashboard');
    } catch (err) {
      const { getApiError } = await import('../../services/authService');
      const msg = getApiError(err);
      toast({
        type: 'error',
        title: isEn ? 'OTP verification failed' : 'Xác thực OTP thất bại',
        message: msg,
      });
      setIsVerifyingOtp(false);
    }
  };

  // ─── Stepper indicator ────────────────────────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-6">
      {/* Step 1 dot */}
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-200 text-slate-500'
          }`}
        >
          {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
        </div>
        <span className={`text-xs font-semibold hidden sm:inline ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
          {isEn ? 'Account' : 'Tài khoản'}
        </span>
      </div>

      <div className={`h-px w-8 sm:w-12 transition-all duration-500 ${step >= 2 ? 'bg-blue-500' : 'bg-slate-200'}`} />

      {/* Step 2 dot */}
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-200 text-slate-500'
          }`}
        >
          2
        </div>
        <span className={`text-xs font-semibold hidden sm:inline ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
          {isEn ? 'Store' : 'Cửa hàng'}
        </span>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="w-full bg-white rounded-[28px] shadow-[0_25px_70px_-12px_rgba(30,58,138,0.18),0_10px_25px_-5px_rgba(15,23,42,0.08)] border border-white/80 ring-1 ring-blue-900/5 overflow-hidden flex flex-col md:flex-row">

        {/* ─── LEFT panel ─────────────────────────────────────────────────────── */}
        <div className="md:w-[40%] bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-400 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient glowing orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Logo + Title */}
          <div className="relative z-10 flex flex-col items-center text-center pt-2">
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center shadow-lg">
                <svg className="w-11 h-11 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black px-2.5 py-0.5 rounded-full bg-white/70 text-slate-950 border border-slate-900/20 whitespace-nowrap uppercase tracking-wider shadow-sm">
                AI Pilot
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 mb-2">StockPilot</h1>
            <p className="text-xs font-bold text-slate-900 max-w-[260px] leading-relaxed">
              {isEn
                ? 'Start 30-day free trial – No credit card required'
                : 'Bắt đầu 30 ngày dùng thử miễn phí – Không cần thẻ tín dụng'}
            </p>
          </div>

          {/* Feature cards */}
          <div className="relative z-10 space-y-2.5 my-8">
            {[
              {
                icon: Package,
                text: isEn ? 'Product catalog & category organization' : 'Quản lý sản phẩm & phân loại danh mục',
              },
              {
                icon: AlertTriangle,
                text: isEn ? 'Smart alerts for stockouts & dead inventory' : 'Cảnh báo thông minh nguy cơ hết / tồn hàng',
              },
              {
                icon: DollarSign,
                text: isEn ? 'AI price suggestions with transparent rationale' : 'AI gợi ý giá tối ưu với giải thích rõ ràng',
              },
              {
                icon: Sparkles,
                text: isEn ? 'AI Pilot assistant for 24/7 business analytics' : 'Trợ lý AI Pilot phân tích kinh doanh 24/7',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-white/35 border border-white/50 backdrop-blur-sm hover:bg-white/45 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white/55 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-bold text-slate-950">{item.text}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom disclaimer */}
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 justify-center">
              {[
                { text: isEn ? '✓ SSL Encrypted' : '✓ Bảo mật SSL' },
                { text: '✓ GDPR ready' },
                { text: isEn ? '✓ Daily backups' : '✓ Backup hàng ngày' },
              ].map((b, i) => (
                <span key={i} className="text-[10px] font-bold text-slate-950/70 bg-white/30 px-2 py-0.5 rounded-full">
                  {b.text}
                </span>
              ))}
            </div>
            <p className="text-center text-[11px] font-bold text-slate-900">
              {isEn
                ? 'AI suggestions only • Shop owners hold full control'
                : 'Hệ thống chỉ gợi ý • Chủ shop toàn quyền quyết định'}
            </p>
          </div>
        </div>

        {/* ─── RIGHT panel ─────────────────────────────────────────────────────── */}
        <div className="md:w-[60%] p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div className="max-w-lg w-full mx-auto">

            {/* Header */}
            <div className="mb-5">
              <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                {step === 1
                  ? (isEn ? 'Create StockPilot Account' : 'Tạo tài khoản StockPilot')
                  : (isEn ? 'Set Up Your Store' : 'Thiết lập cửa hàng của bạn')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {step === 1
                  ? (isEn ? 'Step 1 / 2 — Personal info & account credentials' : 'Bước 1 / 2 — Điền thông tin cá nhân và mật khẩu đăng nhập')
                  : (isEn ? 'Step 2 / 2 — Store profile & configuration' : 'Bước 2 / 2 — Thiết lập hồ sơ và thông tin cửa hàng')}
              </p>
            </div>

            {/* Step indicator */}
            <StepIndicator />

            {/* Step 1 form */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-5" autoComplete="off">
                <StepAccount form={form} errors={errors} onChange={onChange} isEn={isEn} />

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{isEn ? 'Continue → Store Setup' : 'Tiếp tục → Thiết lập cửa hàng'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Step 2 form */}
            {step === 2 && (
              <form onSubmit={handleFinalSubmit} className="space-y-5" autoComplete="off">
                <StepStore form={form} errors={errors} onChange={onChange} isEn={isEn} />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setErrors({}); }}
                    className="shrink-0 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
                  >
                    {isEn ? '← Back' : '← Quay lại'}
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isEn ? 'Create Account' : 'Đăng ký'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Login link */}
            <div className="mt-6 text-center text-xs text-slate-400">
              {isEn ? 'Already have a store account?' : 'Đã có tài khoản cửa hàng?'}{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                {isEn ? 'Sign in now' : 'Đăng nhập ngay'}
              </Link>
            </div>
          </div>

          <div className="pt-6 text-center text-xs text-slate-400">
            {isEn ? 'Version 1.0 • © 2026 StockPilot Vietnam' : 'Phiên bản 1.0 • © 2026 StockPilot Vietnam'}
          </div>
        </div>
      </div>

      {/* ─── MODAL NHẬP MÃ OTP XÁC THỰC ĐĂNG KÝ (Render via Portal to cover entire viewport) ─── */}
      {showOtpModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            {/* Close / Go back button */}
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {isEn ? 'Verify Account Registration' : 'Xác thực đăng ký tài khoản'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isEn
                  ? 'A 6-digit OTP code has been sent to your email:'
                  : 'Mã OTP gồm 6 chữ số đã được gửi đến email đăng nhập của bạn:'}
                <br />
                <strong className="text-blue-600 font-semibold">{form.email}</strong>
              </p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2.5 text-center">
                  {isEn ? 'Enter the 6-digit OTP code from your inbox:' : 'Nhập mã OTP 6 chữ số trong hộp thư Gmail:'}
                </label>

                {/* 6 Digits Inputs */}
                <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP button */}
              <div className="flex items-center justify-center text-xs">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 cursor-pointer hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Resend new OTP code' : 'Gửi lại mã OTP mới'}</span>
                  </button>
                ) : (
                  <span className="text-slate-400">
                    {isEn ? (
                      <>Resend code in <strong className="text-blue-600">{resendCooldown}s</strong></>
                    ) : (
                      <>Gửi lại mã sau <strong className="text-blue-600">{resendCooldown}s</strong></>
                    )}
                  </span>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {isEn ? 'Back' : 'Quay về'}
                </button>

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
                >
                  {isVerifyingOtp ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{isEn ? 'Verify & Finish' : 'Xác nhận & Hoàn tất'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
