import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Cpu, Info, Loader2, PlayCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { apiListAdminStores, formatVNDateTime } from '../../../services/adminService';
import { apiGetOpsJobs, apiRunDecisionForStore } from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { Badge, ConfirmDialog, ErrorState, PanelCard, SummaryStrip } from '../components/AdminUI';
import { useAdminText } from '../useAdminText';
import { formatDuration, formatNumber, useOpsData } from './opsShared';

const STATUS = {
  RUNNING: { tone: 'info', vi: 'Đang chạy', en: 'Running' },
  SUCCESS: { tone: 'success', vi: 'Thành công', en: 'Succeeded' },
  FAILED: { tone: 'danger', vi: 'Lỗi ở lần chạy gần nhất', en: 'Last run failed' },
  NEVER_RUN: { tone: 'neutral', vi: 'Chưa chạy lần nào', en: 'Never run' },
};

const pad2 = (n) => String(n).padStart(2, '0');

export function OpsJobsPanel() {
  const { t } = useAdminText();
  const { toast } = useToast();
  const jobs = useOpsData(() => apiGetOpsJobs());
  const stores = useOpsData(() => apiListAdminStores({ limit: 100, isActive: true }).then((r) => r.data));
  const [storeId, setStoreId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const job = jobs.data?.[0];
  const status = STATUS[job?.status] || STATUS.NEVER_RUN;
  const run = job?.lastRun;
  const schedule = job?.schedule;
  const selectedStore = stores.data?.find((s) => String(s.id) === String(storeId));

  const runForStore = async () => {
    try {
      const result = await apiRunDecisionForStore(storeId);
      setLastResult(result);
      toast({
        type: result.failureCount > 0 ? 'info' : 'success',
        title: t(`Đã tính lại cho ${result.storeName}`, `Recalculated ${result.storeName}`),
        description: t(
          `${formatNumber(result.processed)} SKU · ${formatNumber(result.failureCount)} lỗi · còn ${formatNumber(result.remaining)} SKU`,
          `${formatNumber(result.processed)} SKUs · ${formatNumber(result.failureCount)} failed · ${formatNumber(result.remaining)} remaining`
        ),
      });
      setConfirming(false);
      jobs.reload();
    } catch (err) {
      toast({ type: 'error', title: t('Không tính lại được', 'Recalculation failed'), description: apiErrorMessage(err) });
    }
  };

  if (jobs.error) {
    return (
      <div className={ui.card}>
        <ErrorState message={jobs.error} onRetry={jobs.reload} />
      </div>
    );
  }

  const summary = [
    {
      label: t('Lịch tự động', 'Schedule'),
      value: schedule?.enabled ? t('● Đang bật', '● Enabled') : t('○ Tắt trên máy chủ này', '○ Off on this server'),
      tone: schedule?.enabled ? 'success' : undefined,
      hint: schedule
        ? t(`Chạy lúc ${pad2(schedule.nightlyHour)}:00 · ${schedule.timeZone}`, `Runs at ${pad2(schedule.nightlyHour)}:00 · ${schedule.timeZone}`)
        : undefined,
    },
    {
      label: t('Lần chạy gần nhất', 'Last run'),
      value: run ? formatVNDateTime(run.finishedAt) : t('Chưa có', 'None yet'),
      hint: run ? t(`Ngày nghiệp vụ ${run.businessDate}`, `Business date ${run.businessDate}`) : t('Kết quả hiện sau lần chạy đầu tiên', 'Results appear after the first run'),
    },
    {
      label: t('SKU đã tính lại', 'SKUs recalculated'),
      value: run ? formatNumber(run.processedSkus) : '–',
      tone: run?.failedSkus ? 'danger' : undefined,
      hint: run
        ? run.failedSkus
          ? t(`${formatNumber(run.failedSkus)} SKU lỗi · ${formatNumber(run.stores)} cửa hàng`, `${formatNumber(run.failedSkus)} failed · ${formatNumber(run.stores)} stores`)
          : t(`Không lỗi · ${formatNumber(run.stores)} cửa hàng`, `No failures · ${formatNumber(run.stores)} stores`)
        : undefined,
    },
    {
      label: t('Thời gian chạy', 'Duration'),
      value: run ? formatDuration(run.durationMs) : '–',
      hint: run ? t(`${formatNumber(run.expiredRecommendations)} đề xuất giá hết hạn`, `${formatNumber(run.expiredRecommendations)} price suggestions expired`) : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <PanelCard
        icon={Cpu}
        title={t('Decision Engine — tính lại hằng đêm', 'Decision Engine — nightly recalculation')}
        description={t(
          'Tính lại cảnh báo tồn kho và đề xuất giá cho mọi cửa hàng đang hoạt động.',
          'Recalculates stock alerts and price suggestions for every active store.'
        )}
        bodyClassName=""
        actions={
          <>
            {jobs.loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" aria-hidden="true" />
            ) : (
              <Badge tone={status.tone}>{t(status.vi, status.en)}</Badge>
            )}
            {job?.stale && <Badge tone="warning">{t('Bỏ lỡ lịch chạy', 'Missed schedule')}</Badge>}
            <button type="button" onClick={jobs.reload} className={ui.btnGhost} aria-label={t('Làm mới', 'Refresh')} title={t('Làm mới', 'Refresh')}>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </>
        }
      >
        {job?.lastFailure && job.status === 'FAILED' && (
          <div className="mx-5 mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-red-800">
                {t(`Lần chạy lúc ${formatVNDateTime(job.lastFailure.at)} bị lỗi`, `Run at ${formatVNDateTime(job.lastFailure.at)} failed`)}
              </p>
              <p className="text-[12px] text-red-700 mt-0.5 wrap-break-word">{job.lastFailure.message || t('Không có thông tin lỗi', 'No error details')}</p>
            </div>
          </div>
        )}

        <SummaryStrip items={summary} loading={jobs.loading} />

        {!jobs.loading && schedule && !schedule.enabled && (
          <p
            className="px-5 py-2.5 border-t border-slate-200 bg-slate-50 flex items-start gap-2 text-[12px] text-slate-500"
            title="DECISION_SCHEDULER_ENABLED=true"
          >
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            {t(
              'Lịch hằng đêm chỉ tự bật trên máy chủ production. Có thể tính lại thủ công cho từng cửa hàng ở bên dưới.',
              'The nightly schedule only runs on production servers. You can still recalculate a single store below.'
            )}
          </p>
        )}

        {job?.runningStoreRecalculations?.length > 0 && (
          <p className="px-5 py-2.5 border-t border-slate-200 flex items-center gap-2 text-[13px] text-blue-700">
            <Activity className="w-4 h-4" aria-hidden="true" />
            {t('Đang tính lại cho cửa hàng', 'Recalculating store')} #{job.runningStoreRecalculations.join(', #')}
          </p>
        )}
      </PanelCard>

      <PanelCard
        icon={RotateCcw}
        title={t('Tính lại cho một cửa hàng', 'Recalculate a single store')}
        description={t(
          'Dùng khi chủ cửa hàng báo cảnh báo tồn kho hoặc đề xuất giá chưa cập nhật. Chỉ tính toán lại — không sửa dữ liệu bán hàng hay tồn kho — và được ghi vào nhật ký kiểm toán.',
          'Use when a store owner reports stale stock alerts or price suggestions. It only recalculates — sales and stock data are untouched — and is recorded in the audit log.'
        )}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label className="sr-only" htmlFor="ops-store">
            {t('Cửa hàng', 'Store')}
          </label>
          <select
            id="ops-store"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className={`${ui.select} h-9 sm:max-w-sm`}
            disabled={stores.loading}
          >
            <option value="">
              {stores.loading ? t('Đang tải danh sách cửa hàng…', 'Loading stores…') : t('Chọn cửa hàng đang hoạt động', 'Select an active store')}
            </option>
            {(stores.data || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          <button type="button" className={ui.btnPrimary} disabled={!storeId} onClick={() => setConfirming(true)}>
            <PlayCircle className="w-4 h-4" aria-hidden="true" /> {t('Tính lại ngay', 'Recalculate now')}
          </button>
        </div>
        {!storeId && !lastResult && (
          <p className="mt-2 text-[12px] text-slate-500">{t('Chọn một cửa hàng để bật nút tính lại.', 'Select a store to enable recalculation.')}</p>
        )}
        {lastResult && (
          <p className="mt-3 flex items-start gap-2 text-[13px] text-emerald-700" role="status">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {t(
                `${lastResult.storeName}: ${formatNumber(lastResult.successCount)} SKU thành công, ${formatNumber(lastResult.failureCount)} lỗi, mất ${formatDuration(lastResult.durationMs)}.`,
                `${lastResult.storeName}: ${formatNumber(lastResult.successCount)} SKUs succeeded, ${formatNumber(lastResult.failureCount)} failed, took ${formatDuration(lastResult.durationMs)}.`
              )}
              {lastResult.remaining > 0 &&
                t(
                  ` Còn ${formatNumber(lastResult.remaining)} SKU — bấm tính lại lần nữa để xử lý tiếp.`,
                  ` ${formatNumber(lastResult.remaining)} SKUs remain — run again to continue.`
                )}
            </span>
          </p>
        )}
      </PanelCard>

      {confirming && selectedStore && (
        <ConfirmDialog
          title={t(`Tính lại Decision Engine cho "${selectedStore.name}"?`, `Recalculate Decision Engine for "${selectedStore.name}"?`)}
          description={t(
            'Hệ thống tính lại cảnh báo tồn kho và đề xuất giá của cửa hàng này. Có thể mất vài chục giây với cửa hàng nhiều sản phẩm.',
            'Stock alerts and price suggestions for this store will be recalculated. Large catalogs may take a few dozen seconds.'
          )}
          confirmLabel={t('Tính lại', 'Recalculate')}
          onConfirm={runForStore}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
