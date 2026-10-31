import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Calendar,
  AlertTriangle,
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
  ACTION_LABELS,
  ENTITY_LABELS,
  actionLabel,
  apiErrorMessage,
  entityLabel,
  formatRelativeTime,
  isSensitiveAction,
  roleLabel,
} from './adminLabels';
import { adminStyles as ui } from './adminStyles';
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

const ENTITY_OPTIONS = [
  { value: '', label: 'Mọi phân hệ' },
  ...Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label })),
];

const ACTION_OPTIONS = [
  { value: '', label: 'Mọi hành động' },
  ...Object.entries(ACTION_LABELS)
    .filter(([code]) => code !== 'LOGIN')
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'vi')),
];

const ACTOR_OPTIONS = [
  { value: '', label: 'Mọi người thực hiện' },
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'SHOP_OWNER', label: 'Chủ cửa hàng' },
  { value: 'WAREHOUSE_STAFF', label: 'Nhân viên kho' },
  { value: 'SYSTEM', label: 'Tác vụ tự động' },
];

const DATE_PRESETS = [
  { id: 'today', label: 'Hôm nay', days: 0 },
  { id: '7d', label: '7 ngày qua', days: 6 },
  { id: '30d', label: '30 ngày qua', days: 29 },
  { id: '90d', label: 'Quý này', days: 89 },
];

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
  if (val === undefined || val === null) return '—';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function AuditDiffViewer({ log }) {
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
    toast({ type: 'success', title: 'Đã sao chép dữ liệu JSON vào Clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 bg-slate-50/70 border-t border-[#E2E8F0] text-[13px] space-y-4">
      {/* Thông số kỹ thuật của bản ghi */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs">
        <div>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Mã hành động</span>
          <span className="font-mono text-[12px] font-semibold text-[#0F172A] break-all">{log.action}</span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Đối tượng tác động</span>
          <span className="text-[13px] font-semibold text-[#0F172A]">
            {entityLabel(log.entityType)} {log.entityId ? `#${log.entityId}` : ''}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Địa chỉ IP</span>
          <span className="font-mono text-[12px] text-[#2563EB] font-medium flex items-center gap-1">
            <Globe className="w-3 h-3" /> {log.ipAddress || '—'}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Thời điểm thực hiện</span>
          <span className="text-[12px] text-[#0F172A] font-medium">{formatVNDateTime(log.createdAt)}</span>
        </div>
        {log.userAgent && (
          <div className="sm:col-span-4 pt-2 border-t border-slate-100 flex items-center gap-2 text-[12px] text-[#64748B]">
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Thiết bị: {log.userAgent}</span>
          </div>
        )}
      </div>

      {/* Tiêu đề vùng so sánh */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#0F172A]">Dữ liệu thay đổi</span>
          {diffRows.length > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
              {diffRows.filter((r) => r.changed).length} trường đã đổi / {diffRows.length} tổng
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {diffRows.length > 0 && (
            <button
              type="button"
              onClick={copyJSON}
              className="inline-flex items-center gap-1 text-[12px] text-[#64748B] hover:text-[#0F172A] font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã sao chép' : 'Sao chép JSON'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="text-[12px] text-[#2563EB] hover:underline font-semibold cursor-pointer"
          >
            {showRaw ? 'Xem dạng bảng so sánh' : 'Xem JSON thô'}
          </button>
        </div>
      </div>

      {diffRows.length === 0 ? (
        <p className="text-[13px] text-[#64748B] p-4 bg-white rounded-lg border border-[#E2E8F0] italic">
          Bản ghi này không yêu cầu lưu trữ dữ liệu trạng thái trước/sau (thao tác không làm thay đổi model).
        </p>
      ) : showRaw ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[12px]">
          {[['Dữ liệu trước (Before)', beforeObj], ['Dữ liệu sau (After)', afterObj]].map(([label, obj]) => (
            <div key={label} className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl overflow-x-auto shadow-2xs">
              <span className="text-[11px] font-sans font-bold text-[#64748B] uppercase tracking-wider block mb-2">
                {label}
              </span>
              <pre className="text-[#334155] leading-relaxed">{JSON.stringify(obj, null, 2) || '—'}</pre>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#475569]">
                <th className="px-4 py-2.5 font-semibold text-[12px] w-1/4">Thuộc tính</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] w-3/8">Trước</th>
                <th className="px-4 py-2.5 font-semibold text-[12px] w-3/8">Sau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {diffRows.map((row) => (
                <tr key={row.key} className={row.changed ? 'bg-amber-50/30' : ''}>
                  <td className="px-4 py-2.5 font-mono text-[12px] font-semibold text-[#0F172A]">{row.key}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[#64748B] break-all">
                    {formatDiffValue(row.before)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[#0F172A] break-all font-medium">
                    {formatDiffValue(row.after)}
                    {row.changed && (
                      <span className="ml-2 font-sans text-[11px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">
                        đã sửa
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
      setError('Khoảng thời gian không hợp lệ: Ngày bắt đầu phải trước ngày kết thúc.');
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
        title: 'Đã xuất file kiểm toán CSV',
        description: 'Tệp CSV gồm tối đa 5.000 sự kiện mới nhất khớp bộ lọc đã được tải xuống.',
      });
    } catch (err) {
      toast({ type: 'error', title: 'Không xuất được file CSV', description: apiErrorMessage(err) });
    } finally {
      setIsExporting(false);
    }
  };

  const chips = [
    userId && {
      key: 'user',
      label: `Người thực hiện: ${userName || `#${userId}`}`,
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
      label: storeOptions.find((s) => String(s.id) === storeId)?.name || 'Cửa hàng',
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
        title="Nhật ký kiểm toán"
        description="Lưu vết bất biến (Immutable Audit Trail) toàn bộ sự kiện hệ thống: ai làm, lúc nào, địa chỉ IP và dữ liệu trước/sau."
        badge={<Badge tone="neutral">{pagination?.total ?? 0} sự kiện</Badge>}
        actions={
          <>
            <button type="button" onClick={load} disabled={isLoading} className={ui.btnSecondary}>
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || rangeInvalid}
              className={ui.btnPrimary}
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Đang xuất CSV…' : 'Xuất CSV'}
            </button>
          </>
        }
      />

      {/* Compliance / Security Info Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/40 text-[13px] text-blue-900 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0" />
        <span className="leading-relaxed">
          <strong className="text-[#1D4ED8]">Tiêu chuẩn bảo mật SOC2 / ISO:</strong> Nhật ký kiểm toán là tài nguyên chỉ đọc.
          Không bất kỳ ai (kể cả Quản trị viên cấp cao nhất) có quyền sửa đổi hoặc xóa bản ghi. Mỗi lượt xuất CSV đều được lưu lại.
        </span>
      </div>

      {/* Bộ lọc đa tầng */}
      <div className="space-y-3">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo email, họ tên, mã đối tượng, địa chỉ IP…"
            className="w-full lg:w-80"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect label="Người thực hiện" value={actorRole} onChange={(v) => updateParams({ actor: v })} options={ACTOR_OPTIONS} />
            <FilterSelect label="Hành động" value={action} onChange={(v) => updateParams({ action: v })} options={ACTION_OPTIONS} className="max-w-55" />
            <FilterSelect label="Phân hệ" value={entityType} onChange={(v) => updateParams({ entity: v })} options={ENTITY_OPTIONS} />
            <FilterSelect
              label="Cửa hàng"
              value={storeId}
              onChange={(v) => updateParams({ store: v })}
              options={[{ value: '', label: 'Mọi cửa hàng' }, ...storeOptions.map((s) => ({ value: String(s.id), label: s.name }))]}
              className="max-w-50"
            />
          </div>
        </Toolbar>

        {/* Thanh chọn thời gian */}
        <div className="flex flex-wrap items-center gap-3 text-[13px] p-3 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
          <span className="font-semibold text-[#334155] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            Khoảng thời gian:
          </span>
          <div className="inline-flex rounded-lg border border-[#CBD5E1] bg-white overflow-hidden divide-x divide-slate-200 shadow-2xs">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.days)}
                aria-pressed={activePreset?.id === p.id}
                className={`px-3 py-1.5 cursor-pointer font-medium text-[12px] transition-colors ${
                  activePreset?.id === p.id ? 'bg-[#EFF4FF] text-[#2563EB]' : 'text-[#475569] hover:bg-slate-50'
                }`}
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
              className="h-8.5 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] text-[12px] cursor-pointer"
            />
            <span className="text-[#94A3B8]">đến</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => updateParams({ to: e.target.value })}
              className="h-8.5 px-2.5 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] text-[12px] cursor-pointer"
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
              unit="sự kiện"
            />
          )
        }
      >
        <table className="w-full min-w-230">
          <thead>
            <tr>
              <Th>Thời gian</Th>
              <Th>Người thực hiện</Th>
              <Th>Hành động</Th>
              <Th>Phân hệ tác động</Th>
              <Th>Cửa hàng</Th>
              <Th>Địa chỉ IP</Th>
              <th className="w-12 px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <span className="sr-only">Chi tiết</span>
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
                  title="Không có sự kiện kiểm toán phù hợp"
                  description="Hãy thử mở rộng khoảng thời gian hoặc bỏ bớt các bộ lọc hiện tại."
                  action={
                    chips.length || search ? (
                      <button type="button" onClick={clearFilters} className={ui.btnSecondary}>
                        Xóa bộ lọc
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
                    className={`cursor-pointer transition-colors ${
                      isExpanded ? 'bg-blue-50/40 border-b-transparent' : 'hover:bg-slate-50/80'
                    }`}
                    aria-expanded={isExpanded}
                  >
                    <Td className="whitespace-nowrap">
                      <p className="font-semibold text-[#0F172A]" title={formatVNDateTime(log.createdAt)}>
                        {formatRelativeTime(log.createdAt) || formatVNDateTime(log.createdAt)}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{formatVNDateTime(log.createdAt)}</p>
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
                          title="Lọc chỉ xem người này"
                        >
                          <Avatar
                            name={log.user.fullName}
                            size={32}
                            tone={log.user.role === 'ADMIN' ? 'brand' : 'neutral'}
                          />
                          <span className="min-w-0">
                            <span className="block font-semibold text-[#0F172A] group-hover:underline truncate max-w-45">
                              {log.user.fullName}
                            </span>
                            <span className="block text-[11px] text-[#64748B]">{roleLabel(log.user.role)}</span>
                          </span>
                        </button>
                      ) : (
                        <span className="text-[13px] text-[#64748B] font-medium">Tác vụ tự động</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${
                          sensitive
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {actionLabel(log.action)}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="font-semibold text-[#0F172A]">{entityLabel(log.entityType)}</span>
                      {log.entityId && (
                        <span className="text-[12px] text-[#64748B] font-mono ml-1.5" title={log.entityId}>
                          #{log.entityId.length > 10 ? `${log.entityId.slice(0, 8)}…` : log.entityId}
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap font-medium text-[#334155]">
                      {log.store?.name || <span className="text-[#94A3B8]">Quản trị Nền tảng</span>}
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[12px] text-[#475569]">{log.ipAddress || '—'}</Td>
                    <Td align="right">
                      <span
                        className={`inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-transform ${
                          isExpanded ? 'rotate-180 text-[#2563EB]' : ''
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
