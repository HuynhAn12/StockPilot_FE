import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Search, RefreshCw, X, ChevronLeft, ChevronRight, KeyRound, LogOut, Lock, Unlock, Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/common/Toast';
import {
  apiListAdminUsers,
  apiGetAdminUser,
  apiCreateAdminUser,
  apiUpdateAdminUserStatus,
  apiRevokeAdminUserSessions,
  apiSendAdminPasswordReset,
  apiListAdminStores,
  formatVNDateTime,
} from '../../services/adminService';
import { actionLabel, apiErrorMessage, formatRelativeTime, roleLabel } from './adminLabels';
import { adminStyles } from './adminStyles';

const MIN_REASON_LENGTH = 5;
const EMPTY_CREATE_FORM = { fullName: '', email: '', password: '', actorPassword: '' };

function StatusText({ isActive }) {
  // Bình thường để chữ xám; chỉ trạng thái cần chú ý mới có màu.
  return isActive ? (
    <span className="text-[13px] text-[#64748B]">Hoạt động</span>
  ) : (
    <span className={`${adminStyles.badge} ${adminStyles.badgeRed}`}>Bị khóa</span>
  );
}

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-full bg-slate-100 text-[#475569] font-medium text-xs flex items-center justify-center shrink-0 border border-[#E5E7EB]">
      {name ? name.charAt(0).toUpperCase() : 'U'}
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#64748B]">{label}</span>
      <span className="text-[#334155] text-right">{children}</span>
    </div>
  );
}

