import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, X, ChevronLeft, ChevronRight, Lock, Unlock, Loader2, Phone, MapPin, Globe } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { apiListAdminStores, apiGetAdminStore, apiUpdateAdminStoreStatus, formatVNDateTime } from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from './adminLabels';
import { adminStyles } from './adminStyles';

const MIN_REASON_LENGTH = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const PAYOS_LABEL = {
  ACTIVE: { text: 'PayOS đang dùng', className: 'text-emerald-700' },
  DISABLED: { text: 'PayOS đã tắt', className: 'text-[#64748B]' },
  NOT_CONFIGURED: { text: 'Chỉ tiền mặt', className: 'text-[#94A3B8]' },
};

function payosFromDetail(detail) {
  const config = detail?.paymentConfigs?.find((c) => c.provider === 'PAYOS');
  if (!config) return 'NOT_CONFIGURED';
  return config.isActive ? 'ACTIVE' : 'DISABLED';
}

function daysSince(value) {
  return value ? Math.floor((Date.now() - new Date(value).getTime()) / DAY_MS) : null;
}

function LastActive({ value, idleDays }) {
  if (!value) return <span className="text-[#94A3B8]">Chưa đăng nhập</span>;
  const idle = daysSince(value) >= idleDays;
  return (
    <span className={idle ? 'text-[#D97706]' : 'text-[#475569]'} title={formatVNDateTime(value)}>
      {formatRelativeTime(value) || formatVNDateTime(value)}
    </span>
  );
}

function StatusText({ isActive }) {
  return isActive ? (
    <span className="text-[13px] text-[#64748B]">Hoạt động</span>
  ) : (
    <span className={`${adminStyles.badge} ${adminStyles.badgeRed}`}>Tạm khóa</span>
  );
}

