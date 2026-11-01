import React, { useState } from 'react';
import { AlarmClock, Layers, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetSupportSla } from '../../../services/adminOpsService';
import { adminStyles as ui } from '../adminStyles';
import { Badge, EmptyState, ErrorState, PanelCard, SummaryStrip, TableBody, Td, Th } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import {
  PRIORITY_TONES,
  formatMinutes,
  formatNumber,
  priorityLabel,
  rangeFromPreset,
  segmentedButton,
  segmentedWrapper,
  useOpsData,
} from './opsShared';

const PRESETS = [7, 30, 90];

export function OpsSupportSlaPanel() {
  const { t } = useAdminText();
  const [days, setDays] = useState(30);
  const sla = useOpsData(() => apiGetSupportSla(rangeFromPreset(days)), [days]);
  const d = sla.data;
  const overall = d?.overall;

  if (sla.error) {
    return (
      <div className={ui.card}>
        <ErrorState message={sla.error} onRetry={sla.reload} />
      </div>
    );
  }

  const rangePicker = (
    <div className={segmentedWrapper} role="group" aria-label={t('Khoảng thời gian', 'Time range')}>
      {PRESETS.map((p) => (
        <button key={p} type="button" aria-pressed={days === p} className={segmentedButton(days === p)} onClick={() => setDays(p)}>
          {t(`${p} ngày`, `${p} days`)}
        </button>
      ))}
    </div>
  );

  const slaText = d?.slaHours
    ? t(
        `Thời hạn phản hồi đầu tiên: Cao ${d.slaHours.HIGH} giờ · Bình thường ${d.slaHours.NORMAL} giờ · Thấp ${d.slaHours.LOW} giờ.`,
        `First-response targets: High ${d.slaHours.HIGH}h · Normal ${d.slaHours.NORMAL}h · Low ${d.slaHours.LOW}h.`
      )
    : t('Đang tải thời hạn…', 'Loading targets…');

  return (
    <div className="space-y-4">
      <PanelCard
        icon={LifeBuoy}
        title={t('Chất lượng hỗ trợ', 'Support quality')}
        description={
          <>
            {slaText}{' '}
            <Link to="/admin/security?tab=settings" className="text-blue-700 hover:underline underline-offset-2">
              {t('Đổi thời hạn', 'Change targets')}
            </Link>
          </>
        }
        actions={rangePicker}
        bodyClassName=""
      >
        <SummaryStrip
          loading={sla.loading}
          items={[
            {
              label: t('Ticket trong kỳ', 'Tickets in period'),
              value: formatNumber(overall?.total),
              hint: overall ? t(`${formatNumber(overall.resolved)} đã xử lý xong`, `${formatNumber(overall.resolved)} resolved`) : undefined,
            },
            {
              label: t('Phản hồi đầu tiên (TB)', 'First response (avg)'),
              value: formatMinutes(overall?.firstResponseMinutes?.avg),
              hint:
                overall?.firstResponseMinutes?.p95 != null
                  ? t(`95% ticket dưới ${formatMinutes(overall.firstResponseMinutes.p95)}`, `95% under ${formatMinutes(overall.firstResponseMinutes.p95)}`)
                  : t('Chưa có ticket được phản hồi', 'No responses yet'),
            },
            {
              label: t('Vi phạm SLA phản hồi', 'Response SLA breaches'),
              value: formatNumber(overall?.breachedFirstResponse),
              tone: overall?.breachedFirstResponse ? 'danger' : undefined,
            },
            {
              label: t('Thời gian xử lý xong (TB)', 'Resolution time (avg)'),
              value: formatMinutes(overall?.resolutionMinutes?.avg),
              hint: overall?.resolutionMinutes?.p95 != null ? `P95: ${formatMinutes(overall.resolutionMinutes.p95)}` : undefined,
            },
          ]}
        />
      </PanelCard>

      <PanelCard icon={Layers} title={t('Theo mức ưu tiên', 'By priority')} bodyClassName="overflow-x-auto">
        <table className={ui.table}>
          <thead>
            <tr>
              <Th>{t('Mức ưu tiên', 'Priority')}</Th>
              <Th align="right">{t('Thời hạn', 'Target')}</Th>
              <Th align="right">Ticket</Th>
              <Th align="right">{t('Phản hồi TB', 'Avg response')}</Th>
              <Th align="right">P95</Th>
              <Th align="right">{t('Vi phạm', 'Breaches')}</Th>
            </tr>
          </thead>
          <TableBody loading={sla.loading} columns={6}>
            {(d?.byPriority || []).map((row) => (
              <tr key={row.priority} className={ui.tr}>
                <Td>
                  <Badge tone={PRIORITY_TONES[row.priority]}>{priorityLabel(row.priority)}</Badge>
                </Td>
                <Td align="right" className="tabular-nums">
                  {d.slaHours[row.priority]} {t('giờ', 'h')}
                </Td>
                <Td align="right" className="tabular-nums">{formatNumber(row.total)}</Td>
                <Td align="right" className="tabular-nums">{formatMinutes(row.firstResponseMinutes.avg)}</Td>
                <Td align="right" className="tabular-nums">{formatMinutes(row.firstResponseMinutes.p95)}</Td>
                <Td align="right">
                  <span className={`tabular-nums font-medium ${row.breachedFirstResponse ? 'text-red-700' : 'text-slate-400'}`}>
                    {formatNumber(row.breachedFirstResponse)}
                  </span>
                </Td>
              </tr>
            ))}
          </TableBody>
        </table>
      </PanelCard>

      <PanelCard
        icon={AlarmClock}
        title={t('Ticket chưa phản hồi đã quá hạn', 'Overdue tickets awaiting a reply')}
        actions={d?.overdue?.count > 0 && <Badge tone="danger">{formatNumber(d.overdue.count)} ticket</Badge>}
        bodyClassName="overflow-x-auto"
      >
        {!sla.loading && !d?.overdue?.items?.length ? (
          <EmptyState
            title={t('Không có ticket nào quá hạn', 'No overdue tickets')}
            description={t('Mọi ticket đang mở đều đã được phản hồi trong thời hạn.', 'Every open ticket was answered within its target.')}
          />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>Ticket</Th>
                <Th>{t('Cửa hàng', 'Store')}</Th>
                <Th>{t('Ưu tiên', 'Priority')}</Th>
                <Th>{t('Tạo lúc', 'Created')}</Th>
                <Th align="right">{t('Đã chờ', 'Waiting')}</Th>
                <Th>{t('Phụ trách', 'Assignee')}</Th>
              </tr>
            </thead>
            <TableBody loading={sla.loading} columns={6}>
              {(d?.overdue?.items || []).map((ticket) => (
                <tr key={ticket.id} className={ui.tr}>
                  <Td>
                    <Link to={`/admin/support?ticket=${ticket.id}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline underline-offset-2">
                      #{ticket.id} · {ticket.subject}
                    </Link>
                  </Td>
                  <Td>{ticket.store?.name || '–'}</Td>
                  <Td>
                    <Badge tone={PRIORITY_TONES[ticket.priority]}>{priorityLabel(ticket.priority)}</Badge>
                  </Td>
                  <Td className="tabular-nums">{formatVNDateTime(ticket.createdAt)}</Td>
                  <Td align="right">
                    <span className="font-medium text-red-700 tabular-nums">{formatMinutes(ticket.waitingMinutes)}</span>
                  </Td>
                  <Td>{ticket.assignee?.fullName || <span className="text-slate-400">{t('Chưa phân công', 'Unassigned')}</span>}</Td>
                </tr>
              ))}
            </TableBody>
          </table>
        )}
      </PanelCard>
      {d?.truncated && (
        <p className="text-[12px] text-slate-500">
          {t(
            'Kỳ này có hơn 5.000 ticket; số liệu tính trên 5.000 ticket mới nhất.',
            'This period has over 5,000 tickets; figures use the latest 5,000.'
          )}
        </p>
      )}
    </div>
  );
}
