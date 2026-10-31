import React, { useEffect, useState } from 'react';
import { History, Loader2, RotateCcw, Save } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetOpsSettings, apiGetSettingHistory, apiRestoreSetting, apiUpdateOpsSetting } from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { Badge, ConfirmDialog, EmptyState, ErrorState, TableCard, Td, Th } from '../components/AdminUI';
import { SETTING_LABELS, formatSettingValue, useOpsData } from './opsShared';

/** Ô số có nhãn và đơn vị, dùng trong các form cài đặt vận hành. */
function NumberField({ label, unit, value, onChange, min, max, step = 1 }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-[#475569] mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} className={`${ui.input} w-28`} />
        <span className="text-[12.5px] text-[#64748B]">{unit}</span>
      </div>
    </label>
  );
}

function OpsSettingCard({ setting, onSaved }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(setting.value), [setting.value]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(setting.value);
  const setField = (field) => (v) => setDraft((d) => ({ ...d, [field]: v === '' ? '' : Number(v) }));

  const save = async () => {
    setSaving(true);
    try {
      await apiUpdateOpsSetting(setting.key, draft);
      toast({ type: 'success', title: 'Đã lưu cài đặt', description: SETTING_LABELS[setting.key] });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: 'Không lưu được', description: apiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${ui.card} p-5 flex flex-col`}>
      <p className="text-[14px] font-semibold text-[#0F172A]">{SETTING_LABELS[setting.key]}</p>
      <p className="text-[12.5px] text-[#64748B] mt-1 mb-4">{setting.description}</p>
      <div className="flex flex-wrap gap-4 flex-1">
        {setting.key === 'ops.security.loginLockout' && (
          <>
            <NumberField label="Số lần sai tối đa" unit="lần (0 = tắt)" min={0} max={50} value={draft.maxAttempts} onChange={setField('maxAttempts')} />
            <NumberField label="Trong khoảng" unit="phút" min={1} max={1440} value={draft.windowMinutes} onChange={setField('windowMinutes')} />
          </>
        )}
        {setting.key === 'ops.support.firstResponseSlaHours' && (
          <>
            <NumberField label="Ưu tiên cao" unit="giờ" min={0.25} max={720} step={0.25} value={draft.HIGH} onChange={setField('HIGH')} />
            <NumberField label="Bình thường" unit="giờ" min={0.25} max={720} step={0.25} value={draft.NORMAL} onChange={setField('NORMAL')} />
            <NumberField label="Thấp" unit="giờ" min={0.25} max={720} step={0.25} value={draft.LOW} onChange={setField('LOW')} />
          </>
        )}
        {setting.key === 'ops.payments.pendingAlertMinutes' && (
          <NumberField label="Coi là treo sau" unit="phút" min={5} max={1440} value={draft} onChange={(v) => setDraft(v === '' ? '' : Number(v))} />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[#F1F5F9]">
        <span className="text-[12px] text-[#94A3B8]">
          {setting.updatedAt ? `Sửa lần cuối ${formatVNDateTime(setting.updatedAt)}${setting.updatedBy ? ` · ${setting.updatedBy.fullName}` : ''}` : 'Đang dùng giá trị mặc định'}
        </span>
        <button type="button" className={ui.btnPrimary} onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Lưu
        </button>
      </div>
    </div>
  );
}

export function OpsSettingsHistoryPanel() {
  const { toast } = useToast();
  const [key, setKey] = useState('');
  const [page, setPage] = useState(1);
  const [restoring, setRestoring] = useState(null);
  const settings = useOpsData(() => apiGetOpsSettings());
  const history = useOpsData(() => apiGetSettingHistory({ key, page, limit: 15 }), [key, page]);
  const items = history.data?.items || [];
  const pagination = history.data?.pagination;

  const restore = async ({ reason }) => {
    try {
      const result = await apiRestoreSetting(restoring.id, reason);
      toast({ type: 'success', title: 'Đã khôi phục cài đặt', description: `${SETTING_LABELS[result.key] || result.key}: ${formatSettingValue(result.key, result.value)}` });
      setRestoring(null);
      history.reload();
      settings.reload();
    } catch (err) {
      toast({ type: 'error', title: 'Không khôi phục được', description: apiErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[14px] font-bold text-[#0F172A] mb-1">Ngưỡng vận hành</p>
        <p className="text-[13px] text-[#64748B] mb-4">Các cài đặt nền tảng khác (đăng ký, banner, hạn mức AI) nằm ở trang Hệ thống & AI → Cài đặt nền tảng.</p>
        {settings.error ? (
          <div className={ui.card}><ErrorState message={settings.error} onRetry={settings.reload} /></div>
        ) : settings.loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {settings.data.map((s) => <OpsSettingCard key={s.key} setting={s} onSaved={() => { settings.reload(); history.reload(); }} />)}
          </div>
        )}
      </div>

      <TableCard
        header={
          <>
            <span className={`${ui.cardTitle} flex items-center gap-2`}><History className="w-4 h-4 text-[#64748B]" /> Lịch sử thay đổi cài đặt</span>
            <select value={key} onChange={(e) => { setKey(e.target.value); setPage(1); }} className={`${ui.select} w-auto`} aria-label="Lọc theo cài đặt">
              <option value="">Tất cả cài đặt</option>
              {Object.entries(SETTING_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </>
        }
        footer={
          pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#F1F5F9] text-[12.5px] text-[#64748B]">
              <span>Trang {pagination.page}/{pagination.totalPages} · {pagination.total} thay đổi</span>
              <div className="flex gap-2">
                <button type="button" className={ui.btnSecondary} disabled={page <= 1 || history.loading} onClick={() => setPage((p) => p - 1)}>Trước</button>
                <button type="button" className={ui.btnSecondary} disabled={page >= pagination.totalPages || history.loading} onClick={() => setPage((p) => p + 1)}>Sau</button>
              </div>
            </div>
          )
        }
      >
        {history.error ? (
          <ErrorState message={history.error} onRetry={history.reload} />
        ) : !history.loading && items.length === 0 ? (
          <EmptyState title="Chưa có thay đổi nào" description={key ? 'Cài đặt này chưa từng được sửa.' : 'Các lần đổi cài đặt sẽ được ghi lại tại đây.'} />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>Thời gian</Th>
                <Th>Người thay đổi</Th>
                <Th>Cài đặt</Th>
                <Th>Trước → Sau</Th>
                <Th align="right">Thao tác</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className={ui.tr}>
                  <Td className="whitespace-nowrap">{formatVNDateTime(row.createdAt)}</Td>
                  <Td>{row.user?.fullName || <span className="text-[#94A3B8]">Hệ thống</span>}</Td>
                  <Td>
                    <p className="font-medium text-[#0F172A]">{SETTING_LABELS[row.key] || row.key}</p>
                    {row.action === 'SYSTEM_SETTING_RESTORED' && <Badge tone="purple" dot={false} className="mt-1">Khôi phục</Badge>}
                  </Td>
                  <Td className="max-w-[340px]">
                    <span className="text-[#64748B] line-through decoration-slate-300">{formatSettingValue(row.key, row.before)}</span>
                    <span className="mx-1.5 text-[#94A3B8]">→</span>
                    <span className="font-medium text-[#0F172A]">{formatSettingValue(row.key, row.after)}</span>
                    {row.reason && <p className="text-[12px] text-[#64748B] mt-0.5">Lý do: {row.reason}</p>}
                  </Td>
                  <Td align="right">
                    {row.canRestore && (
                      <button type="button" className={ui.btnSecondary} onClick={() => setRestoring(row)}>
                        <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {restoring && (
        <ConfirmDialog
          title={`Khôi phục "${SETTING_LABELS[restoring.key] || restoring.key}"?`}
          description={`Giá trị sẽ trở về: ${formatSettingValue(restoring.key, restoring.before)} (giá trị trước lần sửa lúc ${formatVNDateTime(restoring.createdAt)}).`}
          confirmLabel="Khôi phục"
          reason={{ required: true, minLength: 3, placeholder: 'Ví dụ: Lần sửa trước gây khóa nhầm nhiều cửa hàng' }}
          onConfirm={restore}
          onClose={() => setRestoring(null)}
        />
      )}
    </div>
  );
}
