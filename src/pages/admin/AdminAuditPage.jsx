import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  ChevronDown,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Monitor,
  Globe,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import {
  apiListAdminAuditLogs,
  apiExportAdminAuditLogs,
  apiListAdminStores,
  formatVNDateTime,
  toVnStartOfDayISO,
  toVnEndOfDayISO,
} from '../../services/adminService';
import {
  ACTION_LABELS_VI,
  ENTITY_LABELS_VI,
  actionLabel,
  apiErrorMessage,
  entityLabel,
  formatRelativeTime,
  isSensitiveAction,
  roleLabel,
} from './adminLabels';
import { adminStyles as ui } from './adminStyles';
import { segmentedButton, segmentedWrapper } from './ops/opsShared';
import {
  PageHeader,
  Toolbar,
  SearchInput,
  FilterSelect,
  FilterChips,
  TableCard,
  Th,
  Td,
  TableBody,
  EmptyState,
  Pagination,
  Badge,
  Avatar,
  useDebounced,
} from './components/AdminUI';
import { useAdminText } from './useAdminText';

/** Tùy chọn bộ lọc dựng theo ngôn ngữ hiện tại (nhãn hành động/phân hệ lấy từ adminLabels). */
function buildFilterOptions(t, isEn) {
  return {
    entity: [
      { value: '', label: t('Mọi phân hệ', 'All modules') },
      ...Object.keys(ENTITY_LABELS_VI).map((value) => ({ value, label: entityLabel(value) })),
    ],
    action: [
      { value: '', label: t('Mọi hành động', 'All actions') },
      ...Object.keys(ACTION_LABELS_VI)
        .filter((code) => code !== 'LOGIN')
        .map((value) => ({ value, label: actionLabel(value) }))
        .sort((a, b) => a.label.localeCompare(b.label, isEn ? 'en' : 'vi')),
    ],
    actor: [
      { value: '', label: t('Mọi người thực hiện', 'All actors') },
      { value: 'ADMIN', label: t('Quản trị viên', 'Administrator') },
      { value: 'SHOP_OWNER', label: t('Chủ cửa hàng', 'Store owner') },
      { value: 'WAREHOUSE_STAFF', label: t('Nhân viên kho', 'Warehouse staff') },
      { value: 'SYSTEM', label: t('Tác vụ tự động', 'Automated task') },
    ],
    presets: [
      { id: 'today', label: t('Hôm nay', 'Today'), days: 0 },
      { id: '7d', label: t('7 ngày qua', 'Last 7 days'), days: 6 },
      { id: '30d', label: t('30 ngày qua', 'Last 30 days'), days: 29 },
      { id: '90d', label: t('90 ngày qua', 'Last 90 days'), days: 89 },
    ],
  };
}

