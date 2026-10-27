import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminStyles as ui } from './adminStyles';
import { PageHeader, Tabs } from './components/AdminUI';
import { OpsJobsPanel } from './ops/OpsJobsPanel';
import { OpsPaymentsPanel } from './ops/OpsPaymentsPanel';
import { OpsSupportSlaPanel } from './ops/OpsSupportSlaPanel';
import { OpsGrowthPanel } from './ops/OpsGrowthPanel';
import { OpsDataPanel } from './ops/OpsDataPanel';

const TABS = [
  { value: 'jobs', label: 'Tác vụ nền' },
  { value: 'payments', label: 'Thanh toán' },
  { value: 'support', label: 'Hỗ trợ (SLA)' },
  { value: 'growth', label: 'Tăng trưởng' },
  { value: 'data', label: 'Dữ liệu' },
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

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title="Vận hành nền tảng"
        description="Tác vụ chạy nền, sức khỏe thanh toán, chất lượng hỗ trợ, tăng trưởng và dung lượng dữ liệu. Chỉ số cấp nền tảng — không hiển thị doanh thu của cửa hàng."
      >
        <Tabs tabs={TABS} value={tab} onChange={(value) => setParams({ tab: value }, { replace: true })} />
      </PageHeader>
      <Panel key={tab} />
    </div>
  );
}

export default AdminOpsPage;
