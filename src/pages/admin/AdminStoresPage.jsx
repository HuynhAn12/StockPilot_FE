import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  Loader2,
  Store,
  Phone,
  Mail,
  Edit2,
  Lock,
  Unlock,
  ExternalLink,
  CreditCard,
  Package,
  Users,
  ShoppingBag,
  Clock,
  Warehouse,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import {
  apiListAdminStores,
  apiGetAdminStore,
  apiUpdateAdminStore,
  apiUpdateAdminStoreStatus,
  formatVNDateTime,
} from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from './adminLabels';
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
  StatCard,
  useDebounced,
} from './components/AdminUI';
import { useAdminText } from './useAdminText';

const DAY_MS = 24 * 60 * 60 * 1000;

const PAYOS = {
  ACTIVE: { vi: 'VietQR đang bật', en: 'VietQR on', tone: 'success' },
  DISABLED: { vi: 'VietQR đã tắt', en: 'VietQR off', tone: 'neutral' },
  NOT_CONFIGURED: { vi: 'Chỉ tiền mặt', en: 'Cash only', tone: 'neutral' },
};

function payosFromDetail(detail) {
  const config = detail?.paymentConfigs?.find((c) => c.provider === 'PAYOS');
  if (!config) return 'NOT_CONFIGURED';
  return config.isActive ? 'ACTIVE' : 'DISABLED';
}

function EditStoreModal({ store, onClose, onSaved }) {
  const { t } = useAdminText();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: store.name || '',
    phone: store.phone || '',
    address: store.address || '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {};
    if (form.name.trim() !== (store.name || '')) payload.name = form.name.trim();
    if (form.phone.trim() !== (store.phone || '')) payload.phone = form.phone.trim();
    if (form.address.trim() !== (store.address || '')) payload.address = form.address.trim();

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setBusy(true);
    try {
      await apiUpdateAdminStore(store.id, payload);
      toast({ type: 'success', title: t('Đã lưu thông tin cửa hàng', 'Store details saved') });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: t('Không lưu được', 'Could not save'), description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={t('Sửa thông tin Cửa hàng', 'Edit store details')}
      description={t(
        `Mã cửa hàng (${store.code}) là định danh cố định, không thể đổi. Mọi thay đổi được ghi vào nhật ký kiểm toán.`,
        `The store code (${store.code}) is permanent. Every change is written to the audit log.`
      )}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            {t('Hủy', 'Cancel')}
          </button>
          <button type="submit" form="edit-store-form" disabled={busy || form.name.trim().length < 2} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            {t('Lưu thay đổi', 'Save changes')}
          </button>
        </>
      }
    >
      <form id="edit-store-form" onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="store-name" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Tên cửa hàng', 'Store name')}
          </label>
          <input
            id="store-name"
            required
            minLength={2}
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={ui.input}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="store-phone" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Số điện thoại liên hệ', 'Contact phone')}
          </label>
          <input
            id="store-phone"
            inputMode="tel"
            maxLength={20}
            pattern="[0-9+.\s()\-]*"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={ui.input}
            placeholder="09xx xxx xxx"
          />
        </div>
        <div>
          <label htmlFor="store-address" className="block text-[13px] font-medium text-slate-700 mb-1.5">
            {t('Địa chỉ', 'Address')}
          </label>
          <textarea
            id="store-address"
            rows={2}
            maxLength={500}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={ui.input}
            placeholder={t('Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố', 'Street, ward, district, city')}
          />
        </div>
      </form>
    </Modal>
  );
}

