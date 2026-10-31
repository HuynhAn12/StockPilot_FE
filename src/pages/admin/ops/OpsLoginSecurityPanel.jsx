import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, KeyRound, LockOpen, ShieldAlert } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { formatVNDateTime } from '../../../services/adminService';
import { apiClearLoginLock, apiGetLoginFailures } from '../../../services/adminOpsService';
import { apiErrorMessage, roleLabel } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { Badge, ConfirmDialog, EmptyState, ErrorState, StatCard, TableCard, Td, Th } from '../components/AdminUI';
import { formatNumber, segmentedButton, segmentedWrapper, useOpsData } from './opsShared';

const WINDOWS = [
  { hours: 24, label: '24 giờ' },
  { hours: 168, label: '7 ngày' },
  { hours: 720, label: '30 ngày' },
];

export function OpsLoginSecurityPanel() {
  const { toast } = useToast();
  const [hours, setHours] = useState(24);
  const [clearing, setClearing] = useState(null);
  const report = useOpsData(() => apiGetLoginFailures({ hours, limit: 10 }), [hours]);
  const d = report.data;

  const clearLock = async ({ reason }) => {
    try {
      await apiClearLoginLock(clearing.accountKey, reason);
      toast({ type: 'success', title: 'Đã gỡ khóa đăng nhập', description: `${clearing.emailMasked} có thể đăng nhập lại ngay.` });
      setClearing(null);
      report.reload();
    } catch (err) {
      toast({ type: 'error', title: 'Không gỡ khóa được', description: apiErrorMessage(err) });
    }
  };

  if (report.error) return <div className={ui.card}><ErrorState message={report.error} onRetry={report.reload} /></div>;

  const lockout = d?.lockout;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13px] text-[#64748B] max-w-[75ch]">
          {lockout
            ? lockout.maxAttempts === 0
              ? 'Tự khóa tạm đang TẮT. '
              : `Một email nhập sai ${lockout.maxAttempts} lần trong ${lockout.windowMinutes} phút sẽ bị khóa đăng nhập tạm thời. `
            : ''}
          <Link to="/admin/security?tab=settings" className="text-[#2563EB] hover:underline">Đổi ngưỡng</Link>
        </p>
        <div className={segmentedWrapper} role="group" aria-label="Khoảng thời gian">
          {WINDOWS.map((w) => (
            <button key={w.hours} type="button" className={segmentedButton(hours === w.hours)} onClick={() => setHours(w.hours)}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Lượt đăng nhập sai" value={formatNumber(d?.totalFailures)} icon={KeyRound} loading={report.loading} />
        <StatCard
          title="Lượt bị chặn do đang khóa"
          value={formatNumber(d?.blockedAttempts)}
          alert={Boolean(d?.blockedAttempts)}
          subtitle="Dấu hiệu có người cố dò mật khẩu"
          icon={Ban}
          loading={report.loading}
        />
        <StatCard
          title="Tài khoản đang bị khóa tạm"
          value={formatNumber(d?.byAccount?.filter((a) => a.locked).length)}
          icon={ShieldAlert}
          loading={report.loading}
        />
      </div>

      <TableCard header={<span className={ui.cardTitle}>Tài khoản bị nhập sai nhiều nhất</span>}>
        {!report.loading && !d?.byAccount?.length ? (
          <EmptyState title="Không có lượt đăng nhập sai" description="Trong khoảng thời gian này chưa ai nhập sai mật khẩu." />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>Email (đã che)</Th>
                <Th>Tài khoản</Th>
                <Th align="right">Lượt sai</Th>
                <Th>Lần sai gần nhất</Th>
                <Th>Trạng thái</Th>
                <Th align="right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {(d?.byAccount || []).map((a) => (
                <tr key={a.accountKey} className={ui.tr}>
                  <Td><span className="font-mono text-[12.5px]">{a.emailMasked}</span></Td>
                  <Td>
                    {a.user ? (
                      <>
                        <p className="font-medium text-[#0F172A]">{a.user.fullName}</p>
                        <p className="text-[12px] text-[#64748B]">{roleLabel(a.user.role)}{!a.user.isActive && ' · đã khóa'}</p>
                      </>
                    ) : (
                      <span className="text-[12.5px] text-[#94A3B8]">Email không tồn tại trong hệ thống</span>
                    )}
                  </Td>
                  <Td align="right"><span className="admin-num font-semibold">{formatNumber(a.failures)}</span></Td>
                  <Td>{formatVNDateTime(a.lastFailedAt)}</Td>
                  <Td>{a.locked ? <Badge tone="danger">Khóa tạm · còn {a.retryAfterMinutes} phút</Badge> : <Badge tone="neutral">Bình thường</Badge>}</Td>
                  <Td align="right">
                    {a.locked && (
                      <button type="button" className={ui.btnSecondary} onClick={() => setClearing(a)}>
                        <LockOpen className="w-3.5 h-3.5" /> Gỡ khóa
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <TableCard header={<span className={ui.cardTitle}>Địa chỉ IP nhập sai nhiều nhất</span>}>
        {!report.loading && !d?.byIp?.length ? (
          <EmptyState title="Chưa có dữ liệu" />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>Địa chỉ IP</Th>
                <Th align="right">Lượt sai</Th>
                <Th>Lần sai gần nhất</Th>
              </tr>
            </thead>
            <tbody>
              {(d?.byIp || []).map((row) => (
                <tr key={row.ipAddress || 'unknown'} className={ui.tr}>
                  <Td><span className="font-mono text-[12.5px]">{row.ipAddress || 'Không xác định'}</span></Td>
                  <Td align="right"><span className="admin-num font-semibold">{formatNumber(row.failures)}</span></Td>
                  <Td>{formatVNDateTime(row.lastFailedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <p className="text-[12px] text-[#64748B]">
        Cần khóa hẳn một tài khoản? Dùng trang <Link to="/admin/users" className="text-[#2563EB] hover:underline">Người dùng & Quyền</Link>.
      </p>

      {clearing && (
        <ConfirmDialog
          title={`Gỡ khóa đăng nhập cho ${clearing.emailMasked}?`}
          description="Chỉ gỡ khi đã xác minh chính chủ (ví dụ chủ cửa hàng gọi điện báo quên mật khẩu). Bộ đếm lượt sai sẽ về 0."
          confirmLabel="Gỡ khóa"
          reason={{ required: true, minLength: 3, placeholder: 'Ví dụ: Chủ cửa hàng gọi hotline xác minh lúc 10:15' }}
          onConfirm={clearLock}
          onClose={() => setClearing(null)}
        />
      )}
    </div>
  );
}
