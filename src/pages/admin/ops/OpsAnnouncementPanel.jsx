import React, { useMemo, useState } from 'react';
import { Bell, Megaphone, Search } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { apiListAdminStores } from '../../../services/adminService';
import { apiBroadcastAnnouncement } from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { ConfirmDialog, Section } from '../components/AdminUI';
import { formatNumber, useOpsData } from './opsShared';

const ROLE_OPTIONS = [
  { value: 'SHOP_OWNER', label: 'Chủ cửa hàng' },
  { value: 'WAREHOUSE_STAFF', label: 'Nhân viên kho' },
];

export function OpsAnnouncementPanel() {
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
    title: form.title.trim().length < 3 ? 'Tiêu đề cần ít nhất 3 ký tự' : '',
    message: form.message.trim().length < 3 ? 'Nội dung cần ít nhất 3 ký tự' : '',
    target: target === 'SELECTED' && selected.length === 0 ? 'Chọn ít nhất một cửa hàng' : '',
    roles: roles.length === 0 ? 'Chọn ít nhất một nhóm người nhận' : '',
  };
  const valid = !Object.values(errors).some(Boolean);

  const toggle = (list, setList, value) => setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const send = async () => {
    try {
      const result = await apiBroadcastAnnouncement({
        title: form.title.trim(),
        message: form.message.trim(),
        roles,
        ...(target === 'SELECTED' ? { storeIds: selected.map(Number) } : {}),
      });
      toast({ type: 'success', title: 'Đã gửi thông báo', description: `${formatNumber(result.recipients)} người nhận tại ${formatNumber(result.storeCount)} cửa hàng.` });
      setConfirming(false);
      setForm({ title: '', message: '' });
      setSelected([]);
      setTouched(false);
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được thông báo', description: apiErrorMessage(err) });
    }
  };

  const fieldError = (key) => touched && errors[key] ? <span className="block text-[12px] text-red-600 mt-1">{errors[key]}</span> : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <form
        className={`${ui.card} xl:col-span-3`}
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (valid) setConfirming(true);
        }}
      >
        <div className={`${ui.cardBody} space-y-5`}>
          <label className="block">
            <span className="block text-[13px] font-semibold text-[#334155] mb-1.5">Tiêu đề</span>
            <input className={ui.input} maxLength={150} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ví dụ: Bảo trì hệ thống tối 30/10" />
            {fieldError('title')}
          </label>
          <label className="block">
            <span className="flex justify-between text-[13px] font-semibold text-[#334155] mb-1.5">
              Nội dung <span className="font-normal text-[#94A3B8]">{form.message.length}/2000</span>
            </span>
            <textarea rows={5} maxLength={2000} className={ui.input} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Nêu rõ thời gian, ảnh hưởng và việc cửa hàng cần làm (nếu có)." />
            {fieldError('message')}
          </label>

          <Section title="Gửi tới">
            <div className="flex flex-wrap gap-4 text-[13px] text-[#334155]">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={target === 'ALL'} onChange={() => setTarget('ALL')} className="accent-[#2563EB]" /> Tất cả cửa hàng đang hoạt động</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={target === 'SELECTED'} onChange={() => setTarget('SELECTED')} className="accent-[#2563EB]" /> Chọn cửa hàng</label>
            </div>
            {target === 'SELECTED' && (
              <div className="mt-3 rounded-xl border border-[#E2E8F0]">
                <div className="relative border-b border-[#F1F5F9]">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã cửa hàng" className="w-full pl-9 pr-3 py-2.5 text-[13px] rounded-t-xl focus:outline-none" aria-label="Tìm cửa hàng" />
                </div>
                <div className="max-h-56 overflow-y-auto p-2 space-y-0.5">
                  {filteredStores.map((s) => (
                    <label key={s.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-[13px]">
                      <input type="checkbox" checked={selected.includes(String(s.id))} onChange={() => toggle(selected, setSelected, String(s.id))} className="accent-[#2563EB]" />
                      <span className="text-[#0F172A]">{s.name}</span>
                      <span className="text-[#94A3B8]">{s.code}</span>
                    </label>
                  ))}
                  {!stores.loading && filteredStores.length === 0 && <p className="px-2 py-3 text-[13px] text-[#64748B]">Không tìm thấy cửa hàng.</p>}
                </div>
                <p className="px-3 py-2 border-t border-[#F1F5F9] text-[12px] text-[#64748B]">Đã chọn {selected.length} cửa hàng</p>
              </div>
            )}
            {fieldError('target')}
          </Section>

          <Section title="Người nhận">
            <div className="flex flex-wrap gap-4 text-[13px] text-[#334155]">
              {ROLE_OPTIONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={roles.includes(r.value)} onChange={() => toggle(roles, setRoles, r.value)} className="accent-[#2563EB]" /> {r.label}
                </label>
              ))}
            </div>
            {fieldError('roles')}
          </Section>

          <div className="pt-1">
            <button type="submit" className={ui.btnPrimary}><Megaphone className="w-4 h-4" /> Gửi thông báo</button>
          </div>
        </div>
      </form>

      <div className="xl:col-span-2 space-y-3">
        <p className="text-[13px] font-semibold text-[#334155]">Xem trước trong hộp thông báo</p>
        <div className={`${ui.card} p-4 flex gap-3`}>
          <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0"><Bell className="w-4 h-4" /></span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0F172A] break-words">{form.title.trim() || 'Tiêu đề thông báo'}</p>
            <p className="text-[12.5px] text-[#475569] mt-1 whitespace-pre-line break-words">{form.message.trim() || 'Nội dung thông báo sẽ hiển thị ở đây.'}</p>
            <p className="text-[11px] text-[#94A3B8] mt-2">Vừa xong · Từ StockPilot</p>
          </div>
        </div>
        <p className="text-[12px] text-[#64748B]">Thông báo được gửi vào hộp thông báo của từng người dùng và không thể thu hồi sau khi gửi.</p>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Gửi thông báo này?"
          description={`Gửi tới ${roles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label.toLowerCase()).join(' và ')} của ${
            target === 'ALL' ? 'tất cả cửa hàng đang hoạt động' : `${selected.length} cửa hàng đã chọn`
          }. Không thể thu hồi sau khi gửi.`}
          confirmLabel="Gửi ngay"
          onConfirm={send}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
