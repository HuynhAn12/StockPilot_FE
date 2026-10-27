import React, { useMemo, useState } from 'react';
import { ArrowRight, Crown, Loader2, UserRound } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { apiGetAdminStore, apiListAdminStores, apiListAdminUsers } from '../../../services/adminService';
import { apiTransferStoreOwner } from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { Badge, ConfirmDialog, EmptyState, ErrorState, Section } from '../components/AdminUI';
import { useOpsData } from './opsShared';

export function OpsOwnerTransferPanel() {
  const { toast } = useToast();
  const [storeId, setStoreId] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [deactivateFormer, setDeactivateFormer] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(null);

  const stores = useOpsData(() => apiListAdminStores({ limit: 100 }).then((r) => r.data));
  const detail = useOpsData(
    () =>
      storeId
        ? Promise.all([apiGetAdminStore(storeId), apiListAdminUsers({ storeId, role: 'WAREHOUSE_STAFF', limit: 100 })]).then(([store, staff]) => ({
            store,
            staff: staff.data,
          }))
        : Promise.resolve(null),
    [storeId]
  );

  const store = detail.data?.store;
  const activeOwners = (store?.owners || []).filter((o) => o.isActive);
  const candidates = useMemo(() => (detail.data?.staff || []).filter((u) => u.isActive && u.role === 'WAREHOUSE_STAFF' && String(u.storeId) === String(storeId)), [detail.data, storeId]);
  const newOwner = candidates.find((u) => String(u.id) === String(newOwnerId));

  const changeStore = (value) => {
    setStoreId(value);
    setNewOwnerId('');
    setDone(null);
  };

  const transfer = async ({ reason, password }) => {
    try {
      const result = await apiTransferStoreOwner(storeId, {
        newOwnerUserId: Number(newOwnerId),
        reason,
        actorPassword: password,
        deactivateFormerOwner: deactivateFormer,
      });
      setDone(result);
      setConfirming(false);
      setNewOwnerId('');
      setDeactivateFormer(false);
      detail.reload();
      toast({ type: 'success', title: 'Đã chuyển quyền chủ cửa hàng', description: `${result.newOwner.fullName} là chủ mới của ${result.store.name}.` });
    } catch (err) {
      toast({ type: 'error', title: 'Không chuyển quyền được', description: apiErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className={ui.card}>
        <div className={ui.cardBody}>
          <Section title="1. Chọn cửa hàng">
            <p className="text-[13px] text-[#64748B] mb-3 max-w-[70ch]">
              Dùng khi chủ cửa hàng nghỉ việc, sang nhượng hoặc mất quyền truy cập tài khoản. Mỗi cửa hàng luôn chỉ có đúng một chủ đang hoạt động.
            </p>
            <select value={storeId} onChange={(e) => changeStore(e.target.value)} className={`${ui.select} sm:max-w-md`} aria-label="Chọn cửa hàng" disabled={stores.loading}>
              <option value="">{stores.loading ? 'Đang tải danh sách cửa hàng…' : 'Chọn cửa hàng'}</option>
              {(stores.data || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code}){s.isActive ? '' : ' — tạm ngưng'}</option>
              ))}
            </select>
          </Section>
        </div>
      </div>

      {storeId && (
        <div className={ui.card}>
          <div className={ui.cardBody}>
            {detail.loading ? (
              <div className="flex items-center gap-2 text-[13px] text-[#64748B]"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải thông tin cửa hàng…</div>
            ) : detail.error ? (
              <ErrorState message={detail.error} onRetry={detail.reload} />
            ) : (
              <div className="space-y-6">
                <Section title="2. Chủ hiện tại">
                  {activeOwners.length ? (
                    <div className="flex flex-wrap gap-3">
                      {activeOwners.map((o) => (
                        <div key={o.id} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] px-4 py-3">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <div>
                            <p className="text-[13px] font-semibold text-[#0F172A]">{o.fullName}</p>
                            <p className="text-[12px] text-[#64748B]">{o.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-amber-700 font-medium">Cửa hàng hiện không có chủ nào đang hoạt động.</p>
                  )}
                </Section>

                <Section title="3. Chọn chủ mới (nhân viên của cửa hàng này)">
                  {candidates.length === 0 ? (
                    <EmptyState title="Cửa hàng chưa có nhân viên đang hoạt động" description="Chủ mới phải là nhân viên thuộc chính cửa hàng. Hãy tạo hoặc mở khóa tài khoản nhân viên trước." />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Chủ mới">
                      {candidates.map((u) => (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                            String(newOwnerId) === String(u.id) ? 'border-[#2563EB] bg-blue-50/60' : 'border-[#E2E8F0] hover:border-slate-300'
                          }`}
                        >
                          <input type="radio" name="new-owner" value={u.id} checked={String(newOwnerId) === String(u.id)} onChange={() => setNewOwnerId(String(u.id))} className="accent-[#2563EB]" />
                          <UserRound className="w-4 h-4 text-[#64748B]" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#0F172A] truncate">{u.fullName}</p>
                            <p className="text-[12px] text-[#64748B] truncate">{u.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </Section>

                {candidates.length > 0 && (
                  <div className="space-y-4 border-t border-[#F1F5F9] pt-5">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={deactivateFormer} onChange={(e) => setDeactivateFormer(e.target.checked)} className="mt-0.5 accent-[#DC2626]" />
                      <span className="text-[13px] text-[#334155]">
                        Khóa luôn tài khoản chủ cũ
                        <span className="block text-[12px] text-[#64748B]">Nếu không chọn, chủ cũ trở thành nhân viên kho của cửa hàng.</span>
                      </span>
                    </label>
                    <button type="button" className={ui.btnDanger} disabled={!newOwner} onClick={() => setConfirming(true)}>
                      Chuyển quyền chủ cửa hàng <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
          <Badge tone="success">Hoàn tất</Badge>{' '}
          {done.newOwner.fullName} là chủ mới của {done.store.name}. Đã thu hồi {done.revokedSessions} phiên đăng nhập — các tài khoản liên quan cần đăng nhập lại.
        </div>
      )}

      {confirming && newOwner && store && (
        <ConfirmDialog
          title={`Chuyển "${store.name}" cho ${newOwner.fullName}?`}
          description={`${newOwner.fullName} sẽ có toàn quyền cửa hàng (gồm giá vốn và duyệt giá). Chủ cũ ${deactivateFormer ? 'bị khóa tài khoản' : 'trở thành nhân viên kho'}. Mọi phiên đăng nhập của các bên bị thu hồi.`}
          confirmLabel="Chuyển quyền"
          danger
          reason={{ required: true, minLength: 3, placeholder: 'Ví dụ: Chủ cũ sang nhượng cửa hàng theo hợp đồng ngày 25/10' }}
          password={{}}
          onConfirm={transfer}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
