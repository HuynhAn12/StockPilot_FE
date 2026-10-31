import React, { useState } from 'react';
import { CreditCard, Hourglass, Info, Store } from 'lucide-react';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetPaymentHealth } from '../../../services/adminOpsService';
import { adminStyles as ui } from '../adminStyles';
import { Badge, EmptyState, ErrorState, StatCard, TableCard, Td, Th } from '../components/AdminUI';
import { formatMinutes, formatNumber, segmentedButton, segmentedWrapper, useOpsData } from './opsShared';

const PENDING_PRESETS = [15, 30, 60, 120];

export function OpsPaymentsPanel() {
  const [pendingMinutes, setPendingMinutes] = useState(null); // null = dùng ngưỡng trong cài đặt
  const health = useOpsData(() => apiGetPaymentHealth({ pendingMinutes: pendingMinutes ?? undefined }), [pendingMinutes]);
  const data = health.data;
  const threshold = pendingMinutes ?? data?.pendingMinutes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[13px] text-[#64748B] max-w-[70ch]">
          Theo dõi cổng PayOS của từng cửa hàng. Chỉ hiển thị số lượng và thời điểm — không hiển thị số tiền để không lộ doanh thu cửa hàng.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#64748B]">Coi là treo sau</span>
          <div className={segmentedWrapper} role="group" aria-label="Ngưỡng giao dịch treo">
            {PENDING_PRESETS.map((m) => (
              <button key={m} type="button" className={segmentedButton(threshold === m)} onClick={() => setPendingMinutes(m)}>
                {m}′
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Cửa hàng đã kết nối PayOS" value={formatNumber(data?.summary?.storesConfigured)} icon={CreditCard} loading={health.loading} />
        <StatCard
          title="Cửa hàng có giao dịch treo"
          value={formatNumber(data?.summary?.storesWithStuckPayments)}
          alert={Boolean(data?.summary?.storesWithStuckPayments)}
          subtitle={threshold ? `Chờ quá ${formatMinutes(threshold)}` : ''}
          icon={Store}
          loading={health.loading}
        />
        <StatCard title="Tổng giao dịch đang treo" value={formatNumber(data?.summary?.totalStuckPayments)} alert={Boolean(data?.summary?.totalStuckPayments)} icon={Hourglass} loading={health.loading} />
      </div>

      <TableCard header={<span className={ui.cardTitle}>Theo cửa hàng</span>}>
        {health.error ? (
          <ErrorState message={health.error} onRetry={health.reload} />
        ) : !health.loading && !data?.items?.length ? (
          <EmptyState title="Chưa có cửa hàng nào dùng PayOS" description="Khi cửa hàng kết nối PayOS hoặc phát sinh giao dịch, thông tin sẽ hiện ở đây." />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>Cửa hàng</Th>
                <Th>PayOS</Th>
                <Th align="right">Giao dịch treo</Th>
                <Th>Treo từ</Th>
                <Th>Thanh toán thành công gần nhất</Th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map((item) => (
                <tr key={item.storeId} className={ui.tr}>
                  <Td>
                    <p className="font-semibold text-[#0F172A]">{item.name}</p>
                    <p className="text-[12px] text-[#94A3B8]">{item.code}{!item.storeActive && ' · đang tạm ngưng'}</p>
                  </Td>
                  <Td>{item.payosConfigured ? <Badge tone="success">Đã kết nối</Badge> : <Badge tone="neutral">Chưa kết nối</Badge>}</Td>
                  <Td align="right">
                    <span className={`admin-num font-semibold ${item.stuckPendingCount ? 'text-amber-700' : 'text-[#94A3B8]'}`}>{formatNumber(item.stuckPendingCount)}</span>
                  </Td>
                  <Td>{item.oldestStuckAt ? formatVNDateTime(item.oldestStuckAt) : <span className="text-[#94A3B8]">–</span>}</Td>
                  <Td>{item.lastPaidAt ? formatVNDateTime(item.lastPaidAt) : <span className="text-[#94A3B8]">Chưa có</span>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {data?.limitations?.length > 0 && (
        <p className="flex items-start gap-2 text-[12px] text-[#64748B]">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {data.limitations.join(' ')}
        </p>
      )}
    </div>
  );
}
