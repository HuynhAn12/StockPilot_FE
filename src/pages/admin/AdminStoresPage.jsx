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
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
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

const DAY_MS = 24 * 60 * 60 * 1000;

const PAYOS = {
  ACTIVE: { label: 'VietQR (Đang bật)', tone: 'success' },
  DISABLED: { label: 'VietQR (Đã tắt)', tone: 'neutral' },
  NOT_CONFIGURED: { label: 'Chỉ tiền mặt', tone: 'neutral' },
};

const PAYOS_OPTIONS = [
  { value: '', label: 'Mọi hình thức thanh toán' },
  { value: 'ACTIVE', label: 'VietQR đang bật' },
  { value: 'DISABLED', label: 'VietQR đã tắt' },
  { value: 'NOT_CONFIGURED', label: 'Chỉ tiền mặt' },
];

function payosFromDetail(detail) {
  const config = detail?.paymentConfigs?.find((c) => c.provider === 'PAYOS');
  if (!config) return 'NOT_CONFIGURED';
  return config.isActive ? 'ACTIVE' : 'DISABLED';
}

function EditStoreModal({ store, onClose, onSaved }) {
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
      toast({ type: 'success', title: 'Đã lưu thông tin cửa hàng' });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: 'Không lưu được', description: apiErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Sửa thông tin Cửa hàng"
      description={`Mã cửa hàng (${store.code}) là định danh cố định không thể thay đổi. Mọi sửa đổi được lưu vào nhật ký kiểm toán.`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={ui.btnSecondary}>
            Hủy
          </button>
          <button type="submit" form="edit-store-form" disabled={busy || form.name.trim().length < 2} className={ui.btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Lưu thay đổi
          </button>
        </>
      }
    >
      <form id="edit-store-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Tên cửa hàng</label>
          <input
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
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Số điện thoại liên hệ</label>
          <input
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
          <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Địa chỉ hoạt động</label>
          <textarea
            rows={2}
            maxLength={500}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={ui.input}
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
          />
        </div>
      </form>
    </Modal>
  );
}

