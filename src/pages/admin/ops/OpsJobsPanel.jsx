import React, { useState } from 'react';
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Cpu, Loader2, Package, PlayCircle, RefreshCw, Store, Timer } from 'lucide-react';
import { useToast } from '../../../components/common/Toast';
import { apiListAdminStores, formatVNDateTime } from '../../../services/adminService';
import { apiGetOpsJobs, apiRunDecisionForStore } from '../../../services/adminOpsService';
import { apiErrorMessage } from '../adminLabels';
import { adminStyles as ui } from '../adminStyles';
import { Badge, ConfirmDialog, EmptyState, ErrorState, Section, StatCard } from '../components/AdminUI';
import { formatDuration, formatNumber, useOpsData } from './opsShared';

const STATUS = {
  RUNNING: { tone: 'info', label: 'Đang chạy' },
  SUCCESS: { tone: 'success', label: 'Thành công' },
  FAILED: { tone: 'danger', label: 'Lỗi ở lần chạy gần nhất' },
  NEVER_RUN: { tone: 'neutral', label: 'Chưa chạy lần nào' },
};

export function OpsJobsPanel() {
  const { toast } = useToast();
  const jobs = useOpsData(() => apiGetOpsJobs());
  const stores = useOpsData(() => apiListAdminStores({ limit: 100, isActive: true }).then((r) => r.data));
  const [storeId, setStoreId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const job = jobs.data?.[0];
  const status = STATUS[job?.status] || STATUS.NEVER_RUN;
  const run = job?.lastRun;
  const selectedStore = stores.data?.find((s) => String(s.id) === String(storeId));

  const runForStore = async () => {
    try {
      const result = await apiRunDecisionForStore(storeId);
      setLastResult(result);
      toast({
        type: result.failureCount > 0 ? 'info' : 'success',
        title: `Đã tính lại cho ${result.storeName}`,
        description: `${formatNumber(result.processed)} SKU · ${formatNumber(result.failureCount)} lỗi · còn ${formatNumber(result.remaining)} SKU`,
      });
      setConfirming(false);
      jobs.reload();
    } catch (err) {
      toast({ type: 'error', title: 'Không tính lại được', description: apiErrorMessage(err) });
    }
  };

  if (jobs.error) return <div className={ui.card}><ErrorState message={jobs.error} onRetry={jobs.reload} /></div>;

  return (
    <div className="space-y-6">
      <div className={ui.card}>
        <div className={ui.cardHeader}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
              <Cpu className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <p className={ui.cardTitle}>{job?.label || 'Decision Engine — tính lại hằng đêm'}</p>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                {job?.schedule?.enabled
                  ? `Tự động chạy lúc ${job.schedule.nightlyHour}:00 hằng đêm (${job.schedule.timeZone})`
                  : 'Lịch tự động đang tắt trên máy chủ này (chỉ bật ở production hoặc khi đặt DECISION_SCHEDULER_ENABLED=true)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {jobs.loading ? <Loader2 className="w-4 h-4 animate-spin text-[#94A3B8]" /> : <Badge tone={status.tone}>{status.label}</Badge>}
            {job?.stale && <Badge tone="warning">Bỏ lỡ lịch chạy</Badge>}
            <button type="button" onClick={jobs.reload} className={ui.btnGhost} aria-label="Làm mới">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {job?.lastFailure && job.status === 'FAILED' && (
          <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-red-800">Lần chạy lúc {formatVNDateTime(job.lastFailure.at)} bị lỗi</p>
              <p className="text-[12px] text-red-700 mt-0.5 break-words">{job.lastFailure.message || 'Không có thông tin lỗi'}</p>
            </div>
          </div>
        )}

        <div className={ui.cardBody}>
          {!jobs.loading && !run ? (
            <EmptyState title="Chưa có lần chạy nào" description="Kết quả sẽ hiện ở đây sau lần chạy hằng đêm đầu tiên." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard title="Ngày nghiệp vụ" value={run?.businessDate || '–'} subtitle={run ? `Xong lúc ${formatVNDateTime(run.finishedAt)}` : ''} icon={CalendarClock} loading={jobs.loading} />
              <StatCard title="Cửa hàng đã xử lý" value={formatNumber(run?.stores)} icon={Store} loading={jobs.loading} />
              <StatCard
                title="SKU đã tính lại"
                value={formatNumber(run?.processedSkus)}
                subtitle={run?.failedSkus ? `${formatNumber(run.failedSkus)} SKU lỗi` : 'Không có SKU lỗi'}
                alert={Boolean(run?.failedSkus)}
                icon={Package}
                loading={jobs.loading}
              />
              <StatCard title="Thời gian chạy" value={formatDuration(run?.durationMs)} subtitle={run ? `${formatNumber(run.expiredRecommendations)} đề xuất giá hết hạn` : ''} icon={Timer} loading={jobs.loading} />
            </div>
          )}
          {job?.runningStoreRecalculations?.length > 0 && (
            <p className="mt-4 flex items-center gap-2 text-[13px] text-[#175CD3]">
              <Activity className="w-4 h-4" /> Đang tính lại cho cửa hàng #{job.runningStoreRecalculations.join(', #')}
            </p>
          )}
        </div>
      </div>

      <div className={ui.card}>
        <div className={ui.cardBody}>
          <Section title="Tính lại cho một cửa hàng">
            <p className="text-[13px] text-[#64748B] mb-4 max-w-[70ch]">
              Dùng khi chủ cửa hàng báo cảnh báo tồn kho hoặc đề xuất giá chưa cập nhật. Thao tác chỉ tính toán lại, không sửa
              dữ liệu bán hàng hay tồn kho của cửa hàng, và được ghi vào nhật ký kiểm toán.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <label className="sr-only" htmlFor="ops-store">Cửa hàng</label>
              <select id="ops-store" value={storeId} onChange={(e) => setStoreId(e.target.value)} className={`${ui.select} sm:max-w-sm`} disabled={stores.loading}>
                <option value="">{stores.loading ? 'Đang tải danh sách cửa hàng…' : 'Chọn cửa hàng đang hoạt động'}</option>
                {(stores.data || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
              <button type="button" className={ui.btnPrimary} disabled={!storeId} onClick={() => setConfirming(true)}>
                <PlayCircle className="w-4 h-4" /> Tính lại ngay
              </button>
            </div>
            {lastResult && (
              <p className="mt-4 flex items-center gap-2 text-[13px] text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                {lastResult.storeName}: {formatNumber(lastResult.successCount)} SKU thành công, {formatNumber(lastResult.failureCount)} lỗi,
                {' '}mất {formatDuration(lastResult.durationMs)}.
                {lastResult.remaining > 0 && ` Còn ${formatNumber(lastResult.remaining)} SKU — bấm tính lại lần nữa để xử lý tiếp.`}
              </p>
            )}
          </Section>
        </div>
      </div>

      {confirming && selectedStore && (
        <ConfirmDialog
          title={`Tính lại Decision Engine cho "${selectedStore.name}"?`}
          description="Hệ thống tính lại cảnh báo tồn kho và đề xuất giá của cửa hàng này. Có thể mất vài chục giây với cửa hàng nhiều sản phẩm."
          confirmLabel="Tính lại"
          onConfirm={runForStore}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
