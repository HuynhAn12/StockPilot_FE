import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import { AlertTriangle, Check, Copy, Download, KeyRound, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { useAuthStore } from '../../../components/store/authStore';
import { apiListAdminUsers, formatVNDateTime } from '../../../services/adminService';
import {
  apiDisableTwoFactor,
  apiEnableTwoFactor,
  apiGetTwoFactorStatus,
  apiResetTwoFactor,
  apiStartTwoFactorSetup,
} from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { Badge, ConfirmDialog, ErrorState, Modal, Section } from '../components/AdminUI';
import { useOpsData } from './opsShared';

/** Vẽ QR từ otpauth:// ngay trên trình duyệt — secret không bao giờ gửi tới dịch vụ bên ngoài. */
function OtpQrCode({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    ref.current.innerHTML = '';
    try {
      const svg = new BrowserQRCodeSvgWriter().write(value, 192, 192);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Mã QR thiết lập xác thực 2 lớp');
      ref.current.appendChild(svg);
    } catch {
      ref.current.textContent = 'Không vẽ được mã QR — hãy nhập mã bí mật thủ công.';
    }
  }, [value]);
  return <div ref={ref} className="w-[192px] h-[192px] rounded-xl border border-[#E2E8F0] bg-white p-1 flex items-center justify-center text-[12px] text-[#64748B]" />;
}

