import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, RefreshCw, Save, ShieldCheck, XCircle } from 'lucide-react';
import { useToast } from '../common/Toast';
import { apiTestPaymentConfig, apiUpdatePaymentConfig } from '../../services/analyticsService';

const FIELDS = ['clientId', 'apiKey', 'checksumKey'];
const EMPTY = { clientId: '', apiKey: '', checksumKey: '' };

const errorMessage = (err, fallback) =>
  err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || fallback;

function buildPayload(values) {
  const payload = {};
  FIELDS.forEach(key => { if (values[key].trim()) payload[key] = values[key].trim(); });
  return payload;
}

function CredentialField({ id, label, value, onChange, placeholder, hint, error, secret, required, isEn }) {
  const [visible, setVisible] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600" aria-hidden>*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={`payos_${id}_token`}
          type={secret && !visible ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={secret ? 'new-password' : 'off'}
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-required={required}
          className={`h-11 w-full rounded-lg border bg-white px-3 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${secret ? 'pr-11' : ''} ${error ? 'border-red-300' : 'border-slate-200'}`}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? (isEn ? `Hide ${label}` : `Ẩn ${label}`) : (isEn ? `Show ${label}` : `Hiện ${label}`)}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        )}
      </div>
      {error
        ? <p id={`${id}-error`} className="text-xs font-medium text-red-600">{error}</p>
        : hint && <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function PayOSCredentialsForm({ config, isEn, onSaved }) {
  const { toast } = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success, message }

  // Chưa cấu hình hoặc khóa cũ không giải mã được → phải nhập đủ 3 trường.
  const requireAll = !config.configured || config.needsReentry;
  const hasSaved = config.configured && !config.needsReentry;
  const busy = saving || testing;

  const setField = (key) => (val) => {
    setValues(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    setTestResult(null);
  };

  const validate = () => {
    if (!requireAll) return {};
    const msg = isEn ? 'Required' : 'Bắt buộc nhập';
    return FIELDS.reduce((acc, key) => (values[key].trim() ? acc : { ...acc, [key]: msg }), {});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    const firstInvalid = FIELDS.find(key => nextErrors[key]);
    if (firstInvalid) {
      document.getElementById(`payos-${firstInvalid}`)?.focus();
      return;
    }
    const payload = buildPayload(values);
    if (Object.keys(payload).length === 0) {
      toast({
        title: isEn ? 'Nothing to update' : 'Chưa có thay đổi',
        description: isEn ? 'Enter at least one new key to replace the saved one.' : 'Nhập ít nhất một khóa mới để thay khóa đã lưu.',
        type: 'info',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await apiUpdatePaymentConfig(payload);
      onSaved({ ...res, configured: true });
      setValues(EMPTY);
      setTestResult(null);
      toast({
        title: isEn ? 'PayOS credentials saved' : 'Đã lưu thông tin PayOS',
        description: isEn ? 'Run "Test connection" to confirm the keys work.' : 'Bấm "Kiểm tra kết nối" để chắc chắn khóa hoạt động.',
        type: 'success',
      });
    } catch (err) {
      toast({
        title: isEn ? 'Could not save credentials' : 'Không lưu được thông tin PayOS',
        description: errorMessage(err, isEn ? 'Check the keys and try again.' : 'Kiểm tra lại các khóa và thử lại.'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Gửi các trường vừa gõ (nếu có); trường để trống → BE dùng khóa đã lưu.
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiTestPaymentConfig(buildPayload(values));
      const success = Boolean(res?.success);
      setTestResult({
        success,
        message: res?.message || (success
          ? (isEn ? 'PayOS accepted the credentials.' : 'PayOS đã xác thực thông tin kết nối.')
          : (isEn ? 'PayOS rejected the credentials.' : 'PayOS từ chối thông tin kết nối.')),
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: errorMessage(err, isEn ? 'Connection test failed. Please try again.' : 'Kiểm tra kết nối thất bại. Vui lòng thử lại.'),
      });
    } finally {
      setTesting(false);
    }
  };

  const savedSecretPlaceholder = isEn ? '•••••••• (leave blank to keep)' : '•••••••• (Để trống nếu giữ nguyên)';
  const canTest = hasSaved || FIELDS.every(key => values[key].trim());

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]" aria-labelledby="payos-credentials-title">
      <div className="mb-4 space-y-1">
        <h3 id="payos-credentials-title" className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <KeyRound className="size-4 text-slate-500" aria-hidden />
          {hasSaved ? (isEn ? 'Update credentials' : 'Cập nhật khóa kết nối') : (isEn ? 'Connection credentials' : 'Khóa kết nối')}
        </h3>
        <p className="text-sm text-slate-500">
          {isEn ? 'Copy these 3 values from PayOS → Payment Channels → your channel.' : 'Sao chép 3 giá trị này từ PayOS → Kênh thanh toán → kênh của bạn.'}
        </p>
      </div>

      {config.needsReentry && (
        <div role="alert" className="mb-4 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
          <p>{isEn
            ? 'The saved keys can no longer be decrypted (server encryption key changed). VietQR is paused until you enter all 3 values again.'
            : 'Không giải mã được khóa đã lưu (khóa mã hóa trên máy chủ đã đổi). VietQR tạm ngưng cho tới khi bạn nhập lại đủ 3 giá trị.'}</p>
        </div>
      )}

      <form onSubmit={handleSave} autoComplete="off" noValidate className="space-y-4">
        {/* Ô mồi để trình duyệt không tự điền mật khẩu đăng nhập vào ô khóa PayOS */}
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
          <input type="text" name="decoy_username" tabIndex={-1} autoComplete="username" />
          <input type="password" name="decoy_password" tabIndex={-1} autoComplete="current-password" />
        </div>

        <CredentialField
          id="payos-clientId" label="Client ID" isEn={isEn} required={requireAll}
          value={values.clientId} onChange={setField('clientId')} error={errors.clientId}
          placeholder={hasSaved && config.clientIdMasked
            ? (isEn ? `Saved Client ID: ${config.clientIdMasked}` : `Client ID đã lưu: ${config.clientIdMasked}`)
            : (isEn ? 'e.g. 550e8400-e29b-41d4-a716-446655440000' : 'Ví dụ: 550e8400-e29b-41d4-a716-446655440000')}
          hint={isEn ? 'Public identifier of your payment channel.' : 'Mã định danh công khai của kênh thanh toán.'}
        />
        <CredentialField
          id="payos-apiKey" label="API Key" secret isEn={isEn} required={requireAll}
          value={values.apiKey} onChange={setField('apiKey')} error={errors.apiKey}
          placeholder={hasSaved ? savedSecretPlaceholder : (isEn ? 'Paste API Key from PayOS' : 'Dán API Key từ PayOS')}
        />
        <CredentialField
          id="payos-checksumKey" label="Checksum Key" secret isEn={isEn} required={requireAll}
          value={values.checksumKey} onChange={setField('checksumKey')} error={errors.checksumKey}
          placeholder={hasSaved ? savedSecretPlaceholder : (isEn ? 'Paste Checksum Key from PayOS' : 'Dán Checksum Key từ PayOS')}
          hint={isEn ? 'Used to verify the signature of every webhook PayOS sends.' : 'Dùng để kiểm tra chữ ký của mọi webhook PayOS gửi về.'}
        />

        <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
          {isEn
            ? 'Keys are encrypted with AES-256-GCM before being stored and are never shown again.'
            : 'Khóa được mã hóa AES-256-GCM trước khi lưu và không bao giờ hiển thị lại.'}
        </p>

        {testResult && (
          <div
            role="status"
            className={`flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${testResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}
          >
            {testResult.success
              ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              : <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />}
            <div>
              <p className="font-medium">{testResult.success ? (isEn ? 'Connection successful' : 'Kết nối thành công') : (isEn ? 'Connection failed' : 'Kết nối thất bại')}</p>
              <p className="mt-0.5 text-xs">{testResult.message}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleTest}
            disabled={busy || !canTest}
            title={!canTest ? (isEn ? 'Enter all 3 keys or save them first' : 'Nhập đủ 3 khóa hoặc lưu trước') : undefined}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${testing ? 'animate-spin' : ''}`} aria-hidden />
            {testing ? (isEn ? 'Testing…' : 'Đang kiểm tra…') : (isEn ? 'Test connection' : 'Kiểm tra kết nối')}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
            {saving ? (isEn ? 'Saving…' : 'Đang lưu…') : (isEn ? 'Save credentials' : 'Lưu thông tin kết nối')}
          </button>
        </div>
      </form>
    </section>
  );
}
