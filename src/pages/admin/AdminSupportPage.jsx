import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RefreshCw, Send, Loader2, ArrowLeft, Lock, Store } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import {
  apiAdminListTickets,
  apiAdminGetTicket,
  apiAdminReplyTicket,
  apiAdminUpdateTicket,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_PRIORITY_LABELS,
} from '../../services/supportService';
import { apiListAdminUsers, formatVNDateTime } from '../../services/adminService';
import { StatusBadge, MessageThread } from '../shared/SupportPage';
import { apiErrorMessage, formatRelativeTime } from './adminLabels';
import { adminStyles as ui } from './adminStyles';

const IMPORT_STATUS = { PREVIEWED: 'Đã xem trước', COMMITTING: 'Đang nhập', COMPLETED: 'Hoàn tất', FAILED: 'Lỗi', EXPIRED: 'Hết hạn' };

const FILTERS = [
  { value: 'ACTIVE', label: 'Đang mở' },
  { value: 'OPEN', label: 'Chờ hỗ trợ' },
  { value: 'WAITING_STORE', label: 'Chờ cửa hàng' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: '', label: 'Tất cả' },
];

export function AdminSupportPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('ACTIVE');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const selectedId = Number(searchParams.get('ticket')) || null;
  const [ticket, setTicket] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [busy, setBusy] = useState('');

  const loadList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiAdminListTickets({ status, category, search: search.trim(), limit: 50 });
      setTickets(res.data);
      setSummary(res.summary);
    } catch (err) {
      toast({ type: 'error', title: 'Không tải được hộp thư hỗ trợ', description: apiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }, [status, category, search, toast]);

  const loadTicket = useCallback(
    async (id) => {
      try {
        setTicket(await apiAdminGetTicket(id));
      } catch (err) {
        toast({ type: 'error', title: 'Không mở được yêu cầu', description: apiErrorMessage(err) });
      }
    },
    [toast]
  );

  useEffect(() => {
    const timer = setTimeout(loadList, 250);
    return () => clearTimeout(timer);
  }, [loadList]);

  useEffect(() => {
    apiListAdminUsers({ role: 'ADMIN', isActive: 'true', limit: 100 })
      .then((res) => setAdmins(res.data))
      .catch(() => setAdmins([]));
  }, []);

  useEffect(() => {
    setTicket(null);
    if (selectedId) loadTicket(selectedId);
  }, [selectedId, loadTicket]);

  const update = async (patch, successTitle) => {
    setBusy('update');
    try {
      await apiAdminUpdateTicket(selectedId, patch);
      toast({ type: 'success', title: successTitle });
      await Promise.all([loadTicket(selectedId), loadList()]);
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được', description: apiErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (reply.trim().length < 2) return;
    setBusy('reply');
    try {
      await apiAdminReplyTicket(selectedId, reply.trim(), isInternal);
      setReply('');
      setIsInternal(false);
      await Promise.all([loadTicket(selectedId), loadList()]);
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được', description: apiErrorMessage(err) });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className={ui.pageContainer}>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.pageTitle}>Hỗ trợ khách hàng</h1>
          <p className={ui.pageDesc}>
            {summary
              ? `${summary.unanswered} yêu cầu chưa được trả lời · ${summary.OPEN} chờ hỗ trợ · ${summary.IN_PROGRESS} đang xử lý · ${summary.WAITING_STORE} chờ cửa hàng`
              : 'Yêu cầu hỗ trợ từ các cửa hàng.'}
          </p>
        </div>
        <button type="button" onClick={loadList} disabled={isLoading} className={ui.btnSecondary}>
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5 self-start overflow-x-auto max-w-full">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1 text-[13px] rounded-md whitespace-nowrap cursor-pointer ${
                status === f.value ? 'bg-slate-100 text-[#334155] font-medium' : 'text-[#64748B] hover:text-[#334155]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${ui.select} lg:w-56`}>
          <option value="">Mọi loại yêu cầu</option>
          {Object.entries(SUPPORT_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="relative lg:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tiêu đề hoặc cửa hàng" className={`${ui.input} pl-9`} />
        </div>
      </div>

      <div className="grid xl:grid-cols-[420px_1fr] gap-4 items-start">
        {/* Hộp thư */}
        <div className={`${ui.card} overflow-hidden ${selectedId ? 'hidden xl:block' : ''}`}>
          {isLoading && tickets.length === 0 ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="p-10 text-center text-[13px] text-[#64748B]">Không có yêu cầu nào trong mục này.</p>
          ) : (
            <ul className="divide-y divide-[#E5E7EB]">
              {tickets.map((t) => {
                const unanswered = t.status === 'OPEN' && !t.firstResponseAt;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ ticket: String(t.id) })}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 cursor-pointer ${selectedId === t.id ? 'bg-blue-50/60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[13px] line-clamp-1 ${unanswered ? 'font-semibold text-[#0F172A]' : 'font-medium text-[#334155]'}`}>
                          {t.priority === 'HIGH' && <span className="text-[#DC2626]">Gấp · </span>}
                          {t.subject}
                        </p>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-[12px] text-[#64748B] mt-0.5 truncate">
                        {t.store?.name} · {SUPPORT_CATEGORY_LABELS[t.category]}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        #{t.id} · {formatRelativeTime(t.lastMessageAt) || formatVNDateTime(t.lastMessageAt)}
                        {t.assignee ? ` · ${t.assignee.fullName}` : ' · chưa giao'}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Chi tiết */}
        <div className={`${ui.card} ${selectedId ? '' : 'hidden xl:block'}`}>
          {!selectedId ? (
            <p className="p-10 text-center text-[13px] text-[#64748B]">Chọn một yêu cầu để xem và trả lời.</p>
          ) : !ticket ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_260px]">
              <div className="flex flex-col max-h-[calc(100vh-230px)] lg:border-r border-[#E5E7EB]">
                <div className="px-5 py-4 border-b border-[#E5E7EB]">
                  <button type="button" onClick={() => setSearchParams({})} className="xl:hidden mb-2 inline-flex items-center gap-1 text-[13px] text-[#64748B]">
                    <ArrowLeft className="w-3.5 h-3.5" /> Hộp thư
                  </button>
                  <h2 className="text-[15px] font-semibold text-[#334155]">{ticket.subject}</h2>
                  <p className="text-[12px] text-[#64748B] mt-0.5">
                    #{ticket.id} · {ticket.createdBy?.fullName || 'Người dùng đã xóa'} ({ticket.createdBy?.email}) · {formatVNDateTime(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 bg-slate-50/60">
                  <MessageThread messages={ticket.messages} viewerIsAdmin />
                </div>
                <form onSubmit={handleReply} className="p-4 border-t border-[#E5E7EB] space-y-2">
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={isInternal ? 'Ghi chú chỉ quản trị viên thấy' : 'Trả lời cửa hàng'}
                    maxLength={5000}
                    className={`${ui.input} ${isInternal ? 'bg-amber-50 border-amber-200' : ''}`}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 text-[13px] text-[#475569] cursor-pointer">
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                      <Lock className="w-3.5 h-3.5" /> Ghi chú nội bộ
                    </label>
                    <button type="submit" disabled={busy === 'reply' || reply.trim().length < 2} className={ui.btnPrimary}>
                      {busy === 'reply' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {isInternal ? 'Lưu ghi chú' : 'Gửi trả lời'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Cột thông tin */}
              <aside className="p-4 space-y-4 text-[13px]">
                <div className="space-y-2">
                  <label className="block">
                    <span className="block text-[12px] text-[#64748B] mb-1">Trạng thái</span>
                    <select
                      value={ticket.status}
                      disabled={busy === 'update'}
                      onChange={(e) => update({ status: e.target.value }, 'Đã đổi trạng thái')}
                      className={ui.select}
                    >
                      {Object.entries(SUPPORT_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[12px] text-[#64748B] mb-1">Mức độ</span>
                    <select
                      value={ticket.priority}
                      disabled={busy === 'update'}
                      onChange={(e) => update({ priority: e.target.value }, 'Đã đổi mức độ')}
                      className={ui.select}
                    >
                      {Object.entries(SUPPORT_PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[12px] text-[#64748B] mb-1">Người phụ trách</span>
                    <select
                      value={ticket.assignee?.id ?? ''}
                      disabled={busy === 'update'}
                      onChange={(e) => update({ assigneeId: e.target.value ? Number(e.target.value) : null }, 'Đã giao người phụ trách')}
                      className={ui.select}
                    >
                      <option value="">Chưa giao</option>
                      {admins.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] space-y-1.5">
                  <p className="text-[12px] text-[#64748B] flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" /> Cửa hàng
                  </p>
                  <p className="text-[#334155] font-medium">{ticket.store.name}</p>
                  <p className="text-[12px] text-[#64748B]">
                    {ticket.store.code}
                    {ticket.store.phone ? ` · ${ticket.store.phone}` : ''}
                  </p>
                  {!ticket.store.isActive && <p className="text-[12px] text-[#DC2626]">Cửa hàng đang tạm khóa</p>}
                  <p className="text-[12px] text-[#64748B]">
                    Thanh toán:{' '}
                    {{ ACTIVE: 'PayOS đang bật', DISABLED: 'PayOS đã tắt', NOT_CONFIGURED: 'chỉ tiền mặt' }[ticket.storeContext.payos]}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB]">
                  <p className="text-[12px] text-[#64748B] mb-1.5">Lần nhập dữ liệu gần đây</p>
                  {ticket.storeContext.recentImports.length === 0 ? (
                    <p className="text-[12px] text-[#94A3B8]">Chưa nhập lần nào</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {ticket.storeContext.recentImports.map((job) => (
                        <li key={job.id} className="text-[12px]">
                          <span className={job.status === 'FAILED' ? 'text-[#DC2626]' : 'text-[#334155]'}>{IMPORT_STATUS[job.status] || job.status}</span>
                          <span className="text-[#64748B]">
                            {' '}
                            · {job.validRows}/{job.totalRows} dòng hợp lệ
                            {job.invalidRows ? `, ${job.invalidRows} lỗi` : ''}
                          </span>
                          <div className="text-[11px] text-[#94A3B8]">{formatVNDateTime(job.createdAt)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSupportPage;
