import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  LifeBuoy,
  Store,
  KeyRound,
  LogOut,
  ExternalLink,
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
import { useAdminText } from './useAdminText';

const POLL_MS = 10000;

const STATUS_TONE = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  WAITING_STORE: 'neutral',
  RESOLVED: 'success',
};

const IMPORT_STATUS = {
  PREVIEWED: ['Đã xem trước', 'Previewed'],
  COMMITTING: ['Đang nhập', 'Importing'],
  COMPLETED: ['Hoàn tất', 'Completed'],
  FAILED: ['Thất bại', 'Failed'],
  EXPIRED: ['Hết hạn', 'Expired'],
};

const PAYOS_TEXT = {
  ACTIVE: ['VietQR đang bật', 'VietQR on'],
  DISABLED: ['VietQR đã tắt', 'VietQR off'],
  NOT_CONFIGURED: ['Chỉ tiền mặt', 'Cash only'],
};

// Bản tiếng Anh cho nhãn dùng chung trong supportService (file đó phục vụ cả trang của cửa hàng nên giữ nguyên).
const CATEGORY_EN = { DATA_IMPORT: 'Data import (KiotViet, Excel)', PAYMENT: 'Payments, PayOS', ACCOUNT: 'Account, sign-in', BUG: 'Bug report', HOW_TO: 'How-to', OTHER: 'Other' };
const STATUS_EN = { OPEN: 'Awaiting support', IN_PROGRESS: 'In progress', WAITING_STORE: 'Waiting for store', RESOLVED: 'Resolved' };
const PRIORITY_EN = { LOW: 'Low', NORMAL: 'Normal', HIGH: 'Urgent' };

/** Nhãn song ngữ: [vi, en] → chuỗi theo ngôn ngữ. */
const pick = (pair, isEn) => (Array.isArray(pair) ? pair[isEn ? 1 : 0] : pair);
const categoryLabel = (c, isEn) => (isEn ? CATEGORY_EN[c] : SUPPORT_CATEGORY_LABELS[c]) || c;
const statusLabel = (s, isEn) => (isEn ? STATUS_EN[s] : SUPPORT_STATUS_LABELS[s]) || s;
const priorityLabel = (p, isEn) => (isEn ? PRIORITY_EN[p] : SUPPORT_PRIORITY_LABELS[p]) || p;

// Nội dung gửi cho cửa hàng nên luôn là tiếng Việt; chỉ nhãn nút song ngữ.
const QUICK_REPLIES = [
  {
    label: 'Tiếp nhận',
    labelEn: 'Acknowledge',
    text: 'Chào bạn, đội ngũ hỗ trợ kỹ thuật StockPilot đã tiếp nhận yêu cầu và đang tiến hành kiểm tra xử lý. Chúng tôi sẽ phản hồi lại bạn sớm nhất có thể.',
  },
  {
    label: 'Xin ảnh chụp lỗi',
    labelEn: 'Ask for screenshot',
    text: 'Bạn vui lòng gửi giúp ảnh chụp toàn màn hình lúc xảy ra sự cố (có thể nhấn Ctrl + V để dán trực tiếp ảnh vào ô chat này) để kỹ thuật hỗ trợ nhanh hơn nhé.',
  },
  {
    label: 'Hướng dẫn nhập Excel',
    labelEn: 'Excel import guide',
    text: 'Bạn vào mục "Nhập dữ liệu" trên thanh menu, chọn mẫu file phù hợp rồi tải file lên. Hệ thống sẽ kiểm tra hợp lệ từng dòng và báo lỗi chi tiết trước khi bạn ấn xác nhận nhập.',
  },
  {
    label: 'Xử lý hoàn tất',
    labelEn: 'Resolved',
    text: 'Vấn đề của bạn đã được kiểm tra và xử lý hoàn tất. Bạn vui lòng thao tác kiểm tra lại giúp nhé. Nếu cần hỗ trợ thêm thông tin gì khác, bạn cứ nhắn tin tại đây!',
  },
];

const STATUS_TABS = [
  { value: 'ACTIVE', vi: 'Đang mở', en: 'Open' },
  { value: 'OPEN', vi: 'Chờ hỗ trợ', en: 'Awaiting support', countKey: 'OPEN' },
  { value: 'IN_PROGRESS', vi: 'Đang xử lý', en: 'In progress', countKey: 'IN_PROGRESS' },
  { value: 'WAITING_STORE', vi: 'Chờ shop phản hồi', en: 'Waiting for store', countKey: 'WAITING_STORE' },
  { value: 'RESOLVED', vi: 'Đã giải quyết', en: 'Resolved', countKey: 'RESOLVED' },
  { value: 'ALL', vi: 'Tất cả yêu cầu', en: 'All tickets' },
];

