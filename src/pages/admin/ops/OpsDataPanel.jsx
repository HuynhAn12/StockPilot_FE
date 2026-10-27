import React, { useState } from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetRetentionReport } from '../../../services/adminOpsService';
import { adminStyles as ui } from '../adminStyles';
import { ErrorState, TableCard, Td, Th } from '../components/AdminUI';
import { formatBytes, formatNumber, segmentedButton, segmentedWrapper, useOpsData } from './opsShared';

const PRESETS = [90, 180, 365];
const TABLE_LABELS = {
  audit_logs: 'Nhật ký kiểm toán',
  ai_interactions: 'Lịch sử hỏi Trợ lý AI',
  notifications: 'Thông báo đã đọc',
  support_ticket_attachments: 'Ảnh đính kèm ticket',
};

export function OpsDataPanel() {
  const [days, setDays] = useState(180);
  const report = useOpsData(() => apiGetRetentionReport({ olderThanDays: days }), [days]);
  const d = report.data;

  if (report.error) return <div className={ui.card}><ErrorState message={report.error} onRetry={report.reload} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <ShieldCheck className="w-4.5 h-4.5 text-[#2563EB] mt-0.5 shrink-0" />
        <div className="text-[13px] text-[#1E3A8A]">
          <p className="font-semibold">Chế độ chạy thử — trang này không xóa bất kỳ dữ liệu nào.</p>
          <p className="mt-0.5">Số liệu giúp nhóm chốt chính sách lưu giữ dữ liệu trước khi bật chức năng dọn dẹp thật.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13px] text-[#64748B]">
          Bản ghi cũ hơn {days} ngày{d?.cutoff ? ` (trước ${formatVNDateTime(d.cutoff)})` : ''}
        </p>
        <div className={segmentedWrapper} role="group" aria-label="Độ cũ">
          {PRESETS.map((p) => (
            <button key={p} type="button" className={segmentedButton(days === p)} onClick={() => setDays(p)}>
              {p === 365 ? '1 năm' : `${p} ngày`}
            </button>
          ))}
        </div>
      </div>

      <TableCard header={<span className={ui.cardTitle}>Dữ liệu có thể dọn</span>}>
        <table className={ui.table}>
          <thead>
            <tr>
              <Th>Loại dữ liệu</Th>
              <Th align="right">Tổng</Th>
              <Th align="right">Cũ hơn {days} ngày</Th>
              <Th>Khuyến nghị</Th>
            </tr>
          </thead>
          <tbody>
            {report.loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="px-4 py-4"><div className="h-4 rounded bg-slate-100 animate-pulse" /></td></tr>
                ))
              : (d?.candidates || []).map((c) => (
                  <tr key={c.table} className={ui.tr}>
                    <Td>
                      <p className="font-semibold text-[#0F172A]">{TABLE_LABELS[c.table] || c.table}</p>
                      <p className="text-[12px] text-[#94A3B8] font-mono">{c.table}</p>
                    </Td>
                    <Td align="right">
                      <span className="admin-num">{formatNumber(c.total)}</span>
                      {c.totalBytes != null && <p className="text-[12px] text-[#64748B]">{formatBytes(c.totalBytes)}</p>}
                    </Td>
                    <Td align="right">
                      <span className={`admin-num font-semibold ${c.olderThanCutoff ? 'text-amber-700' : 'text-[#94A3B8]'}`}>{formatNumber(c.olderThanCutoff)}</span>
                      {c.olderThanCutoffBytes != null && <p className="text-[12px] text-[#64748B]">{formatBytes(c.olderThanCutoffBytes)}</p>}
                    </Td>
                    <Td className="max-w-[360px] text-[12.5px] text-[#475569]">{c.recommendation}</Td>
                  </tr>
                ))}
          </tbody>
        </table>
      </TableCard>

      <TableCard header={<span className={`${ui.cardTitle} flex items-center gap-2`}><Database className="w-4 h-4 text-[#64748B]" /> Bảng lớn nhất trong cơ sở dữ liệu</span>}>
        {!report.loading && !d?.largestTables?.length ? (
          <p className="px-5 py-6 text-[13px] text-[#64748B]">Tài khoản cơ sở dữ liệu không có quyền đọc thông tin dung lượng bảng.</p>
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>Bảng</Th>
                <Th align="right">Số dòng (ước tính)</Th>
                <Th align="right">Dữ liệu</Th>
                <Th align="right">Chỉ mục</Th>
              </tr>
            </thead>
            <tbody>
              {(d?.largestTables || []).map((t) => (
                <tr key={t.table} className={ui.tr}>
                  <Td><span className="font-mono text-[12.5px]">{t.table}</span></Td>
                  <Td align="right"><span className="admin-num">{formatNumber(t.approxRows)}</span></Td>
                  <Td align="right">{formatBytes(t.dataBytes)}</Td>
                  <Td align="right">{formatBytes(t.indexBytes)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
