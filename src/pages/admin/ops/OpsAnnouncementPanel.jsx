import React, { useMemo, useState } from 'react';
import { Bell, Megaphone, Search } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { apiListAdminStores } from '../../../services/adminService';
import { apiBroadcastAnnouncement } from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { ConfirmDialog, PanelCard } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { formatNumber, useOpsData } from './opsShared';

const ROLE_OPTIONS = [
  { value: 'SHOP_OWNER', vi: 'Chủ cửa hàng', en: 'Store owners' },
  { value: 'WAREHOUSE_STAFF', vi: 'Nhân viên kho', en: 'Warehouse staff' },
];

const fieldLabel = 'block text-[13px] font-medium text-slate-700 mb-1.5';
const groupLabel = 'text-[13px] font-medium text-slate-700 mb-2';

export function OpsAnnouncementPanel() {
  const { t } = useAdminText();
  const { toast } = useToast();
  const stores = useOpsData(() => apiListAdminStores({ limit: 100, isActive: true }).then((r) => r.data));
  const [form, setForm] = useState({ title: '', message: '' });
  const [target, setTarget] = useState('ALL');
  const [selected, setSelected] = useState([]);
  const [roles, setRoles] = useState(['SHOP_OWNER', 'WAREHOUSE_STAFF']);
  const [search, setSearch] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const filteredStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (stores.data || []).filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [stores.data, search]);

  const errors = {
    title: form.title.trim().length < 3 ? t('Tiêu đề cần ít nhất 3 ký tự', 'Title needs at least 3 characters') : '',
    message: form.message.trim().length < 3 ? t('Nội dung cần ít nhất 3 ký tự', 'Message needs at least 3 characters') : '',
    target: target === 'SELECTED' && selected.length === 0 ? t('Chọn ít nhất một cửa hàng', 'Select at least one store') : '',
    roles: roles.length === 0 ? t('Chọn ít nhất một nhóm người nhận', 'Select at least one recipient group') : '',
  };
  const valid = !Object.values(errors).some(Boolean);

  const toggle = (list, setList, value) => setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const roleName = (value) => {
    const r = ROLE_OPTIONS.find((o) => o.value === value);
    return r ? t(r.vi, r.en).toLowerCase() : value;
  };

  const send = async () => {
    try {
      const result = await apiBroadcastAnnouncement({
        title: form.title.trim(),
        message: form.message.trim(),
        roles,
        ...(target === 'SELECTED' ? { storeIds: selected.map(Number) } : {}),
      });
      toast({
        type: 'success',
        title: t('Đã gửi thông báo', 'Announcement sent'),
        description: t(
          `${formatNumber(result.recipients)} người nhận tại ${formatNumber(result.storeCount)} cửa hàng.`,
          `${formatNumber(result.recipients)} recipients across ${formatNumber(result.storeCount)} stores.`
        ),
      });
      setConfirming(false);
      setForm({ title: '', message: '' });
      setSelected([]);
      setTouched(false);
    } catch (err) {
      toast({ type: 'error', title: t('Không gửi được thông báo', 'Could not send the announcement'), description: apiErrorMessage(err) });
    }
  };

  const fieldError = (key) =>
    touched && errors[key] ? (
      <span className="block text-[12px] text-red-600 mt-1" role="alert">
        {errors[key]}
      </span>
    ) : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-start">
      <form
        className="xl:col-span-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (valid) setConfirming(true);
        }}
      >
        <PanelCard
          icon={Megaphone}
          title={t('Soạn thông báo', 'Compose announcement')}
          description={t('Gửi vào hộp thông báo của chủ cửa hàng và nhân viên.', 'Delivered to the inbox of store owners and staff.')}
          footer={
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-slate-500">{t('Không thể thu hồi sau khi gửi.', 'Cannot be recalled once sent.')}</span>
              <button type="submit" className={ui.btnPrimary}>
                <Megaphone className="w-4 h-4" aria-hidden="true" /> {t('Gửi thông báo', 'Send announcement')}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            <label className="block">
              <span className={fieldLabel}>{t('Tiêu đề', 'Title')}</span>
              <input
                className={ui.input}
                maxLength={150}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t('Ví dụ: Bảo trì hệ thống tối 30/10', 'e.g. System maintenance on the evening of 30/10')}
                aria-invalid={Boolean(touched && errors.title)}
              />
              {fieldError('title')}
            </label>
            <label className="block">
              <span className={`${fieldLabel} flex justify-between`}>
                {t('Nội dung', 'Message')} <span className="font-normal text-slate-400 tabular-nums">{form.message.length}/2000</span>
              </span>
              <textarea
                rows={5}
                maxLength={2000}
                className={ui.input}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder={t('Nêu rõ thời gian, ảnh hưởng và việc cửa hàng cần làm (nếu có).', 'State the time, the impact and anything stores need to do.')}
                aria-invalid={Boolean(touched && errors.message)}
              />
              {fieldError('message')}
            </label>

            <fieldset>
              <legend className={groupLabel}>{t('Gửi tới', 'Send to')}</legend>
              <div className="flex flex-wrap gap-4 text-[13px] text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={target === 'ALL'} onChange={() => setTarget('ALL')} className="accent-blue-600" />{' '}
                  {t('Tất cả cửa hàng đang hoạt động', 'All active stores')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={target === 'SELECTED'} onChange={() => setTarget('SELECTED')} className="accent-blue-600" />{' '}
                  {t('Chọn cửa hàng', 'Selected stores')}
                </label>
              </div>
              {target === 'SELECTED' && (
                <div className="mt-3 rounded-lg border border-slate-200">
                  <div className="relative border-b border-slate-100">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('Tìm theo tên hoặc mã cửa hàng', 'Search by store name or code')}
                      className="w-full pl-9 pr-3 py-2 text-[13px] rounded-t-lg focus:outline-none"
                      aria-label={t('Tìm cửa hàng', 'Search stores')}
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredStores.map((s) => (
                      <label key={s.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-[13px]">
                        <input
                          type="checkbox"
                          checked={selected.includes(String(s.id))}
                          onChange={() => toggle(selected, setSelected, String(s.id))}
                          className="accent-blue-600"
                        />
                        <span className="text-slate-900">{s.name}</span>
                        <span className="text-slate-400">{s.code}</span>
                      </label>
                    ))}
                    {!stores.loading && filteredStores.length === 0 && (
                      <p className="px-2 py-3 text-[13px] text-slate-500">{t('Không tìm thấy cửa hàng.', 'No stores found.')}</p>
                    )}
                  </div>
                  <p className="px-3 py-2 border-t border-slate-100 text-[12px] text-slate-500 tabular-nums">
                    {t(`Đã chọn ${selected.length} cửa hàng`, `${selected.length} stores selected`)}
                  </p>
                </div>
              )}
              {fieldError('target')}
            </fieldset>

            <fieldset>
              <legend className={groupLabel}>{t('Người nhận', 'Recipients')}</legend>
              <div className="flex flex-wrap gap-4 text-[13px] text-slate-700">
                {ROLE_OPTIONS.map((r) => (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={roles.includes(r.value)} onChange={() => toggle(roles, setRoles, r.value)} className="accent-blue-600" />{' '}
                    {t(r.vi, r.en)}
                  </label>
                ))}
              </div>
              {fieldError('roles')}
            </fieldset>
          </div>
        </PanelCard>
      </form>

      <div className="xl:col-span-2 space-y-2 xl:sticky xl:top-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{t('Xem trước', 'Preview')}</p>
        <div className={`${ui.card} p-4 flex gap-3`}>
          <span className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-slate-900 wrap-break-word">{form.title.trim() || t('Tiêu đề thông báo', 'Announcement title')}</p>
            <p className="text-[12px] text-slate-600 mt-1 whitespace-pre-line wrap-break-word">
              {form.message.trim() || t('Nội dung thông báo sẽ hiển thị ở đây.', 'Your message will appear here.')}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">{t('Vừa xong · Từ StockPilot', 'Just now · From StockPilot')}</p>
          </div>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title={t('Gửi thông báo này?', 'Send this announcement?')}
          description={t(
            `Gửi tới ${roles.map(roleName).join(' và ')} của ${
              target === 'ALL' ? 'tất cả cửa hàng đang hoạt động' : `${selected.length} cửa hàng đã chọn`
            }. Không thể thu hồi sau khi gửi.`,
            `Send to ${roles.map(roleName).join(' and ')} of ${
              target === 'ALL' ? 'all active stores' : `${selected.length} selected stores`
            }. It cannot be recalled once sent.`
          )}
          confirmLabel={t('Gửi ngay', 'Send now')}
          onConfirm={send}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
