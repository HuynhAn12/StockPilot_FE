import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminStyles as ui } from './adminStyles';
import { PageHeader, Tabs } from './components/AdminUI';
import { useAdminText } from './useAdminText';
import { OpsJobsPanel } from './ops/OpsJobsPanel';
import { OpsPaymentsPanel } from './ops/OpsPaymentsPanel';
import { OpsSupportSlaPanel } from './ops/OpsSupportSlaPanel';
import { OpsGrowthPanel } from './ops/OpsGrowthPanel';
import { OpsDataPanel } from './ops/OpsDataPanel';

const TABS = [
  { value: 'jobs', vi: 'Tác vụ nền', en: 'Background jobs' },
  { value: 'payments', vi: 'Thanh toán', en: 'Payments' },
  { value: 'support', vi: 'Hỗ trợ (SLA)', en: 'Support (SLA)' },
  { value: 'growth', vi: 'Tăng trưởng', en: 'Growth' },
  { value: 'data', vi: 'Dữ liệu', en: 'Data' },
];

const PANELS = {
  jobs: OpsJobsPanel,
  payments: OpsPaymentsPanel,
  support: OpsSupportSlaPanel,
  growth: OpsGrowthPanel,
  data: OpsDataPanel,
};

/** /admin/ops — theo dõi vận hành nền tảng. Tab hiện tại lưu trên URL (?tab=) để F5 hoặc chia sẻ link không mất. */
export function AdminOpsPage() {
  const [params, setParams] = useSearchParams();
  const tab = PANELS[params.get('tab')] ? params.get('tab') : 'jobs';
  const Panel = PANELS[tab];
  const { t } = useAdminText();

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title={t('Vận hành nền tảng', 'Platform operations')}
        description={t(
          'Tác vụ chạy nền, sức khỏe thanh toán, chất lượng hỗ trợ, tăng trưởng và dung lượng dữ liệu. Chỉ số cấp nền tảng — không hiển thị doanh thu của cửa hàng.',
          'Background jobs, payment health, support quality, growth and data volume. Platform-level metrics only — store revenue is never shown.'
        )}
      >
        <Tabs tabs={TABS.map((x) => ({ value: x.value, label: t(x.vi, x.en) }))} value={tab} onChange={(value) => setParams({ tab: value }, { replace: true })} />
      </PageHeader>
      <Panel key={tab} />
    </div>
  );
}

export default AdminOpsPage;