function StatusBadge({ status }) {
  const { isEn } = useAdminText();
  return <Badge tone={STATUS_TONE[status] || 'neutral'}>{statusLabel(status, isEn)}</Badge>;
}

function TicketListItem({ ticket, selected, onSelect }) {
  const { t } = useAdminText();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={`w-full text-left px-4 py-3 cursor-pointer border-l-2 transition-colors focus-visible:outline-none focus-visible:bg-slate-50 ${
        selected ? 'bg-blue-50 border-l-blue-600' : 'border-l-transparent hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[12px] text-slate-500">
        <span className="flex items-center gap-2 min-w-0">
          {ticket.unread && (
            <span className="inline-flex rounded-full h-2 w-2 bg-blue-600 shrink-0" aria-label={t('Chưa đọc', 'Unread')} />
          )}
          <span className="font-semibold text-slate-900 truncate">{ticket.store?.name}</span>
        </span>
        <span className="shrink-0 text-[12px] tabular-nums" title={formatVNDateTime(ticket.lastMessageAt)}>
          {formatRelativeTime(ticket.lastMessageAt) || t('Vừa xong', 'Just now')}
        </span>
      </div>

      <p className={`text-[13px] line-clamp-2 mt-1 ${ticket.unread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
        {ticket.subject}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={ticket.status} />
        {ticket.priority === 'HIGH' && (
          <Badge tone="danger" dot={false}>
            {t('Gấp', 'Urgent')}
          </Badge>
        )}
        <span className="text-[12px] text-slate-500 ml-auto truncate">
          #{ticket.id} · {ticket.assignee ? ticket.assignee.fullName : t('Chưa giao', 'Unassigned')}
        </span>
      </div>
    </button>
  );
}

function StorePanel({ ticket, store, loadingStore, onReset, onRevoke }) {
  const { t, isEn } = useAdminText();
  const owner = store?.owners?.[0] || null;
  const ctx = ticket.storeContext || {};

  return (
    <div className="p-5 space-y-6 text-[13px]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[15px] text-slate-900 truncate">{ticket.store?.name}</h3>
          {(store ?? ticket.store)?.isActive === false ? (
            <Badge tone="danger">{t('Tạm khóa', 'Suspended')}</Badge>
          ) : (
            <Badge tone="success">{t('Hoạt động', 'Active')}</Badge>
          )}
        </div>
        <p className="text-[12px] text-slate-500 mt-0.5">
          {t('Mã cửa hàng: ', 'Store code: ')}
          <span className="font-mono">{ticket.store?.code}</span>
        </p>
      </div>

      <DetailList
        rows={[
          [t('Người gửi', 'Submitted by'), ticket.createdBy ? `${ticket.createdBy.fullName}` : '–'],
          [t('Chủ cửa hàng', 'Store owner'), loadingStore ? '…' : owner?.fullName || t('Chưa liên kết', 'Not linked')],
          [t('Email chủ shop', 'Owner email'), loadingStore ? '…' : owner?.email || '–'],
          [t('Số điện thoại', 'Phone'), ticket.store?.phone || store?.phone || '–'],
          [t('Thanh toán', 'Payments'), pick(PAYOS_TEXT[ctx.payos], isEn) || '–'],
        ]}
      />

      {/* Snapshot Quy mô */}
      <div>
        <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">{t('Quy mô cửa hàng', 'Store size')}</h4>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            [t('Số mã SKU', 'SKUs'), store?.stats?.skus],
            [t('Đơn 30 ngày', 'Orders (30d)'), store?.stats?.ordersLast30Days],
            [t('Tài khoản shop', 'Store accounts'), store ? (store.stats?.owners || 0) + (store.stats?.staff || 0) : undefined],
            [
              t('Đơn gần nhất', 'Last order'),
              store?.stats?.lastOrderAt
                ? formatRelativeTime(store.stats.lastOrderAt) || formatVNDateTime(store.stats.lastOrderAt)
                : store
                ? t('Chưa có', 'None yet')
                : undefined,
            ],
          ].map(([label, value]) => (
            <div key={label} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white">
              <p className="text-[12px] text-slate-500">{label}</p>
              <p className="text-[14px] font-medium text-slate-900 tabular-nums truncate mt-0.5">
                {loadingStore ? '…' : value ?? '–'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Lần nhập dữ liệu gần nhất */}
      <div>
        <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">{t('Lịch sử nhập file Excel', 'Excel import history')}</h4>
        {!ctx.recentImports?.length ? (
          <p className="text-[12px] text-slate-500 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
            {t('Cửa hàng chưa thực hiện nhập dữ liệu từ file.', 'This store has not imported any files.')}
          </p>
        ) : (
          <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white overflow-hidden">
            {ctx.recentImports.slice(0, 3).map((job) => (
              <li key={job.id} className="p-3 text-[12px]">
                <div className="flex justify-between items-center gap-2">
                  <span
                    className={`font-semibold ${
                      job.status === 'FAILED' ? 'text-red-700' : 'text-slate-900'
                    }`}
                  >
                    {pick(IMPORT_STATUS[job.status], isEn) || job.status}
                  </span>
                  <span className="text-slate-400 font-medium">
                    {formatRelativeTime(job.createdAt) || formatVNDateTime(job.createdAt)}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  {t(`${job.validRows}/${job.totalRows} dòng hợp lệ`, `${job.validRows}/${job.totalRows} valid rows`)}
                  {job.invalidRows > 0 && (
                    <span className="text-red-600 font-medium">{t(` · ${job.invalidRows} dòng lỗi`, ` · ${job.invalidRows} invalid`)}</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hành động Hỗ trợ Khẩn cấp */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{t('Thao tác hỗ trợ nhanh', 'Quick support actions')}</h4>
        <button
          type="button"
          onClick={onReset}
          disabled={!owner || !owner.isActive}
          className={`${ui.btnSecondary} w-full justify-start text-[12px]`}
        >
          <KeyRound className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          {t('Gửi mã đổi mật khẩu cho chủ shop', 'Send owner a password reset code')}
        </button>
        <button
          type="button"
          onClick={onRevoke}
          disabled={!owner}
          className={`${ui.btnSecondary} w-full justify-start text-[12px]`}
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          {t('Đăng xuất mọi thiết bị của chủ shop', 'Sign owner out of all devices')}
        </button>
        <Link
          to={`/admin/stores?id=${ticket.store?.id}`}
          className={`${ui.btnSecondary} w-full justify-start text-[12px]`}
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          {t('Mở hồ sơ chi tiết cửa hàng', 'Open store profile')}
        </Link>
      </div>
    </div>
  );
}

export function AdminSupportPage() {
  const { t, isEn } = useAdminText();
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
        setLastSyncTime(new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        if (!silent) setListError(apiErrorMessage(err));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [page, status, category, priority, query, assignee, isEn]
  );

  const loadTicket = useCallback(
    async (id) => {
      try {
        setTicket(await apiAdminGetTicket(id));
      } catch (err) {
        toast({ type: 'error', title: t('Không tải được nội dung yêu cầu', 'Could not load the ticket'), description: apiErrorMessage(err) });
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
      toast({ type: 'error', title: t('Không cập nhật được', 'Could not update'), description: apiErrorMessage(err) });
    } finally {
      setIsUpdating(false);
    }
  };

  const sendReply = async (body, files) => {
    try {
      await apiAdminReplyTicket(selectedId, body, isInternal, files);
      toast({
        type: 'success',
        title: isInternal ? t('Đã lưu ghi chú nội bộ', 'Internal note saved') : t('Đã gửi phản hồi tới cửa hàng', 'Reply sent to the store'),
      });
      await Promise.all([loadTicket(selectedId), loadList({ silent: true })]);
    } catch (err) {
      toast({ type: 'error', title: t('Không gửi được phản hồi', 'Could not send the reply'), description: apiErrorMessage(err) });
      throw err;
    }
  };

  const owner = store?.owners?.[0] || null;

  const assigneeOptions = [
    { value: '', label: t('Mọi người phụ trách', 'All assignees') },
    { value: 'none', label: t('Chưa giao việc', 'Unassigned') },
    ...admins.map((a) => ({ value: String(a.id), label: a.id === me?.id ? `${a.fullName} ${t('(bạn)', '(you)')}` : a.fullName })),
  ];

  const chips = [
    category && {
      key: 'category',
      label: categoryLabel(category, isEn),
      onRemove: () => updateParams({ category: '' }),
    },
    priority && {
      key: 'priority',
      label: t('Ưu tiên: ', 'Priority: ') + priorityLabel(priority, isEn)?.toLowerCase(),
      onRemove: () => updateParams({ priority: '' }),
    },
    assignee && {
      key: 'assignee',
      label: assigneeOptions.find((o) => o.value === assignee)?.label || t('Người phụ trách', 'Assignee'),
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
        title={t('Trung tâm Hỗ trợ Khách hàng', 'Customer support')}
        description={t('Hộp thư tiếp nhận và xử lý yêu cầu trợ giúp kỹ thuật, sự cố phần mềm gửi từ các cửa hàng.', 'Inbox for technical help requests and software issues sent by stores.')}
        badge={
          <Badge tone="neutral" dot={false}>
            {t(`${summary?.total ?? 0} yêu cầu`, `${summary?.total ?? 0} tickets`)}
          </Badge>
        }
        actions={
          <LiveIndicator status="synced" lastUpdated={lastSyncTime} onRefresh={() => loadList()} loading={isLoading} />
        }
      >
        <Tabs
          value={status}
          onChange={(v) => updateParams({ status: v === 'ACTIVE' ? '' : v })}
          tabs={STATUS_TABS.map((tab) => ({
            value: tab.value,
            label: t(tab.vi, tab.en),
            count: tab.countKey ? summary?.[tab.countKey] : undefined,
          }))}
        />
      </PageHeader>

      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Tìm theo tiêu đề yêu cầu hoặc tên shop…', 'Search by subject or store name…')}
            className="w-full lg:w-80"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label={t('Loại sự cố', 'Category')}
              value={category}
              onChange={(v) => updateParams({ category: v })}
              options={[
                { value: '', label: t('Mọi loại sự cố', 'All categories') },
                ...Object.keys(SUPPORT_CATEGORY_LABELS).map((value) => ({ value, label: categoryLabel(value, isEn) })),
              ]}
            />
            <FilterSelect
              label={t('Mức ưu tiên', 'Priority')}
              value={priority}
              onChange={(v) => updateParams({ priority: v })}
              options={[
                { value: '', label: t('Mọi mức ưu tiên', 'All priorities') },
                ...Object.keys(SUPPORT_PRIORITY_LABELS).map((value) => ({ value, label: priorityLabel(value, isEn) })),
              ]}
            />
            <FilterSelect
              label={t('Người phụ trách', 'Assignee')}
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
          aria-label={t('Danh sách yêu cầu hỗ trợ', 'Support tickets')}
        >
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[12px] font-medium text-slate-600">
            <span className="tabular-nums">{t(`Hộp thư (${tickets.length})`, `Inbox (${tickets.length})`)}</span>
            {summary?.unread > 0 && (
              <Badge tone="info" dot={false}>
                {t(`${summary.unread} tin mới`, `${summary.unread} new`)}
              </Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : listError ? (
              <ErrorState message={listError} onRetry={() => loadList()} />
            ) : tickets.length === 0 ? (
              <EmptyState
                title={status === 'ACTIVE' && !chips.length && !query ? t('Không có yêu cầu nào tồn đọng', 'No open tickets') : t('Không có yêu cầu phù hợp', 'No matching tickets')}
                description={
                  status === 'ACTIVE' && !chips.length && !query
                    ? t('Tuyệt vời! Mọi sự cố kỹ thuật đều đã được xử lý xong.', 'Every technical issue has been handled.')
                    : t('Hãy thử bỏ bớt các bộ lọc đang kích hoạt.', 'Try removing some filters.')
                }
                action={
                  chips.length || query ? (
                    <button type="button" onClick={clearFilters} className={ui.btnSecondary}>
                      {t('Xóa bộ lọc', 'Clear filters')}
                    </button>
                  ) : null
                }
              />
            ) : (
              tickets.map((item) => (
                <TicketListItem
                  key={item.id}
                  ticket={item}
                  selected={selectedId === item.id}
                  onSelect={() => updateParams({ ticket: String(item.id) }, false)}
                />
              ))
            )}
          </div>

          {!listError && pagination?.totalPages > 1 && (
            <Pagination
              pagination={pagination}
              onPage={(p) => updateParams({ page: String(p) }, false)}
              disabled={isLoading}
              unit={t('yêu cầu', 'tickets')}
            />
          )}
        </aside>

        {/* Cột 2: Khung Hội Thoại & Composer */}
        <section
          className={`${ui.card} overflow-hidden flex-col min-h-135 xl:min-h-0 ${selectedId ? 'flex' : 'hidden xl:flex'}`}
          aria-label={t('Khung xử lý hội thoại', 'Conversation')}
        >
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <span className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                <LifeBuoy className="w-5 h-5" aria-hidden="true" />
              </span>
              <h3 className="text-[14px] font-semibold text-slate-900">{t('Chọn một yêu cầu để phản hồi', 'Select a ticket to reply')}</h3>
              <p className="text-[13px] text-slate-500 max-w-[40ch] mt-1">
                {t('Xem toàn bộ lịch sử trao đổi, đính kèm ảnh lỗi và lưu lại các ghi chú nội bộ của đội ngũ kỹ thuật.', 'See the full conversation, screenshots and internal notes from the team.')}
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
              <header className="px-5 py-4 border-b border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => updateParams({ ticket: '' }, false)}
                      className="xl:hidden mb-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> {t('Trở lại hộp thư', 'Back to inbox')}
                    </button>
                    <h2 className="text-[16px] font-semibold text-slate-900 leading-snug">{ticket.subject}</h2>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      #{ticket.id} · <span className="font-medium text-slate-700">{categoryLabel(ticket.category, isEn)}</span> ·{' '}
                      <span className="tabular-nums">{formatVNDateTime(ticket.createdAt)}</span>
                    </p>
                  </div>

                  {ticket.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => updateTicket({ status: 'RESOLVED' }, t('Đã đánh dấu giải quyết hoàn tất', 'Marked as resolved'))}
                      className={`${ui.btnSecondary} shrink-0`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      {t('Giải quyết xong', 'Mark resolved')}
                    </button>
                  )}
                </div>

                {/* Điều khiển Trạng thái / Ưu tiên / Người phụ trách */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label htmlFor="ticket-status" className="block text-[12px] text-slate-500 mb-1">
                      {t('Trạng thái', 'Status')}
                    </label>
                    <select
                      id="ticket-status"
                      value={ticket.status}
                      disabled={isUpdating}
                      onChange={(e) => updateTicket({ status: e.target.value }, t('Đã đổi trạng thái', 'Status changed'))}
                      className={`${ui.select} h-8 py-1`}
                    >
                      {Object.keys(SUPPORT_STATUS_LABELS).map((v) => (
                        <option key={v} value={v}>
                          {statusLabel(v, isEn)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ticket-priority" className="block text-[12px] text-slate-500 mb-1">
                      {t('Mức ưu tiên', 'Priority')}
                    </label>
                    <select
                      id="ticket-priority"
                      value={ticket.priority}
                      disabled={isUpdating}
                      onChange={(e) => updateTicket({ priority: e.target.value }, t('Đã đổi mức ưu tiên', 'Priority changed'))}
                      className={`${ui.select} h-8 py-1`}
                    >
                      {Object.keys(SUPPORT_PRIORITY_LABELS).map((v) => (
                        <option key={v} value={v}>
                          {priorityLabel(v, isEn)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ticket-assignee" className="block text-[12px] text-slate-500 mb-1">
                      {t('Người phụ trách', 'Assignee')}
                    </label>
                    <select
                      id="ticket-assignee"
                      value={ticket.assignee?.id ?? ''}
                      disabled={isUpdating}
                      onChange={(e) =>
                        updateTicket({ assigneeId: e.target.value ? Number(e.target.value) : null }, t('Đã đổi người phụ trách', 'Assignee changed'))
                      }
                      className={`${ui.select} h-8 py-1`}
                    >
                      <option value="">{t('Chưa giao', 'Unassigned')}</option>
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
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 min-h-65">
                <MessageThread
                  messages={ticket.messages || []}
                  viewerIsAdmin
                  fetchAttachment={apiAdminFetchAttachment}
                />
              </div>

              {/* Composer */}
              <div className={isInternal ? 'border-t-2 border-amber-400' : 'border-t border-slate-200'}>
                {isInternal && (
                  <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-[12px] font-medium text-amber-900 flex items-center gap-1.5" role="status">
                    <Lock className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                    {t('Ghi chú nội bộ — cửa hàng không nhìn thấy, chỉ quản trị viên đọc được.', 'Internal note — hidden from the store, visible to administrators only.')}
                  </div>
                )}
                <Composer
                  key={ticket.id}
                  onSend={sendReply}
                  tone={isInternal ? 'internal' : 'default'}
                  quickReplies={isInternal ? [] : QUICK_REPLIES.map((r) => ({ label: isEn ? r.labelEn : r.label, text: r.text }))}
                  placeholder={
                    isInternal
                      ? t('Nhập ghi chú nội bộ dành cho các Admin khác…', 'Write an internal note for other admins…')
                      : t(`Gửi phản hồi tới ${ticket.store?.name || 'cửa hàng'}…`, `Reply to ${ticket.store?.name || 'the store'}…`)
                  }
                  onError={(msg) => toast({ type: 'warning', title: t('Không đính kèm được tệp', 'Could not attach the file'), description: msg })}
                  extra={
                    <label className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="accent-amber-600 w-4 h-4 cursor-pointer"
                      />
                      <Lock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                      {t('Ghi chú nội bộ', 'Internal note')}
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
          aria-label={t('Thông tin cửa hàng', 'Store information')}
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
            <div className="p-8 text-center text-[13px] text-slate-500">
              <span className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
                <Store className="w-5 h-5" aria-hidden="true" />
              </span>
              {t('Chọn một yêu cầu để xem thông tin tổng hợp của cửa hàng gửi ticket.', 'Select a ticket to see the sending store\'s summary.')}
            </div>
          )}
        </aside>
      </div>

      {/* Dialogs */}
      {dialog === 'reset' && owner && (
        <ConfirmDialog
          title={t(`Gửi mã đặt lại mật khẩu cho ${owner.fullName}?`, `Send a password reset code to ${owner.fullName}?`)}
          description={t(
            `Mã xác thực có hiệu lực 15 phút sẽ được gửi tới email ${owner.email}. Bạn không thấy mã và không đặt mật khẩu thay cho chủ cửa hàng.`,
            `A code valid for 15 minutes is emailed to ${owner.email}. You never see the code and never set the password for the owner.`
          )}
          confirmLabel={t('Gửi mã OTP', 'Send code')}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            try {
              const res = await apiSendAdminPasswordReset(owner.id);
              const sent = res.emailSent || res.simulated;
              toast({
                type: sent ? 'success' : 'warning',
                title: sent ? t('Đã gửi mã đặt lại mật khẩu', 'Password reset code sent') : t('Chưa gửi được email', 'Email not sent'),
                description: sent ? t(`Đã gửi tới ${res.email}.`, `Sent to ${res.email}.`) : t('Máy chủ chưa cấu hình gửi email (SMTP).', 'The server has no email (SMTP) configured.'),
              });
              setDialog(null);
            } catch (err) {
              toast({ type: 'error', title: t('Không gửi được mã', 'Could not send the code'), description: apiErrorMessage(err) });
            }
          }}
        />
      )}

      {dialog === 'revoke' && owner && (
        <ConfirmDialog
          title={t(`Đăng xuất ${owner.fullName} khỏi mọi thiết bị?`, `Sign ${owner.fullName} out of every device?`)}
          description={t('Dùng khi chủ shop báo mất máy hoặc nghi ngờ lộ mật khẩu. Tài khoản không bị khóa.', 'Use when the owner lost a device or suspects a leaked password. The account stays active.')}
          confirmLabel={t('Đăng xuất thiết bị', 'Sign out devices')}
          danger
          reason={{
            required: true,
            initial: t(`Theo yêu cầu hỗ trợ #${ticket?.id}`, `Per support ticket #${ticket?.id}`),
            placeholder: t('Ví dụ: Chủ shop báo mất thiết bị cá nhân', 'e.g. Owner reported a lost device'),
          }}
          onClose={() => setDialog(null)}
          onConfirm={async ({ reason }) => {
            try {
              const res = await apiRevokeAdminUserSessions(owner.id, reason);
              toast({
                type: 'success',
                title: t('Đã đăng xuất mọi thiết bị', 'Signed out of all devices'),
                description: t(`Đã thu hồi ${res.revokedSessions} phiên đăng nhập.`, `${res.revokedSessions} sessions revoked.`),
              });
              setDialog(null);
            } catch (err) {
              toast({ type: 'error', title: t('Không thực hiện được', 'Action failed'), description: apiErrorMessage(err) });
            }
          }}
        />
      )}
    </div>
  );
}

export default AdminSupportPage;
