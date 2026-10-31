import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, LockOpen, ShieldAlert, UserX } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { formatVNDateTime } from '../../../services/adminService';
import { apiClearLoginLock, apiGetLoginFailures } from '../../../services/adminOpsService';
import { apiErrorMessage, roleLabel } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { Badge, ConfirmDialog, EmptyState, ErrorState, PanelCard, SummaryStrip, TableBody, Td, Th } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { formatNumber, segmentedButton, segmentedWrapper, useOpsData } from './opsShared';

const WINDOWS = [
  { hours: 24, vi: '24 giờ', en: '24 hours' },
  { hours: 168, vi: '7 ngày', en: '7 days' },
  { hours: 720, vi: '30 ngày', en: '30 days' },
];

export function OpsLoginSecurityPanel() {
  const { t } = useAdminText();
  const { toast } = useToast();
  const [hours, setHours] = useState(24);
  const [clearing, setClearing] = useState(null);
  const report = useOpsData(() => apiGetLoginFailures({ hours, limit: 10 }), [hours]);
  const d = report.data;

  const clearLock = async ({ reason }) => {
    try {
      await apiClearLoginLock(clearing.accountKey, reason);
      toast({
        type: 'success',
        title: t('Đã gỡ khóa đăng nhập', 'Login lock cleared'),
        description: t(`${clearing.emailMasked} có thể đăng nhập lại ngay.`, `${clearing.emailMasked} can sign in again now.`),
      });
      setClearing(null);
      report.reload();
    } catch (err) {
      toast({ type: 'error', title: t('Không gỡ khóa được', 'Could not clear the lock'), description: apiErrorMessage(err) });
    }
  };

  if (report.error) {
    return (
      <div className={ui.card}>
        <ErrorState message={report.error} onRetry={report.reload} />
      </div>
    );
  }

  const lockout = d?.lockout;
  const lockedCount = d?.byAccount?.filter((a) => a.locked).length;

  const windowPicker = (
    <div className={segmentedWrapper} role="group" aria-label={t('Khoảng thời gian', 'Time range')}>
      {WINDOWS.map((w) => (
        <button key={w.hours} type="button" aria-pressed={hours === w.hours} className={segmentedButton(hours === w.hours)} onClick={() => setHours(w.hours)}>
          {t(w.vi, w.en)}
        </button>
      ))}
    </div>
  );

  const lockoutText = lockout
    ? lockout.maxAttempts === 0
      ? t('Tự khóa tạm đang TẮT.', 'Automatic lockout is OFF.')
      : t(
          `Một email nhập sai ${lockout.maxAttempts} lần trong ${lockout.windowMinutes} phút sẽ bị khóa đăng nhập tạm thời.`,
          `An email with ${lockout.maxAttempts} failed attempts within ${lockout.windowMinutes} minutes is temporarily locked.`
        )
    : '';

  return (
    <div className="space-y-4">
      <PanelCard
        icon={ShieldAlert}
        title={t('Đăng nhập bất thường', 'Suspicious sign-ins')}
        description={
          <>
            {lockoutText}{' '}
            <Link to="/admin/security?tab=settings" className="text-blue-700 hover:underline underline-offset-2">
              {t('Đổi ngưỡng', 'Change threshold')}
            </Link>
          </>
        }
        actions={windowPicker}
        bodyClassName=""
      >
        <SummaryStrip
          loading={report.loading}
          items={[
            { label: t('Lượt đăng nhập sai', 'Failed sign-ins'), value: formatNumber(d?.totalFailures) },
            {
              label: t('Lượt bị chặn do đang khóa', 'Blocked while locked'),
              value: formatNumber(d?.blockedAttempts),
              tone: d?.blockedAttempts ? 'warning' : undefined,
              hint: t('Dấu hiệu có người cố dò mật khẩu', 'A sign of password guessing'),
            },
            {
              label: t('Tài khoản đang bị khóa tạm', 'Accounts locked now'),
              value: formatNumber(lockedCount),
              tone: lockedCount ? 'danger' : undefined,
            },
            {
              label: t('IP nhập sai nhiều nhất', 'Top failing IP'),
              value: d?.byIp?.[0]?.ipAddress || '–',
              hint: d?.byIp?.[0] ? t(`${formatNumber(d.byIp[0].failures)} lượt sai`, `${formatNumber(d.byIp[0].failures)} failures`) : undefined,
            },
          ]}
        />
      </PanelCard>

      <PanelCard icon={UserX} title={t('Tài khoản bị nhập sai nhiều nhất', 'Most-failed accounts')} bodyClassName="overflow-x-auto">
        {!report.loading && !d?.byAccount?.length ? (
          <EmptyState
            title={t('Không có lượt đăng nhập sai', 'No failed sign-ins')}
            description={t('Trong khoảng thời gian này chưa ai nhập sai mật khẩu.', 'Nobody entered a wrong password in this period.')}
          />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>{t('Email (đã che)', 'Email (masked)')}</Th>
                <Th>{t('Tài khoản', 'Account')}</Th>
                <Th align="right">{t('Lượt sai', 'Failures')}</Th>
                <Th>{t('Lần sai gần nhất', 'Last failure')}</Th>
                <Th>{t('Trạng thái', 'Status')}</Th>
                <Th align="right">
                  <span className="sr-only">{t('Thao tác', 'Actions')}</span>
                </Th>
              </tr>
            </thead>
            <TableBody loading={report.loading} columns={6}>
              {(d?.byAccount || []).map((a) => (
                <tr key={a.accountKey} className={ui.tr}>
                  <Td>
                    <span className="font-mono text-[12px]">{a.emailMasked}</span>
                  </Td>
                  <Td>
                    {a.user ? (
                      <>
                        <p className="font-medium text-slate-900">{a.user.fullName}</p>
                        <p className="text-[12px] text-slate-500">
                          {roleLabel(a.user.role)}
                          {!a.user.isActive && t(' · đã khóa', ' · disabled')}
                        </p>
                      </>
                    ) : (
                      <span className="text-[12px] text-slate-500">{t('Email không tồn tại trong hệ thống', 'Email not registered')}</span>
                    )}
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums font-medium">{formatNumber(a.failures)}</span>
                  </Td>
                  <Td className="tabular-nums">{formatVNDateTime(a.lastFailedAt)}</Td>
                  <Td>
                    {a.locked ? (
                      <Badge tone="danger">{t(`Khóa tạm · còn ${a.retryAfterMinutes} phút`, `Locked · ${a.retryAfterMinutes} min left`)}</Badge>
                    ) : (
                      <Badge tone="neutral">{t('Bình thường', 'Normal')}</Badge>
                    )}
                  </Td>
                  <Td align="right">
                    {a.locked && (
                      <button type="button" className={`${ui.btnSecondary} h-8`} onClick={() => setClearing(a)}>
                        <LockOpen className="w-3.5 h-3.5" aria-hidden="true" /> {t('Gỡ khóa', 'Unlock')}
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </TableBody>
          </table>
        )}
      </PanelCard>

      <PanelCard icon={Globe} title={t('Địa chỉ IP nhập sai nhiều nhất', 'Most-failing IP addresses')} bodyClassName="overflow-x-auto">
        {!report.loading && !d?.byIp?.length ? (
          <EmptyState title={t('Chưa có dữ liệu', 'No data yet')} />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>{t('Địa chỉ IP', 'IP address')}</Th>
                <Th align="right">{t('Lượt sai', 'Failures')}</Th>
                <Th>{t('Lần sai gần nhất', 'Last failure')}</Th>
              </tr>
            </thead>
            <TableBody loading={report.loading} columns={3}>
              {(d?.byIp || []).map((row) => (
                <tr key={row.ipAddress || 'unknown'} className={ui.tr}>
                  <Td>
                    <span className="font-mono text-[12px]">{row.ipAddress || t('Không xác định', 'Unknown')}</span>
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums font-medium">{formatNumber(row.failures)}</span>
                  </Td>
                  <Td className="tabular-nums">{formatVNDateTime(row.lastFailedAt)}</Td>
                </tr>
              ))}
            </TableBody>
          </table>
        )}
      </PanelCard>

      <p className="text-[12px] text-slate-500">
        {t('Cần khóa hẳn một tài khoản? Dùng trang', 'Need to disable an account permanently? Use')}{' '}
        <Link to="/admin/users" className="text-blue-700 hover:underline underline-offset-2">
          {t('Người dùng & Quyền', 'Users & Roles')}
        </Link>
        .
      </p>

      {clearing && (
        <ConfirmDialog
          title={t(`Gỡ khóa đăng nhập cho ${clearing.emailMasked}?`, `Clear the login lock for ${clearing.emailMasked}?`)}
          description={t(
            'Chỉ gỡ khi đã xác minh chính chủ (ví dụ chủ cửa hàng gọi điện báo quên mật khẩu). Bộ đếm lượt sai sẽ về 0.',
            'Only clear after verifying the owner (e.g. a store owner called about a forgotten password). The failure counter resets to 0.'
          )}
          confirmLabel={t('Gỡ khóa', 'Unlock')}
          reason={{
            required: true,
            minLength: 3,
            placeholder: t('Ví dụ: Chủ cửa hàng gọi hotline xác minh lúc 10:15', 'e.g. Store owner verified via hotline at 10:15'),
          }}
          onConfirm={clearLock}
          onClose={() => setClearing(null)}
        />
      )}
    </div>
  );
}
