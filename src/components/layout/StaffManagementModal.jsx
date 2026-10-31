import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, UserPlus, Search, Edit2, Trash2, CheckCircle2, XCircle,
  X, Shield, KeyRound, Mail, User, AlertTriangle, Loader2,
  ShoppingBag, DollarSign, TrendingUp, Sparkles, Eye, EyeOff, Calendar, Award
} from 'lucide-react';
import { apiGetStaffList, apiCreateStaff, apiUpdateStaff, apiDeleteStaff } from '../../services/staffService';
import { useToast } from '../common/Toast';
import { cn } from '../lib/utils';

export function StaffManagementModal({ isOpen, onClose, isEn }) {
  const { toast } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected staff for Left Panel
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Left Panel Mode: 'edit' (edit selected staff) | 'add' (add new staff form)
  const [panelMode, setPanelMode] = useState('edit');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('12345678');
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Delete confirmation state
  const [deletingStaff, setDeletingStaff] = useState(null);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await apiGetStaffList();
      setStaffList(data);

      // Select first staff or keep current selected staff
      setSelectedStaff((prev) => {
        if (!data || data.length === 0) return null;
        if (prev) {
          const found = data.find((s) => s.id === prev.id);
          if (found) return found;
        }
        return data[0];
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
    if (isOpen) {
      fetchStaff();
      setSearchQuery('');
    }
  }, [isOpen]);

  // Sync edit form whenever selectedStaff changes
  useEffect(() => {
    if (selectedStaff) {
      setEditName(selectedStaff.fullName || '');
      setEditEmail(selectedStaff.email || '');
      setEditPassword('');
      setEditIsActive(Boolean(selectedStaff.isActive));
      setShowEditPassword(false);
    }
  }, [selectedStaff]);

  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
    setPanelMode('edit');
  };

  const handleOpenAddMode = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword('12345678');
    setShowAddPassword(false);
    setPanelMode('add');
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
        title: isEn ? 'Staff created successfully' : 'Tạo nhân viên thành công',
        message: isEn ? `Staff ${addEmail} has been added.` : `Đã thêm nhân viên ${addEmail} vào hệ thống.`,
      });

      await fetchStaff();
      if (created) setSelectedStaff(created);
      setPanelMode('edit');
    } catch (err) {
      toast({
        type: 'error',
        title: isEn ? 'Creation failed' : 'Tạo nhân viên thất bại',
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
      toast({ type: 'error', title: isEn ? 'Missing information' : 'Thiếu thông tin', message: isEn ? 'Please enter staff full name.' : 'Vui lòng nhập họ và tên nhân viên.' });
      return;
    }
    if (editEmail && !editEmail.includes('@')) {
      toast({ type: 'error', title: isEn ? 'Invalid email' : 'Email không hợp lệ', message: isEn ? 'Please enter a valid email address.' : 'Vui lòng nhập địa chỉ email hợp lệ.' });
      return;
    }
    if (editPassword && editPassword.length < 6) {
      toast({ type: 'error', title: isEn ? 'Weak password' : 'Mật khẩu yếu', message: isEn ? 'New password must be at least 6 characters.' : 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: editName.trim(),
        isActive: editIsActive,
      };
      if (editEmail.trim() !== selectedStaff.email) {
        payload.email = editEmail.trim();
      }
      if (editPassword) {
        payload.password = editPassword;
      }

      const updated = await apiUpdateStaff(selectedStaff.id, payload);

      toast({
        type: 'success',
        title: isEn ? 'Staff updated successfully' : 'Cập nhật nhân viên thành công',
        message: isEn ? `Information for ${editName} has been saved.` : `Đã lưu thay đổi cho nhân viên ${editName}.`,
      });

      await fetchStaff();
      if (updated) setSelectedStaff(updated);
    } catch (err) {
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
        title: isEn ? 'Staff deleted successfully' : 'Xóa nhân viên thành công',
        message: isEn
          ? `Staff ${deletingStaff.fullName || deletingStaff.email} has been removed from system.`
          : `Đã xóa nhân viên ${deletingStaff.fullName || deletingStaff.email} khỏi hệ thống.`,
      });
      setDeletingStaff(null);
      await fetchStaff();
    } catch (err) {
      toast({
        type: 'error',
        title: isEn ? 'Deletion failed' : 'Xóa thất bại',
        message: err?.response?.data?.error?.message || err?.message || 'Error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter staff by search query
  const filteredStaff = staffList.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (s.fullName && s.fullName.toLowerCase().includes(q)) ||
           (s.email && s.email.toLowerCase().includes(q));
  });

  // Calculate overview metrics
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const totalCompletedOrders = staffList.reduce((acc, s) => acc + (Number(s.completedOrdersCount) || 0), 0);
  const totalAmountPaidAll = staffList.reduce((acc, s) => acc + (Number(s.totalAmountPaid) || 0), 0);

  const formatVND = (num) => {
    return Number(num || 0).toLocaleString('vi-VN') + ' đ';
  };

  const isOwner = selectedStaff?.role === 'SHOP_OWNER';

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] max-h-[860px] shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col overflow-hidden">
        
        {/* ============================================================== */}
        {/* HEADER                                                         */}
        {/* ============================================================== */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isEn ? 'Staff & Sales Performance Management' : 'Quản lý nhân viên & Hiệu suất bán hàng'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  {totalStaff} {isEn ? 'members' : 'nhân sự'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Manage staff accounts, edit profiles, track completed orders and payments collected'
                  : 'Quản lý danh sách nhân viên, sửa đổi thông tin, theo dõi số đơn hoàn thành & doanh số thanh toán'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddMode}
              className={cn(
                'px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer',
                panelMode === 'add'
                  ? 'bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isEn ? '1. Add Staff Member' : '1. Thêm nhân viên mới'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* KPI OVERVIEW CARDS BAR                                         */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-400 block truncate">
                {isEn ? 'Total Roster' : 'Tổng số nhân sự'}
              </span>
              <span className="text-sm font-black text-slate-800">
                {totalStaff} <span className="text-xs font-normal text-slate-500">{isEn ? 'people' : 'người'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-400 block truncate">
                {isEn ? 'Active Accounts' : 'Đang hoạt động'}
              </span>
              <span className="text-sm font-black text-emerald-600">
                {activeStaff} / {totalStaff}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-400 block truncate">
                {isEn ? 'Orders Completed' : 'Đơn hàng hoàn thành'}
              </span>
              <span className="text-sm font-black text-slate-800">
                {totalCompletedOrders} <span className="text-xs font-normal text-slate-500">{isEn ? 'orders' : 'đơn'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-400 block truncate">
                {isEn ? 'Total Sales Collected' : 'Tổng doanh số thanh toán'}
              </span>
              <span className="text-sm font-black text-emerald-700 truncate block">
                {formatVND(totalAmountPaidAll)}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN BODY: 2-COLUMN SPLIT WORKSPACE                            */}
        {/* ============================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ------------------------------------------------------------ */}
          {/* CỘT TRÁI: FORM SỬA / THAY ĐỔI THÔNG TIN / XÓA HOẶC THÊM MỚI */}
          {/* ------------------------------------------------------------ */}
          <div className="w-full lg:w-[380px] xl:w-[420px] border-r border-slate-200 flex flex-col bg-slate-50/40 shrink-0 overflow-y-auto">
            
            {/* Left Panel Tabs Header */}
            <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPanelMode('edit')}
                disabled={!selectedStaff}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  panelMode === 'edit'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEn ? 'Edit Selected Staff' : 'Sửa / Chi tiết nhân viên'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddMode}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  panelMode === 'add'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isEn ? 'Add Staff' : 'Thêm nhân viên'}</span>
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              
              {/* MODE: EDIT SELECTED STAFF */}
              {panelMode === 'edit' && selectedStaff && (
                <div className="space-y-5 animate-in fade-in">
                  
                  {/* Selected Staff Hero Card */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs',
                        isOwner ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                      )}>
                        {(selectedStaff.fullName || selectedStaff.email || 'NV').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate">
                            {selectedStaff.fullName || (isEn ? 'Unnamed' : 'Chưa đặt tên')}
                          </h4>
                          {isOwner ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                              {isEn ? 'Store Owner' : 'Chủ shop'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              {isEn ? 'Warehouse Staff' : 'Nhân viên kho'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{selectedStaff.email}</p>
                      </div>
                    </div>

                    {/* 2 KPI Metrics for this Staff: ĐƠN HOÀN THÀNH & TIỀN ĐÃ THANH TOÁN */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/80">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide block flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          {isEn ? 'Orders Completed' : 'Đơn hoàn thành'}
                        </span>
                        <span className="text-base font-black text-blue-900 mt-0.5 block">
                          {selectedStaff.completedOrdersCount || 0} <span className="text-xs font-semibold text-blue-600">{isEn ? 'orders' : 'đơn'}</span>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {isEn ? 'Sales Collected' : 'Tiền đã thanh toán'}
                        </span>
                        <span className="text-base font-black text-emerald-900 mt-0.5 block truncate">
                          {formatVND(selectedStaff.totalAmountPaid)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* EDIT FORM (SỬA HOẶC THAY ĐỔI THÔNG TIN) */}
                  <form onSubmit={handleUpdateStaff} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        {isEn ? 'Modify Staff Information' : 'Sửa thông tin nhân viên'}
                      </span>
                      {selectedStaff.isActive ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {isEn ? 'Active' : 'Đang hoạt động'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          {isEn ? 'Locked' : 'Đang tạm khóa'}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isEn ? 'Full name *' : 'Họ và tên nhân viên *'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isEn ? 'Login email *' : 'Email đăng nhập *'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isEn ? 'Reset password (optional)' : 'Đặt lại mật khẩu mới (tùy chọn)'}
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder={isEn ? 'Leave empty to keep current password' : 'Để trống nếu không muốn đổi mật khẩu'}
                          className="w-full pl-9 pr-10 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isEn ? 'Account active status' : 'Trạng thái hoạt động'}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditIsActive(true)}
                          className={cn(
                            'py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                            editIsActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Active' : 'Hoạt động'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditIsActive(false)}
                          className={cn(
                            'py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                            !editIsActive
                              ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Lock Account' : 'Tạm khóa'}</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer mt-2"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isEn ? 'Save Changes' : 'Lưu thay đổi'}</span>
                    </button>
                  </form>

                  {/* DANGER ZONE: XÓA NHÂN VIÊN */}
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {isEn ? 'Danger Zone' : 'Khu vực quản trị đặc biệt'}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-600">
                      {isOwner
                        ? (isEn ? 'Store owner account cannot be deleted.' : 'Tài khoản chủ cửa hàng (gốc) không thể xóa.')
                        : (isEn ? 'Permanently delete this staff account and revoke all sessions.' : 'Xóa vĩnh viễn tài khoản nhân viên này và thu hồi toàn bộ phiên làm việc.')}
                    </p>

                    {!isOwner && (
                      <button
                        type="button"
                        onClick={() => setDeletingStaff(selectedStaff)}
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Delete This Staff Member' : 'Xóa nhân viên này'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* MODE: ADD NEW STAFF FORM */}
              {panelMode === 'add' && (
                <form onSubmit={handleCreateStaff} className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
                    <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900">
                      <span className="font-bold block">{isEn ? 'Create New Staff Member' : 'Thêm nhân viên mới'}</span>
                      <span className="text-[11px] text-emerald-700">
                        {isEn
                          ? 'Staff will have access to inbound/outbound shipments, barcode scanning, POS cashiering & stock auditing. Revenue and profit metrics are securely masked.'
                          : 'Nhân viên sẽ có quyền nhập kho, quét mã vạch kiểm kê, bán lẻ POS. Báo cáo tài chính & biên độ lãi sẽ được bảo mật tự động.'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isEn ? 'Staff full name *' : 'Họ và tên nhân viên *'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder={isEn ? 'e.g. John Doe' : 'VD: Nguyễn Văn An'}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isEn ? 'Login email *' : 'Email đăng nhập *'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        placeholder={isEn ? 'e.g. staff@demo.com' : 'VD: an.nguyen@demo.vn'}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isEn ? 'Initial password *' : 'Mật khẩu khởi tạo *'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        required
                        value={addPassword}
                        onChange={(e) => setAddPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isEn ? 'Minimum 6 characters.' : 'Tối thiểu 6 ký tự.'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPanelMode('edit')}
                      className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                    >
                      {isEn ? 'Cancel' : 'Hủy'}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isEn ? 'Confirm Add Staff' : 'Xác nhận tạo'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CỘT PHẢI: BẢNG DANH SÁCH NHÂN SỰ & HIỆU SUẤT BÁN HÀNG         */}
          {/* ------------------------------------------------------------ */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            
            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? 'Search staff by name or email...' : 'Tìm nhân viên theo tên hoặc email...'}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 font-medium shrink-0">
                {isEn ? 'Click any row to edit & view metrics' : 'Bấm vào dòng để xem & sửa ở cột trái'}
              </div>
            </div>

            {/* Staff List Table */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs">{isEn ? 'Loading staff directory...' : 'Đang tải danh sách nhân viên...'}</span>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="py-20 px-4 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">{isEn ? 'No staff found' : 'Không tìm thấy nhân viên nào'}</h4>
                  <p className="text-xs text-slate-400 mt-1">{isEn ? 'Try adjusting your search query.' : 'Thử tìm với từ khóa khác.'}</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{isEn ? 'Staff Member' : 'Nhân viên'}</th>
                      <th className="py-3 px-3">{isEn ? 'Role' : 'Vai trò'}</th>
                      <th className="py-3 px-3">{isEn ? 'Status' : 'Trạng thái'}</th>
                      <th className="py-3 px-3 text-center">
                        <span className="flex items-center justify-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                          {isEn ? 'Completed' : 'Đơn hoàn thành'}
                        </span>
                      </th>
                      <th className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="flex items-center justify-end gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          {isEn ? 'Sales Paid' : 'Tiền đã thanh toán'}
                        </span>
                      </th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">{isEn ? 'Action' : 'Thao tác'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((staff) => {
                      const isSelected = selectedStaff?.id === staff.id;
                      const staffIsOwner = staff.role === 'SHOP_OWNER';

                      return (
                        <tr
                          key={staff.id}
                          onClick={() => handleSelectStaff(staff)}
                          className={cn(
                            'hover:bg-blue-50/50 transition-colors cursor-pointer group',
                            isSelected && 'bg-blue-50/80 font-medium'
                          )}
                        >
                          {/* Staff Name & Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-transform group-hover:scale-105',
                                staffIsOwner ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                              )}>
                                {(staff.fullName || staff.email || 'NV').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className={cn('block font-bold text-slate-800 truncate', isSelected && 'text-blue-700')}>
                                  {staff.fullName || (isEn ? 'Unnamed' : 'Chưa đặt tên')}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono truncate block">{staff.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-3">
                            {staffIsOwner ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 whitespace-nowrap">
                                {isEn ? 'Store Owner' : 'Chủ shop'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                {isEn ? 'Warehouse Staff' : 'Nhân viên kho'}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {staff.isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {isEn ? 'Active' : 'Hoạt động'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                {isEn ? 'Locked' : 'Tạm khóa'}
                              </span>
                            )}
                          </td>

                          {/* ĐƠN HOÀN THÀNH */}
                          <td className="py-3 px-3 text-center font-bold text-slate-800">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-black">
                              {staff.completedOrdersCount || 0}
                            </span>
                          </td>

                          {/* SỐ TIỀN ĐÃ THANH TOÁN */}
                          <td className="py-3 px-3 text-right">
                            <span className="font-black text-emerald-600 block">
                              {formatVND(staff.totalAmountPaid)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleSelectStaff(staff)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 transition-colors"
                                title={isEn ? 'Edit in left panel' : 'Sửa ở cột trái'}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {!staffIsOwner && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingStaff(staff)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
                                  title={isEn ? 'Delete staff' : 'Xóa nhân viên'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>

        </div>

        {/* ============================================================== */}
        {/* DELETE CONFIRMATION POPUP                                      */}
        {/* ============================================================== */}
        {deletingStaff && (
          <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-rose-100 animate-in zoom-in-95 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h4 className="text-base font-bold text-slate-900">
                  {isEn ? 'Confirm Staff Deletion' : 'Xác nhận xóa nhân viên'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isEn
                    ? `Are you sure you want to permanently delete staff "${deletingStaff.fullName || deletingStaff.email}"? All login sessions will be immediately terminated.`
                    : `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản nhân viên "${deletingStaff.fullName || deletingStaff.email}"? Toàn bộ phiên đăng nhập sẽ bị thu hồi ngay lập tức.`}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingStaff(null)}
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEn ? 'Delete Permanently' : 'Xóa vĩnh viễn'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
