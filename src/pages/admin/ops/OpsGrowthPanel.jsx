import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Percent, Store, UserCheck, UserPlus } from 'lucide-react';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetGrowth } from '../../../services/adminOpsService';
import { adminStyles as ui } from '../adminStyles';
import { EmptyState, ErrorState, StatCard, TableCard, Td, Th } from '../components/AdminUI';
import { formatNumber, segmentedButton, segmentedWrapper, useOpsData } from './opsShared';

function bucketLabel(bucket, period) {
  if (period === 'month') {
    const [y, m] = bucket.split('-');
    return `T${Number(m)}/${y.slice(2)}`;
  }
  const [, m, d] = bucket.split('-');
  return `${d}/${m}`;
}

/** Biểu đồ cột đôi đơn giản bằng Tailwind (không thêm thư viện biểu đồ). */
function GrowthBars({ buckets, period }) {
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.newStores, b.newLeads)));
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3 h-44 border-b border-[#E2E8F0] px-1">
        {buckets.map((b) => (
          <div key={b.bucket} className="flex-1 min-w-0 h-full flex items-end justify-center gap-1 group" title={`${bucketLabel(b.bucket, period)}: ${b.newStores} cửa hàng mới, ${b.newLeads} lead, ${b.convertedLeads} lead chuyển đổi`}>
            <div className="w-1/2 max-w-[18px] rounded-t bg-[#2563EB] transition-all group-hover:opacity-80" style={{ height: `${(b.newStores / max) * 100}%`, minHeight: b.newStores ? 4 : 0 }} />
            <div className="w-1/2 max-w-[18px] rounded-t bg-[#93C5FD] transition-all group-hover:opacity-80" style={{ height: `${(b.newLeads / max) * 100}%`, minHeight: b.newLeads ? 4 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 sm:gap-3 px-1 mt-2">
        {buckets.map((b) => (
          <span key={b.bucket} className="flex-1 min-w-0 text-center text-[11px] text-[#64748B] truncate">{bucketLabel(b.bucket, period)}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[12px] text-[#64748B]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" /> Cửa hàng mới</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#93C5FD]" /> Lead mới</span>
      </div>
    </div>
  );
}

export function OpsGrowthPanel() {
  const [period, setPeriod] = useState('month');
  const periods = period === 'month' ? 6 : 12;
  const growth = useOpsData(() => apiGetGrowth({ period, periods, dormantDays: 30 }), [period]);
  const d = growth.data;

  if (growth.error) return <div className={ui.card}><ErrorState message={growth.error} onRetry={growth.reload} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13px] text-[#64748B]">Chỉ số cấp nền tảng — không dùng doanh thu của cửa hàng.</p>
        <div className={segmentedWrapper} role="group" aria-label="Chu kỳ">
          <button type="button" className={segmentedButton(period === 'month')} onClick={() => setPeriod('month')}>6 tháng</button>
          <button type="button" className={segmentedButton(period === 'week')} onClick={() => setPeriod('week')}>12 tuần</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Cửa hàng mới" value={formatNumber(d?.totals?.newStores)} icon={Store} loading={growth.loading} />
        <StatCard title="Lead mới" value={formatNumber(d?.totals?.newLeads)} icon={UserPlus} loading={growth.loading} />
        <StatCard title="Lead đã chuyển đổi" value={formatNumber(d?.totals?.convertedLeads)} icon={UserCheck} loading={growth.loading} />
        <StatCard
          title="Tỉ lệ chuyển đổi lead"
          value={d?.totals?.leadConversionRate == null ? '–' : `${d.totals.leadConversionRate}%`}
          subtitle={d?.totals?.newLeads ? '' : 'Chưa có lead trong kỳ'}
          icon={Percent}
          loading={growth.loading}
        />
      </div>

      <div className={ui.card}>
        <div className={ui.cardHeader}><span className={ui.cardTitle}>Tăng trưởng theo {period === 'month' ? 'tháng' : 'tuần'}</span></div>
        <div className={ui.cardBody}>
          {growth.loading ? (
            <div className="h-44 rounded-xl bg-slate-50 animate-pulse" />
          ) : d?.buckets?.some((b) => b.newStores || b.newLeads) ? (
            <GrowthBars buckets={d.buckets} period={period} />
          ) : (
            <EmptyState title="Chưa có cửa hàng hay lead mới trong kỳ" />
          )}
        </div>
      </div>

      <TableCard
        header={
          <>
            <span className={ui.cardTitle}>Cửa hàng "ngủ đông" — không có đơn trong {d?.dormant?.days ?? 30} ngày</span>
            <span className="text-[12px] text-[#64748B]">{formatNumber(d?.dormant?.count)} cửa hàng</span>
          </>
        }
      >
        {!growth.loading && !d?.dormant?.items?.length ? (
          <EmptyState title="Mọi cửa hàng đều đang bán hàng" description="Không có cửa hàng nào im lặng quá 30 ngày." />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>Cửa hàng</Th>
                <Th>Ngày tham gia</Th>
                <Th>Đơn gần nhất</Th>
              </tr>
            </thead>
            <tbody>
              {(d?.dormant?.items || []).map((s) => (
                <tr key={s.id} className={ui.tr}>
                  <Td>
                    <Link to={`/admin/stores?storeId=${s.id}`} className="font-semibold text-[#0F172A] hover:text-[#2563EB]">{s.name}</Link>
                    <p className="text-[12px] text-[#94A3B8]">{s.code}</p>
                  </Td>
                  <Td>{formatVNDateTime(s.createdAt)}</Td>
                  <Td>{s.lastOrderAt ? formatVNDateTime(s.lastOrderAt) : <span className="text-amber-700 font-medium">Chưa có đơn nào</span>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
