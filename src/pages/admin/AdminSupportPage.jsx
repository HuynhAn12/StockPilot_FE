import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Lock,
  LifeBuoy,
  Phone,
  Mail,
  Store,
  KeyRound,
  LogOut,
  AlertCircle,
  ExternalLink,
  Clock,
  Sparkles,
  Paperclip,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../store/authStore';
import { usePolling, MessageThread, Composer } from '../../components/support/SupportChat';
import {
  apiAdminListTickets,
  apiAdminGetTicket,
  apiAdminReplyTicket,
  apiAdminUpdateTicket,
  apiAdminFetchAttachment,
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_PRIORITY_LABELS,
} from '../../services/supportService';
import {
  apiListAdminUsers,
  apiGetAdminStore,
  apiSendAdminPasswordReset,
  apiRevokeAdminUserSessions,
  formatVNDateTime,
} from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from './adminLabels';
import { adminStyles as ui } from './adminStyles';
import {
  PageHeader,
  Tabs,
  SearchInput,
  FilterSelect,
  FilterChips,
  Badge,
  Pagination,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  DetailList,
  LiveIndicator,
  useDebounced,
} from './components/AdminUI';

const POLL_MS = 10000;

const STATUS_TONE = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  WAITING_STORE: 'neutral',
  RESOLVED: 'success',
};

const IMPORT_STATUS = {
  PREVIEWED: 'Đã xem trước',
  COMMITTING: 'Đang nhập',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Thất bại',
  EXPIRED: 'Hết hạn',
};

const PAYOS_TEXT = { ACTIVE: 'VietQR đang bật', DISABLED: 'VietQR đã tắt', NOT_CONFIGURED: 'Chỉ tiền mặt' };

const QUICK_REPLIES = [
  {
    label: 'Tiếp nhận',
    text: 'Chào bạn, đội ngũ hỗ trợ kỹ thuật StockPilot đã tiếp nhận yêu cầu và đang tiến hành kiểm tra xử lý. Chúng tôi sẽ phản hồi lại bạn sớm nhất có thể.',
  },
  {
    label: 'Xin ảnh chụp lỗi',
    text: 'Bạn vui lòng gửi giúp ảnh chụp toàn màn hình lúc xảy ra sự cố (có thể nhấn Ctrl + V để dán trực tiếp ảnh vào ô chat này) để kỹ thuật hỗ trợ nhanh hơn nhé.',
  },
  {
    label: 'Hướng dẫn nhập Excel',
    text: 'Bạn vào mục "Nhập dữ liệu" trên thanh menu, chọn mẫu file phù hợp rồi tải file lên. Hệ thống sẽ kiểm tra hợp lệ từng dòng và báo lỗi chi tiết trước khi bạn ấn xác nhận nhập.',
  },
  {
    label: 'Xử lý hoàn tất',
    text: 'Vấn đề của bạn đã được kiểm tra và xử lý hoàn tất. Bạn vui lòng thao tác kiểm tra lại giúp nhé. Nếu cần hỗ trợ thêm thông tin gì khác, bạn cứ nhắn tin tại đây!',
  },
];

const STATUS_TABS = [
  { value: 'ACTIVE', label: 'Đang mở' },
  { value: 'OPEN', label: 'Chờ hỗ trợ', countKey: 'OPEN' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý', countKey: 'IN_PROGRESS' },
  { value: 'WAITING_STORE', label: 'Chờ shop phản hồi', countKey: 'WAITING_STORE' },
  { value: 'RESOLVED', label: 'Đã giải quyết', countKey: 'RESOLVED' },
  { value: 'ALL', label: 'Tất cả yêu cầu' },
];

function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] || 'neutral'}>{SUPPORT_STATUS_LABELS[status] || status}</Badge>;
}

