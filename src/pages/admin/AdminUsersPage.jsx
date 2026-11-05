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
  Laptop,
  ExternalLink,
  ShieldCheck,
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
  canAddProduct,
  canEditProduct,
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
import { useAdminText } from './useAdminText';

const ROLE_OPTIONS = [
  { value: '', vi: 'Mọi vai trò', en: 'All roles' },
  { value: 'SHOP_OWNER', vi: 'Chủ cửa hàng', en: 'Store owner' },
  { value: 'WAREHOUSE_STAFF', vi: 'Nhân viên kho', en: 'Warehouse staff' },
  { value: 'ADMIN', vi: 'Quản trị viên', en: 'Administrator' },
];

const STATUS_OPTIONS = [
  { value: '', vi: 'Mọi trạng thái', en: 'All statuses' },
  { value: 'true', vi: 'Đang hoạt động', en: 'Active' },
  { value: 'false', vi: 'Đã bị khóa', en: 'Disabled' },
];

// ─── Cấu hình Ma trận phân quyền ─────────────────────────────────────────────
const PERMISSION_GROUPS = [
  {
    title: 'Bán hàng & đơn hàng',
    titleEn: 'Sales & orders',
    description: 'Bán hàng, tạo hóa đơn và xử lý đơn hàng tại quầy',
    descriptionEn: 'Selling, invoicing and handling counter orders',
    rules: [
      { name: 'Bán hàng tại quầy (POS)', en: 'Point of sale (POS)', route: '/pos' },
      { name: 'Xem danh sách đơn hàng', en: 'View orders', route: '/orders' },
      { name: 'Hủy đơn hàng', en: 'Cancel orders', check: (role) => canCancelOrder(role) },
    ],
  },
  {
    title: 'Kho & sản phẩm',
    titleEn: 'Inventory & products',
    description: 'Kiểm kê, nhập/xuất kho và quản lý sản phẩm',
    descriptionEn: 'Stock counts, stock in/out and product catalog',
    rules: [
      { name: 'Xem & quản lý sản phẩm', en: 'View & manage products', route: '/products' },
      { name: 'Thêm & cập nhật sản phẩm', en: 'Add & update products', check: (role) => canAddProduct(role) },
      { name: 'Nhập / xuất kho & kiểm kê', en: 'Stock in/out & counts', route: '/inventory' },
      { name: 'Nhận cảnh báo tồn kho thấp', en: 'Low-stock alerts', route: '/alerts' },
      { name: 'Xóa sản phẩm khỏi hệ thống', en: 'Delete products', check: (role) => canDeleteProduct(role) },
      { name: 'Nhập dữ liệu hàng loạt từ file Excel', en: 'Bulk import from Excel', route: '/import' },
    ],
  },
  {
    title: 'Tài chính & giá',
    titleEn: 'Finance & pricing',
    description: 'Báo cáo doanh số, giá vốn và đề xuất giá',
    descriptionEn: 'Sales reports, cost prices and price suggestions',
    rules: [
      { name: 'Xem giá vốn, lợi nhuận & doanh thu', en: 'View cost, profit & revenue', check: (role) => canViewCostPrice(role) },
      { name: 'Phân tích & báo cáo', en: 'Analytics & reports', route: '/analytics' },
      { name: 'Đề xuất giá bán', en: 'Price suggestions', route: '/pricing' },
      { name: 'Duyệt áp dụng giá đề xuất', en: 'Approve suggested prices', check: (role) => canApprovePricing(role) },
    ],
  },
  {
    title: 'Quản trị & cấu hình',
    titleEn: 'Administration & settings',
    description: 'Cài đặt hệ thống, tài khoản và nhật ký kiểm toán',
    descriptionEn: 'System settings, accounts and the audit log',
    rules: [
      { name: 'Quản lý người dùng & phân quyền', en: 'Users & roles', route: '/admin/users' },
      { name: 'Quản lý các cửa hàng', en: 'Manage stores', route: '/admin/stores' },
      { name: 'Xem nhật ký kiểm toán', en: 'View audit log', route: '/admin/audit-log' },
      { name: 'Xử lý yêu cầu hỗ trợ', en: 'Handle support tickets', route: '/admin/support' },
      { name: 'Cấu hình hệ thống & AI', en: 'System & AI settings', route: '/admin/system' },
      { name: 'Cài đặt thông tin cửa hàng', en: 'Store settings', route: '/settings' },
      { name: 'Quản lý nhân viên của cửa hàng', en: 'Manage store staff', route: '/staff' },
    ],
  },
];

