import React, { useState } from 'react';
import { CreditCard, Info } from 'lucide-react';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetPaymentHealth } from '../../../services/adminOpsService';
import { adminStyles as ui } from '../adminStyles';
import { Badge, EmptyState, ErrorState, PanelCard, SummaryStrip, Td, Th, TableBody } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { formatMinutes, formatNumber, segmentedButton, segmentedWrapper, useOpsData } from './opsShared';

const PENDING_PRESETS = [15, 30, 60, 120];

export function OpsPaymentsPanel() {
  const { t } = useAdminText();
  const [pendingMinutes, setPendingMinutes] = useState(null); // null = dùng ngưỡng trong cài đặt
  const health = useOpsData(() => apiGetPaymentHealth({ pendingMinutes: pendingMinutes ?? undefined }), [pendingMinutes]);
  const data = health.data;
  const threshold = pendingMinutes ?? data?.pendingMinutes;
  const stuckStores = data?.summary?.storesWithStuckPayments;
  const stuckTotal = data?.summary?.totalStuckPayments;

  const thresholdPicker = (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-slate-500">{t('Coi là treo sau', 'Stuck after')}</span>
      <div className={segmentedWrapper} role="group" aria-label={t('Ngưỡng giao dịch treo', 'Stuck payment threshold')}>
        {PENDING_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={threshold === m}
            className={segmentedButton(threshold === m)}
            onClick={() => setPendingMinutes(m)}
          >
            {m}′
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <PanelCard
        icon={CreditCard}
        title={t('Sức khỏe thanh toán PayOS', 'PayOS payment health')}
        description={t(
          'Chỉ hiển thị số lượng và thời điểm — không hiển thị số tiền để không lộ doanh thu cửa hàng.',
          'Counts and timestamps only — amounts are hidden so store revenue is never exposed.'
        )}
        actions={thresholdPicker}
        bodyClassName=""
      >
        <SummaryStrip
          loading={health.loading}
          items={[
            { label: t('Cửa hàng đã kết nối PayOS', 'Stores connected to PayOS'), value: formatNumber(data?.summary?.storesConfigured) },
            {
              label: t('Cửa hàng có giao dịch treo', 'Stores with stuck payments'),
              value: formatNumber(stuckStores),
              tone: stuckStores ? 'warning' : undefined,
              hint: threshold ? t(`Chờ quá ${formatMinutes(threshold)}`, `Waiting over ${formatMinutes(threshold)}`) : undefined,
            },
            {
              label: t('Tổng giao dịch đang treo', 'Total stuck payments'),
              value: formatNumber(stuckTotal),
              tone: stuckTotal ? 'warning' : undefined,
            },
            {
              label: t('Trạng thái', 'Status'),
              value: stuckTotal ? t('Cần kiểm tra', 'Needs review') : t('Bình thường', 'Healthy'),
              tone: stuckTotal ? 'warning' : 'success',
            },
          ]}
        />
      </PanelCard>

      <PanelCard title={t('Theo cửa hàng', 'By store')} bodyClassName="overflow-x-auto">
        {health.error ? (
          <ErrorState message={health.error} onRetry={health.reload} />
        ) : !health.loading && !data?.items?.length ? (
          <EmptyState
            title={t('Chưa có cửa hàng nào dùng PayOS', 'No store uses PayOS yet')}
            description={t(
              'Khi cửa hàng kết nối PayOS hoặc phát sinh giao dịch, thông tin sẽ hiện ở đây.',
              'Stores appear here once they connect PayOS or receive a payment.'
            )}
          />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>{t('Cửa hàng', 'Store')}</Th>
                <Th>PayOS</Th>
                <Th align="right">{t('Giao dịch treo', 'Stuck')}</Th>
                <Th>{t('Treo từ', 'Stuck since')}</Th>
                <Th>{t('Thanh toán thành công gần nhất', 'Last successful payment')}</Th>
              </tr>
            </thead>
            <TableBody loading={health.loading} columns={5}>
              {(data?.items || []).map((item) => (
                <tr key={item.storeId} className={ui.tr}>
                  <Td>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-[12px] text-slate-500">
                      {item.code}
                      {!item.storeActive && t(' · đang tạm ngưng', ' · suspended')}
                    </p>
                  </Td>
                  <Td>
                    {item.payosConfigured ? (
                      <Badge tone="success">{t('Đã kết nối', 'Connected')}</Badge>
                    ) : (
                      <Badge tone="neutral">{t('Chưa kết nối', 'Not connected')}</Badge>
                    )}
                  </Td>
                  <Td align="right">
                    <span className={`tabular-nums font-medium ${item.stuckPendingCount ? 'text-amber-700' : 'text-slate-400'}`}>
                      {formatNumber(item.stuckPendingCount)}
                    </span>
                  </Td>
                  <Td className="tabular-nums">{item.oldestStuckAt ? formatVNDateTime(item.oldestStuckAt) : <span className="text-slate-400">–</span>}</Td>
                  <Td className="tabular-nums">
                    {item.lastPaidAt ? formatVNDateTime(item.lastPaidAt) : <span className="text-slate-400">{t('Chưa có', 'None yet')}</span>}
                  </Td>
                </tr>
              ))}
            </TableBody>
          </table>
        )}
      </PanelCard>

      {data?.limitations?.length > 0 && (
        <p className="flex items-start gap-2 text-[12px] text-slate-500">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" /> {data.limitations.join(' ')}
        </p>
      )}
    </div>
  );
}