export function AdminStoresPage() {
  const { toast } = useToast();
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
  const [dialog, setDialog] = useState(null); // { type: 'edit' | 'lock' | 'unlock', store }

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
        toast({ type: 'error', title: 'Không mở được thông tin cửa hàng', description: apiErrorMessage(err) });
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
        return sortDirection === 'asc' ? nA.localeCompare(nB, 'vi') : nB.localeCompare(nA, 'vi');
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
  }, [stores, sortKey, sortDirection]);

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

  const actionsFor = (st) => [
    { label: 'Xem chi tiết', icon: ExternalLink, onClick: () => setDetailId(st.id) },
    { label: 'Sửa thông tin', icon: Edit2, onClick: () => setDialog({ type: 'edit', store: st }) },
    st.owner?.email && {
      label: 'Gửi email cho chủ cửa hàng',
      icon: Mail,
      onClick: () => window.open(`mailto:${st.owner.email}`),
    },
    st.phone && {
      label: 'Gọi điện cho cửa hàng',
      icon: Phone,
      onClick: () => window.open(`tel:${st.phone.replace(/[^\d+]/g, '')}`),
    },
    st.isActive
      ? { label: 'Tạm khóa cửa hàng', icon: Lock, onClick: () => setDialog({ type: 'lock', store: st }), danger: true }
      : { label: 'Mở lại cửa hàng', icon: Unlock, onClick: () => setDialog({ type: 'unlock', store: st }) },
  ].filter(Boolean);

  const chips = [
    status && {
      key: 'status',
      label: status === 'true' ? 'Đang hoạt động' : 'Tạm khóa',
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
        title="Quản lý Cửa hàng"
        description="Theo dõi tình trạng hoạt động, quy mô và tích hợp của từng khách hàng thuê nền tảng."
        badge={<Badge tone="neutral">{summary?.total ?? 0} cửa hàng</Badge>}
        actions={
          <button type="button" onClick={load} disabled={isLoading} className={ui.btnSecondary}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
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
            { value: '', label: 'Tất cả cửa hàng', count: summary?.total },
            { value: 'true', label: 'Đang hoạt động', count: summary?.active },
            { value: 'false', label: 'Đang tạm khóa', count: summary?.locked },
          ]}
        />
      </PageHeader>

      {/* 4 Thẻ KPI Tóm tắt Cửa hàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng số Cửa hàng"
          value={summary?.total ?? 0}
          subtitle="Tất cả tenant đăng ký"
          icon={Store}
          iconBg="bg-blue-50 text-[#2563EB] border-blue-100"
          loading={isLoading}
        />
        <StatCard
          title="Đang hoạt động"
          value={summary?.active ?? 0}
          subtitle={`Tỷ lệ ${summary?.total ? Math.round((summary.active / summary.total) * 100) : 0}% tổng thể`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-100"
          loading={isLoading}
        />
        <StatCard
          title="Tích hợp VietQR (PayOS)"
          value={`${summary?.payosActive ?? 0} / ${summary?.active ?? 0}`}
          subtitle="Cửa hàng nhận thanh toán QR"
          icon={CreditCard}
          iconBg="bg-purple-50 text-purple-600 border-purple-100"
          loading={isLoading}
        />
        <StatCard
          title="Ít hoạt động (> 14 ngày)"
          value={summary?.idle ?? 0}
          subtitle="Nguy cơ rời bỏ nền tảng"
          icon={Clock}
          iconBg="bg-amber-50 text-amber-700 border-amber-100"
          alert={summary?.idle > 0}
          loading={isLoading}
        />
      </div>

      <div className="space-y-3">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tên cửa hàng, mã định danh, số điện thoại…"
            className="w-full lg:w-80"
          />
          <FilterSelect
            label="Thanh toán"
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
              unit="cửa hàng"
            />
          )
        }
      >
        <table className="w-full min-w-237.5">
          <thead>
            <tr>
              <th className="w-10 px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] text-center">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onChange={handleSelectAll}
                  aria-label="Chọn tất cả cửa hàng"
                />
              </th>
              <Th sortKey="name" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                Cửa hàng
              </Th>
              <Th>Chủ cửa hàng</Th>
              <Th sortKey="skus" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="right">
                Quy mô
              </Th>
              <Th sortKey="orders" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} align="right">
                Đơn 30 ngày
              </Th>
              <Th sortKey="lastActiveAt" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}>
                Đăng nhập gần nhất
              </Th>
              <Th>Thanh toán</Th>
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
            columns={9}
            empty={
              sortedStores.length === 0 && (
                <EmptyState
                  title="Không tìm thấy cửa hàng phù hợp"
                  description="Hãy thử từ khóa tìm kiếm khác hoặc bỏ bớt các bộ lọc đang kích hoạt."
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
            {sortedStores.map((st) => {
              const p = PAYOS[st.payos] || PAYOS.NOT_CONFIGURED;
              const isSelected = selectedIds.includes(st.id);
              const isIdle =
                st.lastActiveAt && Math.floor((Date.now() - new Date(st.lastActiveAt).getTime()) / DAY_MS) >= idleDays;

              return (
                <tr
                  key={st.id}
                  onClick={() => setDetailId(st.id)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                >
                  <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => handleSelectRow(st.id, checked)}
                      aria-label={`Chọn ${st.name}`}
                    />
                  </td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={st.name} tone="brand" size={38} />
                      <div className="min-w-0">
                        <p className="font-bold text-[#0F172A] truncate max-w-55">{st.name}</p>
                        <p className="text-[12px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[11px] text-[#475569]">
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
                        <p className="font-semibold text-[#1E293B] flex items-center gap-1.5">
                          {st.owner.fullName}
                          {!st.owner.isActive && (
                            <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                              Khóa
                            </span>
                          )}
                        </p>
                        <p className="text-[12px] text-[#64748B] truncate mt-0.5">{st.owner.email}</p>
                      </div>
                    ) : (
                      <span className="text-[#94A3B8] italic">Chưa liên kết</span>
                    )}
                  </Td>
                  <Td align="right" className="whitespace-nowrap admin-num">
                    <p className="font-bold text-[#0F172A]">{st.stats.skus.toLocaleString('vi-VN')} SKU</p>
                    <p className="text-[12px] text-[#64748B]">{st.stats.users} tài khoản</p>
                  </Td>
                  <Td align="right" className="whitespace-nowrap admin-num">
                    <p className="font-bold text-[#0F172A]">{st.stats.ordersLast30Days.toLocaleString('vi-VN')} đơn</p>
                    <p className="text-[12px] text-[#64748B]">
                      {st.stats.lastOrderAt
                        ? `Gần nhất ${formatRelativeTime(st.stats.lastOrderAt) || formatVNDateTime(st.stats.lastOrderAt)}`
                        : 'Chưa có đơn'}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {st.lastActiveAt ? (
                      <div>
                        <p className={`font-semibold ${isIdle ? 'text-amber-800' : 'text-[#0F172A]'}`} title={formatVNDateTime(st.lastActiveAt)}>
                          {formatRelativeTime(st.lastActiveAt) || formatVNDateTime(st.lastActiveAt)}
                        </p>
                        {isIdle && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium mt-0.5">
                            <Clock className="w-2.5 h-2.5" /> Lâu không dùng
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#94A3B8] italic">Chưa đăng nhập</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={p.tone} dot={st.payos === 'ACTIVE'}>
                      {p.label}
                    </Badge>
                  </Td>
                  <Td>
                    {st.isActive ? (
                      <Badge tone="success">Đang hoạt động</Badge>
                    ) : (
                      <Badge tone="danger">Tạm khóa</Badge>
                    )}
                  </Td>
                  <Td align="right">
                    <RowMenu items={actionsFor(st)} label={`Thao tác với ${st.name}`} />
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
            label: 'Tạm khóa hàng loạt',
            icon: Lock,
            danger: true,
            onClick: () => {
              toast({
                type: 'info',
                title: 'Thao tác hàng loạt',
                description: `Đang chuẩn bị xác nhận tạm khóa cho ${selectedIds.length} cửa hàng đã chọn.`,
              });
            },
          },
        ]}
      />

      {/* Drawer Chi Tiết Cửa Hàng */}
      {detailId && (
        <Drawer
          title={detail?.name || 'Hồ sơ Cửa hàng'}
          subtitle={`Mã tenant: ${detail?.code}`}
          badge={
            detail && (
              <Badge tone={detail.isActive ? 'success' : 'danger'}>
                {detail.isActive ? 'Hoạt động' : 'Tạm khóa'}
              </Badge>
            )
          }
          tabs={[
            { key: 'overview', label: 'Tổng quan & Quy mô' },
            { key: 'owners', label: 'Nhân sự', count: detail?.owners?.length },
            { key: 'integrations', label: 'Cổng thanh toán' },
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
                  <Edit2 className="w-3.5 h-3.5" />
                  Sửa thông tin
                </button>
                {detail.isActive ? (
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'lock', store: detail })}
                    className={ui.btnDanger}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Tạm khóa cửa hàng
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDialog({ type: 'unlock', store: detail })}
                    className={ui.btnPrimary}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Mở lại cửa hàng
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
                  ['Tên cửa hàng', detail.name],
                  ['Mã subdomain', <span className="font-mono">{detail.code}</span>],
                  ['Điện thoại liên hệ', detail.phone || 'Chưa cập nhật'],
                  ['Địa chỉ', detail.address || 'Chưa cập nhật'],
                  ['Ngày khởi tạo', formatVNDateTime(detail.createdAt)],
                  [
                    'Đơn hàng gần nhất',
                    detail.stats?.lastOrderAt ? formatVNDateTime(detail.stats.lastOrderAt) : 'Chưa có đơn hàng nào',
                  ],
                ]}
              />

              <Section title="Quy mô & Tài nguyên vận hành">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['Tài khoản', (detail.stats?.owners || 0) + (detail.stats?.staff || 0), Users],
                    ['Sản phẩm', detail.stats?.products ?? 0, Package],
                    ['Mã SKU', detail.stats?.skus ?? 0, ShoppingBag],
                    ['Tổng số đơn', detail.stats?.orders ?? 0, ShoppingBag],
                    ['Đơn 30 ngày', detail.stats?.ordersLast30Days ?? 0, ShoppingBag],
                    ['Kho hàng', detail.stats?.warehouses ?? 0, Warehouse],
                  ].map(([label, value, Icon]) => (
                    <div key={label} className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs">
                      <div className="flex items-center justify-between text-[#64748B] mb-1">
                        <span className="text-[12px] font-medium">{label}</span>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[20px] font-bold text-[#0F172A] admin-num">{value.toLocaleString('vi-VN')}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          ) : drawerTab === 'owners' ? (
            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-[#0F172A]">Chủ cửa hàng & Quản lý</h4>
              {detail.owners?.length > 0 ? (
                <ul className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] bg-white overflow-hidden shadow-2xs">
                  {detail.owners.map((ow) => (
                    <li key={ow.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={ow.fullName} size={36} />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F172A] truncate flex items-center gap-1.5">
                            {ow.fullName}
                            {!ow.isActive && <Badge tone="danger">Khóa</Badge>}
                          </p>
                          <a href={`mailto:${ow.email}`} className="text-[12px] text-[#2563EB] hover:underline truncate block mt-0.5">
                            {ow.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a href={`mailto:${ow.email}`} className={`${ui.btnGhost} p-2`} title="Gửi email">
                          <Mail className="w-4 h-4 text-[#2563EB]" />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-[#64748B] p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Cửa hàng chưa có tài khoản chủ shop liên kết.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-[13px] font-bold text-[#0F172A]">Cổng thanh toán điện tử</h4>
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#0F172A]">VietQR qua PayOS</p>
                      <p className="text-[12px] text-[#64748B]">Tự động đối soát và khớp đơn hàng tại quầy</p>
                    </div>
                  </div>
                  <Badge tone={PAYOS[detailPayos].tone} dot={detailPayos === 'ACTIVE'}>
                    {{ ACTIVE: 'Đang bật', DISABLED: 'Đã tắt', NOT_CONFIGURED: 'Chưa kết nối' }[detailPayos]}
                  </Badge>
                </div>
                {payosConfig && (
                  <p className="text-[12px] text-[#475569] pt-2 border-t border-slate-100">
                    Được cấu hình ngày <span className="font-semibold">{formatVNDateTime(payosConfig.configuredAt)}</span>. Khóa API được mã hóa bằng AES-256 an toàn.
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
              ? `Tạm khóa cửa hàng ${dialog.store.name}?`
              : `Mở lại cửa hàng ${dialog.store.name}?`
          }
          description={
            dialog.type === 'lock'
              ? 'Tất cả tài khoản thuộc cửa hàng này sẽ bị đăng xuất ngay lập tức và không thể truy cập hệ thống. Toàn bộ dữ liệu sản phẩm và đơn hàng vẫn được lưu giữ an toàn.'
              : 'Các tài khoản thuộc cửa hàng sẽ có thể đăng nhập và bán hàng bình thường ngay sau khi mở khóa.'
          }
          confirmLabel={dialog.type === 'lock' ? 'Tạm khóa cửa hàng' : 'Mở lại cửa hàng'}
          danger={dialog.type === 'lock'}
          reason={{
            required: dialog.type === 'lock',
            placeholder:
              dialog.type === 'lock'
                ? 'Ví dụ: Hết hạn gói dịch vụ tháng này hoặc vi phạm điều khoản'
                : 'Ví dụ: Đã thanh toán gia hạn dịch vụ thành công',
          }}
          password={
            dialog.type === 'lock'
              ? { hint: 'Khóa cửa hàng ảnh hưởng đến toàn bộ nhân viên shop nên cần xác nhận lại mật khẩu.' }
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
                title: dialog.type === 'lock' ? 'Đã tạm khóa cửa hàng' : 'Đã mở lại cửa hàng',
                description:
                  dialog.type === 'lock'
                    ? `${dialog.store.name}: Đã thu hồi ${res?.data?.revokedSessions ?? 0} phiên đăng nhập.`
                    : `${dialog.store.name} đã được mở lại thành công.`,
              });
              refreshAfterChange(dialog.store.id);
            } catch (err) {
              toast({ type: 'error', title: 'Không cập nhật được trạng thái', description: apiErrorMessage(err) });
            }
          }}
        />
      )}
    </div>
  );
}

export default AdminStoresPage;
