import React, { useEffect, useState } from 'react';
import { History, Loader2, RotateCcw, Save } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { formatVNDateTime } from '../../../services/adminService';
import { apiGetOpsSettings, apiGetSettingHistory, apiRestoreSetting, apiUpdateOpsSetting } from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { Badge, ConfirmDialog, EmptyState, ErrorState, PanelCard, TableBody, Td, Th } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { SETTING_LABELS, formatSettingValue, settingLabel, useOpsData } from './opsShared';

/** Ô số có nhãn và đơn vị, dùng trong các form cài đặt vận hành. */
function NumberField({ label, unit, value, onChange, min, max, step = 1 }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-slate-600 mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${ui.input} h-9 w-24 tabular-nums`}
        />
        <span className="text-[12px] text-slate-500">{unit}</span>
      </div>
    </label>
  );
}

function OpsSettingCard({ setting, onSaved }) {
  const { t } = useAdminText();
  const { toast } = useToast();
  const [draft, setDraft] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(setting.value), [setting.value]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(setting.value);
  const setField = (field) => (v) => setDraft((d) => ({ ...d, [field]: v === '' ? '' : Number(v) }));
  const HOURS = t('giờ', 'hours');
  const MIN = t('phút', 'min');

  const save = async () => {
    setSaving(true);
    try {
      await apiUpdateOpsSetting(setting.key, draft);
      toast({ type: 'success', title: t('Đã lưu cài đặt', 'Setting saved'), description: settingLabel(setting.key) });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: t('Không lưu được', 'Could not save'), description: apiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${ui.card} flex flex-col`}>
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14px] font-semibold text-slate-900">{settingLabel(setting.key)}</p>
          {dirty && (
            <Badge tone="warning" dot={false}>
              {t('Chưa lưu', 'Unsaved')}
            </Badge>
          )}
        </div>
        <p className="text-[12px] text-slate-500 mt-1 mb-4">{setting.description}</p>
        <div className="flex flex-wrap gap-4">
          {setting.key === 'ops.security.loginLockout' && (
            <>
              <NumberField
                label={t('Số lần sai tối đa', 'Max failed attempts')}
                unit={t('lần (0 = tắt)', 'times (0 = off)')}
                min={0}
                max={50}
                value={draft.maxAttempts}
                onChange={setField('maxAttempts')}
              />
              <NumberField label={t('Trong khoảng', 'Within')} unit={MIN} min={1} max={1440} value={draft.windowMinutes} onChange={setField('windowMinutes')} />
            </>
          )}
          {setting.key === 'ops.support.firstResponseSlaHours' && (
            <>
              <NumberField label={t('Ưu tiên cao', 'High priority')} unit={HOURS} min={0.25} max={720} step={0.25} value={draft.HIGH} onChange={setField('HIGH')} />
              <NumberField label={t('Bình thường', 'Normal')} unit={HOURS} min={0.25} max={720} step={0.25} value={draft.NORMAL} onChange={setField('NORMAL')} />
              <NumberField label={t('Thấp', 'Low')} unit={HOURS} min={0.25} max={720} step={0.25} value={draft.LOW} onChange={setField('LOW')} />
            </>
          )}
          {setting.key === 'ops.payments.pendingAlertMinutes' && (
            <NumberField
              label={t('Coi là treo sau', 'Stuck after')}
              unit={MIN}
              min={5}
              max={1440}
              value={draft}
              onChange={(v) => setDraft(v === '' ? '' : Number(v))}
            />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <span className="text-[12px] text-slate-500 truncate">
          {setting.updatedAt
            ? t('Sửa lần cuối ', 'Last changed ') + formatVNDateTime(setting.updatedAt) + (setting.updatedBy ? ` · ${setting.updatedBy.fullName}` : '')
            : t('Đang dùng giá trị mặc định', 'Using the default value')}
        </span>
        <button type="button" className={`${ui.btnPrimary} h-8`} onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />} {t('Lưu', 'Save')}
        </button>
      </div>
    </div>
  );
}