function TicketListItem({ ticket, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={`w-full text-left p-4 cursor-pointer border-l-3 transition-all ${
        selected
          ? 'bg-blue-50/70 border-l-[#2563EB] shadow-2xs'
          : 'border-l-transparent hover:bg-slate-50/80'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[12px] text-[#64748B]">
        <span className="flex items-center gap-2 min-w-0">
          {ticket.unread && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]" />
            </span>
          )}
          <span className="font-semibold text-[#0F172A] truncate">{ticket.store?.name}</span>
        </span>
        <span className="shrink-0 text-[11px] font-medium" title={formatVNDateTime(ticket.lastMessageAt)}>
          {formatRelativeTime(ticket.lastMessageAt) || 'Vừa xong'}
        </span>
      </div>

      <p className={`text-[13px] line-clamp-2 mt-1 ${ticket.unread ? 'font-bold text-[#0F172A]' : 'text-[#334155]'}`}>
        {ticket.subject}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={ticket.status} />
        {ticket.priority === 'HIGH' && (
          <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.2 rounded-full">
            GẤP
          </span>
        )}
        <span className="text-[11px] text-[#94A3B8] ml-auto font-medium">
          #{ticket.id} · {ticket.assignee ? ticket.assignee.fullName : 'Chưa giao'}
        </span>
      </div>
    </button>
  );
}

function StorePanel({ ticket, store, loadingStore, onReset, onRevoke }) {
  const owner = store?.owners?.[0] || null;
  const ctx = ticket.storeContext || {};

  return (
    <div className="p-5 space-y-6 text-[13px]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-[16px] text-[#0F172A] truncate">{ticket.store?.name}</h3>
          {(store ?? ticket.store)?.isActive === false ? (
            <Badge tone="danger">Tạm khóa</Badge>
          ) : (
            <Badge tone="success">Hoạt động</Badge>
          )}
        </div>
        <p className="text-[12px] text-[#64748B] font-mono mt-0.5">Mã tenant: {ticket.store?.code}</p>
      </div>

      <DetailList
        rows={[
          ['Người gửi ticket', ticket.createdBy ? `${ticket.createdBy.fullName}` : '—'],
          ['Chủ cửa hàng', loadingStore ? '…' : owner?.fullName || 'Chưa liên kết'],
          ['Email chủ shop', loadingStore ? '…' : owner?.email || '—'],
          ['Số điện thoại', ticket.store?.phone || store?.phone || '—'],
          ['Phương thức thanh toán', PAYOS_TEXT[ctx.payos] || '—'],
        ]}
      />

      {/* Snapshot Quy mô */}
      <div>
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#64748B] mb-2.5">Quy mô cửa hàng</h4>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ['Số mã SKU', store?.stats?.skus],
            ['Đơn 30 ngày', store?.stats?.ordersLast30Days],
            ['Tài khoản shop', store ? (store.stats?.owners || 0) + (store.stats?.staff || 0) : undefined],
            [
              'Đơn gần nhất',
              store?.stats?.lastOrderAt
                ? formatRelativeTime(store.stats.lastOrderAt) || formatVNDateTime(store.stats.lastOrderAt)
                : store
                ? 'Chưa có'
                : undefined,
            ],
          ].map(([label, value]) => (
            <div key={label} className="p-3 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
              <p className="text-[11px] font-medium text-[#64748B]">{label}</p>
              <p className="text-[15px] font-bold text-[#0F172A] admin-num truncate mt-0.5">
                {loadingStore ? '…' : value ?? '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lần nhập dữ liệu gần nhất */}
      <div>
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#64748B] mb-2.5">Lịch sử nhập file Excel</h4>
        {!ctx.recentImports?.length ? (
          <p className="text-[12px] text-[#64748B] p-3 bg-slate-50 rounded-lg border border-slate-200/80 italic">
            Cửa hàng chưa thực hiện nhập dữ liệu từ file.
          </p>
        ) : (
          <ul className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] bg-white shadow-2xs overflow-hidden">
            {ctx.recentImports.slice(0, 3).map((job) => (
              <li key={job.id} className="p-3 text-[12px]">
                <div className="flex justify-between items-center gap-2">
                  <span
                    className={`font-semibold ${
                      job.status === 'FAILED' ? 'text-red-700' : 'text-[#0F172A]'
                    }`}
                  >
                    {IMPORT_STATUS[job.status] || job.status}
                  </span>
                  <span className="text-[#94A3B8] font-medium">
                    {formatRelativeTime(job.createdAt) || formatVNDateTime(job.createdAt)}
                  </span>
                </div>
                <p className="text-[#64748B] mt-1">
                  {job.validRows}/{job.totalRows} dòng hợp lệ
                  {job.invalidRows > 0 && <span className="text-red-600 font-bold"> · {job.invalidRows} dòng lỗi</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hành động Hỗ trợ Khẩn cấp */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#64748B] mb-2">Thao tác hỗ trợ nhanh</h4>
        <button
          type="button"
          onClick={onReset}
          disabled={!owner || !owner.isActive}
          className={`${ui.btnSecondary} w-full justify-start text-[12px]`}
        >
          <KeyRound className="w-3.5 h-3.5 text-[#2563EB]" />
          Gửi mã đổi mật khẩu cho chủ shop
        </button>
        <button
          type="button"
          onClick={onRevoke}
          disabled={!owner}
          className={`${ui.btnSecondary} w-full justify-start text-[12px]`}
        >
          <LogOut className="w-3.5 h-3.5 text-amber-600" />
          Đăng xuất mọi thiết bị của chủ shop
        </button>
        <Link
          to={`/admin/stores?id=${ticket.store?.id}`}
          className={`${ui.btnSecondary} w-full justify-start text-[12px]`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở hồ sơ chi tiết cửa hàng
        </Link>
      </div>
    </div>
  );
}

export function AdminSupportPage() {
  const { toast } = useToast();
  const { user: me } = useAuthStore();
  const [params, setParams] = useSearchParams();

  const status = params.get('status') || 'ACTIVE';
  const category = params.get('category') || '';
  const priority = params.get('priority') || '';
  const assignee = params.get('assignee') || '';
  const page = Number(params.get('page')) || 1;
  const selectedId = Number(params.get('ticket')) || null;
  const [search, setSearch] = useState(params.get('q') || '');
  const debouncedSearch = useDebounced(search);

  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [ticket, setTicket] = useState(null);
  const [store, setStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [isInternal, setIsInternal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialog, setDialog] = useState(null); // 'reset' | 'revoke'
  const [lastSyncTime, setLastSyncTime] = useState('');

  const updateParams = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if ((params.get('q') || '') !== debouncedSearch) updateParams({ q: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = params.get('q') || '';
  const loadList = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await apiAdminListTickets({
          page,
          limit: 30,
          status: status === 'ALL' ? '' : status,
          category,
          priority,
          search: query,
          assigneeId: assignee && assignee !== 'none' ? assignee : '',
          unassigned: assignee === 'none' ? 'true' : '',
        });
        setTickets(res.data);
        setSummary(res.summary);
        setPagination(res.pagination);
        setListError('');
        setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        if (!silent) setListError(apiErrorMessage(err));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [page, status, category, priority, query, assignee]
  );

  const loadTicket = useCallback(
    async (id) => {
      try {
        setTicket(await apiAdminGetTicket(id));
      } catch (err) {
        toast({ type: 'error', title: 'Không tải được nội dung yêu cầu', description: apiErrorMessage(err) });
      }
    },
    [toast]
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    apiListAdminUsers({ role: 'ADMIN', isActive: 'true', limit: 100 })
      .then((res) => setAdmins(res.data || []))
      .catch(() => setAdmins([]));
  }, []);

  useEffect(() => {
    setTicket(null);
    setStore(null);
    setIsInternal(false);
    if (selectedId) {
      loadTicket(selectedId).then(() => loadList({ silent: true }));
    }
  }, [selectedId, loadTicket]); // eslint-disable-line react-hooks/exhaustive-deps

  const storeId = ticket?.store?.id;
  useEffect(() => {
    if (!storeId) return;
    setLoadingStore(true);
    apiGetAdminStore(storeId)
      .then(setStore)
      .catch(() => setStore(null))
      .finally(() => setLoadingStore(false));
  }, [storeId]);

  usePolling(() => {
    loadList({ silent: true });
    if (selectedId) loadTicket(selectedId);
  }, POLL_MS);

  const updateTicket = async (patch, title) => {
    setIsUpdating(true);
    try {
      await apiAdminUpdateTicket(selectedId, patch);
      toast({ type: 'success', title });
      await Promise.all([loadTicket(selectedId), loadList({ silent: true })]);
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được', description: apiErrorMessage(err) });
    } finally {
      setIsUpdating(false);
    }
  };

  const sendReply = async (body, files) => {
    try {
      await apiAdminReplyTicket(selectedId, body, isInternal, files);
      toast({
        type: 'success',
        title: isInternal ? 'Đã lưu ghi chú nội bộ' : 'Đã gửi phản hồi tới cửa hàng',
      });
      await Promise.all([loadTicket(selectedId), loadList({ silent: true })]);
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được phản hồi', description: apiErrorMessage(err) });
      throw err;
    }
  };

  const owner = store?.owners?.[0] || null;

  const assigneeOptions = [
    { value: '', label: 'Mọi người phụ trách' },
    { value: 'none', label: 'Chưa giao việc' },
    ...admins.map((a) => ({ value: String(a.id), label: a.id === me?.id ? `${a.fullName} (bạn)` : a.fullName })),
  ];

  const chips = [
    category && {
      key: 'category',
      label: SUPPORT_CATEGORY_LABELS[category],
      onRemove: () => updateParams({ category: '' }),
    },
    priority && {
      key: 'priority',
      label: `Ưu tiên: ${SUPPORT_PRIORITY_LABELS[priority]?.toLowerCase()}`,
      onRemove: () => updateParams({ priority: '' }),
    },
    assignee && {
      key: 'assignee',
      label: assigneeOptions.find((o) => o.value === assignee)?.label || 'Người phụ trách',
      onRemove: () => updateParams({ assignee: '' }),
    },
  ].filter(Boolean);

  const clearFilters = () => {
    setSearch('');
    const next = new URLSearchParams();
    if (status !== 'ACTIVE') next.set('status', status);
    if (selectedId) next.set('ticket', String(selectedId));
    setParams(next, { replace: true });
  };

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title="Trung tâm Hỗ trợ Khách hàng"
        description="Hộp thư tiếp nhận và xử lý yêu cầu trợ giúp kỹ thuật, sự cố phần mềm gửi từ các cửa hàng."
        badge={<Badge tone="neutral">{summary?.total ?? 0} yêu cầu</Badge>}
        actions={
          <div className="flex items-center gap-3">
            <LiveIndicator status="synced" lastUpdated={lastSyncTime} onRefresh={() => loadList()} loading={isLoading} />
            <button
              type="button"
              onClick={() => loadList()}
              disabled={isLoading}
              className={ui.btnSecondary}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        }
      >
        <Tabs
          value={status}
          onChange={(v) => updateParams({ status: v === 'ACTIVE' ? '' : v })}
          tabs={STATUS_TABS.map((t) => ({
            value: t.value,
            label: t.label,
            count: t.countKey ? summary?.[t.countKey] : undefined,
          }))}
        />
      </PageHeader>

      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tiêu đề yêu cầu hoặc tên shop…"
            className="w-full lg:w-80"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Loại sự cố"
              value={category}
              onChange={(v) => updateParams({ category: v })}
              options={[
                { value: '', label: 'Mọi loại sự cố' },
                ...Object.entries(SUPPORT_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <FilterSelect
              label="Mức ưu tiên"
              value={priority}
              onChange={(v) => updateParams({ priority: v })}
              options={[
                { value: '', label: 'Mọi mức ưu tiên' },
                ...Object.entries(SUPPORT_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <FilterSelect
              label="Người phụ trách"
              value={assignee}
              onChange={(v) => updateParams({ assignee: v })}
              options={assigneeOptions}
              className="max-w-55"
            />
          </div>
        </div>
        <FilterChips chips={chips} onClearAll={clearFilters} />
      </div>

      {/* Bố cục 3 Cột: Danh sách Ticket | Khung hội thoại Chat | Snapshot Cửa hàng */}
      <div className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)_320px] gap-4 xl:h-[calc(100vh-270px)] xl:min-h-145">
        {/* Cột 1: Danh sách Ticket */}
        <aside
          className={`${ui.card} overflow-hidden flex-col min-h-0 ${selectedId ? 'hidden xl:flex' : 'flex'}`}
          aria-label="Danh sách yêu cầu hỗ trợ"
        >
          <div className="p-3.5 bg-slate-50 border-b border-[#F1F5F9] flex items-center justify-between text-[12px] font-semibold text-[#475569]">
            <span>Hộp thư ({tickets.length})</span>
            {summary?.unread > 0 && (
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.2 rounded-full">
                {summary.unread} tin mới
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : listError ? (
              <ErrorState message={listError} onRetry={() => loadList()} />
            ) : tickets.length === 0 ? (
              <EmptyState
                title={status === 'ACTIVE' && !chips.length && !query ? 'Không có yêu cầu nào tồn đọng' : 'Không có yêu cầu phù hợp'}
                description={
                  status === 'ACTIVE' && !chips.length && !query
                    ? 'Tuyệt vời! Mọi sự cố kỹ thuật đều đã được xử lý xong.'
                    : 'Hãy thử bỏ bớt các bộ lọc đang kích hoạt.'
                }
                action={
                  chips.length || query ? (
                    <button type="button" onClick={clearFilters} className={ui.btnSecondary}>
                      Xóa bộ lọc
                    </button>
                  ) : null
                }
              />
            ) : (
              tickets.map((t) => (
                <TicketListItem
                  key={t.id}
                  ticket={t}
                  selected={selectedId === t.id}
                  onSelect={() => updateParams({ ticket: String(t.id) }, false)}
                />
              ))
            )}
          </div>

          {!listError && pagination?.totalPages > 1 && (
            <Pagination
              pagination={pagination}
              onPage={(p) => updateParams({ page: String(p) }, false)}
              disabled={isLoading}
              unit="yêu cầu"
            />
          )}
        </aside>

        {/* Cột 2: Khung Hội Thoại & Composer */}
        <section
          className={`${ui.card} overflow-hidden flex-col min-h-135 xl:min-h-0 ${selectedId ? 'flex' : 'hidden xl:flex'}`}
          aria-label="Khung xử lý hội thoại"
        >
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <span className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] text-[#64748B] flex items-center justify-center shadow-xs mb-3">
                <LifeBuoy className="w-7 h-7" />
              </span>
              <h3 className="text-[16px] font-bold text-[#0F172A]">Chọn một yêu cầu để phản hồi</h3>
              <p className="text-[13px] text-[#64748B] max-w-[40ch] mt-1">
                Xem toàn bộ lịch sử trao đổi, đính kèm ảnh lỗi và lưu lại các ghi chú nội bộ của đội ngũ kỹ thuật.
              </p>
            </div>
          ) : !ticket ? (
            <div className="p-6 space-y-4">
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-72 rounded-xl bg-slate-100 animate-pulse" />
            </div>
          ) : (
            <>
              {/* Header Ticket */}
              <header className="px-5 py-4 border-b border-[#F1F5F9] bg-[#FAFBFC] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => updateParams({ ticket: '' }, false)}
                      className="xl:hidden mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Trở lại hộp thư
                    </button>
                    <h2 className="text-[17px] font-bold text-[#0F172A] leading-snug">{ticket.subject}</h2>
                    <p className="text-[12px] text-[#64748B] mt-0.5">
                      #{ticket.id} · Phân hệ: <span className="font-semibold text-[#334155]">{SUPPORT_CATEGORY_LABELS[ticket.category] || ticket.category}</span> · Khởi tạo lúc {formatVNDateTime(ticket.createdAt)}
                    </p>
                  </div>

                  {ticket.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateTicket({ status: 'RESOLVED' }, 'Đã đánh dấu giải quyết hoàn tất')}
                      className={`${ui.btnPrimary} bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-[12px] shrink-0`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Giải quyết xong
                    </button>
                  )}
                </div>

                {/* Điều khiển Trạng thái / Ưu tiên / Người phụ trách */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">Trạng thái</span>
                    <select
                      value={ticket.status}
                      disabled={isUpdating}
                      onChange={(e) => updateTicket({ status: e.target.value }, 'Đã đổi trạng thái')}
                      className={`${ui.select} h-8.5 text-[12px] py-1`}
                    >
                      {Object.entries(SUPPORT_STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">Mức ưu tiên</span>
                    <select
                      value={ticket.priority}
                      disabled={isUpdating}
                      onChange={(e) => updateTicket({ priority: e.target.value }, 'Đã đổi mức ưu tiên')}
                      className={`${ui.select} h-8.5 text-[12px] py-1`}
                    >
                      {Object.entries(SUPPORT_PRIORITY_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">Người phụ trách</span>
                    <select
                      value={ticket.assignee?.id ?? ''}
                      disabled={isUpdating}
                      onChange={(e) =>
                        updateTicket({ assigneeId: e.target.value ? Number(e.target.value) : null }, 'Đã đổi người phụ trách')
                      }
                      className={`${ui.select} h-8.5 text-[12px] py-1`}
                    >
                      <option value="">Chưa giao</option>
                      {admins.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </header>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC] min-h-65">
                <MessageThread
                  messages={ticket.messages || []}
                  viewerIsAdmin
                  fetchAttachment={apiAdminFetchAttachment}
                />
              </div>

              {/* Composer */}
              <div className={isInternal ? 'border-t-2 border-amber-400 bg-amber-50/20' : ''}>
                {isInternal && (
                  <div className="px-4 py-1.5 bg-amber-100/70 border-b border-amber-300 text-[12px] font-semibold text-amber-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    Chế độ Ghi chú nội bộ: Cửa hàng KHÔNG nhìn thấy nội dung này. Chỉ Quản trị viên đọc được.
                  </div>
                )}
                <Composer
                  key={ticket.id}
                  onSend={sendReply}
                  tone={isInternal ? 'internal' : 'default'}
                  quickReplies={isInternal ? [] : QUICK_REPLIES}
                  placeholder={
                    isInternal
                      ? 'Nhập ghi chú nội bộ dành cho các Admin khác…'
                      : `Gửi phản hồi trực tiếp tới ${ticket.store?.name || 'cửa hàng'}…`
                  }
                  onError={(msg) => toast({ type: 'warning', title: 'Không đính kèm được tệp', description: msg })}
                  extra={
                    <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#475569] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="accent-amber-600 w-4 h-4 cursor-pointer"
                      />
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Ghi chú nội bộ
                    </label>
                  }
                />
              </div>
            </>
          )}
        </section>

        {/* Cột 3: Snapshot Cửa Hàng */}
        <aside
          className={`${ui.card} overflow-y-auto ${selectedId && ticket ? 'block' : 'hidden xl:block'}`}
          aria-label="Thông tin cửa hàng"
        >
          {ticket ? (
            <StorePanel
              ticket={ticket}
              store={store}
              loadingStore={loadingStore}
              onReset={() => setDialog('reset')}
              onRevoke={() => setDialog('revoke')}
            />
          ) : (
            <div className="p-8 text-center text-[13px] text-[#64748B]">
              <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Store className="w-5 h-5" />
              </span>
              Chọn một yêu cầu để xem thông tin tổng hợp của cửa hàng gửi ticket.
            </div>
          )}
        </aside>
      </div>

      {/* Dialogs */}
      {dialog === 'reset' && owner && (
        <ConfirmDialog
          title={`Gửi mã đặt lại mật khẩu cho ${owner.fullName}?`}
          description={`Mã xác thực có hiệu lực 15 phút sẽ được gửi tới email ${owner.email}. Bạn không thấy mã và không đặt mật khẩu thay cho chủ cửa hàng.`}
          confirmLabel="Gửi mã OTP"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            try {
              const res = await apiSendAdminPasswordReset(owner.id);
              const sent = res.emailSent || res.simulated;
              toast({
                type: sent ? 'success' : 'warning',
                title: sent ? 'Đã gửi mã đặt lại mật khẩu' : 'Chưa gửi được email',
                description: sent ? `Đã gửi tới ${res.email}.` : 'Máy chủ chưa cấu hình gửi email (SMTP).',
              });
              setDialog(null);
            } catch (err) {
              toast({ type: 'error', title: 'Không gửi được mã', description: apiErrorMessage(err) });
            }
          }}
        />
      )}

      {dialog === 'revoke' && owner && (
        <ConfirmDialog
          title={`Đăng xuất ${owner.fullName} khỏi mọi thiết bị?`}
          description="Dùng khi chủ shop báo mất máy hoặc nghi ngờ lộ mật khẩu. Tài khoản không bị khóa."
          confirmLabel="Đăng xuất thiết bị"
          danger
          reason={{
            required: true,
            initial: `Theo yêu cầu hỗ trợ #${ticket?.id}`,
            placeholder: 'Ví dụ: Chủ shop báo mất thiết bị cá nhân',
          }}
          onClose={() => setDialog(null)}
          onConfirm={async ({ reason }) => {
            try {
              const res = await apiRevokeAdminUserSessions(owner.id, reason);
              toast({
                type: 'success',
                title: 'Đã đăng xuất mọi thiết bị',
                description: `Đã thu hồi ${res.revokedSessions} phiên đăng nhập.`,
              });
              setDialog(null);
            } catch (err) {
              toast({ type: 'error', title: 'Không thực hiện được', description: apiErrorMessage(err) });
            }
          }}
        />
      )}
    </div>
  );
}

export default AdminSupportPage;
