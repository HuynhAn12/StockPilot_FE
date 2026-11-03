import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Moon, TrendingUp } from 'lucide-react';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetGrowth } from '../../../services/adminOpsService';
import { adminStyles as ui } from '../adminStyles';
import { EmptyState, ErrorState, PanelCard, SummaryStrip, TableBody, Td, Th } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { formatNumber, segmentedButton, segmentedWrapper, useOpsData } from './opsShared';

function bucketLabel(bucket, period, isEn) {
  if (period === 'month') {
    const [y, m] = bucket.split('-');
    return isEn ? `${m}/${y.slice(2)}` : `T${Number(m)}/${y.slice(2)}`;
  }
  const [, m, d] = bucket.split('-');
  return isEn ? `${m}/${d}` : `${d}/${m}`;
}

/** Biểu đồ cột đôi đơn giản bằng Tailwind (không thêm thư viện biểu đồ). */
function GrowthBars({ buckets, period }) {
  const { t, isEn } = useAdminText();
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.newStores, b.newLeads)));
  return (
    <div>
      <div className="relative h-44 border-b border-slate-200 px-1">
        {/* Lưới ngang mờ */}
        {[0.25, 0.5, 0.75].map((r) => (
          <div key={r} className="absolute inset-x-0 border-t border-dashed border-slate-100" style={{ bottom: `${r * 100}%` }} aria-hidden="true" />
        ))}
        <div className="relative flex items-end gap-2 sm:gap-3 h-full">
          {buckets.map((b) => {
            const label = bucketLabel(b.bucket, period, isEn);
            const tip = t(
              `${label}: ${b.newStores} cửa hàng mới, ${b.newLeads} lead, ${b.convertedLeads} lead chuyển đổi`,
              `${label}: ${b.newStores} new stores, ${b.newLeads} leads, ${b.convertedLeads} converted`
            );
            return (
              <div key={b.bucket} className="flex-1 min-w-0 h-full flex items-end justify-center gap-1 group" title={tip} aria-label={tip}>
                <div
                  className="w-1/2 max-w-[18px] rounded-t-sm bg-blue-600 group-hover:bg-blue-700 transition-colors"
                  style={{ height: `${(b.newStores / max) * 100}%`, minHeight: b.newStores ? 4 : 0 }}
                />
                <div
                  className="w-1/2 max-w-[18px] rounded-t-sm bg-blue-300 group-hover:bg-blue-400 transition-colors"
                  style={{ height: `${(b.newLeads / max) * 100}%`, minHeight: b.newLeads ? 4 : 0 }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2 sm:gap-3 px-1 mt-2">
        {buckets.map((b) => (
          <span key={b.bucket} className="flex-1 min-w-0 text-center text-[11px] text-slate-500 tabular-nums truncate">
            {bucketLabel(b.bucket, period, isEn)}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[12px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" aria-hidden="true" /> {t('Cửa hàng mới', 'New stores')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-300" aria-hidden="true" /> {t('Lead mới', 'New leads')}
        </span>
      </div>
    </div>
  );
}

export function OpsGrowthPanel() {
  const { t } = useAdminText();
  const [period, setPeriod] = useState('month');
  const periods = period === 'month' ? 6 : 12;
  const growth = useOpsData(() => apiGetGrowth({ period, periods, dormantDays: 30 }), [period]);
  const d = growth.data;

  if (growth.error) {
    return (
      <div className={ui.card}>
        <ErrorState message={growth.error} onRetry={growth.reload} />
      </div>
    );
  }

  const periodPicker = (
    <div className={segmentedWrapper} role="group" aria-label={t('Chu kỳ', 'Period')}>
      <button type="button" aria-pressed={period === 'month'} className={segmentedButton(period === 'month')} onClick={() => setPeriod('month')}>
        {t('6 tháng', '6 months')}
      </button>
      <button type="button" aria-pressed={period === 'week'} className={segmentedButton(period === 'week')} onClick={() => setPeriod('week')}>
        {t('12 tuần', '12 weeks')}
      </button>
    </div>
  );

  const dormantDays = d?.dormant?.days ?? 30;

  return (
    <div className="space-y-4">
      <PanelCard
        icon={TrendingUp}
        title={t('Tăng trưởng nền tảng', 'Platform growth')}
        description={t('Chỉ số cấp nền tảng — không dùng doanh thu của cửa hàng.', 'Platform-level metrics — store revenue is not used.')}
        actions={periodPicker}
        bodyClassName=""
      >
        <SummaryStrip
          loading={growth.loading}
          items={[
            { label: t('Cửa hàng mới', 'New stores'), value: formatNumber(d?.totals?.newStores) },
            { label: t('Lead mới', 'New leads'), value: formatNumber(d?.totals?.newLeads) },
            { label: t('Lead đã chuyển đổi', 'Converted leads'), value: formatNumber(d?.totals?.convertedLeads) },
            {
              label: t('Tỉ lệ chuyển đổi lead', 'Lead conversion rate'),
              value: d?.totals?.leadConversionRate == null ? '–' : `${d.totals.leadConversionRate}%`,
              hint: d?.totals?.newLeads ? undefined : t('Chưa có lead trong kỳ', 'No leads in this period'),
            },
          ]}
        />
      </PanelCard>

      <PanelCard icon={BarChart3} title={period === 'month' ? t('Tăng trưởng theo tháng', 'Monthly growth') : t('Tăng trưởng theo tuần', 'Weekly growth')}>
        {growth.loading ? (
          <div className="h-44 rounded-lg bg-slate-50 animate-pulse" />
        ) : d?.buckets?.some((b) => b.newStores || b.newLeads) ? (
          <GrowthBars buckets={d.buckets} period={period} />
        ) : (
          <EmptyState title={t('Chưa có cửa hàng hay lead mới trong kỳ', 'No new stores or leads in this period')} />
        )}
      </PanelCard>

      <PanelCard
        icon={Moon}
        title={t(`Cửa hàng "ngủ đông" — không có đơn trong ${dormantDays} ngày`, `Dormant stores — no orders in ${dormantDays} days`)}
        actions={<span className="text-[12px] text-slate-500 tabular-nums">{t(`${formatNumber(d?.dormant?.count)} cửa hàng`, `${formatNumber(d?.dormant?.count)} stores`)}</span>}
        bodyClassName="overflow-x-auto"
      >
        {!growth.loading && !d?.dormant?.items?.length ? (
          <EmptyState
            title={t('Mọi cửa hàng đều đang bán hàng', 'Every store is selling')}
            description={t(`Không có cửa hàng nào im lặng quá ${dormantDays} ngày.`, `No store has been silent for more than ${dormantDays} days.`)}
          />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>{t('Cửa hàng', 'Store')}</Th>
                <Th>{t('Ngày tham gia', 'Joined')}</Th>
                <Th>{t('Đơn gần nhất', 'Last order')}</Th>
              </tr>
            </thead>
            <TableBody loading={growth.loading} columns={3}>
              {(d?.dormant?.items || []).map((s) => (
                <tr key={s.id} className={ui.tr}>
                  <Td>
                    <Link to={`/admin/stores?storeId=${s.id}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline underline-offset-2">
                      {s.name}
                    </Link>
                    <p className="text-[12px] text-slate-500">{s.code}</p>
                  </Td>
                  <Td className="tabular-nums">{formatVNDateTime(s.createdAt)}</Td>
                  <Td className="tabular-nums">
                    {s.lastOrderAt ? formatVNDateTime(s.lastOrderAt) : <span className="text-amber-700 font-medium">{t('Chưa có đơn nào', 'No orders yet')}</span>}
                  </Td>
                </tr>
              ))}
            </TableBody>
          </table>
        )}
      </PanelCard>
    </div>
  );
}