function SummaryTile({ label, value, detail, tone, active, onClick }) {
  const valueColor = tone === 'danger' ? 'text-[#DC2626]' : tone === 'warning' ? 'text-[#D97706]' : 'text-[#334155]';
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${adminStyles.card} p-3.5 text-left ${onClick ? 'cursor-pointer hover:border-[#93C5FD]' : ''} ${
        active ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]' : ''
      }`}
    >
      <div className="text-[12px] text-[#64748B]">{label}</div>
      <div className={`text-[22px] font-semibold tabular-nums mt-0.5 ${valueColor}`}>{value}</div>
      <div className="text-[12px] text-[#94A3B8] truncate">{detail}</div>
    </Tag>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[#64748B] flex items-center gap-1.5 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#94A3B8]" />}
        {label}
      </span>
      <span className="text-[#334155] text-right break-words">{children}</span>
    </div>
  );
}

export function AdminStoresPage() {
  const { toast } = useToast();

  const [stores, setStores] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [detail, setDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [statusModalStore, setStatusModalStore] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusPassword, setStatusPassword] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  const fetchStores = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const res = await apiListAdminStores({ page, limit: 20, search: searchQuery.trim(), isActive: selectedStatus });
        setStores(res.data);
        setPagination(res.pagination);
        setSummary(res.summary);
      } catch (err) {
        toast({ type: 'error', title: 'Không tải được danh sách cửa hàng', description: apiErrorMessage(err) });
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, selectedStatus, toast]
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchStores(1), 250);
    return () => clearTimeout(timer);
  }, [fetchStores]);

  const loadDetail = useCallback(
    async (storeId) => {
      setIsLoadingDetail(true);
      try {
        setDetail(await apiGetAdminStore(storeId));
      } catch (err) {
        toast({ type: 'error', title: 'Không mở được cửa hàng', description: apiErrorMessage(err) });
        setDrawerOpen(false);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [toast]
  );

  const openDetail = (storeId) => {
    setDetail(null);
    setDrawerOpen(true);
    loadDetail(storeId);
  };

  const openStatusModal = (store) => {
    setStatusModalStore(store);
    setStatusReason('');
    setStatusPassword('');
  };

  const isLockingModal = Boolean(statusModalStore?.isActive);
  const canSubmitStatus =
    !isSubmittingStatus && (!isLockingModal || (statusReason.trim().length >= MIN_REASON_LENGTH && statusPassword.length > 0));

  const handleConfirmStatusChange = async () => {
    if (!statusModalStore || !canSubmitStatus) return;
    setIsSubmittingStatus(true);
    try {
      const res = await apiUpdateAdminStoreStatus(statusModalStore.id, {
        isActive: !isLockingModal,
        reason: statusReason.trim() || undefined,
        actorPassword: isLockingModal ? statusPassword : undefined,
      });
      toast({
        type: 'success',
        title: isLockingModal ? 'Đã tạm khóa cửa hàng' : 'Đã mở lại cửa hàng',
        description: isLockingModal
          ? `${statusModalStore.name}: đã đăng xuất ${res?.data?.revokedSessions ?? 0} phiên đăng nhập.`
          : `${statusModalStore.name} hoạt động lại bình thường.`,
      });
      const storeId = statusModalStore.id;
      setStatusModalStore(null);
      fetchStores(pagination.page);
      if (drawerOpen && detail?.id === storeId) loadDetail(storeId);
    } catch (err) {
      toast({ type: 'error', title: 'Không cập nhật được trạng thái', description: apiErrorMessage(err) });
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const idleDays = summary?.idleDays ?? 14;
  const statusTabs = [
    { value: '', label: 'Tất cả' },
    { value: 'true', label: 'Đang hoạt động' },
    { value: 'false', label: 'Tạm khóa' },
  ];
  const detailPayos = PAYOS_LABEL[payosFromDetail(detail)];

  return (
    <div className={adminStyles.pageContainer}>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Cửa hàng</h1>
          <p className={adminStyles.pageDesc}>Tình trạng sử dụng của từng cửa hàng thuê nền tảng.</p>
        </div>
        <button type="button" onClick={() => fetchStores(pagination.page)} disabled={isLoading} className={adminStyles.btnSecondary}>
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Số liệu tổng quan */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <SummaryTile label="Tổng cửa hàng" value={summary?.total ?? '—'} detail="Đã đăng ký trên nền tảng" />
        <SummaryTile
          label="Đang hoạt động"
          value={summary?.active ?? '—'}
          detail="Bấm để lọc"
          active={selectedStatus === 'true'}
          onClick={() => setSelectedStatus(selectedStatus === 'true' ? '' : 'true')}
        />
        <SummaryTile
          label="Dùng thanh toán PayOS"
          value={summary ? `${summary.payosActive}/${summary.active}` : '—'}
          detail="Còn lại chỉ nhận tiền mặt"
        />
        <SummaryTile
          label={`Không đăng nhập ≥ ${idleDays} ngày`}
          value={summary?.idle ?? '—'}
          detail={summary?.idle ? 'Nên liên hệ hỏi thăm' : 'Tất cả đang dùng đều đặn'}
          tone={summary?.idle ? 'warning' : undefined}
        />
        <SummaryTile
          label="Tạm khóa"
          value={summary?.locked ?? '—'}
          detail="Bấm để lọc"
          tone={summary?.locked ? 'danger' : undefined}
          active={selectedStatus === 'false'}
          onClick={() => setSelectedStatus(selectedStatus === 'false' ? '' : 'false')}
        />
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative sm:w-96">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã hoặc số điện thoại"
            className={`${adminStyles.input} pl-9`}
          />
        </div>
        <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5 self-start">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1 text-[13px] rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatus === tab.value ? 'bg-slate-100 text-[#334155] font-medium' : 'text-[#64748B] hover:text-[#334155]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng */}
      <div className={`${adminStyles.tableContainer} hidden md:block`}>
        <div className="overflow-x-auto">
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th className={adminStyles.th}>Cửa hàng</th>
                <th className={adminStyles.th}>Chủ cửa hàng</th>
                <th className={`${adminStyles.th} text-right`}>Sản phẩm</th>
                <th className={`${adminStyles.th} text-right`}>Đơn 30 ngày</th>
                <th className={adminStyles.th}>Đăng nhập gần nhất</th>
                <th className={adminStyles.th}>Thanh toán</th>
                <th className={adminStyles.th}>Trạng thái</th>
                <th className={adminStyles.th}><span className="sr-only">Mở chi tiết</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && stores.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E5E7EB]">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${45 + ((i + j) % 3) * 18}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-[#334155] font-medium">Không có cửa hàng phù hợp</p>
                    <p className="text-[#64748B] mt-1">Thử từ khóa khác hoặc bỏ bộ lọc trạng thái.</p>
                  </td>
                </tr>
              ) : (
                stores.map((st) => {
                  const payos = PAYOS_LABEL[st.payos] || PAYOS_LABEL.NOT_CONFIGURED;
                  return (
                    <tr key={st.id} onClick={() => openDetail(st.id)} className={`${adminStyles.tr} cursor-pointer group`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#334155]">{st.name}</div>
                        <div className="text-[12px] text-[#64748B]">
                          {st.code}
                          {st.phone ? ` · ${st.phone}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {st.owner ? (
                          <>
                            <div className="text-[#334155]">
                              {st.owner.fullName}
                              {!st.owner.isActive && <span className="text-[#DC2626] text-[12px]"> (bị khóa)</span>}
                            </div>
                            <div className="text-[12px] text-[#64748B]">{st.owner.email}</div>
                          </>
                        ) : (
                          <span className="text-[#94A3B8]">Chưa có</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        <div className="text-[#334155]">{st.stats.skus} SKU</div>
                        <div className="text-[12px] text-[#64748B]">{st.stats.users} tài khoản</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        <div className="text-[#334155]">{st.stats.ordersLast30Days}</div>
                        <div className="text-[12px] text-[#64748B]">
                          {st.stats.lastOrderAt ? `gần nhất ${formatRelativeTime(st.stats.lastOrderAt) || formatVNDateTime(st.stats.lastOrderAt)}` : 'chưa có đơn'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <LastActive value={st.lastActiveAt} idleDays={idleDays} />
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap ${payos.className}`}>{payos.text}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusText isActive={st.isActive} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#3B82F6] inline" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between text-[13px] text-[#64748B]">
          <span>
            {pagination.total > 0
              ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} trong ${pagination.total} cửa hàng`
              : '0 cửa hàng'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fetchStores(pagination.page - 1)}
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
              onClick={() => fetchStores(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Thẻ (mobile / tablet nhỏ) */}
      <div className="md:hidden space-y-2">
        {stores.map((st) => {
          const payos = PAYOS_LABEL[st.payos] || PAYOS_LABEL.NOT_CONFIGURED;
          return (
            <button key={st.id} type="button" onClick={() => openDetail(st.id)} className={`${adminStyles.card} w-full text-left p-3.5 space-y-1.5`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-[#334155] truncate">{st.name}</p>
                  <p className="text-[12px] text-[#64748B] truncate">{st.owner?.fullName || 'Chưa có chủ'} · {st.code}</p>
                </div>
                <StatusText isActive={st.isActive} />
              </div>
              <p className="text-[12px] text-[#64748B]">
                {st.stats.skus} SKU · {st.stats.ordersLast30Days} đơn/30 ngày · <span className={payos.className}>{payos.text}</span>
              </p>
              <p className="text-[12px]">
                Đăng nhập: <LastActive value={st.lastActiveAt} idleDays={idleDays} />
              </p>
            </button>
          );
        })}
      </div>

      {/* Drawer chi tiết */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className={adminStyles.drawerBackdrop} onClick={() => setDrawerOpen(false)} />
          <div className={adminStyles.drawerContent} role="dialog" aria-label="Chi tiết cửa hàng">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[16px] font-semibold text-[#334155] truncate">{detail?.name || 'Cửa hàng'}</h3>
                <p className="text-[12px] text-[#64748B]">{detail?.code}</p>
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
                    <DetailRow label="Trạng thái">
                      <StatusText isActive={detail.isActive} />
                    </DetailRow>
                    <DetailRow icon={Phone} label="Điện thoại">{detail.phone || <span className="text-[#94A3B8]">Chưa cập nhật</span>}</DetailRow>
                    <DetailRow icon={MapPin} label="Địa chỉ">{detail.address || <span className="text-[#94A3B8]">Chưa cập nhật</span>}</DetailRow>
                    <DetailRow icon={Globe} label="Mã cửa hàng">{detail.code}</DetailRow>
                    <DetailRow label="Ngày tạo">{formatVNDateTime(detail.createdAt)}</DetailRow>
                  </div>

                  <div>
                    <h4 className="text-[13px] font-medium text-[#334155] mb-2">Quy mô</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['Tài khoản', (detail.stats?.owners || 0) + (detail.stats?.staff || 0)],
                        ['Sản phẩm', detail.stats?.products ?? 0],
                        ['SKU', detail.stats?.skus ?? 0],
                        ['Tổng đơn', detail.stats?.orders ?? 0],
                        ['Đơn 30 ngày', detail.stats?.ordersLast30Days ?? 0],
                        ['Kho', detail.stats?.warehouses ?? 0],
                      ].map(([label, value]) => (
                        <div key={label} className="p-2.5 rounded-lg border border-[#E5E7EB] text-center">
                          <p className="text-[11px] text-[#64748B]">{label}</p>
                          <p className="text-[17px] font-semibold text-[#334155] tabular-nums">{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[12px] text-[#64748B] mt-2">
                      Đơn gần nhất: {detail.stats?.lastOrderAt ? formatVNDateTime(detail.stats.lastOrderAt) : 'chưa có đơn nào'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[13px] font-medium text-[#334155] mb-2">Chủ cửa hàng</h4>
                    {detail.owners?.length > 0 ? (
                      <ul className="border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB]">
                        {detail.owners.map((ow) => (
                          <li key={ow.id} className="p-2.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[#334155] truncate">{ow.fullName}</p>
                              <p className="text-[12px] text-[#64748B] truncate">{ow.email}</p>
                            </div>
                            {!ow.isActive && <span className={`${adminStyles.badge} ${adminStyles.badgeRed}`}>Bị khóa</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#64748B]">Chưa có chủ cửa hàng.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[13px] font-medium text-[#334155] mb-2">Thanh toán</h4>
                    <div className="p-3 rounded-lg border border-[#E5E7EB] flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[#334155]">VietQR (PayOS)</p>
                        <p className="text-[12px] text-[#64748B]">
                          {payosFromDetail(detail) === 'NOT_CONFIGURED'
                            ? 'Chưa kết nối. Cửa hàng chỉ nhận tiền mặt.'
                            : `Kết nối từ ${formatVNDateTime(detail.paymentConfigs.find((c) => c.provider === 'PAYOS').configuredAt)}`}
                        </p>
                      </div>
                      <span className={`text-[13px] font-medium ${detailPayos.className}`}>
                        {{ ACTIVE: 'Đang bật', DISABLED: 'Đã tắt', NOT_CONFIGURED: 'Chưa kết nối' }[payosFromDetail(detail)]}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {detail && (
              <div className="p-4 border-t border-[#E5E7EB] flex justify-end">
                {detail.isActive ? (
                  <button type="button" onClick={() => openStatusModal(detail)} className={adminStyles.btnDanger}>
                    <Lock className="w-3.5 h-3.5" />
                    Tạm khóa cửa hàng
                  </button>
                ) : (
                  <button type="button" onClick={() => openStatusModal(detail)} className={adminStyles.btnPrimary}>
                    <Unlock className="w-3.5 h-3.5" />
                    Mở lại cửa hàng
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hộp thoại tạm khóa / mở lại */}
      {statusModalStore && (
        <div className={adminStyles.modalBackdrop}>
          <div className={adminStyles.modalContent} role="dialog" aria-label="Xác nhận đổi trạng thái cửa hàng">
            <div className="p-5 border-b border-[#E5E7EB]">
              <h3 className="text-[16px] font-semibold text-[#334155]">
                {isLockingModal ? `Tạm khóa ${statusModalStore.name}?` : `Mở lại ${statusModalStore.name}?`}
              </h3>
              <p className="text-[13px] text-[#64748B] mt-1.5 leading-relaxed">
                {isLockingModal
                  ? 'Mọi tài khoản của cửa hàng bị đăng xuất ngay và không đăng nhập được cho tới khi mở lại. Dữ liệu cửa hàng được giữ nguyên.'
                  : 'Các tài khoản của cửa hàng đăng nhập và sử dụng lại bình thường.'}
              </p>
            </div>
            <div className="p-5 space-y-3.5">
              <label className="block">
                <span className="block text-[13px] font-medium text-[#334155] mb-1">Lý do {isLockingModal ? '' : '(không bắt buộc)'}</span>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={isLockingModal ? 'Ví dụ: Hết hạn thuê bao tháng 10' : 'Ví dụ: Đã gia hạn thuê bao'}
                  className={adminStyles.input}
                  autoFocus
                />
                <span className="block text-[12px] text-[#94A3B8] mt-1">
                  {isLockingModal && statusReason.trim().length < MIN_REASON_LENGTH
                    ? `Cần ít nhất ${MIN_REASON_LENGTH} ký tự. Lý do được lưu vào nhật ký kiểm toán.`
                    : 'Lý do được lưu vào nhật ký kiểm toán.'}
                </span>
              </label>
              {isLockingModal && (
                <label className="block">
                  <span className="block text-[13px] font-medium text-[#334155] mb-1">Mật khẩu của bạn</span>
                  <input
                    type="password"
                    value={statusPassword}
                    onChange={(e) => setStatusPassword(e.target.value)}
                    autoComplete="current-password"
                    className={adminStyles.input}
                  />
                  <span className="block text-[12px] text-[#94A3B8] mt-1">Tạm khóa ảnh hưởng mọi tài khoản của cửa hàng nên cần xác nhận lại.</span>
                </label>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStatusModalStore(null)} disabled={isSubmittingStatus} className={adminStyles.btnSecondary}>
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusChange}
                  disabled={!canSubmitStatus}
                  className={isLockingModal ? adminStyles.btnDanger : adminStyles.btnPrimary}
                >
                  {isSubmittingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isLockingModal ? 'Tạm khóa' : 'Mở lại'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStoresPage;
