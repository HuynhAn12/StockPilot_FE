import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight, Store,
  Phone, Globe2, MapPin, CheckCircle2, Circle, Shield,
  Sparkles, Package, DollarSign, AlertTriangle, Check,
  ChevronRight, Building2, Tag
} from 'lucide-react';
import { useAuthStore } from '../components/store/authStore';
import { useToast } from '../components/common/Toast';

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

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Quá yếu', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Yếu',    color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Trung bình', color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Mạnh',   color: 'bg-emerald-400' };
  return { score, label: 'Rất mạnh', color: 'bg-emerald-600' };
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



function StepAccount({ form, errors, onChange }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const checks = [
    { ok: form.password.length >= 8,        text: 'Ít nhất 8 ký tự' },
    { ok: /[A-Z]/.test(form.password),       text: 'Có chữ hoa (A-Z)' },
    { ok: /[0-9]/.test(form.password),       text: 'Có chữ số (0-9)' },
    { ok: /[^A-Za-z0-9]/.test(form.password),text: 'Có ký tự đặc biệt (!@#...)' },
  ];

  return (
    <div className="space-y-4">
      {/* Row: Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Họ và tên chủ cửa hàng" required error={errors.name} icon={User}>
          <TextInput
            id="reg-name"
            icon
            type="text"
            placeholder="Nguyễn Văn A"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </Field>

        <Field label="Số điện thoại liên hệ" error={errors.phone} icon={Phone}>
          <TextInput
            id="reg-phone"
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
        <Field label="Email đăng nhập" required error={errors.email} icon={Mail}>
          <TextInput
            id="reg-email"
            icon
            type="email"
            placeholder="chushop@cuahang.vn"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
        </Field>

        <Field label="Mật khẩu khởi tạo" required error={errors.password}>
          <input
            id="reg-password"
            type={showPw ? 'text' : 'password'}
            placeholder="Tối thiểu 8 ký tự"
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
            <span className="text-[11px] font-semibold text-slate-500">Độ mạnh mật khẩu:</span>
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
      <Field label="Xác nhận mật khẩu" required error={errors.confirmPassword}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Shield className="w-4 h-4" />
          </div>
          <input
            id="reg-confirm"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu để xác nhận"
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

function StepStore({ form, errors, onChange }) {
  const autoSlug = useMemo(() => slugify(form.storeName), [form.storeName]);

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
        <Field label="Tên cửa hàng" required error={errors.storeName} icon={Building2}>
          <TextInput
            id="reg-storename"
            icon
            type="text"
            placeholder="Thời Trang An Phát"
            value={form.storeName}
            onChange={(e) => handleStoreNameChange(e.target.value)}
          />
        </Field>

        <Field
          label="Mã định danh Slug cửa hàng"
          required
          error={errors.storeSlug}
          icon={Globe2}
          hint={`Được dùng trong URL: stockpilot.vn/${form.storeSlug || 'ten-cua-hang'}`}
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
        label="Địa chỉ cửa hàng / Kho hàng"
        error={errors.storeAddress}
        icon={MapPin}
        hint="Dùng để in trên phiếu giao hàng và phiếu kho"
      >
        <TextInput
          id="reg-address"
          icon
          type="text"
          placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
          value={form.storeAddress}
          onChange={(e) => onChange('storeAddress', e.target.value)}
        />
      </Field>

      {/* Industry category */}
      <Field label="Ngành hàng kinh doanh chính" icon={Tag}>
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
            <option value="">-- Chọn ngành hàng --</option>
            <option value="tap-hoa">Tạp hóa / Bán lẻ đa ngành</option>
            <option value="thoi-trang">Thời trang / Quần áo / Phụ kiện</option>
            <option value="thuc-pham">Thực phẩm / Đồ uống / F&B</option>
            <option value="dien-tu">Điện tử / Điện thoại / Máy tính</option>
            <option value="my-pham">Mỹ phẩm / Chăm sóc cá nhân</option>
            <option value="gia-dung">Đồ gia dụng / Nội thất</option>
            <option value="van-phong">Văn phòng phẩm / Học tập</option>
            <option value="khac">Ngành hàng khác</option>
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
          Tôi đã đọc và đồng ý với{' '}
          <a href="#" className="text-blue-600 font-semibold hover:underline" onClick={(e) => e.preventDefault()}>
            Điều khoản Dịch vụ
          </a>{' '}
          và{' '}
          <a href="#" className="text-blue-600 font-semibold hover:underline" onClick={(e) => e.preventDefault()}>
            Chính sách Bảo mật Dữ liệu
          </a>{' '}
          của StockPilot. Dữ liệu cửa hàng của bạn luôn được bảo mật tuyệt đối.
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

  const [step, setStep] = useState(1); // 1 | 2
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // Step 1
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2
    storeName: '',
    storeSlug: '',
    storeSlugManual: false,
    storeAddress: '',
    industry: '',
    agreeTerms: false,
  });

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Validate step 1
  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ và tên đầy đủ';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Địa chỉ email không hợp lệ';
    if (form.password.length < 8) errs.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận chưa khớp';
    if (form.phone && !/^(0|\+84)[0-9]{9}$/.test(form.phone.replace(/\s/g, ''))) {
      errs.phone = 'Số điện thoại không đúng định dạng (10 chữ số)';
    }
    return errs;
  };

  // Validate step 2
  const validateStep2 = () => {
    const errs = {};
    if (!form.storeName.trim()) errs.storeName = 'Vui lòng nhập tên cửa hàng';
    if (!form.storeSlug.trim()) errs.storeSlug = 'Vui lòng nhập mã định danh slug';
    if (!/^[a-z0-9-]+$/.test(form.storeSlug)) errs.storeSlug = 'Slug chỉ được dùng chữ thường, số và dấu gạch ngang';
    if (!form.agreeTerms) errs.agreeTerms = 'Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục';
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

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const { apiRegister } = await import('../services/authService');
      const { user, token, refreshToken } = await apiRegister({
        fullName: form.name,
        email: form.email,
        password: form.password,
        storeName: form.storeName,
        storeCode: form.storeSlug,
        phone: form.phone || undefined,
        address: form.storeAddress || undefined,
      });
      // Lưu token vào authStore
      const { useAuthStore: store } = await import('../components/store/authStore');
      store.getState().setToken(token, refreshToken);
      store.getState().clearUser();
      // Gọn hơn: dùng login() trực tiếp
      const result = await login({ email: form.email, password: form.password });
      toast({
        type: 'success',
        title: 'Đăng ký thành công!',
        message: `Chào mừng ${form.name} đến với StockPilot!`,
      });
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      const { getApiError } = await import('../services/authService');
      const msg = getApiError(err);
      toast({ type: 'error', title: 'Đăng ký thất bại', message: msg });
      setIsLoading(false);
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
          Tài khoản
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
          Cửa hàng
        </span>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
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
          <p className="text-xs font-bold text-slate-900 max-w-[230px] leading-relaxed">
            Bắt đầu 30 ngày dùng thử miễn phí – Không cần thẻ tín dụng
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 space-y-2.5 my-8">
          {[
            { icon: Package,        text: 'Quản lý sản phẩm & phân loại danh mục' },
            { icon: AlertTriangle,  text: 'Cảnh báo thông minh nguy cơ hết / tồn hàng' },
            { icon: DollarSign,     text: 'AI gợi ý giá tối ưu với giải thích rõ ràng' },
            { icon: Sparkles,       text: 'Trợ lý AI Pilot phân tích kinh doanh 24/7' },
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
              { text: '✓ Bảo mật SSL' },
              { text: '✓ GDPR ready' },
              { text: '✓ Backup hàng ngày' },
            ].map((b, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-950/70 bg-white/30 px-2 py-0.5 rounded-full">
                {b.text}
              </span>
            ))}
          </div>
          <p className="text-center text-[11px] font-bold text-slate-900">
            Hệ thống chỉ gợi ý • Chủ shop toàn quyền quyết định
          </p>
        </div>
      </div>

      {/* ─── RIGHT panel ─────────────────────────────────────────────────────── */}
      <div className="md:w-[60%] p-8 sm:p-10 flex flex-col justify-between bg-white">
        <div className="max-w-lg w-full mx-auto">

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
              {step === 1 ? 'Tạo tài khoản StockPilot' : 'Thiết lập cửa hàng của bạn'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {step === 1
                ? 'Bước 1 / 2 — Điền thông tin cá nhân và mật khẩu đăng nhập'
                : 'Bước 2 / 2 — Thiết lập hồ sơ và thông tin cửa hàng'}
            </p>
          </div>

          {/* Step indicator */}
          <StepIndicator />

          {/* Step 1 form */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-5">
              <StepAccount form={form} errors={errors} onChange={onChange} />

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Tiếp tục &rarr; Thiết lập cửa hàng</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2 form */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              <StepStore form={form} errors={errors} onChange={onChange} />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setErrors({}); }}
                  className="flex-shrink-0 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
                >
                  ← Quay lại
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
                      <span>Hoàn tất đăng ký & Mở Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Login link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Đã có tài khoản cửa hàng?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        <div className="pt-6 text-center text-xs text-slate-400">
          Phiên bản 1.0 • © 2026 StockPilot Vietnam
        </div>
      </div>
    </div>
  );
}