export function AdminUsersPage() {
  const { user: currentAdmin } = useAuthStore();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeOptions, setStoreOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [detail, setDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // action: 'lock' | 'unlock' | 'revoke'
  const [actionModal, setActionModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionPassword, setActionPassword] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    apiListAdminStores({ limit: 100 })
      .then((res) => setStoreOptions(res.data || []))
      .catch(() => setStoreOptions([]));
  }, []);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const res = await apiListAdminUsers({
          page,
          limit: 20,
          search: searchQuery.trim(),
          role: selectedRole,
          isActive: selectedStatus,
          storeId: selectedStoreId,
        });
        setUsers(res.data);
        setPagination(res.pagination);
      } catch (err) {
        toast({ type: 'error', title: 'Không tải được danh sách tài khoản', description: apiErrorMessage(err) });
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, selectedRole, selectedStatus, selectedStoreId, toast]
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const loadDetail = useCallback(
    async (userId) => {
      setIsLoadingDetail(true);
      try {
        setDetail(await apiGetAdminUser(userId));
      } catch (err) {
        toast({ type: 'error', title: 'Không mở được hồ sơ', description: apiErrorMessage(err) });
        setDrawerOpen(false);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [toast]
  );

  const openDetail = (userId) => {
    setDetail(null);
    setDrawerOpen(true);
    loadDetail(userId);
  };

  const openAction = (action, target) => {
    setActionModal({ action, user: target });
    setActionReason('');
    setActionPassword('');
  };

  const isSelf = (u) => u?.id === currentAdmin?.id;
  const needsReason = actionModal && actionModal.action !== 'unlock';
  const needsPassword = actionModal?.action === 'lock' && actionModal.user.role === 'ADMIN';
  const reasonValid = !needsReason || actionReason.trim().length >= MIN_REASON_LENGTH;
  const canSubmitAction = reasonValid && (!needsPassword || actionPassword.length > 0) && !isSubmittingAction;

  const handleSubmitAction = async () => {
    if (!actionModal || !canSubmitAction) return;
    const { action, user: target } = actionModal;
    setIsSubmittingAction(true);
    try {
      if (action === 'revoke') {
        const res = await apiRevokeAdminUserSessions(target.id, actionReason.trim());
        toast({
          type: 'success',
          title: 'Đã đăng xuất mọi thiết bị',
          description: `Thu hồi ${res.revokedSessions} phiên của ${target.email}. Tài khoản vẫn đăng nhập lại được.`,
        });
      } else {
        const res = await apiUpdateAdminUserStatus(target.id, {
          isActive: action === 'unlock',
          reason: actionReason.trim() || undefined,
          actorPassword: needsPassword ? actionPassword : undefined,
        });
        toast({
          type: 'success',
          title: action === 'unlock' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
          description:
            action === 'unlock'
              ? `${target.email} có thể đăng nhập lại.`
              : `Đã thu hồi ${res?.data?.revokedSessions ?? 0} phiên đăng nhập của ${target.email}.`,
        });
      }
      setActionModal(null);
      fetchUsers(pagination.page);
      if (drawerOpen && detail?.id === target.id) loadDetail(target.id);
    } catch (err) {
      toast({ type: 'error', title: 'Không thực hiện được', description: apiErrorMessage(err) });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSendReset = async () => {
    if (!detail) return;
    setIsSendingReset(true);
    try {
      const res = await apiSendAdminPasswordReset(detail.id);
      toast({
        type: res.emailSent || res.simulated ? 'success' : 'warning',
        title: res.emailSent || res.simulated ? 'Đã gửi mã đặt lại mật khẩu' : 'Chưa gửi được email',
        description:
          res.emailSent || res.simulated
            ? `Mã có hiệu lực 15 phút, gửi tới ${res.email}. Người dùng nhập mã ở trang "Quên mật khẩu".`
            : 'Máy chủ chưa cấu hình email (SMTP). Kiểm tra mục Hệ thống.',
      });
      loadDetail(detail.id);
    } catch (err) {
      toast({ type: 'error', title: 'Không gửi được mã', description: apiErrorMessage(err) });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    if (createForm.password.length < 8) {
      toast({ type: 'warning', title: 'Mật khẩu quá ngắn', description: 'Mật khẩu cần ít nhất 8 ký tự.' });
      return;
    }
    setIsCreatingAdmin(true);
    try {
      await apiCreateAdminUser(createForm);
      toast({ type: 'success', title: 'Đã tạo quản trị viên', description: `${createForm.email} có thể đăng nhập ngay.` });
      setIsCreateAdminOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      fetchUsers(1);
    } catch (err) {
      toast({ type: 'error', title: 'Không tạo được tài khoản', description: apiErrorMessage(err) });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const actionCopy = actionModal
    ? {
        lock: {
          title: `Khóa tài khoản ${actionModal.user.fullName}?`,
          desc: 'Người này bị đăng xuất khỏi mọi thiết bị và không đăng nhập được cho tới khi mở khóa.',
          confirm: 'Khóa tài khoản',
          danger: true,
        },
        unlock: {
          title: `Mở khóa tài khoản ${actionModal.user.fullName}?`,
          desc: 'Tài khoản đăng nhập lại được ngay.',
          confirm: 'Mở khóa',
          danger: false,
        },
        revoke: {
          title: `Đăng xuất ${actionModal.user.fullName} khỏi mọi thiết bị?`,
          desc: 'Dùng khi người dùng báo mất máy hoặc lộ mật khẩu. Tài khoản không bị khóa, người dùng đăng nhập lại bình thường.',
          confirm: 'Đăng xuất mọi thiết bị',
          danger: true,
        },
      }[actionModal.action]
    : null;

  const roleTabs = [
    { value: '', label: 'Tất cả' },
    { value: 'SHOP_OWNER', label: 'Chủ cửa hàng' },
    { value: 'WAREHOUSE_STAFF', label: 'Nhân viên kho' },
    { value: 'ADMIN', label: 'Quản trị viên' },
  ];

  return (
    <div className={adminStyles.pageContainer}>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Người dùng</h1>
          <p className={adminStyles.pageDesc}>
            {pagination.total > 0 ? `${pagination.total} tài khoản trên nền tảng. ` : ''}Bấm vào một dòng để xem chi tiết và thao tác.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => fetchUsers(pagination.page)} disabled={isLoading} className={adminStyles.btnSecondary}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button type="button" onClick={() => setIsCreateAdminOpen(true)} className={adminStyles.btnPrimary}>
            <UserPlus className="w-3.5 h-3.5" />
            Tạo quản trị viên
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative lg:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc email"
            className={`${adminStyles.input} pl-9`}
          />
        </div>
        <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5 self-start overflow-x-auto max-w-full">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedRole(tab.value)}
              className={`px-3 py-1 text-[13px] rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedRole === tab.value ? 'bg-slate-100 text-[#334155] font-medium' : 'text-[#64748B] hover:text-[#334155]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={`${adminStyles.select} lg:w-44`}>
          <option value="">Mọi trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Bị khóa</option>
        </select>
        <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} className={`${adminStyles.select} lg:w-56`}>
          <option value="">Mọi cửa hàng</option>
          {storeOptions.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bảng (tablet trở lên) */}
      <div className={`${adminStyles.tableContainer} hidden sm:block`}>
        <div className="overflow-x-auto">
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th className={adminStyles.th}>Người dùng</th>
                <th className={adminStyles.th}>Vai trò</th>
                <th className={adminStyles.th}>Cửa hàng</th>
                <th className={adminStyles.th}>Đăng nhập gần nhất</th>
                <th className={adminStyles.th}>Trạng thái</th>
                <th className={adminStyles.th}><span className="sr-only">Mở chi tiết</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E5E7EB]">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${45 + ((i + j) % 3) * 18}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-[#334155] font-medium">Không có tài khoản phù hợp</p>
                    <p className="text-[#64748B] mt-1">Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} onClick={() => openDetail(u.id)} className={`${adminStyles.tr} cursor-pointer group`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} />
                        <div>
                          <div className="font-medium text-[#334155] flex items-center gap-1.5">
                            {u.fullName}
                            {isSelf(u) && <span className={`${adminStyles.badge} ${adminStyles.badgeGray} text-[11px]`}>Bạn</span>}
                          </div>
                          <div className="text-[12px] text-[#64748B]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{roleLabel(u.role)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{u.store?.name || (u.role === 'ADMIN' ? 'Nền tảng' : '—')}</td>
                    <td className="px-4 py-3 whitespace-nowrap" title={u.lastLoginAt ? formatVNDateTime(u.lastLoginAt) : undefined}>
                      {u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) || formatVNDateTime(u.lastLoginAt) : <span className="text-[#94A3B8]">Chưa đăng nhập</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusText isActive={u.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#3B82F6] inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between text-[13px] text-[#64748B]">
          <span>
            {pagination.total > 0
              ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} trong ${pagination.total} tài khoản`
              : '0 tài khoản'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-medium text-[#334155]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách thẻ (mobile) */}
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />)
        ) : users.length === 0 ? (
          <div className={`${adminStyles.card} p-8 text-center text-[#64748B]`}>Không có tài khoản phù hợp.</div>
        ) : (
          users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => openDetail(u.id)}
              className={`${adminStyles.card} w-full text-left p-3.5 flex items-center gap-3 active:bg-slate-50`}
            >
              <Avatar name={u.fullName} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#334155] text-[13px] truncate">{u.fullName}</p>
                <p className="text-[12px] text-[#64748B] truncate">{u.email}</p>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  {roleLabel(u.role)} · {u.store?.name || 'Nền tảng'}
                </p>
              </div>
              <StatusText isActive={u.isActive} />
            </button>
          ))
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 text-xs text-[#64748B]">
            <span>
              Trang {pagination.page}/{pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <button type="button" onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1 || isLoading} className={adminStyles.btnSecondary}>
                Trước
              </button>
              <button
                type="button"
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className={adminStyles.btnSecondary}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer chi tiết */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className={adminStyles.drawerBackdrop} onClick={() => setDrawerOpen(false)} />
          <div className={adminStyles.drawerContent} role="dialog" aria-label="Hồ sơ người dùng">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold text-[#334155] truncate">{detail?.fullName || 'Hồ sơ người dùng'}</h3>
                <p className="text-[12px] text-[#64748B] truncate">{detail?.email || ''}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded text-[#94A3B8] hover:text-[#334155] hover:bg-slate-100 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-[13px]">
              {isLoadingDetail && !detail ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 rounded bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : detail ? (
                <>
                  <div className="rounded-lg p-3.5 border border-[#E5E7EB] space-y-2.5">
                    <DetailRow label="Vai trò">{roleLabel(detail.role)}</DetailRow>
                    <DetailRow label="Cửa hàng">
                      {detail.store?.name || (detail.role === 'ADMIN' ? 'Nền tảng' : '—')}
                      {detail.store && !detail.store.isActive && <span className="text-[#DC2626]"> (đang tạm khóa)</span>}
                    </DetailRow>
                    <DetailRow label="Trạng thái">
                      <StatusText isActive={detail.isActive} />
                    </DetailRow>
                    <DetailRow label="Đăng nhập gần nhất">{detail.lastLoginAt ? formatVNDateTime(detail.lastLoginAt) : 'Chưa đăng nhập'}</DetailRow>
                    <DetailRow label="Phiên đang đăng nhập">{detail.activeSessionCount ?? 0} thiết bị</DetailRow>
                    <DetailRow label="Ngày tạo">{formatVNDateTime(detail.createdAt)}</DetailRow>
                  </div>

                  {!isSelf(detail) && (
                    <div>
                      <h4 className="text-[13px] font-medium text-[#334155] mb-2">Hỗ trợ người dùng</h4>
                      <div className="grid gap-2">
                        <button
                          type="button"
                          onClick={handleSendReset}
                          disabled={isSendingReset || !detail.isActive}
                          className={`${adminStyles.btnSecondary} justify-start`}
                          title={!detail.isActive ? 'Mở khóa tài khoản trước' : undefined}
                        >
                          {isSendingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                          Gửi mã đặt lại mật khẩu qua email
                        </button>
                        <button
                          type="button"
                          onClick={() => openAction('revoke', detail)}
                          disabled={!detail.activeSessionCount}
                          className={`${adminStyles.btnSecondary} justify-start`}
                          title={!detail.activeSessionCount ? 'Không có phiên nào đang đăng nhập' : undefined}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Đăng xuất khỏi mọi thiết bị
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-[13px] font-medium text-[#334155] mb-2">Hoạt động gần đây</h4>
                    {detail.recentAuditLogs?.length > 0 ? (
                      <ul className="border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB]">
                        {detail.recentAuditLogs.map((log) => (
                          <li key={log.id} className="p-2.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[#334155] truncate">{actionLabel(log.action)}</p>
                              <p className="text-[11px] text-[#94A3B8] truncate">{log.store?.name || 'Nền tảng'}</p>
                            </div>
                            <span className="text-[11px] text-[#94A3B8] shrink-0" title={formatVNDateTime(log.createdAt)}>
                              {formatRelativeTime(log.createdAt) || formatVNDateTime(log.createdAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#64748B]">Chưa có hoạt động nào.</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {detail && !isSelf(detail) && (
              <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                {detail.isActive ? (
                  <button type="button" onClick={() => openAction('lock', detail)} className={adminStyles.btnDanger}>
                    <Lock className="w-3.5 h-3.5" />
                    Khóa tài khoản
                  </button>
                ) : (
                  <button type="button" onClick={() => openAction('unlock', detail)} className={adminStyles.btnPrimary}>
                    <Unlock className="w-3.5 h-3.5" />
                    Mở khóa tài khoản
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận: khóa / mở khóa / đăng xuất mọi thiết bị */}
      {actionModal && actionCopy && (
        <div className={adminStyles.modalBackdrop}>
          <div className={adminStyles.modalContent} role="dialog" aria-label={actionCopy.title}>
            <div className="p-5 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-semibold text-[#334155]">{actionCopy.title}</h3>
              <p className="text-[13px] text-[#64748B] mt-1.5 leading-relaxed">{actionCopy.desc}</p>
            </div>
            <div className="p-5 space-y-3.5">
              <label className="block">
                <span className="block text-[13px] font-medium text-[#334155] mb-1">
                  Lý do {needsReason ? '' : '(không bắt buộc)'}
                </span>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={actionModal.action === 'unlock' ? 'Ví dụ: Đã xác minh chủ tài khoản' : 'Ví dụ: Nghi lộ mật khẩu, chủ shop báo mất máy'}
                  className={adminStyles.input}
                  autoFocus
                />
                <span className="block text-[12px] text-[#94A3B8] mt-1">
                  {needsReason && !reasonValid
                    ? `Cần ít nhất ${MIN_REASON_LENGTH} ký tự. Lý do được lưu vào nhật ký kiểm toán.`
                    : 'Lý do được lưu vào nhật ký kiểm toán.'}
                </span>
              </label>

              {needsPassword && (
                <label className="block">
                  <span className="block text-[13px] font-medium text-[#334155] mb-1">Mật khẩu của bạn</span>
                  <input
                    type="password"
                    value={actionPassword}
                    onChange={(e) => setActionPassword(e.target.value)}
                    autoComplete="current-password"
                    className={adminStyles.input}
                  />
                  <span className="block text-[12px] text-[#94A3B8] mt-1">Khóa một quản trị viên khác cần xác nhận lại mật khẩu.</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActionModal(null)} disabled={isSubmittingAction} className={adminStyles.btnSecondary}>
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAction}
                  disabled={!canSubmitAction}
                  className={actionCopy.danger ? adminStyles.btnDanger : adminStyles.btnPrimary}
                >
                  {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {actionCopy.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại tạo quản trị viên */}
      {isCreateAdminOpen && (
        <div className={adminStyles.modalBackdrop}>
          <div className={adminStyles.modalContent} role="dialog" aria-label="Tạo quản trị viên">
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-[16px] font-semibold text-[#334155]">Tạo quản trị viên</h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">Tài khoản này quản lý được toàn bộ nền tảng.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateAdminOpen(false)}
                className="p-1 rounded text-[#94A3B8] hover:text-[#334155] hover:bg-slate-100 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAdminSubmit} className="p-5 space-y-3.5" autoComplete="off">
              {[
                { key: 'fullName', label: 'Họ và tên', type: 'text', placeholder: 'Nguyễn Văn A', autoComplete: 'off' },
                { key: 'email', label: 'Email đăng nhập', type: 'email', placeholder: 'ten@stockpilot.vn', autoComplete: 'off' },
                { key: 'password', label: 'Mật khẩu cho tài khoản mới', type: 'password', placeholder: 'Ít nhất 8 ký tự', autoComplete: 'new-password' },
              ].map((f) => (
                <label key={f.key} className="block">
                  <span className="block text-[13px] font-medium text-[#334155] mb-1">{f.label}</span>
                  <input
                    type={f.type}
                    required
                    value={createForm[f.key]}
                    onChange={(e) => setCreateForm({ ...createForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    autoComplete={f.autoComplete}
                    className={adminStyles.input}
                  />
                </label>
              ))}
              <label className="block pt-3 border-t border-[#E5E7EB]">
                <span className="block text-[13px] font-medium text-[#334155] mb-1">Mật khẩu của bạn (xác nhận)</span>
                <input
                  type="password"
                  required
                  value={createForm.actorPassword}
                  onChange={(e) => setCreateForm({ ...createForm, actorPassword: e.target.value })}
                  autoComplete="current-password"
                  className={adminStyles.input}
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateAdminOpen(false)} disabled={isCreatingAdmin} className={adminStyles.btnSecondary}>
                  Hủy
                </button>
                <button type="submit" disabled={isCreatingAdmin} className={adminStyles.btnPrimary}>
                  {isCreatingAdmin && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
