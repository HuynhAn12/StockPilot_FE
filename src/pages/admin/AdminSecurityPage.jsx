import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminStyles as ui } from './adminStyles';
import { PageHeader, Tabs } from './components/AdminUI';
import { useAdminText } from './useAdminText';
import { OpsLoginSecurityPanel } from './ops/OpsLoginSecurityPanel';
import { OpsTwoFactorPanel } from './ops/OpsTwoFactorPanel';
import { OpsOwnerTransferPanel } from './ops/OpsOwnerTransferPanel';
import { OpsAnnouncementPanel } from './ops/OpsAnnouncementPanel';
import { OpsSettingsHistoryPanel } from './ops/OpsSettingsHistoryPanel';

const TABS = [
  { value: 'login', vi: 'Đăng nhập bất thường', en: 'Suspicious logins' },
  { value: '2fa', vi: 'Xác thực 2 lớp', en: 'Two-factor auth' },
  { value: 'owner', vi: 'Chuyển chủ cửa hàng', en: 'Owner transfer' },
  { value: 'announce', vi: 'Gửi thông báo', en: 'Announcements' },
  { value: 'settings', vi: 'Cài đặt & lịch sử', en: 'Settings & history' },
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
  const { t } = useAdminText();

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title={t('Bảo mật & Kiểm soát', 'Security & controls')}
        description={t(
          'Phát hiện dò mật khẩu, xác thực 2 lớp, chuyển quyền chủ cửa hàng, gửi thông báo và lịch sử thay đổi cài đặt. Mọi thao tác đều được ghi vào nhật ký kiểm toán.',
          'Password-guessing detection, two-factor auth, store owner transfer, announcements and settings history. Every action is written to the audit log.'
        )}
      >
        <Tabs tabs={TABS.map((x) => ({ value: x.value, label: t(x.vi, x.en) }))} value={tab} onChange={(value) => setParams({ tab: value }, { replace: true })} />
      </PageHeader>
      <Panel key={tab} />
    </div>
  );
}

export default AdminSecurityPage;
