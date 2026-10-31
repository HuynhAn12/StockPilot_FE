import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  RefreshCw,
  Check,
  Minus,
  Loader2,
  KeyRound,
  LogOut,
  Lock,
  Unlock,
  Edit2,
  Shield,
  Store,
  Clock,
  Laptop,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import {
  apiListAdminUsers,
  apiGetAdminUser,
  apiCreateAdminUser,
  apiUpdateAdminUser,
  apiUpdateAdminUserStatus,
  apiRevokeAdminUserSessions,
  apiSendAdminPasswordReset,
  apiListAdminStores,
  formatVNDateTime,
} from '../../services/adminService';
import {
  ROUTE_PERMISSIONS,
  ROLES,
  canViewCostPrice,
  canApprovePricing,
  canCancelOrder,
  canDeleteProduct,
} from '../../config/permissions.config';
import { actionLabel, apiErrorMessage, formatRelativeTime, roleLabel } from './adminLabels';
import { adminStyles as ui } from './adminStyles';
import {
  PageHeader,
  Tabs,
  Toolbar,
  SearchInput,
  FilterSelect,
  FilterChips,
  TableCard,
  Th,
  Td,
  Checkbox,
  BulkActionBar,
  TableBody,
  EmptyState,
  Pagination,
  Badge,
  Avatar,
  RowMenu,
  ConfirmDialog,
  Modal,
  Drawer,
  DetailList,
  Section,
  useDebounced,
} from './components/AdminUI';

