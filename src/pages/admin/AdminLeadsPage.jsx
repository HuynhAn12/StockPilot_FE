import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserCheck, Search, RefreshCw, Phone, Mail, Building2,
  Calendar, Clock, ChevronLeft, ChevronRight, Table, Kanban,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import {
  apiListAdminLeads,
  apiUpdateAdminLeadStatus,
  formatVNDateTime,
} from '../../services/adminService';
import { adminStyles } from './adminStyles';

const STATUS_CONFIG = {
  NEW: { label: 'Mới', badge: 'bg-blue-50 text-[#2563EB] border-blue-200' },
  CONTACTED: { label: 'Đã liên hệ', badge: 'bg-amber-50 text-[#D97706] border-amber-200' },
  CONVERTED: { label: 'Đã chuyển đổi', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Không phù hợp', badge: 'bg-slate-100 text-[#64748B] border-slate-200' },
};

function getLeadWaitNotice(createdAt, status) {
  if (status !== 'NEW' || !createdAt) return null;
  const d = new Date(createdAt);
  const diffMs = Date.now() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    return `Chờ ${days} ngày`;
  }
  return null;
}

export function AdminLeadsPage() {
  const { toast } = useToast();

  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchLeads = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await apiListAdminLeads({
        page,
        limit: 50,
        search: searchQuery.trim(),
        status: selectedStatus,
      });
      setLeads(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast({
        type: 'error',
        title: 'Lỗi tải khách hàng tiềm năng',
        description: err?.response?.data?.error?.message || err.message || 'Không thể tải danh sách leads.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      const res = await apiUpdateAdminLeadStatus(leadId, { status: newStatus });
      toast({
        type: 'success',
        title: 'Cập nhật trạng thái thành công',
        description: res?.message || `Đã chuyển lead sang: ${STATUS_CONFIG[newStatus]?.label || newStatus}.`,
      });
      setLeads((prev) =>
        prev.map((ld) => (ld.id === leadId ? { ...ld, status: newStatus } : ld))
      );
    } catch (err) {
      toast({
        type: 'error',
        title: 'Lỗi cập nhật',
        description: err?.response?.data?.error?.message || err.message || 'Không thể đổi trạng thái lead.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Status counts for tabs
  const counts = useMemo(() => {
    const map = { NEW: 0, CONTACTED: 0, CONVERTED: 0, REJECTED: 0 };
    for (const ld of leads) {
      if (map[ld.status] !== undefined) map[ld.status]++;
    }
    return map;
  }, [leads]);

  return (
    <div className={adminStyles.pageContainer}>
      {/* ─── Header ─── */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Khách hàng tiềm năng</h1>
          <p className={adminStyles.pageDesc}>
            Theo dõi và xử lý liên hệ tư vấn mở cửa hàng từ trang Landing Page StockPilot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-100 text-[#334155] font-medium'
                  : 'text-[#64748B] hover:text-[#334155]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-slate-100 text-[#334155] font-medium'
                  : 'text-[#64748B] hover:text-[#334155]'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchLeads(pagination.page)}
            disabled={isLoading}
            className={adminStyles.btnSecondary}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ─── Toolbar: Tìm kiếm & Tabs đếm số theo tiến trình ─── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, số điện thoại, email, tên cửa hàng..."
            className={`${adminStyles.input} pl-9`}
          />
        </div>

        {/* Tab đếm số: Mới 2 · Đã liên hệ 5 · Đã chuyển đổi 3 · Không phù hợp 1 */}
        <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5 self-start overflow-x-auto max-w-full">
          {[
            { value: '', label: 'Tất cả', count: pagination.total },
            { value: 'NEW', label: 'Mới', count: counts.NEW },
            { value: 'CONTACTED', label: 'Đã liên hệ', count: counts.CONTACTED },
            { value: 'CONVERTED', label: 'Đã chuyển đổi', count: counts.CONVERTED },
            { value: 'REJECTED', label: 'Không phù hợp', count: counts.REJECTED },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1.5 text-[13px] rounded-md transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedStatus === tab.value
                  ? 'bg-slate-100 text-[#334155] font-medium'
                  : 'text-[#64748B] hover:text-[#334155]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[11px] text-[#94A3B8] bg-white px-1.5 py-0.2 rounded border border-[#E5E7EB]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Hiển thị dạng Bảng (Table View) ─── */}
      {viewMode === 'table' ? (
        <div className={adminStyles.tableContainer}>
          <div className="overflow-x-auto">
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th className={adminStyles.th}>Họ tên</th>
                  <th className={adminStyles.th}>Số điện thoại</th>
                  <th className={adminStyles.th}>Email</th>
                  <th className={adminStyles.th}>Cửa hàng dự kiến</th>
                  <th className={adminStyles.th}>Ngành hàng</th>
                  <th className={adminStyles.th}>Ghi chú</th>
                  <th className={adminStyles.th}>Ngày đăng ký</th>
                  <th className={`${adminStyles.th} text-right`}>Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${55 + ((i + j) % 3) * 15}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#64748B]">
                      Không tìm thấy khách hàng tiềm năng nào.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const waitNotice = getLeadWaitNotice(lead.createdAt, lead.status);
                    const isUpdating = updatingId === lead.id;

                    return (
                      <tr key={lead.id} className={adminStyles.tr}>
                        {/* Họ tên */}
                        <td className="px-4 py-2.5 whitespace-nowrap font-medium text-[#334155]">
                          {lead.fullName || '—'}
                        </td>

                        {/* Số điện thoại */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-[#3B82F6] hover:underline"
                            >
                              {lead.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Email */}
                        <td className="px-4 py-2.5 whitespace-nowrap text-[12px] text-[#64748B]">
                          {lead.email || '—'}
                        </td>

                        {/* Cửa hàng dự kiến */}
                        <td className="px-4 py-2.5 whitespace-nowrap text-[#475569]">
                          {lead.storeName || '—'}
                        </td>

                        {/* Ngành hàng */}
                        <td className="px-4 py-2.5 whitespace-nowrap text-[12px] text-[#64748B]">
                          {lead.businessCategory || '—'}
                        </td>

                        {/* Ghi chú */}
                        <td className="px-4 py-2.5 max-w-50 text-[12px] text-[#64748B]">
                          <span className="truncate block" title={lead.notes || ''}>
                            {lead.notes || '—'}
                          </span>
                        </td>

                        {/* Ngày đăng ký (Mới > 24h tô màu cam + Chờ X ngày) */}
                        <td className="px-4 py-2.5 whitespace-nowrap text-[12px]">
                          <div className={waitNotice ? 'text-[#D97706] font-medium' : 'text-[#64748B]'}>
                            {formatVNDateTime(lead.createdAt)}
                          </div>
                          {waitNotice && (
                            <div className="text-[11px] text-[#D97706]">{waitNotice}</div>
                          )}
                        </td>

                        {/* Dropdown đổi trạng thái trực tiếp */}
                        <td className="px-4 py-2.5 whitespace-nowrap text-right">
                          <select
                            value={lead.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className="px-2 py-1 text-[12px] rounded border border-[#E5E7EB] bg-white text-[#475569] focus:outline-none focus:border-[#3B82F6] cursor-pointer disabled:opacity-50"
                          >
                            <option value="NEW">Mới</option>
                            <option value="CONTACTED">Đã liên hệ</option>
                            <option value="CONVERTED">Đã chuyển đổi</option>
                            <option value="REJECTED">Không phù hợp</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang dưới bảng */}
          <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between text-[13px] text-[#64748B] bg-white">
            <span>
              {pagination.total > 0
                ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )} trong ${pagination.total} khách hàng tiềm năng`
                : '0 khách hàng'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchLeads(pagination.page - 1)}
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
                onClick={() => fetchLeads(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-[#64748B] cursor-pointer"
                aria-label="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Hiển thị dạng Kanban Tinh Gọn ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'NEW', title: 'Mới', items: leads.filter((l) => l.status === 'NEW') },
            { id: 'CONTACTED', title: 'Đã liên hệ', items: leads.filter((l) => l.status === 'CONTACTED') },
            { id: 'CONVERTED', title: 'Đã chuyển đổi', items: leads.filter((l) => l.status === 'CONVERTED') },
            { id: 'REJECTED', title: 'Không phù hợp', items: leads.filter((l) => l.status === 'REJECTED') },
          ].map((col) => (
            <div key={col.id} className="bg-slate-50/70 rounded-lg border border-[#E5E7EB] p-3 flex flex-col">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E7EB]">
                <span className="text-[13px] font-medium text-[#334155]">{col.title}</span>
                <span className="text-[11px] font-medium text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                  {col.items.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-150">
                {col.items.length === 0 ? (
                  <p className="text-[12px] text-[#94A3B8] text-center py-6">Trống</p>
                ) : (
                  col.items.map((lead) => {
                    const waitNotice = getLeadWaitNotice(lead.createdAt, lead.status);
                    return (
                      <div
                        key={lead.id}
                        className="p-3 bg-white rounded-lg border border-[#E5E7EB] shadow-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-medium text-[#334155] text-[13px]">{lead.fullName}</p>
                          {waitNotice && (
                            <span className="text-[10px] text-[#D97706] font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {waitNotice}
                            </span>
                          )}
                        </div>

                        {lead.phone && (
                          <div className="text-[12px]">
                            <a href={`tel:${lead.phone}`} className="text-[#3B82F6] hover:underline">
                              {lead.phone}
                            </a>
                          </div>
                        )}

                        {lead.storeName && (
                          <p className="text-[12px] text-[#64748B] truncate">
                            Shop: {lead.storeName} {lead.businessCategory && `(${lead.businessCategory})`}
                          </p>
                        )}

                        {lead.notes && (
                          <p className="text-[11px] text-[#64748B] line-clamp-2 bg-slate-50 p-1.5 rounded">
                            {lead.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#94A3B8]">
                          <span>{formatVNDateTime(lead.createdAt)}</span>
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className="text-[11px] px-1.5 py-0.5 rounded border border-[#E5E7EB] bg-white text-[#475569] cursor-pointer"
                          >
                            <option value="NEW">Mới</option>
                            <option value="CONTACTED">Đã liên hệ</option>
                            <option value="CONVERTED">Chuyển đổi</option>
                            <option value="REJECTED">Không phù hợp</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminLeadsPage;
