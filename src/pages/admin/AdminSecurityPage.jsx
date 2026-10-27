import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminStyles as ui } from './adminStyles';
import { PageHeader, Tabs } from './components/AdminUI';
import { OpsLoginSecurityPanel } from './ops/OpsLoginSecurityPanel';
import { OpsTwoFactorPanel } from './ops/OpsTwoFactorPanel';
import { OpsOwnerTransferPanel } from './ops/OpsOwnerTransferPanel';
import { OpsAnnouncementPanel } from './ops/OpsAnnouncementPanel';
import { OpsSettingsHistoryPanel } from './ops/OpsSettingsHistoryPanel';

const TABS = [
  { value: 'login', label: 'Đăng nhập bất thường' },
  { value: '2fa', label: 'Xác thực 2 lớp' },
  { value: 'owner', label: 'Chuyển chủ cửa hàng' },
  { value: 'announce', label: 'Gửi thông báo' },
  { value: 'settings', label: 'Cài đặt & lịch sử' },
];

const PANELS = {
  login: OpsLoginSecurityPanel,
  '2fa': OpsTwoFactorPanel,
  owner: OpsOwnerTransferPanel,
  announce: OpsAnnouncementPanel,
  settings: OpsSettingsHistoryPanel,
};

/** /admin/security — các thao tác bảo mật và kiểm soát nhạy cảm của quản trị viên. Mọi thao tác ghi đều vào nhật ký kiểm toán. */
export function AdminSecurityPage() {
  const [params, setParams] = useSearchParams();
  const tab = PANELS[params.get('tab')] ? params.get('tab') : 'login';
  const Panel = PANELS[tab];

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title="Bảo mật & Kiểm soát"
        description="Phát hiện dò mật khẩu, xác thực 2 lớp, chuyển quyền chủ cửa hàng, gửi thông báo và lịch sử thay đổi cài đặt. Mọi thao tác đều được ghi vào nhật ký kiểm toán."
      >
        <Tabs tabs={TABS} value={tab} onChange={(value) => setParams({ tab: value }, { replace: true })} />
      </PageHeader>
      <Panel key={tab} />
    </div>
  );
}

export default AdminSecurityPage;
