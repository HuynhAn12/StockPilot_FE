import React, { useState } from 'react';
import { Database, HardDrive, ShieldCheck } from 'lucide-react';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetRetentionReport } from '../../../services/adminOpsService';
import { adminStyles as ui } from '../adminStyles';
import { ErrorState, PanelCard, SkeletonRows, Td, Th } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { formatBytes, formatNumber, segmentedButton, segmentedWrapper, useOpsData } from './opsShared';

const PRESETS = [90, 180, 365];
const TABLE_LABELS = {
  audit_logs: ['Nhật ký kiểm toán', 'Audit logs'],
  ai_interactions: ['Lịch sử hỏi Trợ lý AI', 'AI assistant history'],
  notifications: ['Thông báo đã đọc', 'Read notifications'],
  support_ticket_attachments: ['Ảnh đính kèm ticket', 'Ticket attachments'],
};

export function OpsDataPanel() {
  const { t, isEn } = useAdminText();
  const [days, setDays] = useState(180);
  const report = useOpsData(() => apiGetRetentionReport({ olderThanDays: days }), [days]);
  const d = report.data;

  if (report.error) {
    return (
      <div className={ui.card}>
        <ErrorState message={report.error} onRetry={report.reload} />
      </div>
    );
  }

  const agePicker = (
    <div className={segmentedWrapper} role="group" aria-label={t('Độ cũ', 'Age')}>
      {PRESETS.map((p) => (
        <button key={p} type="button" aria-pressed={days === p} className={segmentedButton(days === p)} onClick={() => setDays(p)}>
          {p === 365 ? t('1 năm', '1 year') : t(`${p} ngày`, `${p} days`)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="text-[13px] text-blue-900">
          <p className="font-medium">{t('Chế độ chạy thử — trang này không xóa bất kỳ dữ liệu nào.', 'Dry run — this page never deletes any data.')}</p>
          <p className="mt-0.5 text-blue-800">
            {t(
              'Số liệu giúp nhóm chốt chính sách lưu giữ dữ liệu trước khi bật chức năng dọn dẹp thật.',
              'These numbers help the team settle a retention policy before real cleanup is enabled.'
            )}
          </p>
        </div>
      </div>

      <PanelCard
        icon={HardDrive}
        title={t('Dữ liệu có thể dọn', 'Data eligible for cleanup')}
        description={
          t(`Bản ghi cũ hơn ${days} ngày`, `Records older than ${days} days`) +
          (d?.cutoff ? t(` (trước ${formatVNDateTime(d.cutoff)})`, ` (before ${formatVNDateTime(d.cutoff)})`) : '')
        }
        actions={agePicker}
        bodyClassName="overflow-x-auto"
      >
        <table className={ui.table}>
          <thead>
            <tr>
              <Th>{t('Loại dữ liệu', 'Data type')}</Th>
              <Th align="right">{t('Tổng', 'Total')}</Th>
              <Th align="right">{t(`Cũ hơn ${days} ngày`, `Older than ${days} days`)}</Th>
              <Th>{t('Khuyến nghị', 'Recommendation')}</Th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-slate-100 [&>tr:last-child]:border-0">
            {report.loading ? (
              <SkeletonRows columns={4} rows={4} />
            ) : (
              (d?.candidates || []).map((c) => (
                <tr key={c.table} className={ui.tr}>
                  <Td>
                    <p className="font-medium text-slate-900">{TABLE_LABELS[c.table]?.[isEn ? 1 : 0] || c.table}</p>
                    <p className="text-[12px] text-slate-500 font-mono">{c.table}</p>
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums">{formatNumber(c.total)}</span>
                    {c.totalBytes != null && <p className="text-[12px] text-slate-500 tabular-nums">{formatBytes(c.totalBytes)}</p>}
                  </Td>
                  <Td align="right">
                    <span className={`tabular-nums font-medium ${c.olderThanCutoff ? 'text-amber-700' : 'text-slate-400'}`}>
                      {formatNumber(c.olderThanCutoff)}
                    </span>
                    {c.olderThanCutoffBytes != null && <p className="text-[12px] text-slate-500 tabular-nums">{formatBytes(c.olderThanCutoffBytes)}</p>}
                  </Td>
                  <Td className="max-w-[360px] text-[12px] text-slate-600">{c.recommendation}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PanelCard>

      <PanelCard icon={Database} title={t('Bảng lớn nhất trong cơ sở dữ liệu', 'Largest database tables')} bodyClassName="overflow-x-auto">
        {!report.loading && !d?.largestTables?.length ? (
          <p className="px-5 py-6 text-[13px] text-slate-500">
            {t(
              'Tài khoản cơ sở dữ liệu không có quyền đọc thông tin dung lượng bảng.',
              'The database account cannot read table size information.'
            )}
          </p>
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>{t('Bảng', 'Table')}</Th>
                <Th align="right">{t('Số dòng (ước tính)', 'Rows (approx.)')}</Th>
                <Th align="right">{t('Dữ liệu', 'Data')}</Th>
                <Th align="right">{t('Chỉ mục', 'Indexes')}</Th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-b [&>tr]:border-slate-100 [&>tr:last-child]:border-0">
              {report.loading ? (
                <SkeletonRows columns={4} rows={5} />
              ) : (
                (d?.largestTables || []).map((row) => (
                  <tr key={row.table} className={ui.tr}>
                    <Td>
                      <span className="font-mono text-[12px]">{row.table}</span>
                    </Td>
                    <Td align="right">
                      <span className="tabular-nums">{formatNumber(row.approxRows)}</span>
                    </Td>
                    <Td align="right" className="tabular-nums">{formatBytes(row.dataBytes)}</Td>
                    <Td align="right" className="tabular-nums">{formatBytes(row.indexBytes)}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </PanelCard>
    </div>
  );
}
