import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, Search, Download, RefreshCw, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Copy, Check, Filter,
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
import { actionLabel, entityLabel, formatRelativeTime, isSensitiveAction, roleLabel } from './adminLabels';
import { adminStyles } from './adminStyles';

const ENTITY_OPTIONS = [
  { value: '', label: 'Tất cả phân hệ' },
  { value: 'USER', label: 'Tài khoản' },
  { value: 'AUTH', label: 'Đăng nhập' },
  { value: 'STORE', label: 'Cửa hàng' },
  { value: 'ORDER', label: 'Đơn hàng' },
  { value: 'PRODUCT', label: 'Sản phẩm' },
  { value: 'CATEGORY', label: 'Danh mục' },
  { value: 'INVENTORY', label: 'Kho & Sổ cái' },
  { value: 'STOCK_TAKE', label: 'Kiểm kê' },
  { value: 'PRICING', label: 'Giá bán & Đề xuất' },
  { value: 'ALERT', label: 'Cảnh báo rủi ro' },
  { value: 'CONTACT_LEAD', label: 'Khách tiềm năng' },
  { value: 'AUDIT_LOG', label: 'Nhật ký kiểm toán' },
];

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
  const [showRaw, setShowRaw] = useState(false);
  const beforeObj = safeParseJSON(log.beforeJson);
  const afterObj = safeParseJSON(log.afterJson);

  // Extract keys to compare
  const diffRows = useMemo(() => {
    if (!beforeObj && !afterObj) return [];
    if (typeof beforeObj !== 'object' || typeof afterObj !== 'object') {
      return [{ key: 'payload', before: beforeObj, after: afterObj, changed: beforeObj !== afterObj }];
    }
    const allKeys = Array.from(new Set([...Object.keys(beforeObj || {}), ...Object.keys(afterObj || {})]));
    return allKeys.map((key) => {
      const b = beforeObj?.[key];
      const a = afterObj?.[key];
      const changed = JSON.stringify(b) !== JSON.stringify(a);
      return { key, before: b, after: a, changed };
    });
  }, [beforeObj, afterObj]);

  return (
    <div className="p-4 bg-[#F8FAFC] border-t border-[#E5E7EB] text-[13px] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#334155]">
          Chi tiết thay đổi dữ liệu {diffRows.length > 0 && `(${diffRows.length} trường)`}
        </span>
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="text-[12px] text-[#3B82F6] hover:text-[#2563EB] cursor-pointer"
        >
          {showRaw ? 'Xem bảng so sánh' : 'Xem JSON gốc'}
        </button>
      </div>

      {showRaw ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
          <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
            <span className="text-[11px] font-medium text-[#64748B] block mb-1">Dữ liệu trước (Before)</span>
            <pre className="text-[#475569]">{JSON.stringify(beforeObj, null, 2) || '—'}</pre>
          </div>
          <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto">
            <span className="text-[11px] font-medium text-[#64748B] block mb-1">Dữ liệu sau (After)</span>
            <pre className="text-[#475569]">{JSON.stringify(afterObj, null, 2) || '—'}</pre>
          </div>
        </div>
      ) : diffRows.length === 0 ? (
        <p className="text-[12px] text-[#64748B] italic">Không có payload so sánh cho sự kiện này.</p>
      ) : (
        <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E5E7EB] text-[#64748B]">
                <th className="px-3.5 py-2 font-medium w-1/4">Trường</th>
                <th className="px-3.5 py-2 font-medium w-3/8">Trước</th>
                <th className="px-3.5 py-2 font-medium w-3/8">Sau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {diffRows.map((row) => (
                <tr
                  key={row.key}
                  className={row.changed ? 'bg-amber-50/60 font-medium text-[#334155]' : 'text-[#475569]'}
                >
                  <td className="px-3.5 py-2 font-mono text-[11px] text-[#334155]">{row.key}</td>
                  <td className="px-3.5 py-2 font-mono text-[11px] text-[#64748B] break-all">
                    {formatDiffValue(row.before)}
                  </td>
                  <td className="px-3.5 py-2 font-mono text-[11px] break-all">
                    {formatDiffValue(row.after)}
                    {row.changed && (
                      <span className="ml-2 text-[10px] text-[#D97706] font-sans font-normal">(đã đổi)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Meta thông tin phụ */}
      <div className="text-[11px] text-[#94A3B8] font-mono flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
        <span>Mã gốc: {log.action}</span>
        <span>IP: {log.ipAddress || '—'}</span>
        {log.userAgent && <span className="truncate max-w-md">User-Agent: {log.userAgent}</span>}
      </div>
    </div>
  );
}

export function AdminAuditPage() {
  const { toast } = useToast();

  // Filters State
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [storeOptions, setStoreOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Expand row state
  const [expandedLogId, setExpandedLogId] = useState(null);

  // 1. Fetch store list for filter dropdown
  useEffect(() => {
    apiListAdminStores({ limit: 100 })
      .then((res) => setStoreOptions(res.data || []))
      .catch((err) => console.warn('Không thể tải danh sách cửa hàng:', err));
  }, []);

  // 2. Fetch audit logs from backend
  const fetchLogs = useCallback(async (page = 1) => {
    if (fromDate && toDate && fromDate > toDate) {
      toast({
        type: 'warning',
        title: 'Khoảng ngày không hợp lệ',
        description: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiListAdminAuditLogs({
        page,
        limit: 50,
        search: searchQuery.trim(),
        entityType: selectedEntity,
        storeId: selectedStoreId,
        from: toVnStartOfDayISO(fromDate),
        to: toVnEndOfDayISO(toDate),
      });

      let items = res.data;
      if (actorRole) {
        items = items.filter((l) => {
          if (actorRole === 'SYSTEM') return !l.user;
          return l.user?.role === actorRole;
        });
      }

      setLogs(items);
      setPagination(res.pagination);
    } catch (err) {
      toast({
        type: 'error',
        title: 'Lỗi tải nhật ký kiểm toán',
        description: err?.response?.data?.error?.message || err.message || 'Không thể tải nhật ký.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedEntity, selectedStoreId, actorRole, fromDate, toDate, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Fast date preset helpers
  const applyDatePreset = (preset) => {
    const today = new Date();
    const formatYMD = (d) => d.toISOString().slice(0, 10);

    if (preset === 'today') {
      const t = formatYMD(today);
      setFromDate(t);
      setToDate(t);
    } else if (preset === '7days') {
      const past = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setFromDate(formatYMD(past));
      setToDate(formatYMD(today));
    } else if (preset === '30days') {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(formatYMD(past));
      setToDate(formatYMD(today));
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  // Export CSV Handler
  const handleExportCSV = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast({
        type: 'warning',
        title: 'Khoảng ngày không hợp lệ',
        description: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.',
      });
      return;
    }

    setIsExporting(true);
    try {
      await apiExportAdminAuditLogs({
        search: searchQuery.trim(),
        entityType: selectedEntity,
        storeId: selectedStoreId,
        from: toVnStartOfDayISO(fromDate),
        to: toVnEndOfDayISO(toDate),
      });
      toast({
        type: 'success',
        title: 'Xuất CSV thành công',
        description: 'Tệp nhật ký kiểm toán đã được tải xuống máy của bạn (UTF-8 BOM).',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Xuất dữ liệu thất bại',
        description: err?.response?.data?.error?.message || err.message || 'Không thể xuất tệp CSV.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className={adminStyles.pageContainer}>
      {/* ─── Header ─── */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Nhật ký kiểm toán</h1>
          <p className={adminStyles.pageDesc}>
            Theo dõi và đối soát toàn bộ thao tác, thay đổi dữ liệu và sự kiện an ninh trên hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLogs(pagination.page)}
            disabled={isLoading}
            className={adminStyles.btnSecondary}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className={adminStyles.btnSecondary}
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất CSV'}</span>
          </button>
        </div>
      </div>

      {/* ─── Bộ lọc phẳng ─── */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative sm:col-span-4">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm hành động, IP, email, tên..."
              className={`${adminStyles.input} pl-9`}
            />
          </div>

          {/* Phân hệ */}
          <div className="sm:col-span-3">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className={adminStyles.select}
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cửa hàng */}
          <div className="sm:col-span-3">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className={adminStyles.select}
            >
              <option value="">Tất cả cửa hàng</option>
              {storeOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tác nhân */}
          <div className="sm:col-span-2">
            <select
              value={actorRole}
              onChange={(e) => setActorRole(e.target.value)}
              className={adminStyles.select}
            >
              <option value="">Mọi tác nhân</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="SHOP_OWNER">Chủ shop</option>
              <option value="WAREHOUSE_STAFF">Nhân viên kho</option>
              <option value="SYSTEM">Tác vụ tự động</option>
            </select>
          </div>
        </div>

        {/* Khoảng ngày và preset */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-[#E5E7EB] text-[13px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-[#64748B]">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1 text-[12px] rounded-lg border border-[#E5E7EB] bg-white text-[#475569] cursor-pointer"
            />
            <span className="text-[12px] text-[#64748B]">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1 text-[12px] rounded-lg border border-[#E5E7EB] bg-white text-[#475569] cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: '7days', label: '7 ngày' },
              { id: '30days', label: '30 ngày' },
              { id: 'all', label: 'Tất cả' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id)}
                className="px-2 py-0.5 rounded text-[12px] text-[#64748B] hover:text-[#334155] hover:bg-slate-100 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bảng nhật ký kiểm toán phẳng ─── */}
      <div className={adminStyles.tableContainer}>
        <div className="overflow-x-auto">
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th className={adminStyles.th}>Thời gian</th>
                <th className={adminStyles.th}>Người thực hiện</th>
                <th className={adminStyles.th}>Hành động</th>
                <th className={adminStyles.th}>Phân hệ</th>
                <th className={adminStyles.th}>Cửa hàng</th>
                <th className={adminStyles.th}>Địa chỉ IP</th>
                <th className={`${adminStyles.th} text-right w-16`}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${60 + ((i + j) % 3) * 15}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#64748B]">
                    Không tìm thấy bản ghi kiểm toán nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isSensitive = isSensitiveAction(log.action);

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleExpand(log.id)}
                        className={`${adminStyles.tr} cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                      >
                        {/* Thời gian */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="text-[#334155] font-medium text-[13px]">
                            {formatRelativeTime(log.createdAt) || formatVNDateTime(log.createdAt)}
                          </div>
                          <div className="text-[11px] text-[#94A3B8]">
                            {formatVNDateTime(log.createdAt)}
                          </div>
                        </td>

                        {/* Người thực hiện */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="text-[#334155] font-medium text-[13px]">
                            {log.user?.fullName || 'Hệ thống'}
                          </div>
                          <div className="text-[11px] text-[#94A3B8]">
                            {log.user ? roleLabel(log.user.role) : 'Tác vụ tự động'}
                          </div>
                        </td>

                        {/* Hành động (tiếng Việt) */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span
                            className={
                              isSensitive
                                ? 'text-[#DC2626] font-medium'
                                : 'text-[#334155]'
                            }
                          >
                            {actionLabel(log.action)}
                          </span>
                        </td>

                        {/* Phân hệ */}
                        <td className="px-4 py-2.5 whitespace-nowrap text-[12px] text-[#64748B]">
                          {entityLabel(log.entityType)}
                        </td>

                        {/* Cửa hàng */}
                        <td className="px-4 py-2.5 whitespace-nowrap text-[12px] text-[#64748B]">
                          {log.store?.name || '—'}
                        </td>

                        {/* IP (monospace, xám) */}
                        <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[12px] text-[#64748B]">
                          {log.ipAddress || '—'}
                        </td>

                        {/* Mũi tên mở rộng */}
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            className="p-1 rounded text-[#94A3B8] hover:text-[#334155]"
                            aria-label="Xem chi tiết"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Dòng mở rộng so sánh Trước / Sau */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <AuditDiffViewer log={log} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang dưới bảng: 50 dòng/trang */}
        <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between text-[13px] text-[#64748B] bg-white">
          <span>
            {pagination.total > 0
              ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} trong ${pagination.total} sự kiện`
              : '0 sự kiện'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[#64748B] cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-medium text-[#334155]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[#64748B] cursor-pointer"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAuditPage;
