import { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Search, Edit2, Trash2, CheckCircle2, XCircle,
  X, Shield, KeyRound, Mail, Phone, User, AlertTriangle, Loader2,
  ShoppingBag, DollarSign, Eye, EyeOff, FileSpreadsheet, Download,
  Trophy, Award, Filter, ChevronLeft, ChevronRight, Check, TrendingUp, Sparkles
} from 'lucide-react';
import { apiGetStaffList, apiCreateStaff, apiUpdateStaff, apiDeleteStaff } from '../../services/staffService';
import { useAuthStore } from '../../components/store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useToast } from '../../components/common/Toast';
import { cn } from '../../components/lib/utils';

export function StaffPage() {
  const { user } = useAuthStore();
  const { language } = useTranslation();
  const isEn = language === 'en';
  const { toast } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'locked'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'SHOP_OWNER' | 'STAFF'

  // Selected staff for Right Drawer/Panel
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Right Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelMode, setPanelMode] = useState('edit'); // 'edit' | 'add'
  const [panelTab, setPanelTab] = useState('general'); // 'general' | 'performance'

  // Selected row checkboxes for table bulk
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('0909324543');
  const [editPassword, setEditPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('12345678');
  const [addIsActive, setAddIsActive] = useState(true);
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Delete confirmation modal state
  const [deletingStaff, setDeletingStaff] = useState(null);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await apiGetStaffList();
      setStaffList(data || []);

      setSelectedStaff((prev) => {
        if (!data || data.length === 0) return null;
        if (prev) {
          const found = data.find((s) => s.id === prev.id);
          if (found) return found;
        }
        const firstStaff = data.find((s) => s.role !== 'SHOP_OWNER') || data[0];
        return firstStaff;
      });
    } catch (err) {
      console.error('Failed to load staff list:', err);
      toast({
        type: 'error',
        title: isEn ? 'Failed to load staff' : 'Lỗi tải danh sách nhân viên',
        message: err?.response?.data?.error?.message || err?.message || 'Error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Sync edit form whenever selectedStaff changes
  useEffect(() => {
    if (selectedStaff) {
      setEditName(selectedStaff.fullName || '');
      setEditEmail(selectedStaff.email || '');
      setEditPhone(selectedStaff.phone || '0909324543');
      setEditPassword('');
      setEditIsActive(Boolean(selectedStaff.isActive));
      setShowEditPassword(false);
      setSelectedRowIds(new Set([selectedStaff.id]));
    }
  }, [selectedStaff]);

  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
    setPanelMode('edit');
    setIsPanelOpen(true);
    setSelectedRowIds(new Set([staff.id]));
  };

  const handleOpenAddMode = () => {
    setAddName('');
    setAddEmail('');
    setAddPhone('');
    setAddPassword('12345678');
    setAddIsActive(true);
    setShowAddPassword(false);
    setPanelMode('add');
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!addName.trim()) {
      toast({ type: 'error', title: isEn ? 'Missing information' : 'Thiếu thông tin', message: isEn ? 'Please enter staff full name.' : 'Vui lòng nhập họ và tên nhân viên.' });
      return;
    }
    if (!addEmail.trim() || !addEmail.includes('@')) {
      toast({ type: 'error', title: isEn ? 'Invalid email' : 'Email không hợp lệ', message: isEn ? 'Please enter a valid email address.' : 'Vui lòng nhập địa chỉ email hợp lệ.' });
      return;
    }
    if (!addPassword || addPassword.length < 6) {
      toast({ type: 'error', title: isEn ? 'Weak password' : 'Mật khẩu yếu', message: isEn ? 'Password must be at least 6 characters.' : 'Mật khẩu phải có tối thiểu 6 ký tự.' });
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiCreateStaff({
        fullName: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
      });

      toast({
        type: 'success',
        title: isEn ? 'Staff created' : 'Thêm nhân viên thành công',
        message: isEn
          ? `Staff account ${created.fullName} has been created.`
          : `Đã tạo tài khoản nhân viên ${created.fullName} thành công.`,
      });

      await fetchStaff();
      setSelectedStaff(created);
      setPanelMode('edit');
    } catch (err) {
      console.error('Failed to create staff:', err);
      toast({
        type: 'error',
        title: isEn ? 'Creation failed' : 'Thêm nhân viên thất bại',
        message: err?.response?.data?.error?.message || err?.message || 'Error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;

    if (!editName.trim()) {
      toast({ type: 'error', title: isEn ? 'Missing information' : 'Thiếu thông tin', message: isEn ? 'Please enter full name.' : 'Vui lòng nhập họ và tên.' });
      return;
    }

    if (!editEmail.trim() || !editEmail.includes('@')) {
      toast({ type: 'error', title: isEn ? 'Invalid email' : 'Email không hợp lệ', message: isEn ? 'Please enter a valid email address.' : 'Vui lòng nhập email hợp lệ.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: editName.trim(),
        email: editEmail.trim(),
        isActive: editIsActive,
      };

      if (editPassword && editPassword.trim().length >= 6) {
        payload.password = editPassword.trim();
      }

      const updated = await apiUpdateStaff(selectedStaff.id, payload);

      toast({
        type: 'success',
        title: isEn ? 'Updated successfully' : 'Cập nhật thành công',
        message: isEn
          ? `Staff ${updated.fullName} has been updated.`
          : `Đã cập nhật thông tin nhân viên ${updated.fullName}.`,
      });

      await fetchStaff();
      setSelectedStaff(updated);
    } catch (err) {
      console.error('Failed to update staff:', err);
      toast({
        type: 'error',
        title: isEn ? 'Update failed' : 'Cập nhật thất bại',
        message: err?.response?.data?.error?.message || err?.message || 'Error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;

    setSubmitting(true);
    try {
      await apiDeleteStaff(deletingStaff.id);
      toast({
        type: 'success',
        title: isEn ? 'Staff deleted' : 'Xóa nhân viên thành công',
        message: isEn
          ? `Staff ${deletingStaff.fullName} has been deleted.`
          : `Đã xóa tài khoản nhân viên ${deletingStaff.fullName}.`,
      });

      const deletedId = deletingStaff.id;
      setDeletingStaff(null);
      await fetchStaff();

      if (selectedStaff?.id === deletedId) {
        setSelectedStaff(null);
      }
    } catch (err) {
      console.error('Failed to delete staff:', err);
      toast({
        type: 'error',
        title: isEn ? 'Deletion failed' : 'Xóa nhân viên thất bại',
        message: err?.response?.data?.error?.message || err?.message || 'Error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Export to Excel / CSV format
  const handleExportExcel = () => {
    try {
      const headers = ['Mã NV', 'Họ và tên', 'Email', 'Vai trò', 'Trạng thái', 'Đơn hoàn thành', 'Tiền đã thanh toán (VNĐ)', 'Ngày tham gia'];
      const rows = staffList.map((s) => [
        `NV-${String(s.id).padStart(3, '0')}`,
        `"${(s.fullName || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        s.role === 'SHOP_OWNER' ? (isEn ? 'Store Owner' : 'Chủ shop') : (isEn ? 'Staff' : 'Nhân viên'),
        s.isActive ? (isEn ? 'Active' : 'Hoạt động') : (isEn ? 'Locked' : 'Tạm khóa'),
        s.completedOrdersCount || 0,
        s.totalAmountPaid || 0,
        s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '',
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `danh_sach_nhan_vien_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        type: 'success',
        title: isEn ? 'Export completed' : 'Xuất file thành công',
        message: isEn ? 'Staff list exported to CSV/Excel.' : 'Đã xuất danh sách nhân viên thành file Excel/CSV thành công.',
      });
    } catch (e) {
      console.error('Export error:', e);
      toast({
        type: 'error',
        title: isEn ? 'Export failed' : 'Xuất file thất bại',
        message: isEn ? 'Could not generate CSV file.' : 'Không thể xuất danh sách nhân viên.',
      });
    }
  };

  // Format currency VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount || 0));
  };

  // Helper format Staff ID: NV-001, NV-002...
  const formatStaffId = (id) => `NV-${String(id || 1).padStart(3, '0')}`;

  // Filtered and searched staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // Status filter
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'locked' && s.isActive) return false;

      // Role filter: Chỉ lọc Chủ shop hoặc Nhân viên
      if (roleFilter === 'SHOP_OWNER' && s.role !== 'SHOP_OWNER') return false;
      if (roleFilter === 'STAFF' && s.role === 'SHOP_OWNER') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idStr = formatStaffId(s.id).toLowerCase();
        const matchName = (s.fullName || '').toLowerCase().includes(q);
        const matchEmail = (s.email || '').toLowerCase().includes(q);
        const matchId = idStr.includes(q);
        if (!matchName && !matchEmail && !matchId) return false;
      }

      return true;
    });
  }, [staffList, statusFilter, roleFilter, searchQuery]);

  // Paginated list
  const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  // Bulk select all toggle
  const isAllSelected = paginatedStaff.length > 0 && paginatedStaff.every((s) => selectedRowIds.has(s.id));
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(paginatedStaff.map((s) => s.id)));
    }
  };

  const handleToggleRow = (id, e) => {
    e.stopPropagation();
    const next = new Set(selectedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRowIds(next);
  };

  // KPI Calculations
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const lockedStaff = totalStaff - activeStaff;
  const totalCompletedOrders = staffList.reduce((acc, s) => acc + (s.completedOrdersCount || 0), 0);
  const totalAmountPaidAll = staffList.reduce((acc, s) => acc + (s.totalAmountPaid || 0), 0);

  // Helper avatar background colors matching StockPilot palette
  const getAvatarGradient = (idx) => {
    const gradients = [
      'from-blue-600 to-indigo-600',
      'from-sky-500 to-blue-600',
      'from-indigo-500 to-purple-600',
      'from-emerald-500 to-teal-600',
      'from-slate-600 to-slate-800',
    ];
    return gradients[idx % gradients.length];
  };

  // Role display helpers: Đồng bộ với bảng màu StockPilot
  const getRoleBadge = (role) => {
    if (role === 'SHOP_OWNER') {
      return {
        label: isEn ? 'Store Owner' : 'Chủ shop',
        className: 'bg-blue-50 text-blue-700 border-blue-200/90 font-bold',
      };
    }
    return {
      label: isEn ? 'Staff' : 'Nhân viên',
      className: 'bg-slate-100 text-slate-700 border-slate-200 font-bold',
    };
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* ==================================================================== */}
      {/* 1. TOP HERO BANNER: Framed Hero Gradient đồng bộ với Đơn hàng & Kho */}
      {/* ==================================================================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
          border: '1px solid #7dd3fc',
          borderRadius: 18,
          padding: '18px 24px',
          color: '#082f49',
          boxShadow: '0 8px 22px -5px rgba(14, 165, 233, 0.22), 0 2px 6px -1px rgba(0, 0, 0, .04)',
        }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
      >
        {/* Glow ambient background light */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/90 text-blue-600 flex items-center justify-center border border-blue-200/80 shrink-0 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#082f49] m-0">
                {isEn ? 'Staff Management' : 'Quản lý nhân viên'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/80 text-blue-700 border border-blue-200 shadow-2xs">
                {totalStaff} {isEn ? 'members' : 'nhân sự'}
              </span>
            </div>
            <p className="text-xs text-[#0c4a6e] mt-1 font-medium leading-relaxed max-w-2xl">
              {isEn
                ? 'Create staff accounts, edit profiles, permissions, delete and track completed orders & sales.'
                : 'Thêm mới nhân viên, chỉnh sửa thông tin, phân quyền, xóa tài khoản & theo dõi số đơn hoàn thành và doanh số.'}
            </p>
          </div>
        </div>

        {/* Primary Action Button: StockPilot Blue Button đồng bộ */}
        <div className="relative z-10 shrink-0">
          <button
            onClick={handleOpenAddMode}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ {isEn ? 'Add New Staff' : 'Thêm nhân viên mới'}</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. KPI SUMMARY METRIC CARDS: 4 Thẻ trắng tinh tế chuẩn StockPilot    */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total staff */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block truncate">
              {isEn ? 'Total Staff' : 'Tổng số nhân sự'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                {totalStaff} <span className="text-xs font-normal text-slate-500">{isEn ? 'people' : 'người'}</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                +1 mới
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active staff */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block truncate">
              {isEn ? 'Active Accounts' : 'Đang hoạt động'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-emerald-600 tabular-nums">
                {activeStaff} / {totalStaff}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Orders Completed */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block truncate">
              {isEn ? 'Orders Completed' : 'Đơn hàng hoàn thành'}
            </span>
            <div className="mt-0.5">
              <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                {totalCompletedOrders} <span className="text-xs font-normal text-slate-500">{isEn ? 'orders' : 'đơn'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Revenue Collected */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 block truncate">
              {isEn ? 'Total Sales Collected' : 'Tổng tiền đã thanh toán'}
            </span>
            <span className="text-xl font-extrabold text-slate-900 truncate block mt-0.5 tabular-nums">
              {formatVND(totalAmountPaidAll)}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE: TABLE (LEFT) + CHI TIẾT & CHỈNH SỬA (RIGHT)      */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: TABLE CONTAINER (Bảng danh sách & Hiệu suất)          */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex-1 min-w-0 w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 md:p-5 flex flex-col gap-4">
          {/* Row 1: Status Filter Tabs + Top Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  statusFilter === 'all'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                )}
              >
                {isEn ? 'All' : 'Tất cả'} ({totalStaff})
              </button>
              <button
                onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  statusFilter === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                )}
              >
                {isEn ? 'Active' : 'Hoạt động'} ({activeStaff})
              </button>
              <button
                onClick={() => { setStatusFilter('locked'); setCurrentPage(1); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  statusFilter === 'locked'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                )}
              >
                {isEn ? 'Locked' : 'Tạm khóa'} ({lockedStaff})
              </button>
            </div>

            {/* Top Right Action Buttons: + Thêm nhân viên (Blue) & Xuất file excel */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddMode}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ {isEn ? 'Add Staff' : 'Thêm nhân viên mới'}</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 rounded-xl font-bold text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                title={isEn ? 'Export to Excel/CSV' : 'Xuất danh sách ra file Excel / CSV'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>{isEn ? 'Export Excel' : 'Xuất file excel'}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Title & Search Bar + Role Filter */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEn ? 'Staff Roster & Performance' : 'Danh sách nhân viên & Hiệu suất'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? 'Click any row to view & edit details in the right panel'
                  : 'Bấm vào bất kỳ dòng nào để xem và sửa đổi thông tin ở cột bên phải'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder={isEn ? 'Search name, email, phone...' : 'Tìm theo tên, email, SĐT...'}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-normal"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Role filter dropdown */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
                >
                  <option value="all">{isEn ? 'All Roles' : 'Vai trò: Tất cả'}</option>
                  <option value="SHOP_OWNER">{isEn ? 'Store Owner' : 'Chủ shop'}</option>
                  <option value="STAFF">{isEn ? 'Staff' : 'Nhân viên'}</option>
                </select>
                <Filter className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-bold">{isEn ? 'ID' : 'ID'}</th>
                  <th className="py-3 px-3 font-bold">{isEn ? 'Staff Member' : 'NHÂN VIÊN'}</th>
                  <th className="py-3 px-3 font-bold">{isEn ? 'Role' : 'VAI TRÒ'}</th>
                  <th className="py-3 px-3 font-bold">{isEn ? 'Status' : 'TRẠNG THÁI'}</th>
                  <th className="py-3 px-3 font-bold text-center">{isEn ? 'Completed' : 'ĐƠN HOÀN THÀNH'}</th>
                  <th className="py-3 px-3 font-bold text-right">{isEn ? 'Sales Paid' : 'TIỀN ĐÃ THANH TOÁN'}</th>
                  <th className="py-3 px-3 font-bold text-center w-24">{isEn ? 'Actions' : 'THAO TÁC'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>{isEn ? 'Loading staff roster...' : 'Đang tải danh sách nhân viên...'}</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <p className="font-bold text-slate-600">
                        {isEn ? 'No staff found' : 'Không tìm thấy nhân viên nào'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {isEn ? 'Try adjusting your search query or filters.' : 'Thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((staff, idx) => {
                    const isSelected = selectedStaff?.id === staff.id;
                    const isChecked = selectedRowIds.has(staff.id);
                    const roleInfo = getRoleBadge(staff.role);
                    const staffIdStr = formatStaffId(staff.id);

                    return (
                      <tr
                        key={staff.id}
                        onClick={() => handleSelectStaff(staff)}
                        className={cn(
                          'transition-colors cursor-pointer group',
                          isSelected
                            ? 'bg-blue-50/70 border-l-4 border-l-blue-600 font-semibold'
                            : 'hover:bg-slate-50/80'
                        )}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center" onClick={(e) => handleToggleRow(staff.id, e)}>
                          <input
                            type="checkbox"
                            checked={isChecked || isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* ID */}
                        <td className="py-3 px-3 font-bold text-slate-700">
                          {staffIdStr}
                        </td>

                        {/* Staff: Avatar + Name + Email */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs bg-gradient-to-br',
                                getAvatarGradient(idx)
                              )}
                            >
                              {(staff.fullName || 'NV').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate group-hover:text-blue-600 transition-colors">
                                {staff.fullName}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate block">
                                {staff.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block',
                              roleInfo.className
                            )}
                          >
                            {roleInfo.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {staff.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {isEn ? 'Active' : 'Hoạt động'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              {isEn ? 'Locked' : 'Tạm khóa'}
                            </span>
                          )}
                        </td>

                        {/* Completed Orders Count */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-blue-600 text-xs px-2 py-0.5 rounded-lg bg-blue-50/80 border border-blue-100 tabular-nums">
                            {staff.completedOrdersCount || 0}
                          </span>
                        </td>

                        {/* Total Amount Paid */}
                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {formatVND(staff.totalAmountPaid || 0)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSelectStaff(staff)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title={isEn ? 'Edit staff' : 'Sửa thông tin'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                handleSelectStaff(staff);
                                setPanelTab('performance');
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title={isEn ? 'View performance' : 'Xem hiệu suất'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {staff.role !== 'SHOP_OWNER' && (
                              <button
                                onClick={() => setDeletingStaff(staff)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title={isEn ? 'Delete staff' : 'Xóa nhân viên'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER & PAGINATION */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 pt-1">
            <span>
              {isEn
                ? `Showing 1-${paginatedStaff.length} of ${filteredStaff.length} members`
                : `Hiển thị 1-${paginatedStaff.length} trên ${filteredStaff.length} nhân sự`}
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    currentPage === pg
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  )}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT COLUMN: CHI TIẾT & CHỈNH SỬA / THÊM NHÂN VIÊN MỚI           */}
        {/* ------------------------------------------------------------------ */}
        {isPanelOpen && (
          <div className="w-full lg:w-[390px] xl:w-[410px] shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4 self-start sticky top-4">
            {/* Panel Top Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {panelMode === 'add'
                  ? isEn ? 'Add New Staff' : 'Thêm nhân viên mới'
                  : isEn ? 'Staff Details & Edit' : 'Chi tiết & Chỉnh sửa'}
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClosePanel}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {isEn ? 'Close' : 'Đóng'}
                </button>
                <button
                  onClick={handleClosePanel}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel Mode Switch Tabs (Chỉ khi ở chế độ Edit) */}
            {panelMode === 'edit' && (
              <div className="flex items-center border-b border-slate-200 gap-4 text-xs font-bold">
                <button
                  onClick={() => setPanelTab('general')}
                  className={cn(
                    'pb-2.5 transition-all cursor-pointer relative',
                    panelTab === 'general'
                      ? 'text-blue-600 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {isEn ? 'General Info' : 'Thông tin chung'}
                  {panelTab === 'general' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setPanelTab('performance')}
                  className={cn(
                    'pb-2.5 transition-all cursor-pointer relative',
                    panelTab === 'performance'
                      ? 'text-blue-600 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {isEn ? 'History / Performance' : 'Lịch sử / Hiệu suất'}
                  {panelTab === 'performance' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              </div>
            )}

            {/* CONTENT MODE 1: EDIT STAFF (THÔNG TIN CHUNG) */}
            {panelMode === 'edit' && panelTab === 'general' && selectedStaff && (
              <div className="space-y-4">
                {/* Staff Hero Card */}
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="w-12 h-12 rounded-full ring-2 ring-blue-100 p-0.5 shrink-0 bg-white">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {(selectedStaff.fullName || 'NV').slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {selectedStaff.fullName}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {selectedStaff.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {getRoleBadge(selectedStaff.role).label}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {selectedStaff.isActive ? (isEn ? 'Active' : 'Đang hoạt động') : (isEn ? 'Locked' : 'Đã khóa')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2 Quick Metric Performance Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100/90 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-blue-600 mb-1">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xl font-extrabold text-slate-900 block tabular-nums">
                        {selectedStaff.completedOrdersCount || 0}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 block">
                        {isEn ? 'Orders Completed' : 'Đơn hoàn thành'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100/90 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-emerald-600 mb-1">
                      <Trophy className="w-4 h-4" />
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-emerald-700 block truncate tabular-nums">
                        {formatVND(selectedStaff.totalAmountPaid || 0)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 block">
                        {isEn ? 'Sales Paid' : 'Đã thanh toán'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleUpdateStaff} className="space-y-3 pt-1">
                  {/* Họ tên */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Full Name' : 'Họ tên'} *
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={isEn ? 'e.g. Tran Thi Mai' : 'Ví dụ: Trần Thị Mai'}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Email' : 'Email'} *
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="staff@stockpilot.vn"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Row: Phone & Staff Code */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEn ? 'Phone Number' : 'Số điện thoại'}
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="0909324543"
                          className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-normal"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEn ? 'Staff ID' : 'Mã NV'}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={formatStaffId(selectedStaff.id)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Row: Role & Password */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEn ? 'Role' : 'Vai trò'}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={selectedStaff.role === 'SHOP_OWNER' ? (isEn ? 'Store Owner' : 'Chủ shop') : (isEn ? 'Staff' : 'Nhân viên')}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEn ? 'Reset Password' : 'Mật khẩu mới'}
                      </label>
                      <div className="relative">
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-2.5 pr-7 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Active status */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', editIsActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')} />
                      <span className="text-xs font-bold text-slate-800">
                        {isEn ? 'Active Status' : 'Hoạt động'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={selectedStaff.role === 'SHOP_OWNER'}
                      onClick={() => setEditIsActive(!editIsActive)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                        editIsActive ? 'bg-blue-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform',
                          editIsActive ? 'left-6' : 'left-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Buttons: Lưu thay đổi + Hủy */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{isEn ? 'Save Changes' : 'Lưu thay đổi'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectStaff(selectedStaff)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {isEn ? 'Cancel' : 'Hủy'}
                    </button>
                  </div>
                </form>

                {/* Danger Zone: Khu vực nguy hiểm (Xóa nhân sự) */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    {isEn ? 'Danger Zone' : 'Khu vực nguy hiểm'}
                  </span>
                  {selectedStaff.role === 'SHOP_OWNER' ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs font-semibold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{isEn ? 'Store Owner root account cannot be deleted.' : 'Tài khoản chủ cửa hàng (gốc) không thể xóa.'}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingStaff(selectedStaff)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Delete Staff Member' : 'Xóa nhân sự'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* CONTENT MODE 2: EDIT STAFF -> PERFORMANCE TAB (LỊCH SỬ / HIỆU SUẤT) */}
            {panelMode === 'edit' && panelTab === 'performance' && selectedStaff && (
              <div className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-xs font-bold text-slate-900 block mb-2">
                    {isEn ? 'Performance Breakdown' : 'Tổng kết hiệu suất bán hàng & thu tiền'}
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">{isEn ? 'Completed Orders' : 'Tổng số đơn đã hoàn thành'}</span>
                      <span className="font-extrabold text-blue-600 tabular-nums">{selectedStaff.completedOrdersCount || 0} đơn</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">{isEn ? 'Total Payments' : 'Doanh số thanh toán'}</span>
                      <span className="font-extrabold text-emerald-700 tabular-nums">{formatVND(selectedStaff.totalAmountPaid || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">{isEn ? 'Average Order Value' : 'Giá trị đơn TB (AOV)'}</span>
                      <span className="font-bold text-slate-800 tabular-nums">
                        {selectedStaff.completedOrdersCount > 0
                          ? formatVND((selectedStaff.totalAmountPaid || 0) / selectedStaff.completedOrdersCount)
                          : '0 đ'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">{isEn ? 'Order Completion Rate' : 'Tỷ lệ đơn thành công'}</span>
                      <span className="font-bold text-emerald-600">100%</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-800">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isEn ? 'AI Performance Insight' : 'Đánh giá AI Decision Engine'}</span>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed font-normal">
                    {selectedStaff.completedOrdersCount > 0
                      ? `Nhân viên ${selectedStaff.fullName} đang xử lý tốt các đơn hàng tại kho và quầy thu ngân với độ chính xác cao.`
                      : `Nhân viên mới tham gia hệ thống, chưa phát sinh đơn hàng trực tiếp.`}
                  </p>
                </div>

                <button
                  onClick={() => setPanelTab('general')}
                  className="w-full py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  ← {isEn ? 'Back to General Info' : 'Quay lại Thông tin chung'}
                </button>
              </div>
            )}

            {/* CONTENT MODE 3: ADD NEW STAFF (THÊM NHÂN VIÊN MỚI) */}
            {panelMode === 'add' && (
              <form onSubmit={handleCreateStaff} className="space-y-3.5">
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100/90 text-xs text-blue-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium">
                    {isEn
                      ? 'Create a new staff account with default password.'
                      : 'Cấp tài khoản mới cho nhân viên cửa hàng.'}
                  </span>
                </div>

                {/* Họ tên */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Full Name' : 'Họ và tên nhân viên'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder={isEn ? 'e.g. Tran Thi Mai' : 'Ví dụ: Trần Thị Mai'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isEn ? 'Login Email' : 'Email đăng nhập'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="maitran@stockpilot.vn"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Row: Phone & Code */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Phone Number' : 'Số điện thoại'}
                    </label>
                    <input
                      type="text"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Projected ID' : 'Mã NV'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formatStaffId(staffList.length + 1)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row: Role & Initial Password */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Role' : 'Vai trò'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={isEn ? 'Staff' : 'Nhân viên'}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEn ? 'Password' : 'Mật khẩu ban đầu'} *
                    </label>
                    <div className="relative">
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        required
                        value={addPassword}
                        onChange={(e) => setAddPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-2.5 pr-7 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showAddPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active switch */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-800">
                    {isEn ? 'Active Immediately' : 'Kích hoạt hoạt động ngay'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddIsActive(!addIsActive)}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                      addIsActive ? 'bg-blue-600' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform',
                        addIsActive ? 'left-6' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{isEn ? 'Create Staff Account' : 'Tạo tài khoản nhân sự'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStaff) setPanelMode('edit');
                      else setIsPanelOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {isEn ? 'Cancel' : 'Hủy'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. DELETE CONFIRMATION MODAL                                         */}
      {/* ==================================================================== */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                {isEn ? 'Confirm Staff Deletion' : 'Xác nhận xóa nhân viên'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-normal">
                {isEn
                  ? `Are you sure you want to permanently delete staff account ${deletingStaff.fullName} (${deletingStaff.email})? This action will revoke active login sessions and cannot be undone.`
                  : `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản nhân sự ${deletingStaff.fullName} (${deletingStaff.email})? Mọi phiên đăng nhập sẽ bị thu hồi và không thể hoàn tác.`}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>{isEn ? 'Staff ID' : 'Mã nhân viên'}:</span>
                <span className="font-bold text-slate-700">{formatStaffId(deletingStaff.id)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{isEn ? 'Completed Orders' : 'Đơn hoàn thành'}:</span>
                <span className="font-bold text-blue-600 tabular-nums">{deletingStaff.completedOrdersCount || 0} đơn</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{isEn ? 'Sales Collected' : 'Tổng tiền thanh toán'}:</span>
                <span className="font-bold text-emerald-700 tabular-nums">{formatVND(deletingStaff.totalAmountPaid || 0)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isEn ? 'Yes, Delete' : 'Đồng ý xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffPage;
