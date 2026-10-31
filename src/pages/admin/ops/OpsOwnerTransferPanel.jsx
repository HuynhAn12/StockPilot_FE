import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Crown, Loader2, Store, UserRound, Users } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { apiGetAdminStore, apiListAdminStores, apiListAdminUsers } from '../../../services/adminService';
import { apiTransferStoreOwner } from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { ConfirmDialog, EmptyState, ErrorState, PanelCard } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { useOpsData } from './opsShared';

/** Số thứ tự bước, giúp người dùng thấy đây là quy trình 3 bước. */
function Step({ n, done }) {
  return (
    <span
      className={`w-6 h-6 rounded-full text-[12px] font-semibold tabular-nums flex items-center justify-center shrink-0 ${
        done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
      }`}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

function StepTitle({ n, done, children }) {
  return (
    <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-900 mb-3">
      <Step n={n} done={done} />
      {children}
    </h3>
  );
}

export function OpsOwnerTransferPanel() {
  const { t } = useAdminText();
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
  const candidates = useMemo(
    () => (detail.data?.staff || []).filter((u) => u.isActive && u.role === 'WAREHOUSE_STAFF' && String(u.storeId) === String(storeId)),
    [detail.data, storeId]
  );
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
      toast({
        type: 'success',
        title: t('Đã chuyển quyền chủ cửa hàng', 'Store ownership transferred'),
        description: t(`${result.newOwner.fullName} là chủ mới của ${result.store.name}.`, `${result.newOwner.fullName} now owns ${result.store.name}.`),
      });
    } catch (err) {
      toast({ type: 'error', title: t('Không chuyển quyền được', 'Transfer failed'), description: apiErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-4">
      {done && (
        <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800" role="status">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            {t(
              `${done.newOwner.fullName} là chủ mới của ${done.store.name}. Đã thu hồi ${done.revokedSessions} phiên đăng nhập — các tài khoản liên quan cần đăng nhập lại.`,
              `${done.newOwner.fullName} now owns ${done.store.name}. ${done.revokedSessions} sessions were revoked — affected accounts must sign in again.`
            )}
          </p>
        </div>
      )}

      <PanelCard
        icon={Crown}
        title={t('Chuyển quyền chủ cửa hàng', 'Transfer store ownership')}
        description={t(
          'Dùng khi chủ cửa hàng nghỉ việc, sang nhượng hoặc mất quyền truy cập tài khoản. Mỗi cửa hàng luôn chỉ có đúng một chủ đang hoạt động.',
          'Use when an owner leaves, sells the store or loses account access. Each store always has exactly one active owner.'
        )}
      >
        <div className="space-y-6">
          <section>
            <StepTitle n={1} done={Boolean(storeId)}>
              {t('Chọn cửa hàng', 'Choose a store')}
            </StepTitle>
            <select
              value={storeId}
              onChange={(e) => changeStore(e.target.value)}
              className={`${ui.select} h-9 sm:max-w-md`}
              aria-label={t('Chọn cửa hàng', 'Choose a store')}
              disabled={stores.loading}
            >
              <option value="">{stores.loading ? t('Đang tải danh sách cửa hàng…', 'Loading stores…') : t('Chọn cửa hàng', 'Choose a store')}</option>
              {(stores.data || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}){s.isActive ? '' : t(' — tạm ngưng', ' — suspended')}
                </option>
              ))}
            </select>
          </section>

          {storeId &&
            (detail.loading ? (
              <div className="flex items-center gap-2 text-[13px] text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('Đang tải thông tin cửa hàng…', 'Loading store details…')}
              </div>
            ) : detail.error ? (
              <ErrorState message={detail.error} onRetry={detail.reload} />
            ) : (
              <>
                <section className="pt-5 border-t border-slate-100">
                  <StepTitle n={2} done>
                    {t('Chủ hiện tại', 'Current owner')}
                  </StepTitle>
                  {activeOwners.length ? (
                    <div className="flex flex-wrap gap-2">
                      {activeOwners.map((o) => (
                        <div key={o.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5">
                          <Crown className="w-4 h-4 text-amber-500" aria-hidden="true" />
                          <div>
                            <p className="text-[13px] font-medium text-slate-900">{o.fullName}</p>
                            <p className="text-[12px] text-slate-500">{o.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-amber-700 font-medium">{t('Cửa hàng hiện không có chủ nào đang hoạt động.', 'This store has no active owner.')}</p>
                  )}
                </section>

                <section className="pt-5 border-t border-slate-100">
                  <StepTitle n={3} done={Boolean(newOwner)}>
                    {t('Chọn chủ mới (nhân viên của cửa hàng này)', "Choose the new owner (one of this store's staff)")}
                  </StepTitle>
                  {candidates.length === 0 ? (
                    <EmptyState
                      title={t('Cửa hàng chưa có nhân viên đang hoạt động', 'This store has no active staff')}
                      description={t(
                        'Chủ mới phải là nhân viên thuộc chính cửa hàng. Hãy tạo hoặc mở khóa tài khoản nhân viên trước.',
                        "The new owner must be one of the store's own staff. Create or re-enable a staff account first."
                      )}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('Chủ mới', 'New owner')}>
                      {candidates.map((u) => {
                        const checked = String(newOwnerId) === String(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 cursor-pointer transition-colors ${
                              checked ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="new-owner"
                              value={u.id}
                              checked={checked}
                              onChange={() => setNewOwnerId(String(u.id))}
                              className="accent-blue-600"
                            />
                            <UserRound className="w-4 h-4 text-slate-500" aria-hidden="true" />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-slate-900 truncate">{u.fullName}</p>
                              <p className="text-[12px] text-slate-500 truncate">{u.email}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>

                {candidates.length > 0 && (
                  <section className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={deactivateFormer}
                        onChange={(e) => setDeactivateFormer(e.target.checked)}
                        className="mt-0.5 accent-red-600"
                      />
                      <span className="text-[13px] text-slate-700">
                        {t('Khóa luôn tài khoản chủ cũ', 'Also disable the former owner')}
                        <span className="block text-[12px] text-slate-500">
                          {t('Nếu không chọn, chủ cũ trở thành nhân viên kho của cửa hàng.', 'Otherwise the former owner becomes warehouse staff.')}
                        </span>
                      </span>
                    </label>
                    <button type="button" className={ui.btnDanger} disabled={!newOwner} onClick={() => setConfirming(true)}>
                      {t('Chuyển quyền chủ cửa hàng', 'Transfer ownership')} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </section>
                )}
              </>
            ))}

          {!storeId && (
            <div className="flex items-center gap-6 pt-5 border-t border-slate-100 text-[12px] text-slate-400">
              <span className="flex items-center gap-2">
                <Step n={2} /> <Users className="w-3.5 h-3.5" aria-hidden="true" /> {t('Chủ hiện tại', 'Current owner')}
              </span>
              <span className="flex items-center gap-2">
                <Step n={3} /> <Store className="w-3.5 h-3.5" aria-hidden="true" /> {t('Chủ mới', 'New owner')}
              </span>
            </div>
          )}
        </div>
      </PanelCard>

      {confirming && newOwner && store && (
        <ConfirmDialog
          title={t(`Chuyển "${store.name}" cho ${newOwner.fullName}?`, `Transfer "${store.name}" to ${newOwner.fullName}?`)}
          description={t(
            `${newOwner.fullName} sẽ có toàn quyền cửa hàng (gồm giá vốn và duyệt giá). Chủ cũ ${deactivateFormer ? 'bị khóa tài khoản' : 'trở thành nhân viên kho'}. Mọi phiên đăng nhập của các bên bị thu hồi.`,
            `${newOwner.fullName} gets full store access (including cost prices and price approval). The former owner ${
              deactivateFormer ? 'is disabled' : 'becomes warehouse staff'
            }. All sessions of both are revoked.`
          )}
          confirmLabel={t('Chuyển quyền', 'Transfer')}
          danger
          reason={{
            required: true,
            minLength: 3,
            placeholder: t('Ví dụ: Chủ cũ sang nhượng cửa hàng theo hợp đồng ngày 25/10', 'e.g. Former owner sold the store under the 25/10 contract'),
          }}
          password={{}}
          onConfirm={transfer}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