function RecoveryCodesModal({ codes, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = codes.join('\n');
  const download = () => {
    const url = URL.createObjectURL(new Blob([`StockPilot — mã khôi phục xác thực 2 lớp\nMỗi mã chỉ dùng được 1 lần.\n\n${text}\n`], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stockpilot-ma-khoi-phuc-2fa.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Modal
      title="Lưu các mã khôi phục"
      description="Dùng khi mất điện thoại. Mỗi mã chỉ dùng được một lần."
      onClose={onClose}
      footer={<button type="button" className={ui.btnPrimary} onClick={onClose}>Tôi đã lưu xong</button>}
    >
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[13px] font-semibold text-amber-900">Các mã này chỉ hiển thị MỘT LẦN. Đóng cửa sổ là không xem lại được — hãy tải về hoặc chép lại ngay.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 border border-[#E2E8F0] p-3 font-mono text-[14px] text-[#0F172A] text-center">
        {codes.map((c) => <span key={c}>{c}</span>)}
      </div>
      <div className="flex gap-2 mt-4">
        <button type="button" className={ui.btnSecondary} onClick={() => { navigator.clipboard.writeText(text); setCopied(true); }}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Đã chép' : 'Chép tất cả'}
        </button>
        <button type="button" className={ui.btnSecondary} onClick={download}>
          <Download className="w-3.5 h-3.5" /> Tải file .txt
        </button>
      </div>
    </Modal>
  );
}

export function OpsTwoFactorPanel() {
  const { toast } = useToast();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const status = useOpsData(() => apiGetTwoFactorStatus());
  const admins = useOpsData(() => apiListAdminUsers({ role: 'ADMIN', limit: 100 }).then((r) => r.data));

  const [askPassword, setAskPassword] = useState(false);
  const [setup, setSetup] = useState(null); // { secret, otpauthUrl }
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [disabling, setDisabling] = useState(false);
  const [disableForm, setDisableForm] = useState({ password: '', code: '' });
  const [resetTarget, setResetTarget] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const s = status.data;
  const otherAdmins = (admins.data || []).filter((a) => String(a.id) !== String(currentUserId));

  const startSetup = async ({ password }) => {
    try {
      setSetup(await apiStartTwoFactorSetup(password));
      setAskPassword(false);
      setCode('');
    } catch (err) {
      toast({ type: 'error', title: 'Không bắt đầu thiết lập được', description: apiErrorMessage(err) });
    }
  };

  const confirmEnable = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return;
    setBusy(true);
    try {
      const result = await apiEnableTwoFactor(code);
      setRecoveryCodes(result.recoveryCodes);
      setSetup(null);
      status.reload();
      toast({ type: 'success', title: 'Đã bật xác thực 2 lớp' });
    } catch (err) {
      toast({ type: 'error', title: 'Mã chưa đúng', description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    setBusy(true);
    try {
      await apiDisableTwoFactor(disableForm.password, disableForm.code.trim());
      setDisabling(false);
      setDisableForm({ password: '', code: '' });
      status.reload();
      toast({ type: 'success', title: 'Đã tắt xác thực 2 lớp' });
    } catch (err) {
      toast({ type: 'error', title: 'Không tắt được', description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const doReset = async ({ reason, password }) => {
    try {
      await apiResetTwoFactor(resetTarget, password, reason);
      toast({ type: 'success', title: 'Đã đặt lại xác thực 2 lớp', description: 'Quản trị viên đó có thể đăng nhập bằng mật khẩu và thiết lập lại.' });
      setConfirmReset(false);
      setResetTarget('');
    } catch (err) {
      toast({ type: 'error', title: 'Không đặt lại được', description: apiErrorMessage(err) });
    }
  };

  if (status.error) return <div className={ui.card}><ErrorState message={status.error} onRetry={status.reload} /></div>;

  return (
    <div className="space-y-6">
      <div className={ui.card}>
        <div className={ui.cardHeader}>
          <div className="flex items-center gap-2.5">
            <span className={`w-9 h-9 rounded-xl border flex items-center justify-center ${s?.enabled ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-[#64748B]'}`}>
              {s?.enabled ? <ShieldCheck className="w-4.5 h-4.5" /> : <ShieldOff className="w-4.5 h-4.5" />}
            </span>
            <div>
              <p className={ui.cardTitle}>Xác thực 2 lớp cho tài khoản của bạn</p>
              <p className="text-[12px] text-[#64748B] mt-0.5">Mã 6 số từ Google Authenticator, Microsoft Authenticator hoặc ứng dụng tương tự.</p>
            </div>
          </div>
          {status.loading ? <Loader2 className="w-4 h-4 animate-spin text-[#94A3B8]" /> : s?.enabled ? <Badge tone="success">Đang bật</Badge> : <Badge tone="neutral">Đang tắt</Badge>}
        </div>

        <div className={ui.cardBody}>
          {s?.enabled ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[13px] text-[#475569] space-y-1">
                <p>Bật từ {formatVNDateTime(s.enabledAt)}.</p>
                <p className={s.recoveryCodesRemaining < 3 ? 'text-amber-700 font-semibold' : ''}>
                  Còn {s.recoveryCodesRemaining}/10 mã khôi phục{s.recoveryCodesRemaining < 3 && ' — nên tắt rồi bật lại để nhận mã mới'}.
                </p>
              </div>
              <button type="button" className={ui.btnSecondary} onClick={() => setDisabling(true)}>
                <ShieldOff className="w-3.5 h-3.5" /> Tắt xác thực 2 lớp
              </button>
            </div>
          ) : setup ? (
            <form onSubmit={confirmEnable} className="flex flex-col md:flex-row gap-6">
              <OtpQrCode value={setup.otpauthUrl} />
              <div className="flex-1 space-y-4">
                <ol className="list-decimal pl-5 space-y-1.5 text-[13px] text-[#475569]">
                  <li>Mở ứng dụng xác thực trên điện thoại và quét mã QR.</li>
                  <li>
                    Không quét được? Nhập mã bí mật:{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[12.5px] break-all select-all">{setup.secret}</code>
                  </li>
                  <li>Nhập mã 6 số đang hiển thị trong ứng dụng để xác nhận.</li>
                </ol>
                <div className="flex items-end gap-2">
                  <label className="block">
                    <span className="block text-[13px] font-semibold text-[#334155] mb-1.5">Mã xác nhận</span>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className={`${ui.input} w-36 font-mono text-[16px] tracking-[0.3em] text-center`}
                      autoFocus
                    />
                  </label>
                  <button type="submit" className={ui.btnPrimary} disabled={busy || code.length !== 6}>
                    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Bật 2FA
                  </button>
                  <button type="button" className={ui.btnGhost} onClick={() => setSetup(null)} disabled={busy}>Hủy</button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[13px] text-[#475569] max-w-[65ch]">
                Tài khoản quản trị có quyền khóa cửa hàng và đổi cài đặt toàn hệ thống. Bật 2FA để kẻ gian không đăng nhập được
                dù biết mật khẩu. Sau khi bật, mỗi lần đăng nhập sẽ cần thêm mã 6 số.
              </p>
              <button type="button" className={ui.btnPrimary} onClick={() => setAskPassword(true)} disabled={status.loading}>
                <KeyRound className="w-4 h-4" /> Bật xác thực 2 lớp
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={ui.card}>
        <div className={ui.cardBody}>
          <Section title="Đặt lại 2FA cho quản trị viên khác">
            <p className="text-[13px] text-[#64748B] mb-4 max-w-[70ch]">
              Dùng khi một quản trị viên mất điện thoại và cả mã khôi phục. Người đó sẽ đăng nhập lại bằng mật khẩu rồi tự thiết lập lại.
              Không thể tự đặt lại cho chính mình.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <select value={resetTarget} onChange={(e) => setResetTarget(e.target.value)} className={`${ui.select} sm:max-w-sm`} aria-label="Chọn quản trị viên">
                <option value="">{admins.loading ? 'Đang tải…' : otherAdmins.length ? 'Chọn quản trị viên' : 'Không có quản trị viên khác'}</option>
                {otherAdmins.map((a) => (
                  <option key={a.id} value={a.id}>{a.fullName} — {a.email}</option>
                ))}
              </select>
              <button type="button" className={ui.btnDanger} disabled={!resetTarget} onClick={() => setConfirmReset(true)}>
                Đặt lại 2FA
              </button>
            </div>
          </Section>
        </div>
      </div>

      {askPassword && (
        <ConfirmDialog
          title="Xác nhận để thiết lập 2FA"
          description="Nhập lại mật khẩu của bạn để tạo mã bí mật mới."
          confirmLabel="Tiếp tục"
          password={{}}
          onConfirm={startSetup}
          onClose={() => setAskPassword(false)}
        />
      )}

      {disabling && (
        <Modal
          title="Tắt xác thực 2 lớp?"
          description="Tài khoản sẽ chỉ còn bảo vệ bằng mật khẩu."
          onClose={() => setDisabling(false)}
          busy={busy}
          footer={
            <>
              <button type="button" className={ui.btnSecondary} onClick={() => setDisabling(false)} disabled={busy}>Hủy</button>
              <button type="button" className={ui.btnDanger} onClick={confirmDisable} disabled={busy || !disableForm.password || disableForm.code.trim().length < 6}>
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Tắt 2FA
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <label className="block">
              <span className="block text-[13px] font-semibold text-[#334155] mb-1.5">Mật khẩu của bạn</span>
              <input type="password" autoComplete="current-password" className={ui.input} value={disableForm.password} onChange={(e) => setDisableForm((f) => ({ ...f, password: e.target.value }))} />
            </label>
            <label className="block">
              <span className="block text-[13px] font-semibold text-[#334155] mb-1.5">Mã 6 số hoặc mã khôi phục</span>
              <input autoComplete="one-time-code" className={`${ui.input} font-mono`} value={disableForm.code} onChange={(e) => setDisableForm((f) => ({ ...f, code: e.target.value }))} />
            </label>
          </div>
        </Modal>
      )}

      {confirmReset && (
        <ConfirmDialog
          title="Đặt lại xác thực 2 lớp?"
          description={`Quản trị viên "${otherAdmins.find((a) => String(a.id) === String(resetTarget))?.fullName}" sẽ đăng nhập được chỉ bằng mật khẩu cho tới khi tự bật lại 2FA.`}
          confirmLabel="Đặt lại"
          danger
          reason={{ required: true, minLength: 3, placeholder: 'Ví dụ: Mất điện thoại, đã xác minh qua cuộc gọi' }}
          password={{}}
          onConfirm={doReset}
          onClose={() => setConfirmReset(false)}
        />
      )}

      {recoveryCodes && <RecoveryCodesModal codes={recoveryCodes} onClose={() => setRecoveryCodes(null)} />}
    </div>
  );
}