const ROLE_OPTIONS = [
  { value: '', label: 'Mọi vai trò' },
  { value: 'SHOP_OWNER', label: 'Chủ cửa hàng' },
  { value: 'WAREHOUSE_STAFF', label: 'Nhân viên kho' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Đã bị khóa' },
];

// ─── Cấu hình Ma trận phân quyền ─────────────────────────────────────────────
const PERMISSION_GROUPS = [
  {
    title: 'Vận hành Bán hàng & Khách hàng',
    description: 'Quyền bán hàng, tạo hóa đơn và xử lý đơn hàng tại quầy',
    rules: [
      { name: 'Bán hàng tại quầy (POS)', route: '/pos' },
      { name: 'Xem danh sách đơn hàng', route: '/orders' },
      { name: 'Hủy đơn hàng', check: (role) => canCancelOrder(role) },
    ],
  },
  {
    title: 'Kho vận & Sản phẩm',
    description: 'Kiểm kê kho, nhập/xuất và quản lý danh mục sản phẩm',
    rules: [
      { name: 'Xem & quản lý sản phẩm', route: '/products' },
      { name: 'Nhập / xuất kho & kiểm kê', route: '/inventory' },
      { name: 'Nhận cảnh báo tồn kho thấp', route: '/alerts' },
      { name: 'Xóa sản phẩm khỏi hệ thống', check: (role) => canDeleteProduct(role) },
      { name: 'Nhập dữ liệu hàng loạt từ file Excel', route: '/import' },
    ],
  },
  {
    title: 'Tài chính & Chiến lược giá',
    description: 'Báo cáo doanh số, chi phí vốn và chính sách giá thông minh',
    rules: [
      { name: 'Xem giá vốn, lợi nhuận & doanh thu', check: (role) => canViewCostPrice(role) },
      { name: 'Phân tích & Báo cáo chuyên sâu', route: '/analytics' },
      { name: 'Gợi ý giá bán tối ưu (AI Pricing)', route: '/pricing' },
      { name: 'Duyệt áp dụng giá đề xuất', check: (role) => canApprovePricing(role) },
    ],
  },
  {
    title: 'Quản trị Nền tảng & Cấu hình',
    description: 'Cài đặt hệ thống, quản lý tài khoản và nhật ký kiểm toán',
    rules: [
      { name: 'Quản lý người dùng & phân quyền', route: '/admin/users' },
      { name: 'Quản lý các cửa hàng thuê nền tảng', route: '/admin/stores' },
      { name: 'Xem nhật ký kiểm toán bất biến (Audit)', route: '/admin/audit-log' },
      { name: 'Xử lý hộp thư hỗ trợ khách hàng', route: '/admin/support' },
      { name: 'Cấu hình hệ thống & Giám sát AI', route: '/admin/system' },
      { name: 'Cài đặt thông tin cửa hàng', route: '/settings' },
      { name: 'Quản lý nhân viên nội bộ shop', route: '/staff' },
    ],
  },
];

const MATRIX_ROLES = [
  { key: ROLES.SHOP_OWNER, label: 'Chủ cửa hàng', desc: 'Toàn quyền trong cửa hàng của mình' },
  { key: ROLES.WAREHOUSE_STAFF, label: 'Nhân viên kho', desc: 'Thực thi bán hàng và kiểm kho' },
  { key: ROLES.ADMIN, label: 'Quản trị viên', desc: 'Quản lý nền tảng toàn diện' },
];

function PermissionMatrix() {
  const checkRule = (rule, role) => {
    if (rule.check) {
      if (role === ROLES.ADMIN) return true;
      return rule.check(role);
    }
    if (rule.route) {
      const allowed = ROUTE_PERMISSIONS[rule.route] || [];
      return allowed.includes(role);
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-xl text-[13px] text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#1D4ED8]">Nguyên tắc phân quyền Role-Based Access Control (RBAC)</p>
          <p className="text-[#334155] leading-relaxed">
            Quyền hạn được kiểm soát đa lớp cả ở Frontend và Backend API qua middleware xác thực. Chủ cửa hàng toàn quyền quyết định
            nhân sự của shop mình; Quản trị viên chỉ can thiệp khi có yêu cầu hỗ trợ sự cố tài khoản.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.title} className={ui.card}>
            <div className="px-5 py-3.5 border-b border-[#F1F5F9] bg-[#FAFBFC] flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#0F172A]">{group.title}</h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">{group.description}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50/50 text-[#475569]">
                    <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider w-1/2">Chức năng</th>
                    {MATRIX_ROLES.map((r) => (
                      <th key={r.key} className="px-4 py-3 text-[12px] font-semibold text-center uppercase tracking-wider">
                        {r.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {group.rules.map((rule) => (
                    <tr key={rule.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[#1E293B]">{rule.name}</td>
                      {MATRIX_ROLES.map((r) => {
                        const allowed = checkRule(rule, r.key);
                        return (
                          <td key={r.key} className="px-4 py-3.5 text-center">
                            {allowed ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                                <Minus className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────
function CreateAdminModal({ onClose, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', actorPassword: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({ type: 'warning', title: 'Mật khẩu quá ngắn', description: 'Mật khẩu cần ít nhất 8 ký tự.' });
      return;
    }
    setBusy(true);
    try {
      await apiCreateAdminUser(form);
      toast({ type: 'success', title: 'Đã tạo quản trị viên', description: `${form.email} có thể đăng nhập ngay.` });
      onCreated();
    } catch (err) {
      toast({ type: 'error', title: 'Không tạo được tài khoản', description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Tạo Quản trị viên Nền tảng"
      description="Tài khoản Quản trị viên có toàn quyền kiểm soát nền tảng. Lưu ý chỉ cấp cho nhân sự nội bộ."
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            Hủy
          </button>
          <button type="submit" form="create-admin-form" disabled={busy} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Tạo tài khoản
          </button>
        </>
      }
    >
      <form id="create-admin-form" onSubmit={submit} className="space-y-4" autoComplete="off">
        <div>
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Họ và tên</label>
          <input
            type="text"
            required
            autoComplete="off"
            placeholder="Ví dụ: Nguyễn Văn An"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={ui.input}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Email đăng nhập</label>
          <input
            type="email"
            required
            autoComplete="off"
            placeholder="admin@stockpilot.vn"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={ui.input}
          />
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Mật khẩu ban đầu</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={ui.input}
          />
        </div>
        <div className="pt-3 border-t border-slate-200">
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Mật khẩu của bạn để xác nhận</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Nhập mật khẩu của bạn để xác thực cấp quyền"
            value={form.actorPassword}
            onChange={(e) => setForm({ ...form, actorPassword: e.target.value })}
            className={ui.input}
          />
        </div>
      </form>
    </Modal>
  );
}

function EditNameModal({ user, onClose, onSaved }) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user.fullName || '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiUpdateAdminUser(user.id, { fullName: fullName.trim() });
      toast({ type: 'success', title: 'Đã lưu tên người dùng' });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: 'Không lưu được', description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Sửa tên hiển thị"
      description={`Email ${user.email} và vai trò gắn liền với bảo mật và hợp đồng, không thay đổi tại đây.`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            Hủy
          </button>
          <button type="submit" form="edit-name-form" disabled={busy || fullName.trim().length < 2} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Lưu thay đổi
          </button>
        </>
      }
    >
      <form id="edit-name-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Họ và tên</label>
          <input
            required
            minLength={2}
            maxLength={255}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={ui.input}
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}

// ─── Trang Chính ─────────────────────────────────────────────────────────────
export function AdminUsersPage() {
  const { user: me } = useAuthStore();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const tab = params.get('tab') === 'roles' ? 'roles' : 'list';
  const role = params.get('role') || '';
  const status = params.get('status') || '';
  const storeId = params.get('store') || '';
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 20;

  const [search, setSearch] = useState(params.get('q') || '');
  const debouncedSearch = useDebounced(search);

  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected IDs for Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Detail Drawer
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');

  // Dialogs
  const [dialog, setDialog] = useState(null); // { type: 'create' | 'edit' | 'reset' | 'revoke' | 'lock' | 'unlock', user }

  const setParam = (key, value, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage && key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if ((params.get('q') || '') !== debouncedSearch) setParam('q', debouncedSearch);
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiListAdminUsers({
        page,
        limit,
        search: params.get('q') || '',
        role,
        isActive: status,
        storeId,
      });
      setRows(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, role, status, storeId, params]);

  useEffect(() => {
    if (tab === 'list') load();
  }, [load, tab]);

  useEffect(() => {
    apiListAdminStores({ limit: 100 })
      .then((res) => setStores(res.data || []))
      .catch(() => setStores([]));
  }, []);

  const loadDetail = useCallback(
    async (id) => {
      try {
        setDetail(await apiGetAdminUser(id));
      } catch (err) {
        toast({ type: 'error', title: 'Không mở được hồ sơ', description: apiErrorMessage(err) });
        setDetailId(null);
      }
    },
    [toast]
  );

  useEffect(() => {
    setDetail(null);
    setDrawerTab('overview');
    if (detailId) loadDetail(detailId);
  }, [detailId, loadDetail]);

  const refreshAfterChange = (userId) => {
    setDialog(null);
    load();
    if (detailId === userId) loadDetail(userId);
  };

  const sendReset = async (u) => {
    try {
      const res = await apiSendAdminPasswordReset(u.id);
      toast({
        type: res.emailSent || res.simulated ? 'success' : 'warning',
        title: res.emailSent || res.simulated ? 'Đã gửi mã đặt lại mật khẩu' : 'Chưa gửi được email',
        description:
          res.emailSent || res.simulated
            ? `Mã bảo mật có hiệu lực 15 phút, gửi tới ${res.email}.`
            : 'Máy chủ chưa cấu hình gửi email (SMTP).',
      });
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được mã', description: apiErrorMessage(err) });
      throw err;
    }
  };

  // Sorting
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const sorted = [...rows];
    sorted.sort((a, b) => {
      let vA = a[sortKey];
      let vB = b[sortKey];

      if (sortKey === 'fullName') {
        vA = a.fullName || '';
        vB = b.fullName || '';
        return sortDirection === 'asc' ? vA.localeCompare(vB, 'vi') : vB.localeCompare(vA, 'vi');
      }
      if (sortKey === 'lastLoginAt' || sortKey === 'createdAt') {
        const timeA = vA ? new Date(vA).getTime() : 0;
        const timeB = vB ? new Date(vB).getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortKey === 'isActive') {
        return sortDirection === 'asc' ? Number(a.isActive) - Number(b.isActive) : Number(b.isActive) - Number(a.isActive);
      }
      return 0;
    });
    return sorted;
  }, [rows, sortKey, sortDirection]);

  // Bulk actions handling
  const isAllSelected = sortedRows.length > 0 && selectedIds.length === sortedRows.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < sortedRows.length;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(sortedRows.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const isSelf = (u) => u?.id === me?.id;

  const actionsFor = (u) => [
    { label: 'Xem chi tiết', icon: ExternalLink, onClick: () => setDetailId(u.id) },
    { label: 'Sửa tên hiển thị', icon: Edit2, onClick: () => setDialog({ type: 'edit', user: u }) },
    {
      label: 'Gửi mã đặt lại mật khẩu',
      icon: KeyRound,
      onClick: () => setDialog({ type: 'reset', user: u }),
      hidden: isSelf(u),
      disabled: !u.isActive,
    },
    {
      label: 'Đăng xuất khỏi mọi thiết bị',
      icon: LogOut,
      onClick: () => setDialog({ type: 'revoke', user: u }),
      hidden: isSelf(u),
    },
    u.isActive
      ? { label: 'Khóa tài khoản', icon: Lock, onClick: () => setDialog({ type: 'lock', user: u }), danger: true, hidden: isSelf(u) }
      : { label: 'Mở khóa tài khoản', icon: Unlock, onClick: () => setDialog({ type: 'unlock', user: u }), hidden: isSelf(u) },
  ];

  const chips = [
    role && { key: 'role', label: ROLE_OPTIONS.find((o) => o.value === role)?.label, onRemove: () => setParam('role', '') },
    status && { key: 'status', label: STATUS_OPTIONS.find((o) => o.value === status)?.label, onRemove: () => setParam('status', '') },
    storeId && {
      key: 'store',
      label: stores.find((s) => String(s.id) === storeId)?.name || 'Cửa hàng',
      onRemove: () => setParam('store', ''),
    },
  ].filter(Boolean);

  const clearFilters = () => {
    setSearch('');
    setParams(tab === 'roles' ? { tab } : {}, { replace: true });
  };

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title="Người dùng & Phân quyền"
        description="Quản lý toàn bộ danh sách tài khoản thuộc mọi cửa hàng và quản trị viên nền tảng."
        badge={<Badge tone="neutral">{pagination?.total ?? 0} tài khoản</Badge>}
        actions={
          <>
            <button
              type="button"
              onClick={load}
              disabled={isLoading || tab !== 'list'}
              className={ui.btnSecondary}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button type="button" onClick={() => setDialog({ type: 'create' })} className={ui.btnPrimary}>
              <UserPlus className="w-3.5 h-3.5" />
              Tạo quản trị viên
            </button>
          </>
        }
      >
        <Tabs
          value={tab}
          onChange={(v) => {
            setSelectedIds([]);
            setParams(v === 'roles' ? { tab: 'roles' } : {}, { replace: true });
          }}
          tabs={[
            { value: 'list', label: 'Danh sách người dùng', count: pagination?.total },
            { value: 'roles', label: 'Ma trận vai trò & quyền hạn' },
          ]}
        />
      </PageHeader>

      {tab === 'roles' ? (
        <PermissionMatrix />
      ) : (
        <>
          <div className="space-y-3">
            <Toolbar>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Tìm theo họ tên hoặc email…"
                className="w-full lg:w-80"
              />
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect label="Vai trò" value={role} onChange={(v) => setParam('role', v)} options={ROLE_OPTIONS} />
                <FilterSelect label="Trạng thái" value={status} onChange={(v) => setParam('status', v)} options={STATUS_OPTIONS} />
                <FilterSelect
                  label="Cửa hàng"
                  value={storeId}
                  onChange={(v) => setParam('store', v)}
                  options={[{ value: '', label: 'Mọi cửa hàng' }, ...stores.map((s) => ({ value: String(s.id), label: s.name }))]}
                  className="max-w-55"
                />
              </div>
            </Toolbar>
            <FilterChips chips={chips} onClearAll={clearFilters} />
          </div>

          <TableCard
            footer={
              !error &&
              pagination?.total > 0 && (
                <Pagination
                  pagination={pagination}
                  onPage={(p) => setParam('page', String(p), false)}
                  onLimitChange={(l) => setParam('limit', String(l), true)}
                  disabled={isLoading}
                  unit="tài khoản"
                />
              )
            }
          >
            <table className="w-full min-w-200">
              <thead>
                <tr>
                  <th className="w-10 px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] text-center">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={handleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </th>
                  <Th sortKey="fullName" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                    Người dùng
                  </Th>
                  <Th>Vai trò</Th>
                  <Th>Cửa hàng</Th>
                  <Th sortKey="lastLoginAt" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                    Đăng nhập gần nhất
                  </Th>
                  <Th sortKey="isActive" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                    Trạng thái
                  </Th>
                  <th className="w-12 px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <TableBody
                loading={isLoading}
                error={error}
                onRetry={load}
                columns={7}
                empty={
                  sortedRows.length === 0 && (
                    <EmptyState
                      title="Không tìm thấy tài khoản phù hợp"
                      description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc đang kích hoạt."
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
                {sortedRows.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setDetailId(u.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(checked) => handleSelectRow(u.id, checked)}
                          aria-label={`Chọn ${u.fullName}`}
                        />
                      </td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} tone={u.role === 'ADMIN' ? 'brand' : 'neutral'} size={36} />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#0F172A] truncate flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf(u) && (
                                <span className="text-[11px] font-semibold px-2 py-0.2 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                                  Bạn
                                </span>
                              )}
                            </p>
                            <p className="text-[12px] text-[#64748B] truncate mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-[#334155]">
                          {u.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-[#2563EB]" />}
                          {u.role === 'SHOP_OWNER' && <Store className="w-3.5 h-3.5 text-amber-600" />}
                          {roleLabel(u.role)}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[#334155] font-medium">
                          {u.store?.name || (u.role === 'ADMIN' ? 'Quản trị Nền tảng' : '—')}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {u.lastLoginAt ? (
                          <div>
                            <p className="text-[#0F172A] font-medium" title={formatVNDateTime(u.lastLoginAt)}>
                              {formatRelativeTime(u.lastLoginAt) || formatVNDateTime(u.lastLoginAt)}
                            </p>
                            <p className="text-[11px] text-[#94A3B8]">{formatVNDateTime(u.lastLoginAt)}</p>
                          </div>
                        ) : (
                          <span className="text-[#94A3B8] italic">Chưa từng đăng nhập</span>
                        )}
                      </Td>
                      <Td>
                        {u.isActive ? (
                          <Badge tone="success">Đang hoạt động</Badge>
                        ) : (
                          <Badge tone="danger">Đã bị khóa</Badge>
                        )}
                      </Td>
                      <Td align="right">
                        <RowMenu items={actionsFor(u)} label={`Thao tác với ${u.fullName}`} />
                      </Td>
                    </tr>
                  );
                })}
              </TableBody>
            </table>
          </TableCard>

          {/* Bulk Action Bar */}
          <BulkActionBar
            selectedCount={selectedIds.length}
            onClear={() => setSelectedIds([])}
            actions={[
              {
                label: 'Đăng xuất thiết bị',
                icon: LogOut,
                onClick: () => {
                  toast({
                    type: 'info',
                    title: 'Thao tác hàng loạt',
                    description: `Đang chuẩn bị đăng xuất phiên cho ${selectedIds.length} người dùng đã chọn.`,
                  });
                },
              },
            ]}
          />
        </>
      )}

      {/* Drawer Chi Tiết Người Dùng */}
      {detailId && (
        <Drawer
          title={detail?.fullName || 'Hồ sơ người dùng'}
          subtitle={detail?.email}
          badge={
            detail && (
              <Badge tone={detail.isActive ? 'success' : 'danger'}>
                {detail.isActive ? 'Hoạt động' : 'Bị khóa'}
              </Badge>
            )
          }
          tabs={[
            { key: 'overview', label: 'Tổng quan' },
            { key: 'history', label: 'Lịch sử thao tác', count: detail?.recentAuditLogs?.length },
          ]}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={() => setDetailId(null)}
          footer={
            detail && (
              <>
                <button
                  type="button"
                  onClick={() => setDialog({ type: 'edit', user: detail })}
                  className={ui.btnSecondary}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Sửa tên
                </button>
                {!isSelf(detail) &&
                  (detail.isActive ? (
                    <button
                      type="button"
                      onClick={() => setDialog({ type: 'lock', user: detail })}
                      className={ui.btnDanger}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Khóa tài khoản
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDialog({ type: 'unlock', user: detail })}
                      className={ui.btnPrimary}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Mở khóa tài khoản
                    </button>
                  ))}
              </>
            )
          }
        >
          {!detail ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-5 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : drawerTab === 'overview' ? (
            <div className="space-y-6">
              <DetailList
                rows={[
                  ['Họ và tên', detail.fullName],
                  ['Email', detail.email],
                  ['Vai trò', roleLabel(detail.role)],
                  ['Cửa hàng', detail.store?.name || (detail.role === 'ADMIN' ? 'Quản trị Nền tảng' : null)],
                  [
                    'Đăng nhập gần nhất',
                    detail.lastLoginAt ? formatVNDateTime(detail.lastLoginAt) : 'Chưa từng đăng nhập',
                  ],
                  [
                    'Phiên đăng nhập hiện tại',
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                      <Laptop className="w-4 h-4 text-slate-500" />
                      {detail.activeSessionCount ?? 0} thiết bị
                    </span>,
                  ],
                  ['Ngày tạo tài khoản', formatVNDateTime(detail.createdAt)],
                ]}
              />

              {!isSelf(detail) && (
                <Section title="Hỗ trợ & Bảo mật tài khoản">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!detail.isActive}
                      onClick={() => setDialog({ type: 'reset', user: detail })}
                      className={`${ui.btnSecondary} justify-start text-left p-3`}
                    >
                      <KeyRound className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <div>
                        <p className="font-semibold text-[#0F172A] text-[13px]">Gửi mã đổi mật khẩu</p>
                        <p className="text-[11px] text-[#64748B]">Mã OTP gửi qua email</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={!detail.activeSessionCount}
                      onClick={() => setDialog({ type: 'revoke', user: detail })}
                      className={`${ui.btnSecondary} justify-start text-left p-3`}
                    >
                      <LogOut className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-[#0F172A] text-[13px]">Đăng xuất mọi thiết bị</p>
                        <p className="text-[11px] text-[#64748B]">Thu hồi token ngay lập tức</p>
                      </div>
                    </button>
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-bold text-[#0F172A]">Hoạt động gần đây</h4>
                <Link
                  to={`/admin/audit-log?user=${detail.id}`}
                  className="text-[12px] font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  Xem toàn bộ log <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {detail.recentAuditLogs?.length ? (
                <ul className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] bg-white overflow-hidden shadow-2xs">
                  {detail.recentAuditLogs.map((log) => (
                    <li key={log.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#0F172A] truncate">
                          {actionLabel(log.action)}
                        </p>
                        <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                          {log.store?.name || 'Nền tảng'}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-[#94A3B8] shrink-0" title={formatVNDateTime(log.createdAt)}>
                        {formatRelativeTime(log.createdAt) || formatVNDateTime(log.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-[#64748B] text-[13px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa ghi nhận hoạt động nào từ tài khoản này.
                </div>
              )}
            </div>
          )}
        </Drawer>
      )}

      {/* Dialogs */}
      {dialog?.type === 'create' && (
        <CreateAdminModal
          onClose={() => setDialog(null)}
          onCreated={() => {
            setDialog(null);
            load();
          }}
        />
      )}

      {dialog?.type === 'edit' && (
        <EditNameModal
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSaved={() => refreshAfterChange(dialog.user.id)}
        />
      )}

      {dialog?.type === 'reset' && (
        <ConfirmDialog
          title={`Gửi mã đặt lại mật khẩu cho ${dialog.user.fullName}?`}
          description={`Mã xác thực có hiệu lực 15 phút sẽ được gửi trực tiếp tới email ${dialog.user.email}. Quản trị viên không thể can thiệp hoặc thấy mật khẩu này.`}
          confirmLabel="Gửi mã OTP"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await sendReset(dialog.user);
            refreshAfterChange(dialog.user.id);
          }}
        />
      )}

      {dialog?.type === 'revoke' && (
        <ConfirmDialog
          title={`Đăng xuất ${dialog.user.fullName} khỏi mọi thiết bị?`}
          description="Dùng khi người dùng báo mất thiết bị hoặc có nghi vấn lộ mật khẩu. Tài khoản vẫn hợp lệ và có thể đăng nhập lại."
          confirmLabel="Đăng xuất thiết bị"
          danger
          reason={{ required: true, placeholder: 'Ví dụ: Người dùng báo mất điện thoại cá nhân' }}
          onClose={() => setDialog(null)}
          onConfirm={async ({ reason }) => {
            try {
              const res = await apiRevokeAdminUserSessions(dialog.user.id, reason);
              toast({
                type: 'success',
                title: 'Đã thu hồi phiên đăng nhập',
                description: `Đã đăng xuất ${res.revokedSessions} thiết bị thành công.`,
              });
              refreshAfterChange(dialog.user.id);
            } catch (err) {
              toast({ type: 'error', title: 'Không thực hiện được', description: apiErrorMessage(err) });
            }
          }}
        />
      )}

      {(dialog?.type === 'lock' || dialog?.type === 'unlock') && (
        <ConfirmDialog
          title={
            dialog.type === 'lock'
              ? `Khóa tài khoản ${dialog.user.fullName}?`
              : `Mở khóa tài khoản ${dialog.user.fullName}?`
          }
          description={
            dialog.type === 'lock'
              ? 'Người dùng sẽ bị thu hồi toàn bộ phiên đăng nhập lập tức và không thể truy cập hệ thống cho đến khi được mở khóa.'
              : 'Người dùng sẽ có thể đăng nhập và tiếp tục làm việc bình thường ngay sau khi mở khóa.'
          }
          confirmLabel={dialog.type === 'lock' ? 'Khóa tài khoản' : 'Mở khóa'}
          danger={dialog.type === 'lock'}
          reason={{
            required: dialog.type === 'lock',
            placeholder:
              dialog.type === 'lock'
                ? 'Ví dụ: Tạm khóa do nghi vấn xâm nhập trái phép'
                : 'Ví dụ: Đã xác thực chính chủ tài khoản',
          }}
          password={
            dialog.type === 'lock' && dialog.user.role === 'ADMIN'
              ? { hint: 'Khóa một Quản trị viên khác yêu cầu bạn xác nhận lại mật khẩu của mình.' }
              : null
          }
          onClose={() => setDialog(null)}
          onConfirm={async ({ reason, password }) => {
            try {
              const res = await apiUpdateAdminUserStatus(dialog.user.id, {
                isActive: dialog.type === 'unlock',
                reason: reason || undefined,
                actorPassword: password || undefined,
              });
              toast({
                type: 'success',
                title: dialog.type === 'lock' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
                description:
                  dialog.type === 'lock'
                    ? `Đã thu hồi ${res?.data?.revokedSessions ?? 0} phiên đăng nhập.`
                    : undefined,
              });
              refreshAfterChange(dialog.user.id);
            } catch (err) {
              toast({ type: 'error', title: 'Không thực hiện được', description: apiErrorMessage(err) });
            }
          }}
        />
      )}
    </div>
  );
}

export default AdminUsersPage;