export function AdminStoresPage() {
  const { t, isEn } = useAdminText();
  const { toast } = useToast();
  const locale = isEn ? 'en-US' : 'vi-VN';
  const PAYOS_OPTIONS = [
    { value: '', label: t('Mọi hình thức thanh toán', 'All payment methods') },
    ...Object.entries(PAYOS).map(([value, p]) => ({ value, label: t(p.vi, p.en) })),
  ];
  const [params, setParams] = useSearchParams();

  const status = params.get('status') || '';
  const payos = params.get('payos') || '';
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 20;

  const [search, setSearch] = useState(params.get('q') || '');
  const debouncedSearch = useDebounced(search);

  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const [stores, setStores] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Detail Drawer
  const [detailId, setDetailId] = useState(() => Number(params.get('id')) || null);
  const [detail, setDetail] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');

  // Dialogs
  const [dialog, setDialog] = useState(null); // { type: 'edit' | 'lock' | 'unlock', store } | { type: 'bulkLock' }

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
      const res = await apiListAdminStores({
        page,
        limit,
        search: params.get('q') || '',
        isActive: status,
        payos,
      });
      setStores(res.data);
      setPagination(res.pagination);
      setSummary(res.summary);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status, payos, params]);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = useCallback(
    async (id) => {
      try {
        setDetail(await apiGetAdminStore(id));
      } catch (err) {
        toast({ type: 'error', title: t('Không mở được thông tin cửa hàng', 'Could not open the store'), description: apiErrorMessage(err) });
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

  const refreshAfterChange = (storeId) => {
    setDialog(null);
    load();
    if (detailId === storeId) loadDetail(storeId);
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

  const sortedStores = useMemo(() => {
    if (!stores || stores.length === 0) return [];
    const sorted = [...stores];
    sorted.sort((a, b) => {
      if (sortKey === 'name') {
        const nA = a.name || '';
        const nB = b.name || '';
        return sortDirection === 'asc' ? nA.localeCompare(nB, locale) : nB.localeCompare(nA, locale);
      }
      if (sortKey === 'skus') {
        const vA = a.stats?.skus || 0;
        const vB = b.stats?.skus || 0;
        return sortDirection === 'asc' ? vA - vB : vB - vA;
      }
      if (sortKey === 'orders') {
        const vA = a.stats?.ordersLast30Days || 0;
        const vB = b.stats?.ordersLast30Days || 0;
        return sortDirection === 'asc' ? vA - vB : vB - vA;
      }
      if (sortKey === 'lastActiveAt') {
        const tA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const tB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return sortDirection === 'asc' ? tA - tB : tB - tA;
      }
      if (sortKey === 'isActive') {
        return sortDirection === 'asc' ? Number(a.isActive) - Number(b.isActive) : Number(b.isActive) - Number(a.isActive);
      }
      return 0;
    });
    return sorted;
  }, [stores, sortKey, sortDirection, locale]);

  // Bulk Actions
  const isAllSelected = sortedStores.length > 0 && selectedIds.length === sortedStores.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < sortedStores.length;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(sortedStores.map((s) => s.id));
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

  const idleDays = summary?.idleDays ?? 14;
  const selectedActive = sortedStores.filter((s) => selectedIds.includes(s.id) && s.isActive);

  /** Khóa lần lượt từng cửa hàng đang chọn (mỗi lần đều ghi nhật ký kiểm toán ở backend). */
  const bulkLock = async ({ reason, password }) => {
    let ok = 0;
    const failed = [];
    for (const st of selectedActive) {
      try {
        await apiUpdateAdminStoreStatus(st.id, { isActive: false, reason, actorPassword: password });
        ok += 1;
      } catch (err) {
        failed.push(`${st.name}: ${apiErrorMessage(err)}`);
        // Sai mật khẩu thì các lượt sau cũng sai — dừng sớm.
        if (err?.response?.status === 401 || err?.response?.status === 403) break;
      }
    }
    toast({
      type: failed.length ? (ok ? 'warning' : 'error') : 'success',
      title: t(`Đã tạm khóa ${ok}/${selectedActive.length} cửa hàng`, `Suspended ${ok}/${selectedActive.length} stores`),
      description: failed.length ? failed.slice(0, 2).join(' · ') : undefined,
    });
    setSelectedIds([]);
    setDialog(null);
    load();
  };

  const actionsFor = (st) => [
    { label: t('Xem chi tiết', 'View details'), icon: ExternalLink, onClick: () => setDetailId(st.id) },
    { label: t('Sửa thông tin', 'Edit details'), icon: Edit2, onClick: () => setDialog({ type: 'edit', store: st }) },
    st.owner?.email && {
      label: t('Gửi email cho chủ cửa hàng', 'Email the owner'),
      icon: Mail,
      onClick: () => window.open(`mailto:${st.owner.email}`),
    },
    st.phone && {
      label: t('Gọi điện cho cửa hàng', 'Call the store'),
      icon: Phone,
      onClick: () => window.open(`tel:${st.phone.replace(/[^\d+]/g, '')}`),
    },
    st.isActive
      ? { label: t('Tạm khóa cửa hàng', 'Suspend store'), icon: Lock, onClick: () => setDialog({ type: 'lock', store: st }), danger: true }
      : { label: t('Mở lại cửa hàng', 'Reactivate store'), icon: Unlock, onClick: () => setDialog({ type: 'unlock', store: st }) },
  ].filter(Boolean);

  const chips = [
    status && {
      key: 'status',
      label: status === 'true' ? t('Đang hoạt động', 'Active') : t('Tạm khóa', 'Suspended'),
      onRemove: () => setParam('status', ''),
    },
    payos && {
      key: 'payos',
      label: PAYOS_OPTIONS.find((o) => o.value === payos)?.label,
      onRemove: () => setParam('payos', ''),
    },
  ].filter(Boolean);

  const clearFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  const detailPayos = payosFromDetail(detail);
  const payosConfig = detail?.paymentConfigs?.find((c) => c.provider === 'PAYOS');

  return (
    <div className={ui.pageContainer}>
      <PageHeader
        title={t('Quản lý Cửa hàng', 'Stores')}
        description={t('Theo dõi tình trạng hoạt động, quy mô và tích hợp của từng khách hàng thuê nền tảng.', 'Activity, size and integrations of every store on the platform.')}
        badge={
          <Badge tone="neutral" dot={false}>
            {t(`${summary?.total ?? 0} cửa hàng`, `${summary?.total ?? 0} stores`)}
          </Badge>
        }
        actions={
          <button type="button" onClick={load} disabled={isLoading} className={ui.btnSecondary}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('Làm mới', 'Refresh')}
          </button>
        }
      >
        <Tabs
          value={status}
          onChange={(v) => {
            setSelectedIds([]);
            setParam('status', v);
          }}
          tabs={[
            { value: '', label: t('Tất cả', 'All'), count: summary?.total },
            { value: 'true', label: t('Đang hoạt động', 'Active'), count: summary?.active },
            { value: 'false', label: t('Đang tạm khóa', 'Suspended'), count: summary?.locked },
          ]}
        />
      </PageHeader>

      {/* 4 Thẻ KPI Tóm tắt Cửa hàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('Tổng số cửa hàng', 'Total stores')}
          value={summary?.total ?? 0}
          subtitle={t('Tất cả cửa hàng đã đăng ký', 'Every registered store')}
          icon={Store}
          iconBg="bg-slate-100 text-slate-600"
          loading={isLoading}
        />
        <StatCard
          title={t('Đang hoạt động', 'Active')}
          value={summary?.active ?? 0}
          subtitle={summary?.total ? t(`${Math.round((summary.active / summary.total) * 100)}% tổng số`, `${Math.round((summary.active / summary.total) * 100)}% of all`) : '–'}
          icon={CheckCircle2}
          iconBg="bg-slate-100 text-slate-600"
          loading={isLoading}
        />
        <StatCard
          title={t('Đã bật VietQR (PayOS)', 'VietQR (PayOS) on')}
          value={`${summary?.payosActive ?? 0} / ${summary?.active ?? 0}`}
          subtitle={t('Cửa hàng nhận thanh toán QR', 'Stores accepting QR payments')}
          icon={CreditCard}
          iconBg="bg-slate-100 text-slate-600"
          loading={isLoading}
        />
        <StatCard
          title={t(`Ít hoạt động (≥ ${idleDays} ngày)`, `Low activity (≥ ${idleDays} days)`)}
          value={summary?.idle ?? 0}
          subtitle={t('Nên liên hệ chăm sóc', 'Worth a check-in')}
          icon={Clock}
          iconBg="bg-slate-100 text-slate-600"
          alert={summary?.idle > 0}
          loading={isLoading}
        />
      </div>

      <div className="space-y-3">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Tìm theo tên cửa hàng, mã định danh, số điện thoại…', 'Search by store name, code or phone…')}
            className="w-full lg:w-80"
          />
          <FilterSelect
            label={t('Thanh toán', 'Payments')}
            value={payos}
            onChange={(v) => setParam('payos', v)}
            options={PAYOS_OPTIONS}
          />
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
              unit={t('cửa hàng', 'stores')}
            />
          )
        }
      >
        <table className={`${ui.table} min-w-237.5`}>
          <thead>
            <tr>
              <th className="w-10 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-center">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleSelectAll}
                  aria-label={t('Chọn tất cả cửa hàng', 'Select all stores')}
                />
              </th>
              <Th sortKey="name" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                {t('Cửa hàng', 'Store')}
              </Th>
              <Th>{t('Chủ cửa hàng', 'Owner')}</Th>
              <Th sortKey="skus" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="right">
                {t('Quy mô', 'Size')}
              </Th>
              <Th sortKey="orders" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="right">
                {t('Đơn 30 ngày', 'Orders (30d)')}
              </Th>
              <Th sortKey="lastActiveAt" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                {t('Đăng nhập gần nhất', 'Last sign-in')}
              </Th>
              <Th>{t('Thanh toán', 'Payments')}</Th>
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
            columns={9}
            empty={
              sortedStores.length === 0 && (
                <EmptyState
                  title={t('Không tìm thấy cửa hàng phù hợp', 'No matching stores')}
                  description={t('Hãy thử từ khóa tìm kiếm khác hoặc bỏ bớt các bộ lọc đang kích hoạt.', 'Try another search term or remove some filters.')}
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
            {sortedStores.map((st) => {
              const p = PAYOS[st.payos] || PAYOS.NOT_CONFIGURED;
              const openDetail = () => setDetailId(st.id);
              const isSelected = selectedIds.includes(st.id);
              const isIdle =
                st.lastActiveAt && Math.floor((Date.now() - new Date(st.lastActiveAt).getTime()) / DAY_MS) >= idleDays;

              return (
                <tr
                  key={st.id}
                  onClick={openDetail}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail()}
                  tabIndex={0}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-slate-50 ${isSelected ? 'bg-blue-50/60' : ''}`}
                >
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => handleSelectRow(st.id, checked)}
                      aria-label={t(`Chọn ${st.name}`, `Select ${st.name}`)}
                    />
                  </td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={st.name} tone="brand" size={32} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate max-w-55">{st.name}</p>
                        <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[12px] text-slate-600">
                            {st.code}
                          </span>
                          {st.phone && <span>· {st.phone}</span>}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {st.owner ? (
                      <div>
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {st.owner.fullName}
                          {!st.owner.isActive && (
                            <Badge tone="danger" dot={false}>
                              {t('Khóa', 'Disabled')}
                            </Badge>
                          )}
                        </p>
                        <p className="text-[12px] text-slate-500 truncate mt-0.5">{st.owner.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">{t('Chưa liên kết', 'Not linked')}</span>
                    )}
                  </Td>
                  <Td align="right" className="whitespace-nowrap tabular-nums">
                    <p className="font-medium text-slate-900">{st.stats.skus.toLocaleString(locale)} SKU</p>
                    <p className="text-[12px] text-slate-500">{t(`${st.stats.users} tài khoản`, `${st.stats.users} accounts`)}</p>
                  </Td>
                  <Td align="right" className="whitespace-nowrap tabular-nums">
                    <p className="font-medium text-slate-900">{t(`${st.stats.ordersLast30Days.toLocaleString(locale)} đơn`, `${st.stats.ordersLast30Days.toLocaleString(locale)} orders`)}</p>
                    <p className="text-[12px] text-slate-500">
                      {st.stats.lastOrderAt
                        ? t('Gần nhất ', 'Last ') + (formatRelativeTime(st.stats.lastOrderAt) || formatVNDateTime(st.stats.lastOrderAt))
                        : t('Chưa có đơn', 'No orders yet')}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {st.lastActiveAt ? (
                      <div>
                        <p className={`font-medium ${isIdle ? 'text-amber-800' : 'text-slate-900'}`} title={formatVNDateTime(st.lastActiveAt)}>
                          {formatRelativeTime(st.lastActiveAt) || formatVNDateTime(st.lastActiveAt)}
                        </p>
                        {isIdle && (
                          <Badge tone="warning" dot={false} className="mt-0.5">
                            {t('Lâu không dùng', 'Inactive')}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">{t('Chưa đăng nhập', 'Never signed in')}</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={p.tone} dot={st.payos === 'ACTIVE'}>
                      {t(p.vi, p.en)}
                    </Badge>
                  </Td>
                  <Td>
                    {st.isActive ? (
                      <Badge tone="success">{t('Đang hoạt động', 'Active')}</Badge>
                    ) : (
                      <Badge tone="danger">{t('Tạm khóa', 'Suspended')}</Badge>
                    )}
                  </Td>
                  <Td align="right">
                    <RowMenu items={actionsFor(st)} label={t(`Thao tác với ${st.name}`, `Actions for ${st.name}`)} />
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
            label: t(`Tạm khóa ${selectedActive.length} cửa hàng`, `Suspend ${selectedActive.length} stores`),
            icon: Lock,
            danger: true,
            disabled: selectedActive.length === 0,
            onClick: () => setDialog({ type: 'bulkLock' }),
          },
        ]}
      />

      {/* Drawer Chi Tiết Cửa Hàng */}
      {detailId && (
        <Drawer
          title={detail?.name || t('Hồ sơ cửa hàng', 'Store profile')}
          subtitle={detail ? t(`Mã cửa hàng: ${detail.code}`, `Store code: ${detail.code}`) : ''}
          badge={
            detail && (
              <Badge tone={detail.isActive ? 'success' : 'danger'}>
                {detail.isActive ? t('Hoạt động', 'Active') : t('Tạm khóa', 'Suspended')}
              </Badge>
            )
          }
          tabs={[
            { key: 'overview', label: t('Tổng quan', 'Overview') },
            { key: 'owners', label: t('Chủ cửa hàng', 'Owners'), count: detail?.owners?.length },
            { key: 'integrations', label: t('Thanh toán', 'Payments') },
          ]}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={() => setDetailId(null)}
          footer={
            detail && (
              <>
                <button
                  type="button"
                  onClick={() => setDialog({ type: 'edit', store: detail })}
                  className={ui.btnSecondary}
                >
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('Sửa thông tin', 'Edit details')}
                </button>
                {detail.isActive ? (
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'lock', store: detail })}
                    className={ui.btnDanger}
                  >
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('Tạm khóa cửa hàng', 'Suspend store')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'unlock', store: detail })}
                    className={ui.btnPrimary}
                  >
                    <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('Mở lại cửa hàng', 'Reactivate store')}
                  </button>
                )}
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
                  [t('Tên cửa hàng', 'Store name'), detail.name],
                  [t('Mã cửa hàng', 'Store code'), <span key="code" className="font-mono">{detail.code}</span>],
                  [t('Điện thoại', 'Phone'), detail.phone || t('Chưa cập nhật', 'Not set')],
                  [t('Địa chỉ', 'Address'), detail.address || t('Chưa cập nhật', 'Not set')],
                  [t('Ngày tạo', 'Created'), formatVNDateTime(detail.createdAt)],
                  [
                    t('Đơn hàng gần nhất', 'Last order'),
                    detail.stats?.lastOrderAt ? formatVNDateTime(detail.stats.lastOrderAt) : t('Chưa có đơn hàng nào', 'No orders yet'),
                  ],
                ]}
              />

              <Section title={t('Quy mô & Tài nguyên vận hành', 'Size & resources')}>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    [t('Tài khoản', 'Accounts'), (detail.stats?.owners || 0) + (detail.stats?.staff || 0), Users],
                    [t('Sản phẩm', 'Products'), detail.stats?.products ?? 0, Package],
                    [t('Mã SKU', 'SKUs'), detail.stats?.skus ?? 0, ShoppingBag],
                    [t('Tổng số đơn', 'Orders'), detail.stats?.orders ?? 0, ShoppingBag],
                    [t('Đơn 30 ngày', 'Orders (30d)'), detail.stats?.ordersLast30Days ?? 0, ShoppingBag],
                    [t('Kho hàng', 'Warehouses'), detail.stats?.warehouses ?? 0, Warehouse],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center justify-between text-slate-500 mb-0.5">
                        <span className="text-[12px]">{label}</span>
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      </div>
                      <p className="text-[18px] font-semibold text-slate-900 tabular-nums">{value.toLocaleString(locale)}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          ) : drawerTab === 'owners' ? (
            <div className="space-y-4">
              <h4 className="text-[13px] font-semibold text-slate-900">{t('Chủ cửa hàng & Quản lý', 'Owners')}</h4>
              {detail.owners?.length > 0 ? (
                <ul className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white overflow-hidden ">
                  {detail.owners.map((ow) => (
                    <li key={ow.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={ow.fullName} size={36} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                            {ow.fullName}
                            {!ow.isActive && <Badge tone="danger">{t('Khóa', 'Disabled')}</Badge>}
                          </p>
                          <a href={`mailto:${ow.email}`} className="text-[12px] text-blue-600 hover:underline truncate block mt-0.5">
                            {ow.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`mailto:${ow.email}`}
                          className={`${ui.btnGhost} p-2`}
                          title={t('Gửi email', 'Send email')}
                          aria-label={t(`Gửi email cho ${ow.fullName}`, `Email ${ow.fullName}`)}
                        >
                          <Mail className="w-4 h-4 text-slate-500" aria-hidden="true" />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-slate-500 p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  {t('Cửa hàng chưa có tài khoản chủ shop liên kết.', 'This store has no linked owner account.')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-[13px] font-semibold text-slate-900">{t('Cổng thanh toán điện tử', 'Payment gateway')}</h4>
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-900">{t('VietQR qua PayOS', 'VietQR via PayOS')}</p>
                      <p className="text-[12px] text-slate-500">{t('Tự động đối soát và khớp đơn hàng tại quầy', 'Automatic reconciliation for counter orders')}</p>
                    </div>
                  </div>
                  <Badge tone={PAYOS[detailPayos].tone} dot={detailPayos === 'ACTIVE'}>
                    {
                      {
                        ACTIVE: t('Đang bật', 'On'),
                        DISABLED: t('Đã tắt', 'Off'),
                        NOT_CONFIGURED: t('Chưa kết nối', 'Not connected'),
                      }[detailPayos]
                    }
                  </Badge>
                </div>
                {payosConfig && (
                  <p className="text-[12px] text-slate-600 pt-2 border-t border-slate-100">
                    {t('Cấu hình ngày ', 'Configured on ')}
                    <span className="font-medium tabular-nums">{formatVNDateTime(payosConfig.configuredAt)}</span>.{' '}
                    {t('Khóa API được lưu mã hóa AES-256-GCM.', 'API keys are stored encrypted with AES-256-GCM.')}
                  </p>
                )}
              </div>
            </div>
          )}
        </Drawer>
      )}

      {/* Dialogs */}
      {dialog?.type === 'edit' && (
        <EditStoreModal
          store={dialog.store}
          onClose={() => setDialog(null)}
          onSaved={() => refreshAfterChange(dialog.store.id)}
        />
      )}

      {(dialog?.type === 'lock' || dialog?.type === 'unlock') && (
        <ConfirmDialog
          title={
            dialog.type === 'lock'
              ? t(`Tạm khóa cửa hàng ${dialog.store.name}?`, `Suspend ${dialog.store.name}?`)
              : t(`Mở lại cửa hàng ${dialog.store.name}?`, `Reactivate ${dialog.store.name}?`)
          }
          description={
            dialog.type === 'lock'
              ? t(
                  'Mọi tài khoản của cửa hàng bị đăng xuất ngay và không truy cập được hệ thống. Dữ liệu sản phẩm và đơn hàng vẫn được giữ nguyên.',
                  'Every account of this store is signed out immediately and loses access. Product and order data are kept.'
                )
              : t(
                  'Các tài khoản của cửa hàng đăng nhập và bán hàng bình thường ngay sau khi mở lại.',
                  'Store accounts can sign in and sell again right away.'
                )
          }
          confirmLabel={dialog.type === 'lock' ? t('Tạm khóa cửa hàng', 'Suspend store') : t('Mở lại cửa hàng', 'Reactivate store')}
          danger={dialog.type === 'lock'}
          reason={{
            required: dialog.type === 'lock',
            placeholder:
              dialog.type === 'lock'
                ? t('Ví dụ: Vi phạm điều khoản sử dụng', 'e.g. Terms of service violation')
                : t('Ví dụ: Đã xử lý xong vấn đề với chủ cửa hàng', 'e.g. Issue resolved with the owner'),
          }}
          password={
            dialog.type === 'lock'
              ? { hint: t('Khóa cửa hàng ảnh hưởng toàn bộ nhân viên nên cần nhập lại mật khẩu.', 'Suspending affects every staff member, so your password is required.') }
              : null
          }
          onClose={() => setDialog(null)}
          onConfirm={async ({ reason, password }) => {
            try {
              const res = await apiUpdateAdminStoreStatus(dialog.store.id, {
                isActive: dialog.type === 'unlock',
                reason: reason || undefined,
                actorPassword: dialog.type === 'lock' ? password : undefined,
              });
              toast({
                type: 'success',
                title: dialog.type === 'lock' ? t('Đã tạm khóa cửa hàng', 'Store suspended') : t('Đã mở lại cửa hàng', 'Store reactivated'),
                description:
                  dialog.type === 'lock'
                    ? t(
                        `${dialog.store.name}: đã thu hồi ${res?.data?.revokedSessions ?? 0} phiên đăng nhập.`,
                        `${dialog.store.name}: ${res?.data?.revokedSessions ?? 0} sessions revoked.`
                      )
                    : t(`${dialog.store.name} đã được mở lại.`, `${dialog.store.name} is active again.`),
              });
              refreshAfterChange(dialog.store.id);
            } catch (err) {
              toast({ type: 'error', title: t('Không cập nhật được trạng thái', 'Could not update the status'), description: apiErrorMessage(err) });
            }
          }}
        />
      )}

      {dialog?.type === 'bulkLock' && (
        <ConfirmDialog
          title={t(`Tạm khóa ${selectedActive.length} cửa hàng?`, `Suspend ${selectedActive.length} stores?`)}
          description={t(
            `${selectedActive.map((s) => s.name).join(', ')}. Mọi tài khoản của các cửa hàng này bị đăng xuất ngay. Dữ liệu vẫn được giữ nguyên.`,
            `${selectedActive.map((s) => s.name).join(', ')}. Every account of these stores is signed out immediately. Data is kept.`
          )}
          confirmLabel={t('Tạm khóa tất cả', 'Suspend all')}
          danger
          reason={{ required: true, placeholder: t('Ví dụ: Vi phạm điều khoản sử dụng', 'e.g. Terms of service violation') }}
          password={{ hint: t('Cần nhập lại mật khẩu cho thao tác hàng loạt.', 'Bulk actions require your password.') }}
          onClose={() => setDialog(null)}
          onConfirm={bulkLock}
        />
      )}
    </div>
  );
}

export default AdminStoresPage;