function localYMD(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function safeParseJSON(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function formatDiffValue(val) {
  if (val === undefined || val === null) return '–';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function AuditDiffViewer({ log }) {
  const { t } = useAdminText();
  const { toast } = useToast();
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const beforeObj = safeParseJSON(log.beforeJson);
  const afterObj = safeParseJSON(log.afterJson);

  const diffRows = useMemo(() => {
    if (!beforeObj && !afterObj) return [];
    if (typeof beforeObj !== 'object' || typeof afterObj !== 'object') {
      return [{ key: 'payload', before: beforeObj, after: afterObj, changed: beforeObj !== afterObj }];
    }
    const allKeys = Array.from(new Set([...Object.keys(beforeObj || {}), ...Object.keys(afterObj || {})]));
    return allKeys.map((key) => {
      const b = beforeObj?.[key];
      const a = afterObj?.[key];
      return { key, before: b, after: a, changed: JSON.stringify(b) !== JSON.stringify(a) };
    });
  }, [beforeObj, afterObj]);

  const copyJSON = () => {
    const rawData = JSON.stringify({ before: beforeObj, after: afterObj }, null, 2);
    navigator.clipboard.writeText(rawData);
    setCopied(true);
    toast({ type: 'success', title: t('Đã sao chép dữ liệu JSON vào Clipboard', 'JSON copied to clipboard') });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 bg-slate-50 border-t border-slate-200 text-[13px] space-y-4">
      {/* Thông số kỹ thuật của bản ghi */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200 ">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t('Mã hành động', 'Action code')}</span>
          <span className="font-mono text-[12px] font-semibold text-slate-900 break-all">{log.action}</span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t('Đối tượng tác động', 'Target')}</span>
          <span className="text-[13px] font-semibold text-slate-900">
            {entityLabel(log.entityType)} {log.entityId ? `#${log.entityId}` : ''}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t('Địa chỉ IP', 'IP address')}</span>
          <span className="font-mono text-[12px] text-blue-600 font-medium flex items-center gap-1">
            <Globe className="w-3 h-3" aria-hidden="true" /> {log.ipAddress || '–'}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t('Thời điểm thực hiện', 'Performed at')}</span>
          <span className="text-[12px] text-slate-900 font-medium">{formatVNDateTime(log.createdAt)}</span>
        </div>
        {log.userAgent && (
          <div className="sm:col-span-4 pt-2 border-t border-slate-100 flex items-center gap-2 text-[12px] text-slate-500">
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {t('Thiết bị: ', 'Device: ')}
              {log.userAgent}
            </span>
          </div>
        )}
      </div>

      {/* Tiêu đề vùng so sánh */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{t('Dữ liệu thay đổi', 'Changed data')}</span>
          {diffRows.length > 0 && (
            <Badge tone="info" dot={false}>
              {t(
                `${diffRows.filter((r) => r.changed).length} trường đã đổi / ${diffRows.length} tổng`,
                `${diffRows.filter((r) => r.changed).length} changed / ${diffRows.length} fields`
              )}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {diffRows.length > 0 && (
            <button
              type="button"
              onClick={copyJSON}
              className="inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              {copied ? t('Đã sao chép', 'Copied') : t('Sao chép JSON', 'Copy JSON')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="text-[12px] text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            {showRaw ? t('Xem dạng bảng so sánh', 'Show comparison table') : t('Xem JSON thô', 'Show raw JSON')}
          </button>
        </div>
      </div>

      {diffRows.length === 0 ? (
        <p className="text-[13px] text-slate-500 p-4 bg-white rounded-lg border border-slate-200 italic">
          {t('Bản ghi này không yêu cầu lưu trữ dữ liệu trạng thái trước/sau (thao tác không làm thay đổi model).', 'This entry has no before/after data (the action did not change a record).')}
        </p>
      ) : showRaw ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[12px]">
          {[
            [t('Dữ liệu trước', 'Before'), beforeObj],
            [t('Dữ liệu sau', 'After'), afterObj],
          ].map(([label, obj]) => (
            <div key={label} className="p-3.5 bg-white border border-slate-200 rounded-xl overflow-x-auto ">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                {label}
              </span>
              <pre className="text-slate-700 leading-relaxed">{JSON.stringify(obj, null, 2) || '–'}</pre>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden ">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="px-4 py-2.5 font-semibold text-[12px] w-1/4">{t('Thuộc tính', 'Field')}</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] w-3/8">{t('Trước', 'Before')}</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] w-3/8">{t('Sau', 'After')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {diffRows.map((row) => (
                <tr key={row.key} className={row.changed ? 'bg-amber-50/50' : ''}>
                  <td className="px-4 py-2.5 font-mono text-[12px] font-semibold text-slate-900">{row.key}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-slate-500 break-all">
                    {formatDiffValue(row.before)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-slate-900 break-all font-medium">
                    {formatDiffValue(row.after)}
                    {row.changed && (
                      <span className="ml-2 font-sans text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">
                        {t('đã sửa', 'changed')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminAuditPage() {
  const { t, isEn } = useAdminText();
  const { entity: ENTITY_OPTIONS, action: ACTION_OPTIONS, actor: ACTOR_OPTIONS, presets: DATE_PRESETS } = useMemo(
    () => buildFilterOptions(t, isEn),
    [t, isEn]
  );
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const entityType = params.get('entity') || '';
  const action = params.get('action') || '';
  const storeId = params.get('store') || '';
  const actorRole = params.get('actor') || '';
  const userId = params.get('user') || '';
  const fromDate = params.get('from') || '';
  const toDate = params.get('to') || '';
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 50;

  const [search, setSearch] = useState(params.get('q') || '');
  const debouncedSearch = useDebounced(search);

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [storeOptions, setStoreOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [userName, setUserName] = useState('');

  const updateParams = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if ((params.get('q') || '') !== debouncedSearch) updateParams({ q: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    apiListAdminStores({ limit: 100 })
      .then((res) => setStoreOptions(res.data || []))
      .catch(() => setStoreOptions([]));
  }, []);

  const rangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const filters = useMemo(
    () => ({
      search: params.get('q') || '',
      entityType,
      action,
      storeId,
      actorRole,
      userId,
      from: toVnStartOfDayISO(fromDate),
      to: toVnEndOfDayISO(toDate),
    }),
    [params, entityType, action, storeId, actorRole, userId, fromDate, toDate]
  );

  const load = useCallback(async () => {
    if (rangeInvalid) {
      setError(t('Khoảng thời gian không hợp lệ: Ngày bắt đầu phải trước ngày kết thúc.', 'Invalid range: the start date must be before the end date.'));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await apiListAdminAuditLogs({ page, limit, ...filters });
      setLogs(res.data);
      setPagination(res.pagination);
      if (userId) {
        const actor = res.data.find((l) => String(l.user?.id ?? l.userId) === userId)?.user;
        if (actor) setUserName(actor.fullName);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filters, rangeInvalid, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (days) => {
    const today = new Date();
    updateParams({ from: localYMD(new Date(today.getTime() - days * 86400000)), to: localYMD(today) });
  };

  const activePreset = DATE_PRESETS.find(
    (p) => toDate === localYMD(new Date()) && fromDate === localYMD(new Date(Date.now() - p.days * 86400000))
  );

  const handleExport = async () => {
    if (rangeInvalid) return;
    setIsExporting(true);
    try {
      await apiExportAdminAuditLogs(filters);
      toast({
        type: 'success',
        title: t('Đã xuất file kiểm toán CSV', 'Audit CSV exported'),
        description: t('Tệp CSV gồm tối đa 5.000 sự kiện mới nhất khớp bộ lọc đã được tải xuống.', 'A CSV with up to the 5,000 latest matching events was downloaded.'),
      });
    } catch (err) {
      toast({ type: 'error', title: t('Không xuất được file CSV', 'Could not export CSV'), description: apiErrorMessage(err) });
    } finally {
      setIsExporting(false);
    }
  };

  const chips = [
    userId && {
      key: 'user',
      label: t('Người thực hiện: ', 'Actor: ') + (userName || `#${userId}`),
      onRemove: () => updateParams({ user: '' }),
    },
    actorRole && {
      key: 'actor',
      label: ACTOR_OPTIONS.find((o) => o.value === actorRole)?.label,
      onRemove: () => updateParams({ actor: '' }),
    },
    action && { key: 'action', label: actionLabel(action), onRemove: () => updateParams({ action: '' }) },
    entityType && { key: 'entity', label: entityLabel(entityType), onRemove: () => updateParams({ entity: '' }) },
    storeId && {
      key: 'store',
      label: storeOptions.find((s) => String(s.id) === storeId)?.name || t('Cửa hàng', 'Store'),
      onRemove: () => updateParams({ store: '' }),
    },
    (fromDate || toDate) && {
      key: 'date',
      label: `${fromDate ? fromDate.split('-').reverse().join('/') : '…'} – ${
        toDate ? toDate.split('-').reverse().join('/') : '…'
      }`,
      onRemove: () => updateParams({ from: '', to: '' }),
    },
  ].filter(Boolean);

  const clearFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title={t('Nhật ký kiểm toán', 'Audit log')}
        description={t('Lưu vết bất biến (Immutable Audit Trail) toàn bộ sự kiện hệ thống: ai làm, lúc nào, địa chỉ IP và dữ liệu trước/sau.', 'An immutable trail of every system event: who, when, from which IP, and the data before/after.')}
        badge={
          <Badge tone="neutral" dot={false}>
            {t(`${pagination?.total ?? 0} sự kiện`, `${pagination?.total ?? 0} events`)}
          </Badge>
        }
        actions={
          <>
            <button type="button" onClick={load} disabled={isLoading} className={ui.btnSecondary}>
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('Làm mới', 'Refresh')}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || rangeInvalid}
              className={ui.btnPrimary}
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {isExporting ? t('Đang xuất CSV…', 'Exporting CSV…') : t('Xuất CSV', 'Export CSV')}
            </button>
          </>
        }
      />

      {/* Compliance / Security Info Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 bg-white text-[13px] text-slate-600">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
        <span className="leading-relaxed">
          {t(
            'Nhật ký chỉ đọc: không ai, kể cả quản trị viên, có thể sửa hoặc xóa bản ghi. Mỗi lượt xuất CSV cũng được ghi lại.',
            'Read-only log: nobody, administrators included, can edit or delete entries. Every CSV export is also recorded.'
          )}
        </span>
      </div>

      {/* Bộ lọc đa tầng */}
      <div className="space-y-3">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Tìm theo email, họ tên, mã đối tượng, địa chỉ IP…', 'Search by email, name, target ID, IP…')}
            className="w-full lg:w-80"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label={t('Người thực hiện', 'Actor')} value={actorRole} onChange={(v) => updateParams({ actor: v })} options={ACTOR_OPTIONS} />
            <FilterSelect label={t('Hành động', 'Action')} value={action} onChange={(v) => updateParams({ action: v })} options={ACTION_OPTIONS} className="max-w-55" />
            <FilterSelect label={t('Phân hệ', 'Module')} value={entityType} onChange={(v) => updateParams({ entity: v })} options={ENTITY_OPTIONS} />
            <FilterSelect
              label={t('Cửa hàng', 'Store')}
              value={storeId}
              onChange={(v) => updateParams({ store: v })}
              options={[{ value: '', label: t('Mọi cửa hàng', 'All stores') }, ...storeOptions.map((s) => ({ value: String(s.id), label: s.name }))]}
              className="max-w-50"
            />
          </div>
        </Toolbar>

        {/* Thanh chọn thời gian */}
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
            {t('Khoảng thời gian:', 'Date range:')}
          </span>
          <div className={segmentedWrapper} role="group" aria-label={t('Khoảng thời gian', 'Date range')}>
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.days)}
                aria-pressed={activePreset?.id === p.id}
                className={segmentedButton(activePreset?.id === p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => updateParams({ from: e.target.value })}
              aria-label={t('Từ ngày', 'From date')}
              className={`${ui.input} h-8 w-auto tabular-nums cursor-pointer`}
            />
            <span className="text-slate-400">{t('đến', 'to')}</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => updateParams({ to: e.target.value })}
              aria-label={t('Đến ngày', 'To date')}
              className={`${ui.input} h-8 w-auto tabular-nums cursor-pointer`}
            />
          </div>
        </div>

        <FilterChips chips={chips} onClearAll={clearFilters} />
      </div>

      {/* Bảng Nhật ký kiểm toán */}
      <TableCard
        footer={
          !error &&
          pagination?.total > 0 && (
            <Pagination
              pagination={pagination}
              onPage={(p) => updateParams({ page: String(p) }, false)}
              onLimitChange={(l) => updateParams({ limit: String(l) }, true)}
              disabled={isLoading}
              unit={t('sự kiện', 'events')}
            />
          )
        }
      >
        <table className={`${ui.table} min-w-230`}>
          <thead>
            <tr>
              <Th>{t('Thời gian', 'Time')}</Th>
              <Th>{t('Người thực hiện', 'Actor')}</Th>
              <Th>{t('Hành động', 'Action')}</Th>
              <Th>{t('Phân hệ tác động', 'Module')}</Th>
              <Th>{t('Cửa hàng', 'Store')}</Th>
              <Th>{t('Địa chỉ IP', 'IP address')}</Th>
              <th className="w-12 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <span className="sr-only">{t('Chi tiết', 'Details')}</span>
              </th>
            </tr>
          </thead>
          <TableBody
            loading={isLoading}
            error={error}
            onRetry={load}
            columns={7}
            empty={
              logs.length === 0 && (
                <EmptyState
                  title={t('Không có sự kiện kiểm toán phù hợp', 'No matching audit events')}
                  description={t('Hãy thử mở rộng khoảng thời gian hoặc bỏ bớt các bộ lọc hiện tại.', 'Try a wider date range or remove some filters.')}
                  action={
                    chips.length || search ? (
                      <button type="button" onClick={clearFilters} className={ui.btnSecondary}>
                        {t('Xóa bộ lọc', 'Clear filters')}
                      </button>
                    ) : null
                  }
                />
              )
            }
          >
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const sensitive = isSensitiveAction(log.action);

              return (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedLogId(isExpanded ? null : log.id);
                      }
                    }}
                    tabIndex={0}
                    className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-slate-50 ${
                      isExpanded ? 'bg-slate-50 border-b-transparent' : 'hover:bg-slate-50'
                    }`}
                    aria-expanded={isExpanded}
                  >
                    <Td className="whitespace-nowrap">
                      <p className="font-semibold text-slate-900" title={formatVNDateTime(log.createdAt)}>
                        {formatRelativeTime(log.createdAt) || formatVNDateTime(log.createdAt)}
                      </p>
                      <p className="text-[12px] text-slate-500 tabular-nums mt-0.5">{formatVNDateTime(log.createdAt)}</p>
                    </Td>
                    <Td>
                      {log.user ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserName(log.user.fullName);
                            updateParams({ user: String(log.user.id) });
                          }}
                          className="flex items-center gap-2.5 text-left cursor-pointer group"
                          title={t('Lọc chỉ xem người này', 'Show only this person')}
                        >
                          <Avatar
                            name={log.user.fullName}
                            size={32}
                            tone={log.user.role === 'ADMIN' ? 'brand' : 'neutral'}
                          />
                          <span className="min-w-0">
                            <span className="block font-semibold text-slate-900 group-hover:underline truncate max-w-45">
                              {log.user.fullName}
                            </span>
                            <span className="block text-[12px] text-slate-500">{roleLabel(log.user.role)}</span>
                          </span>
                        </button>
                      ) : (
                        <span className="text-[13px] text-slate-500 font-medium">{t('Tác vụ tự động', 'Automated task')}</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Badge tone={sensitive ? 'danger' : 'neutral'} dot={sensitive}>
                        {actionLabel(log.action)}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{entityLabel(log.entityType)}</span>
                      {log.entityId && (
                        <span className="text-[12px] text-slate-500 font-mono ml-1.5" title={log.entityId}>
                          #{log.entityId.length > 10 ? `${log.entityId.slice(0, 8)}…` : log.entityId}
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap font-medium text-slate-700">
                      {log.store?.name || <span className="text-slate-400">{t('Quản trị Nền tảng', 'Platform admin')}</span>}
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[12px] text-slate-600">{log.ipAddress || '–'}</Td>
                    <Td align="right">
                      <span
                        className={`inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-transform ${
                          isExpanded ? 'rotate-180 text-slate-900' : ''
                        }`}
                        aria-hidden="true"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </Td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <AuditDiffViewer log={log} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </table>
      </TableCard>
    </div>
  );
}

export default AdminAuditPage;