const MATRIX_ROLES = [
  { key: ROLES.SHOP_OWNER, label: 'Chủ cửa hàng', labelEn: 'Store owner' },
  { key: ROLES.WAREHOUSE_STAFF, label: 'Nhân viên kho', labelEn: 'Warehouse staff' },
  { key: ROLES.ADMIN, label: 'Quản trị viên', labelEn: 'Administrator' },
];

function PermissionMatrix() {
  const { t } = useAdminText();
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
      <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          {t(
            'Bảng này đọc trực tiếp từ cấu hình phân quyền của ứng dụng; backend kiểm tra lại mọi quyền ở từng API. Chủ cửa hàng quản lý nhân viên của mình; quản trị viên chỉ can thiệp khi có yêu cầu hỗ trợ.',
            "This table is read from the app's permission config; the backend re-checks every permission on each API. Owners manage their own staff; administrators step in only on support requests."
          )}
        </p>
      </div>

      <div className="space-y-4">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.title} className={`${ui.card} overflow-hidden`}>
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h3 className="text-[14px] font-semibold text-slate-900">{t(group.title, group.titleEn)}</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">{t(group.description, group.descriptionEn)}</p>
            </div>

            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <Th className="w-1/2">{t('Chức năng', 'Capability')}</Th>
                    {MATRIX_ROLES.map((r) => (
                      <Th key={r.key} align="center">
                        {t(r.label, r.labelEn)}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.rules.map((rule) => (
                    <tr key={rule.name}>
                      <td className="px-4 py-2.5 text-slate-800">{t(rule.name, rule.en)}</td>
                      {MATRIX_ROLES.map((r) => {
                        const allowed = checkRule(rule, r.key);
                        return (
                          <td key={r.key} className="px-4 py-2.5 text-center">
                            {allowed ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600">
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                <span className="sr-only">{t('Có quyền', 'Allowed')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 text-slate-300">
                                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                                <span className="sr-only">{t('Không có quyền', 'Not allowed')}</span>
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
  const { t } = useAdminText();
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', actorPassword: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({ type: 'warning', title: t('Mật khẩu quá ngắn', 'Password too short'), description: t('Mật khẩu cần ít nhất 8 ký tự.', 'Use at least 8 characters.') });
      return;
    }
    setBusy(true);
    try {
      await apiCreateAdminUser(form);
      toast({
        type: 'success',
        title: t('Đã tạo quản trị viên', 'Administrator created'),
        description: t(`${form.email} có thể đăng nhập ngay.`, `${form.email} can sign in now.`),
      });
      onCreated();
    } catch (err) {
      toast({ type: 'error', title: t('Không tạo được tài khoản', 'Could not create the account'), description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('Tạo Quản trị viên Nền tảng', 'Create platform administrator')}
      description={t('Tài khoản Quản trị viên có toàn quyền kiểm soát nền tảng. Lưu ý chỉ cấp cho nhân sự nội bộ.', 'Administrators have full control of the platform. Grant only to internal staff.')}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            {t('Hủy', 'Cancel')}
          </button>
          <button type="submit" form="create-admin-form" disabled={busy} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            {t('Tạo tài khoản', 'Create account')}
          </button>
        </>
      }
    >
      <form id="create-admin-form" onSubmit={submit} className="space-y-4" autoComplete="off">
        <div>
          <label htmlFor="admin-name" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Họ và tên', 'Full name')}
          </label>
          <input
            id="admin-name"
            type="text"
            required
            autoComplete="off"
            placeholder={t('Ví dụ: Nguyễn Văn An', 'e.g. Nguyen Van An')}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={ui.input}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="admin-email" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Email đăng nhập', 'Sign-in email')}
          </label>
          <input
            id="admin-email"
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
          <label htmlFor="admin-password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Mật khẩu ban đầu', 'Initial password')}
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="new-password"
            placeholder={t('Tối thiểu 8 ký tự', 'At least 8 characters')}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={ui.input}
          />
        </div>
        <div className="pt-3 border-t border-slate-200">
          <label htmlFor="actor-password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Mật khẩu của bạn để xác nhận', 'Your password to confirm')}
          </label>
          <input
            id="actor-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={t('Nhập mật khẩu của bạn để xác thực cấp quyền', 'Enter your password to authorize')}
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
  const { t } = useAdminText();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user.fullName || '');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiUpdateAdminUser(user.id, { fullName: fullName.trim() });
      toast({ type: 'success', title: t('Đã lưu tên người dùng', 'Name saved') });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: t('Không lưu được', 'Could not save'), description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('Sửa tên hiển thị', 'Edit display name')}
      description={t(
        `Email ${user.email} và vai trò không đổi được ở đây vì gắn với bảo mật.`,
        `The email ${user.email} and role cannot be changed here for security reasons.`
      )}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            {t('Hủy', 'Cancel')}
          </button>
          <button type="submit" form="edit-name-form" disabled={busy || fullName.trim().length < 2} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            {t('Lưu thay đổi', 'Save changes')}
          </button>
        </>
      }
    >
      <form id="edit-name-form" onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="edit-name" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Họ và tên', 'Full name')}
          </label>
          <input
            id="edit-name"
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
  const { t, isEn } = useAdminText();
  const locale = isEn ? 'en-US' : 'vi-VN';
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
  const [dialog, setDialog] = useState(null); // { type: 'create' | 'edit' | 'reset' | 'revoke' | 'lock' | 'unlock', user } | { type: 'bulkRevoke' }

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
        toast({ type: 'error', title: t('Không mở được hồ sơ', 'Could not open the profile'), description: apiErrorMessage(err) });
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
        title: res.emailSent || res.simulated ? t('Đã gửi mã đặt lại mật khẩu', 'Password reset code sent') : t('Chưa gửi được email', 'Email not sent'),
        description:
          res.emailSent || res.simulated
            ? t(`Mã có hiệu lực 15 phút, đã gửi tới ${res.email}.`, `A 15-minute code was sent to ${res.email}.`)
            : t('Máy chủ chưa cấu hình gửi email (SMTP).', 'The server has no email (SMTP) configured.'),
      });
    } catch (err) {
      toast({ type: 'error', title: t('Không gửi được mã', 'Could not send the code'), description: apiErrorMessage(err) });
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
        return sortDirection === 'asc' ? vA.localeCompare(vB, locale) : vB.localeCompare(vA, locale);
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
  }, [rows, sortKey, sortDirection, locale]);

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
  const bulkTargets = sortedRows.filter((u) => selectedIds.includes(u.id) && !isSelf(u));

  /** Thu hồi phiên lần lượt từng người (bỏ qua chính mình); backend ghi nhật ký cho từng lượt. */
  const bulkRevoke = async ({ reason }) => {
    let ok = 0;
    let sessions = 0;
    const failed = [];
    for (const u of bulkTargets) {
      try {
        const res = await apiRevokeAdminUserSessions(u.id, reason);
        ok += 1;
        sessions += res?.revokedSessions ?? 0;
      } catch (err) {
        failed.push(`${u.fullName}: ${apiErrorMessage(err)}`);
      }
    }
    toast({
      type: failed.length ? (ok ? 'warning' : 'error') : 'success',
      title: t(`Đã đăng xuất ${ok}/${bulkTargets.length} người dùng`, `Signed out ${ok}/${bulkTargets.length} users`),
      description: failed.length ? failed.slice(0, 2).join(' · ') : t(`${sessions} phiên đã bị thu hồi.`, `${sessions} sessions revoked.`),
    });
    setSelectedIds([]);
    setDialog(null);
    load();
  };

  const actionsFor = (u) => [
    { label: t('Xem chi tiết', 'View details'), icon: ExternalLink, onClick: () => setDetailId(u.id) },
    { label: t('Sửa tên hiển thị', 'Edit name'), icon: Edit2, onClick: () => setDialog({ type: 'edit', user: u }) },
    {
      label: t('Gửi mã đặt lại mật khẩu', 'Send password reset code'),
      icon: KeyRound,
      onClick: () => setDialog({ type: 'reset', user: u }),
      hidden: isSelf(u),
      disabled: !u.isActive,
    },
    {
      label: t('Đăng xuất khỏi mọi thiết bị', 'Sign out of all devices'),
      icon: LogOut,
      onClick: () => setDialog({ type: 'revoke', user: u }),
      hidden: isSelf(u),
    },
    u.isActive
      ? { label: t('Khóa tài khoản', 'Disable account'), icon: Lock, onClick: () => setDialog({ type: 'lock', user: u }), danger: true, hidden: isSelf(u) }
      : { label: t('Mở khóa tài khoản', 'Enable account'), icon: Unlock, onClick: () => setDialog({ type: 'unlock', user: u }), hidden: isSelf(u) },
  ];

  const roleOptions = ROLE_OPTIONS.map((o) => ({ value: o.value, label: t(o.vi, o.en) }));
  const statusOptions = STATUS_OPTIONS.map((o) => ({ value: o.value, label: t(o.vi, o.en) }));
  const chips = [
    role && { key: 'role', label: roleOptions.find((o) => o.value === role)?.label, onRemove: () => setParam('role', '') },
    status && { key: 'status', label: statusOptions.find((o) => o.value === status)?.label, onRemove: () => setParam('status', '') },
    storeId && {
      key: 'store',
      label: stores.find((s) => String(s.id) === storeId)?.name || t('Cửa hàng', 'Store'),
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
        title={t('Người dùng & Phân quyền', 'Users & roles')}
        description={t('Quản lý toàn bộ danh sách tài khoản thuộc mọi cửa hàng và quản trị viên nền tảng.', 'Every account across all stores, plus platform administrators.')}
        badge={
          <Badge tone="neutral" dot={false}>
            {t(`${pagination?.total ?? 0} tài khoản`, `${pagination?.total ?? 0} accounts`)}
          </Badge>
        }
        actions={
          <>
            <button
              type="button"
              onClick={load}
              disabled={isLoading || tab !== 'list'}
              className={ui.btnSecondary}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('Làm mới', 'Refresh')}
            </button>
            <button type="button" onClick={() => setDialog({ type: 'create' })} className={ui.btnPrimary}>
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {t('Tạo quản trị viên', 'Create administrator')}
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
            { value: 'list', label: t('Danh sách người dùng', 'Users'), count: pagination?.total },
            { value: 'roles', label: t('Ma trận phân quyền', 'Permission matrix') },
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
                placeholder={t('Tìm theo họ tên hoặc email…', 'Search by name or email…')}
                className="w-full lg:w-80"
              />
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect label={t('Vai trò', 'Role')} value={role} onChange={(v) => setParam('role', v)} options={roleOptions} />
                <FilterSelect label={t('Trạng thái', 'Status')} value={status} onChange={(v) => setParam('status', v)} options={statusOptions} />
                <FilterSelect
                  label={t('Cửa hàng', 'Store')}
                  value={storeId}
                  onChange={(v) => setParam('store', v)}
                  options={[{ value: '', label: t('Mọi cửa hàng', 'All stores') }, ...stores.map((s) => ({ value: String(s.id), label: s.name }))]}
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
                  unit={t('tài khoản', 'accounts')}
                />
              )
            }
          >
            <table className={`${ui.table} min-w-200`}>
              <thead>
                <tr>
                  <th className="w-10 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-center">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={handleSelectAll}
                      aria-label={t('Chọn tất cả', 'Select all')}
                    />
                  </th>
                  <Th sortKey="fullName" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                    {t('Người dùng', 'User')}
                  </Th>
                  <Th>{t('Vai trò', 'Role')}</Th>
                  <Th>{t('Cửa hàng', 'Store')}</Th>
                  <Th sortKey="lastLoginAt" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                    {t('Đăng nhập gần nhất', 'Last sign-in')}
                  </Th>
                  <Th sortKey="isActive" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                    {t('Trạng thái', 'Status')}
                  </Th>
                  <th className="w-12 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <span className="sr-only">{t('Thao tác', 'Actions')}</span>
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
                      title={t('Không tìm thấy tài khoản phù hợp', 'No matching accounts')}
                      description={t('Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc đang kích hoạt.', 'Try another search term or remove some filters.')}
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
                {sortedRows.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setDetailId(u.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setDetailId(u.id)}
                      tabIndex={0}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-slate-50 ${isSelected ? 'bg-blue-50/60' : ''}`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(checked) => handleSelectRow(u.id, checked)}
                          aria-label={t(`Chọn ${u.fullName}`, `Select ${u.fullName}`)}
                        />
                      </td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} tone={u.role === 'ADMIN' ? 'brand' : 'neutral'} size={32} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf(u) && (
                                <Badge tone="info" dot={false}>
                                  {t('Bạn', 'You')}
                                </Badge>
                              )}
                            </p>
                            <p className="text-[12px] text-slate-500 truncate mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-slate-700">
                          {u.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />}
                          {u.role === 'SHOP_OWNER' && <Store className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />}
                          {roleLabel(u.role)}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-slate-700 font-medium">
                          {u.store?.name || (u.role === 'ADMIN' ? t('Nền tảng', 'Platform') : '–')}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        {u.lastLoginAt ? (
                          <div>
                            <p className="text-slate-900 font-medium" title={formatVNDateTime(u.lastLoginAt)}>
                              {formatRelativeTime(u.lastLoginAt) || formatVNDateTime(u.lastLoginAt)}
                            </p>
                            <p className="text-[12px] text-slate-500 tabular-nums">{formatVNDateTime(u.lastLoginAt)}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">{t('Chưa từng đăng nhập', 'Never signed in')}</span>
                        )}
                      </Td>
                      <Td>
                        {u.isActive ? (
                          <Badge tone="success">{t('Đang hoạt động', 'Active')}</Badge>
                        ) : (
                          <Badge tone="danger">{t('Đã bị khóa', 'Disabled')}</Badge>
                        )}
                      </Td>
                      <Td align="right">
                        <RowMenu items={actionsFor(u)} label={t(`Thao tác với ${u.fullName}`, `Actions for ${u.fullName}`)} />
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
                label: t(`Đăng xuất ${bulkTargets.length} người`, `Sign out ${bulkTargets.length} users`),
                icon: LogOut,
                disabled: bulkTargets.length === 0,
                onClick: () => setDialog({ type: 'bulkRevoke' }),
              },
            ]}
          />
        </>
      )}

      {/* Drawer Chi Tiết Người Dùng */}
      {detailId && (
        <Drawer
          title={detail?.fullName || t('Hồ sơ người dùng', 'User profile')}
          subtitle={detail?.email}
          badge={
            detail && (
              <Badge tone={detail.isActive ? 'success' : 'danger'}>
                {detail.isActive ? t('Hoạt động', 'Active') : t('Bị khóa', 'Disabled')}
              </Badge>
            )
          }
          tabs={[
            { key: 'overview', label: t('Tổng quan', 'Overview') },
            { key: 'history', label: t('Lịch sử thao tác', 'Activity'), count: detail?.recentAuditLogs?.length },
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
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('Sửa tên', 'Edit name')}
                </button>
                {!isSelf(detail) &&
                  (detail.isActive ? (
                    <button
                      type="button"
                      onClick={() => setDialog({ type: 'lock', user: detail })}
                      className={ui.btnDanger}
                    >
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      {t('Khóa tài khoản', 'Disable account')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDialog({ type: 'unlock', user: detail })}
                      className={ui.btnPrimary}
                    >
                      <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                      {t('Mở khóa tài khoản', 'Enable account')}
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
                  [t('Họ và tên', 'Full name'), detail.fullName],
                  ['Email', detail.email],
                  [t('Vai trò', 'Role'), roleLabel(detail.role)],
                  [t('Cửa hàng', 'Store'), detail.store?.name || (detail.role === 'ADMIN' ? t('Nền tảng', 'Platform') : null)],
                  [
                    t('Đăng nhập gần nhất', 'Last sign-in'),
                    detail.lastLoginAt ? formatVNDateTime(detail.lastLoginAt) : t('Chưa từng đăng nhập', 'Never signed in'),
                  ],
                  [
                    t('Phiên đang hoạt động', 'Active sessions'),
                    <span key="sessions" className="inline-flex items-center gap-1.5 tabular-nums">
                      <Laptop className="w-4 h-4 text-slate-500" aria-hidden="true" />
                      {t(`${detail.activeSessionCount ?? 0} thiết bị`, `${detail.activeSessionCount ?? 0} devices`)}
                    </span>,
                  ],
                  [t('Ngày tạo tài khoản', 'Created'), formatVNDateTime(detail.createdAt)],
                ]}
              />

              {!isSelf(detail) && (
                <Section title={t('Hỗ trợ & Bảo mật tài khoản', 'Account support & security')}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={!detail.isActive}
                      onClick={() => setDialog({ type: 'reset', user: detail })}
                      className={`${ui.btnSecondary} h-auto justify-start text-left p-3`}
                    >
                      <KeyRound className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-900 text-[13px]">{t('Gửi mã đổi mật khẩu', 'Send reset code')}</p>
                        <p className="text-[12px] text-slate-500 font-normal">{t('Mã OTP gửi qua email', 'OTP code by email')}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={!detail.activeSessionCount}
                      onClick={() => setDialog({ type: 'revoke', user: detail })}
                      className={`${ui.btnSecondary} h-auto justify-start text-left p-3`}
                    >
                      <LogOut className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-900 text-[13px]">{t('Đăng xuất mọi thiết bị', 'Sign out everywhere')}</p>
                        <p className="text-[12px] text-slate-500 font-normal">{t('Thu hồi phiên ngay lập tức', 'Revokes sessions immediately')}</p>
                      </div>
                    </button>
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-semibold text-slate-900">{t('Hoạt động gần đây', 'Recent activity')}</h4>
                <Link
                  to={`/admin/audit-log?user=${detail.id}`}
                  className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {t('Xem toàn bộ nhật ký', 'View full log')} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>

              {detail.recentAuditLogs?.length ? (
                <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white overflow-hidden">
                  {detail.recentAuditLogs.map((log) => (
                    <li key={log.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">
                          {actionLabel(log.action)}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {log.store?.name || t('Nền tảng', 'Platform')}
                        </p>
                      </div>
                      <span className="text-[12px] text-slate-500 tabular-nums shrink-0" title={formatVNDateTime(log.createdAt)}>
                        {formatRelativeTime(log.createdAt) || formatVNDateTime(log.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-500 text-[13px] bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  {t('Chưa ghi nhận hoạt động nào từ tài khoản này.', 'No activity recorded for this account.')}
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
          title={t(`Gửi mã đặt lại mật khẩu cho ${dialog.user.fullName}?`, `Send a password reset code to ${dialog.user.fullName}?`)}
          description={t(
            `Mã có hiệu lực 15 phút được gửi tới ${dialog.user.email}. Quản trị viên không thấy mã và không biết mật khẩu mới.`,
            `A code valid for 15 minutes is sent to ${dialog.user.email}. Administrators never see the code or the new password.`
          )}
          confirmLabel={t('Gửi mã OTP', 'Send code')}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await sendReset(dialog.user);
            refreshAfterChange(dialog.user.id);
          }}
        />
      )}

      {dialog?.type === 'revoke' && (
        <ConfirmDialog
          title={t(`Đăng xuất ${dialog.user.fullName} khỏi mọi thiết bị?`, `Sign ${dialog.user.fullName} out of every device?`)}
          description={t('Dùng khi người dùng báo mất thiết bị hoặc có nghi vấn lộ mật khẩu. Tài khoản vẫn hợp lệ và có thể đăng nhập lại.', 'Use when a user lost a device or suspects a leaked password. The account stays enabled.')}
          confirmLabel={t('Đăng xuất thiết bị', 'Sign out devices')}
          danger
          reason={{ required: true, placeholder: t('Ví dụ: Người dùng báo mất điện thoại cá nhân', 'e.g. User reported a lost phone') }}
          onClose={() => setDialog(null)}
          onConfirm={async ({ reason }) => {
            try {
              const res = await apiRevokeAdminUserSessions(dialog.user.id, reason);
              toast({
                type: 'success',
                title: t('Đã thu hồi phiên đăng nhập', 'Sessions revoked'),
                description: t(`Đã đăng xuất ${res.revokedSessions} thiết bị.`, `${res.revokedSessions} devices signed out.`),
              });
              refreshAfterChange(dialog.user.id);
            } catch (err) {
              toast({ type: 'error', title: t('Không thực hiện được', 'Action failed'), description: apiErrorMessage(err) });
            }
          }}
        />
      )}

      {(dialog?.type === 'lock' || dialog?.type === 'unlock') && (
        <ConfirmDialog
          title={
            dialog.type === 'lock'
              ? t(`Khóa tài khoản ${dialog.user.fullName}?`, `Disable ${dialog.user.fullName}?`)
              : t(`Mở khóa tài khoản ${dialog.user.fullName}?`, `Enable ${dialog.user.fullName}?`)
          }
          description={
            dialog.type === 'lock'
              ? t(
                  'Mọi phiên đăng nhập bị thu hồi ngay và người dùng không truy cập được cho đến khi được mở khóa.',
                  'All sessions are revoked immediately and the user has no access until re-enabled.'
                )
              : t('Người dùng đăng nhập và làm việc bình thường ngay sau khi mở khóa.', 'The user can sign in and work normally right away.')
          }
          confirmLabel={dialog.type === 'lock' ? t('Khóa tài khoản', 'Disable account') : t('Mở khóa', 'Enable')}
          danger={dialog.type === 'lock'}
          reason={{
            required: dialog.type === 'lock',
            placeholder:
              dialog.type === 'lock'
                ? t('Ví dụ: Nghi vấn truy cập trái phép', 'e.g. Suspected unauthorized access')
                : t('Ví dụ: Đã xác minh chính chủ', 'e.g. Owner identity verified'),
          }}
          password={
            dialog.type === 'lock' && dialog.user.role === 'ADMIN'
              ? { hint: t('Khóa một quản trị viên khác cần nhập lại mật khẩu của bạn.', 'Disabling another administrator requires your password.') }
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
                title: dialog.type === 'lock' ? t('Đã khóa tài khoản', 'Account disabled') : t('Đã mở khóa tài khoản', 'Account enabled'),
                description:
                  dialog.type === 'lock'
                    ? t(`Đã thu hồi ${res?.data?.revokedSessions ?? 0} phiên đăng nhập.`, `${res?.data?.revokedSessions ?? 0} sessions revoked.`)
                    : undefined,
              });
              refreshAfterChange(dialog.user.id);
            } catch (err) {
              toast({ type: 'error', title: t('Không thực hiện được', 'Action failed'), description: apiErrorMessage(err) });
            }
          }}
        />
      )}

      {dialog?.type === 'bulkRevoke' && (
        <ConfirmDialog
          title={t(`Đăng xuất ${bulkTargets.length} người dùng khỏi mọi thiết bị?`, `Sign ${bulkTargets.length} users out of every device?`)}
          description={t(
            `${bulkTargets.map((u) => u.fullName).join(', ')}. Tài khoản không bị khóa; họ đăng nhập lại được ngay.`,
            `${bulkTargets.map((u) => u.fullName).join(', ')}. Accounts stay enabled; they can sign in again right away.`
          )}
          confirmLabel={t('Đăng xuất tất cả', 'Sign out all')}
          danger
          reason={{ required: true, placeholder: t('Ví dụ: Nghi lộ mật khẩu sau sự cố', 'e.g. Possible password leak after an incident') }}
          onClose={() => setDialog(null)}
          onConfirm={bulkRevoke}
        />
      )}
    </div>
  );
}

export default AdminUsersPage;