export function OpsSettingsHistoryPanel() {
  const { t } = useAdminText();
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
      toast({
        type: 'success',
        title: t('Đã khôi phục cài đặt', 'Setting restored'),
        description: `${settingLabel(result.key)}: ${formatSettingValue(result.key, result.value)}`,
      });
      setRestoring(null);
      history.reload();
      settings.reload();
    } catch (err) {
      toast({ type: 'error', title: t('Không khôi phục được', 'Could not restore'), description: apiErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-4">
      <section>
        <div className="mb-3">
          <h2 className="text-[14px] font-semibold text-slate-900">{t('Ngưỡng vận hành', 'Operational thresholds')}</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {t(
              'Các cài đặt nền tảng khác (đăng ký, banner, hạn mức AI) nằm ở trang Hệ thống & AI → Cài đặt nền tảng.',
              'Other platform settings (sign-up, banner, AI quota) live under System & AI → Platform settings.'
            )}
          </p>
        </div>
        {settings.error ? (
          <div className={ui.card}>
            <ErrorState message={settings.error} onRetry={settings.reload} />
          </div>
        ) : settings.loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {settings.data.map((s) => (
              <OpsSettingCard
                key={s.key}
                setting={s}
                onSaved={() => {
                  settings.reload();
                  history.reload();
                }}
              />
            ))}
          </div>
        )}
      </section>

      <PanelCard
        icon={History}
        title={t('Lịch sử thay đổi cài đặt', 'Settings change history')}
        actions={
          <select
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setPage(1);
            }}
            className={`${ui.select} h-8 w-auto`}
            aria-label={t('Lọc theo cài đặt', 'Filter by setting')}
          >
            <option value="">{t('Tất cả cài đặt', 'All settings')}</option>
            {Object.keys(SETTING_LABELS).map((k) => (
              <option key={k} value={k}>
                {settingLabel(k)}
              </option>
            ))}
          </select>
        }
        bodyClassName="overflow-x-auto"
        footer={
          pagination &&
          pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-[12px] text-slate-500">
              <span className="tabular-nums">
                {t(`Trang ${pagination.page}/${pagination.totalPages} · ${pagination.total} thay đổi`, `Page ${pagination.page}/${pagination.totalPages} · ${pagination.total} changes`)}
              </span>
              <div className="flex gap-2">
                <button type="button" className={`${ui.btnSecondary} h-8`} disabled={page <= 1 || history.loading} onClick={() => setPage((p) => p - 1)}>
                  {t('Trước', 'Previous')}
                </button>
                <button
                  type="button"
                  className={`${ui.btnSecondary} h-8`}
                  disabled={page >= pagination.totalPages || history.loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('Sau', 'Next')}
                </button>
              </div>
            </div>
          )
        }
      >
        {history.error ? (
          <ErrorState message={history.error} onRetry={history.reload} />
        ) : !history.loading && items.length === 0 ? (
          <EmptyState
            title={t('Chưa có thay đổi nào', 'No changes yet')}
            description={
              key
                ? t('Cài đặt này chưa từng được sửa.', 'This setting has never been changed.')
                : t('Các lần đổi cài đặt sẽ được ghi lại tại đây.', 'Setting changes will be recorded here.')
            }
          />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <Th>{t('Thời gian', 'Time')}</Th>
                <Th>{t('Người thay đổi', 'Changed by')}</Th>
                <Th>{t('Cài đặt', 'Setting')}</Th>
                <Th>{t('Trước → Sau', 'Before → After')}</Th>
                <Th align="right">
                  <span className="sr-only">{t('Thao tác', 'Actions')}</span>
                </Th>
              </tr>
            </thead>
            <TableBody loading={history.loading} columns={5}>
              {items.map((row) => (
                <tr key={row.id} className={ui.tr}>
                  <Td className="whitespace-nowrap tabular-nums">{formatVNDateTime(row.createdAt)}</Td>
                  <Td>{row.user?.fullName || <span className="text-slate-400">{t('Hệ thống', 'System')}</span>}</Td>
                  <Td>
                    <p className="font-medium text-slate-900">{settingLabel(row.key)}</p>
                    {row.action === 'SYSTEM_SETTING_RESTORED' && (
                      <Badge tone="purple" dot={false} className="mt-1">
                        {t('Khôi phục', 'Restored')}
                      </Badge>
                    )}
                  </Td>
                  <Td className="max-w-[340px]">
                    <span className="text-slate-500 line-through decoration-slate-300">{formatSettingValue(row.key, row.before)}</span>
                    <span className="mx-1.5 text-slate-400" aria-hidden="true">
                      →
                    </span>
                    <span className="font-medium text-slate-900">{formatSettingValue(row.key, row.after)}</span>
                    {row.reason && (
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {t('Lý do: ', 'Reason: ')}
                        {row.reason}
                      </p>
                    )}
                  </Td>
                  <Td align="right">
                    {row.canRestore && (
                      <button type="button" className={`${ui.btnSecondary} h-8`} onClick={() => setRestoring(row)}>
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {t('Khôi phục', 'Restore')}
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </TableBody>
          </table>
        )}
      </PanelCard>

      {restoring && (
        <ConfirmDialog
          title={t(`Khôi phục "${settingLabel(restoring.key)}"?`, `Restore "${settingLabel(restoring.key)}"?`)}
          description={t(
            `Giá trị sẽ trở về: ${formatSettingValue(restoring.key, restoring.before)} (giá trị trước lần sửa lúc ${formatVNDateTime(restoring.createdAt)}).`,
            `The value returns to: ${formatSettingValue(restoring.key, restoring.before)} (the value before the change at ${formatVNDateTime(restoring.createdAt)}).`
          )}
          confirmLabel={t('Khôi phục', 'Restore')}
          reason={{ required: true, minLength: 3, placeholder: t('Ví dụ: Lần sửa trước gây khóa nhầm nhiều cửa hàng', 'e.g. The last change locked out many stores by mistake') }}
          onConfirm={restore}
          onClose={() => setRestoring(null)}
        />
      )}
    </div>
  );
}
