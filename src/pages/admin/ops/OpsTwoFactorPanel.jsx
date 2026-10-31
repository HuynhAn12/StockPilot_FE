import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import { AlertTriangle, Check, Copy, Download, KeyRound, Loader2, RotateCcw, ShieldCheck, ShieldOff } from 'lucide-react';
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
import { Badge, ConfirmDialog, ErrorState, Modal, PanelCard } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { useOpsData } from './opsShared';

/** Vẽ QR từ otpauth:// ngay trên trình duyệt — secret không bao giờ gửi tới dịch vụ bên ngoài. */
function OtpQrCode({ value }) {
  const { t } = useAdminText();
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    ref.current.innerHTML = '';
    try {
      const svg = new BrowserQRCodeSvgWriter().write(value, 192, 192);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', t('Mã QR thiết lập xác thực 2 lớp', 'Two-factor setup QR code'));
      ref.current.appendChild(svg);
    } catch {
      ref.current.textContent = t('Không vẽ được mã QR — hãy nhập mã bí mật thủ công.', 'Could not draw the QR code — enter the secret manually.');
    }
  }, [value, t]);
  return (
    <div
      ref={ref}
      className="w-[192px] h-[192px] rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center text-[12px] text-slate-500"
    />
  );
}

function RecoveryCodesModal({ codes, onClose }) {
  const { t } = useAdminText();
  const [copied, setCopied] = useState(false);
  const text = codes.join('\n');
  const download = () => {
    const header = t('StockPilot — mã khôi phục xác thực 2 lớp\nMỗi mã chỉ dùng được 1 lần.', 'StockPilot — two-factor recovery codes\nEach code works only once.');
    const url = URL.createObjectURL(new Blob([`${header}\n\n${text}\n`], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stockpilot-ma-khoi-phuc-2fa.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Modal
      title={t('Lưu các mã khôi phục', 'Save your recovery codes')}
      description={t('Dùng khi mất điện thoại. Mỗi mã chỉ dùng được một lần.', 'Use them if you lose your phone. Each code works only once.')}
      onClose={onClose}
      footer={
        <button type="button" className={ui.btnPrimary} onClick={onClose}>
          {t('Tôi đã lưu xong', "I've saved them")}
        </button>
      }
    >
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 mb-4" role="alert">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-[13px] font-medium text-amber-900">
          {t(
            'Các mã này chỉ hiển thị MỘT LẦN. Đóng cửa sổ là không xem lại được — hãy tải về hoặc chép lại ngay.',
            'These codes are shown ONCE. Closing this window hides them for good — download or copy them now.'
          )}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 border border-slate-200 p-3 font-mono text-[14px] text-slate-900 text-center">
        {codes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          className={ui.btnSecondary}
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}{' '}
          {copied ? t('Đã chép', 'Copied') : t('Chép tất cả', 'Copy all')}
        </button>
        <button type="button" className={ui.btnSecondary} onClick={download}>
          <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t('Tải file .txt', 'Download .txt')}
        </button>
      </div>
    </Modal>
  );
}

export function OpsTwoFactorPanel() {
  const { t } = useAdminText();
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
  const resetName = otherAdmins.find((a) => String(a.id) === String(resetTarget))?.fullName;

  const startSetup = async ({ password }) => {
    try {
      setSetup(await apiStartTwoFactorSetup(password));
      setAskPassword(false);
      setCode('');
    } catch (err) {
      toast({ type: 'error', title: t('Không bắt đầu thiết lập được', 'Could not start setup'), description: apiErrorMessage(err) });
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
      toast({ type: 'success', title: t('Đã bật xác thực 2 lớp', 'Two-factor authentication enabled') });
    } catch (err) {
      toast({ type: 'error', title: t('Mã chưa đúng', 'Incorrect code'), description: apiErrorMessage(err) });
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
      toast({ type: 'success', title: t('Đã tắt xác thực 2 lớp', 'Two-factor authentication disabled') });
    } catch (err) {
      toast({ type: 'error', title: t('Không tắt được', 'Could not disable'), description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const doReset = async ({ reason, password }) => {
    try {
      await apiResetTwoFactor(resetTarget, password, reason);
      toast({
        type: 'success',
        title: t('Đã đặt lại xác thực 2 lớp', 'Two-factor authentication reset'),
        description: t(
          'Quản trị viên đó có thể đăng nhập bằng mật khẩu và thiết lập lại.',
          'That administrator can sign in with a password and set it up again.'
        ),
      });
      setConfirmReset(false);
      setResetTarget('');
    } catch (err) {
      toast({ type: 'error', title: t('Không đặt lại được', 'Could not reset'), description: apiErrorMessage(err) });
    }
  };

  if (status.error) {
    return (
      <div className={ui.card}>
        <ErrorState message={status.error} onRetry={status.reload} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PanelCard
        icon={s?.enabled ? ShieldCheck : ShieldOff}
        title={t('Xác thực 2 lớp cho tài khoản của bạn', 'Two-factor authentication for your account')}
        description={t(
          'Mã 6 số từ Google Authenticator, Microsoft Authenticator hoặc ứng dụng tương tự.',
          '6-digit codes from Google Authenticator, Microsoft Authenticator or a similar app.'
        )}
        actions={
          status.loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" aria-hidden="true" />
          ) : s?.enabled ? (
            <Badge tone="success">{t('Đang bật', 'Enabled')}</Badge>
          ) : (
            <Badge tone="neutral">{t('Đang tắt', 'Disabled')}</Badge>
          )
        }
      >
        {s?.enabled ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[13px] text-slate-600 space-y-1">
              <p className="tabular-nums">{t(`Bật từ ${formatVNDateTime(s.enabledAt)}.`, `Enabled since ${formatVNDateTime(s.enabledAt)}.`)}</p>
              <p className={`tabular-nums ${s.recoveryCodesRemaining < 3 ? 'text-amber-700 font-medium' : ''}`}>
                {t(`Còn ${s.recoveryCodesRemaining}/10 mã khôi phục`, `${s.recoveryCodesRemaining}/10 recovery codes left`)}
                {s.recoveryCodesRemaining < 3 && t(' — nên tắt rồi bật lại để nhận mã mới', ' — disable and re-enable to get new ones')}.
              </p>
            </div>
            <button type="button" className={ui.btnSecondary} onClick={() => setDisabling(true)}>
              <ShieldOff className="w-3.5 h-3.5" aria-hidden="true" /> {t('Tắt xác thực 2 lớp', 'Disable two-factor')}
            </button>
          </div>
        ) : setup ? (
          <form onSubmit={confirmEnable} className="flex flex-col md:flex-row gap-6">
            <OtpQrCode value={setup.otpauthUrl} />
            <div className="flex-1 space-y-4">
              <ol className="list-decimal pl-5 space-y-1.5 text-[13px] text-slate-600">
                <li>{t('Mở ứng dụng xác thực trên điện thoại và quét mã QR.', 'Open your authenticator app and scan the QR code.')}</li>
                <li>
                  {t('Không quét được? Nhập mã bí mật:', "Can't scan? Enter the secret:")}{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[12px] break-all select-all">{setup.secret}</code>
                </li>
                <li>{t('Nhập mã 6 số đang hiển thị trong ứng dụng để xác nhận.', 'Enter the 6-digit code shown in the app to confirm.')}</li>
              </ol>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="block text-[13px] font-medium text-slate-700 mb-1.5">{t('Mã xác nhận', 'Verification code')}</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className={`${ui.input} h-9 w-36 font-mono text-[16px] tracking-[0.3em] text-center`}
                    autoFocus
                  />
                </label>
                <button type="submit" className={ui.btnPrimary} disabled={busy || code.length !== 6}>
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />} {t('Bật 2FA', 'Enable 2FA')}
                </button>
                <button type="button" className={`${ui.btnGhost} h-9`} onClick={() => setSetup(null)} disabled={busy}>
                  {t('Hủy', 'Cancel')}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[13px] text-slate-600 max-w-[65ch]">
              {t(
                'Tài khoản quản trị có quyền khóa cửa hàng và đổi cài đặt toàn hệ thống. Bật 2FA để kẻ gian không đăng nhập được dù biết mật khẩu. Sau khi bật, mỗi lần đăng nhập sẽ cần thêm mã 6 số.',
                'Admin accounts can suspend stores and change platform-wide settings. Turn on 2FA so a stolen password alone is not enough. Each sign-in will then also ask for a 6-digit code.'
              )}
            </p>
            <button type="button" className={ui.btnPrimary} onClick={() => setAskPassword(true)} disabled={status.loading}>
              <KeyRound className="w-4 h-4" aria-hidden="true" /> {t('Bật xác thực 2 lớp', 'Enable two-factor')}
            </button>
          </div>
        )}
      </PanelCard>

      <PanelCard
        icon={RotateCcw}
        title={t('Đặt lại 2FA cho quản trị viên khác', 'Reset 2FA for another administrator')}
        description={t(
          'Dùng khi một quản trị viên mất điện thoại và cả mã khôi phục. Người đó sẽ đăng nhập lại bằng mật khẩu rồi tự thiết lập lại. Không thể tự đặt lại cho chính mình.',
          'Use when an administrator lost both their phone and recovery codes. They sign in with a password and set it up again. You cannot reset your own.'
        )}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={resetTarget}
            onChange={(e) => setResetTarget(e.target.value)}
            className={`${ui.select} h-9 sm:max-w-sm`}
            aria-label={t('Chọn quản trị viên', 'Select administrator')}
          >
            <option value="">
              {admins.loading
                ? t('Đang tải…', 'Loading…')
                : otherAdmins.length
                ? t('Chọn quản trị viên', 'Select administrator')
                : t('Không có quản trị viên khác', 'No other administrators')}
            </option>
            {otherAdmins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.fullName} — {a.email}
              </option>
            ))}
          </select>
          <button type="button" className={ui.btnDanger} disabled={!resetTarget} onClick={() => setConfirmReset(true)}>
            {t('Đặt lại 2FA', 'Reset 2FA')}
          </button>
        </div>
      </PanelCard>

      {askPassword && (
        <ConfirmDialog
          title={t('Xác nhận để thiết lập 2FA', 'Confirm to set up 2FA')}
          description={t('Nhập lại mật khẩu của bạn để tạo mã bí mật mới.', 'Re-enter your password to generate a new secret.')}
          confirmLabel={t('Tiếp tục', 'Continue')}
          password={{}}
          onConfirm={startSetup}
          onClose={() => setAskPassword(false)}
        />
      )}

      {disabling && (
        <Modal
          title={t('Tắt xác thực 2 lớp?', 'Disable two-factor authentication?')}
          description={t('Tài khoản sẽ chỉ còn bảo vệ bằng mật khẩu.', 'Your account will be protected by password only.')}
          onClose={() => setDisabling(false)}
          busy={busy}
          footer={
            <>
              <button type="button" className={ui.btnSecondary} onClick={() => setDisabling(false)} disabled={busy}>
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="button"
                className={ui.btnDanger}
                onClick={confirmDisable}
                disabled={busy || !disableForm.password || disableForm.code.trim().length < 6}
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />} {t('Tắt 2FA', 'Disable 2FA')}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <label className="block">
              <span className="block text-[13px] font-medium text-slate-700 mb-1.5">{t('Mật khẩu của bạn', 'Your password')}</span>
              <input
                type="password"
                autoComplete="current-password"
                className={ui.input}
                value={disableForm.password}
                onChange={(e) => setDisableForm((f) => ({ ...f, password: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="block text-[13px] font-medium text-slate-700 mb-1.5">{t('Mã 6 số hoặc mã khôi phục', '6-digit code or recovery code')}</span>
              <input
                autoComplete="one-time-code"
                className={`${ui.input} font-mono`}
                value={disableForm.code}
                onChange={(e) => setDisableForm((f) => ({ ...f, code: e.target.value }))}
              />
            </label>
          </div>
        </Modal>
      )}

      {confirmReset && (
        <ConfirmDialog
          title={t('Đặt lại xác thực 2 lớp?', 'Reset two-factor authentication?')}
          description={t(
            `Quản trị viên "${resetName}" sẽ đăng nhập được chỉ bằng mật khẩu cho tới khi tự bật lại 2FA.`,
            `Administrator "${resetName}" will be able to sign in with a password only until they turn 2FA back on.`
          )}
          confirmLabel={t('Đặt lại', 'Reset')}
          danger
          reason={{ required: true, minLength: 3, placeholder: t('Ví dụ: Mất điện thoại, đã xác minh qua cuộc gọi', 'e.g. Lost phone, verified by phone call') }}
          password={{}}
          onConfirm={doReset}
          onClose={() => setConfirmReset(false)}
        />
      )}

      {recoveryCodes && <RecoveryCodesModal codes={recoveryCodes} onClose={() => setRecoveryCodes(null)} />}
    </div>
  );
}
