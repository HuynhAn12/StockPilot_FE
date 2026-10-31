import React, { useState } from 'react';
import { AlarmClock, CheckCircle2, Inbox, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetSupportSla } from '../../../services/adminOpsService';
import { adminStyles as ui } from '../adminStyles';
import { Badge, EmptyState, ErrorState, StatCard, TableCard, Td, Th } from '../components/AdminUI';
import {
  PRIORITY_LABELS,
  PRIORITY_TONES,
  formatMinutes,
  formatNumber,
  rangeFromPreset,
  segmentedButton,
  segmentedWrapper,
  useOpsData,
} from './opsShared';

const PRESETS = [7, 30, 90];

export function OpsSupportSlaPanel() {
  const [days, setDays] = useState(30);
  const sla = useOpsData(() => apiGetSupportSla(rangeFromPreset(days)), [days]);
  const d = sla.data;
  const overall = d?.overall;

  if (sla.error) return <div className={ui.card}><ErrorState message={sla.error} onRetry={sla.reload} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13px] text-[#64748B]">
          Thời hạn phản hồi đầu tiên:{' '}
          {d?.slaHours ? `Cao ${d.slaHours.HIGH} giờ · Bình thường ${d.slaHours.NORMAL} giờ · Thấp ${d.slaHours.LOW} giờ` : '…'}{' '}
          <Link to="/admin/security?tab=settings" className="text-[#2563EB] hover:underline">Đổi thời hạn</Link>
        </p>
        <div className={segmentedWrapper} role="group" aria-label="Khoảng thời gian">
          {PRESETS.map((p) => (
            <button key={p} type="button" className={segmentedButton(days === p)} onClick={() => setDays(p)}>
              {p} ngày
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Ticket trong kỳ" value={formatNumber(overall?.total)} subtitle={overall ? `${formatNumber(overall.resolved)} đã xử lý xong` : ''} icon={Inbox} loading={sla.loading} />
        <StatCard
          title="Phản hồi đầu tiên (TB)"
          value={formatMinutes(overall?.firstResponseMinutes?.avg)}
          subtitle={overall?.firstResponseMinutes?.p95 != null ? `95% ticket dưới ${formatMinutes(overall.firstResponseMinutes.p95)}` : 'Chưa có ticket được phản hồi'}
          icon={Timer}
          loading={sla.loading}
        />
        <StatCard
          title="Vi phạm SLA phản hồi"
          value={formatNumber(overall?.breachedFirstResponse)}
          alert={Boolean(overall?.breachedFirstResponse)}
          icon={AlarmClock}
          loading={sla.loading}
        />
        <StatCard
          title="Thời gian xử lý xong (TB)"
          value={formatMinutes(overall?.resolutionMinutes?.avg)}
          subtitle={overall?.resolutionMinutes?.p95 != null ? `P95: ${formatMinutes(overall.resolutionMinutes.p95)}` : ''}
          icon={CheckCircle2}
          loading={sla.loading}
        />
      </div>

      <TableCard header={<span className={ui.cardTitle}>Theo mức ưu tiên</span>}>
        <table className={ui.table}>
          <thead>
            <tr>
              <Th>Mức ưu tiên</Th>
              <Th align="right">Thời hạn</Th>
              <Th align="right">Ticket</Th>
              <Th align="right">Phản hồi TB</Th>
              <Th align="right">P95</Th>
              <Th align="right">Vi phạm</Th>
            </tr>
          </thead>
          <tbody>
            {(d?.byPriority || []).map((row) => (
              <tr key={row.priority} className={ui.tr}>
                <Td><Badge tone={PRIORITY_TONES[row.priority]}>{PRIORITY_LABELS[row.priority]}</Badge></Td>
                <Td align="right">{d.slaHours[row.priority]} giờ</Td>
                <Td align="right"><span className="admin-num">{formatNumber(row.total)}</span></Td>
                <Td align="right">{formatMinutes(row.firstResponseMinutes.avg)}</Td>
                <Td align="right">{formatMinutes(row.firstResponseMinutes.p95)}</Td>
                <Td align="right">
                  <span className={`admin-num font-semibold ${row.breachedFirstResponse ? 'text-red-700' : 'text-[#94A3B8]'}`}>{formatNumber(row.breachedFirstResponse)}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <TableCard
        header={
          <>
            <span className={ui.cardTitle}>Ticket chưa phản hồi đã quá hạn</span>
            {d?.overdue?.count > 0 && <Badge tone="danger">{formatNumber(d.overdue.count)} ticket</Badge>}
          </>
        }
      >
        {!sla.loading && !d?.overdue?.items?.length ? (
          <EmptyState title="Không có ticket nào quá hạn" description="Mọi ticket đang mở đều đã được phản hồi trong thời hạn." />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>Ticket</Th>
                <Th>Cửa hàng</Th>
                <Th>Ưu tiên</Th>
                <Th>Tạo lúc</Th>
                <Th align="right">Đã chờ</Th>
                <Th>Phụ trách</Th>
              </tr>
            </thead>
            <tbody>
              {(d?.overdue?.items || []).map((t) => (
                <tr key={t.id} className={ui.tr}>
                  <Td>
                    <Link to={`/admin/support?ticket=${t.id}`} className="font-semibold text-[#0F172A] hover:text-[#2563EB]">#{t.id} · {t.subject}</Link>
                  </Td>
                  <Td>{t.store?.name || '–'}</Td>
                  <Td><Badge tone={PRIORITY_TONES[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge></Td>
                  <Td>{formatVNDateTime(t.createdAt)}</Td>
                  <Td align="right"><span className="font-semibold text-red-700">{formatMinutes(t.waitingMinutes)}</span></Td>
                  <Td>{t.assignee?.fullName || <span className="text-[#94A3B8]">Chưa phân công</span>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
      {d?.truncated && <p className="text-[12px] text-[#64748B]">Kỳ này có hơn 5.000 ticket; số liệu tính trên 5.000 ticket mới nhất.</p>}
    </div>
  );
}
