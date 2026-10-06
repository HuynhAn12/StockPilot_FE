import React, { useState } from 'react';
import {
  Users, UserPlus, Shield, Key, Lock, Unlock,
  Search, CheckCircle2, MoreVertical, Edit2, ShieldCheck,
  Store, Warehouse, X
} from 'lucide-react';
import { useToast } from '../components/common/Toast';

const INITIAL_USERS = [
  { id: 'usr-1', fullName: 'Nguyễn Văn Minh', email: 'owner@stockpilot.vn', phone: '0908 123 456', role: 'store_owner', roleLabel: 'Chủ cửa hàng', status: 'ACTIVE', lastLogin: '2026-10-04T13:30:00Z' },
  { id: 'usr-2', fullName: 'Trần Văn Kho', email: 'warehouse@stockpilot.vn', phone: '0912 345 678', role: 'warehouse_staff', roleLabel: 'Nhân viên kho', status: 'ACTIVE', lastLogin: '2026-10-04T11:15:00Z' },
  { id: 'usr-3', fullName: 'Lê Quản Trị', email: 'admin@stockpilot.vn', phone: '0988 999 888', role: 'admin', roleLabel: 'Quản trị viên', status: 'ACTIVE', lastLogin: '2026-10-04T08:00:00Z' },
  { id: 'usr-4', fullName: 'Phạm Thu Ngân', email: 'thungan@stockpilot.vn', phone: '0933 222 111', role: 'warehouse_staff', roleLabel: 'Nhân viên kho', status: 'LOCKED', lastLogin: '2026-09-20T10:00:00Z' },
];

export function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('warehouse_staff');

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
  });

  const handleToggleLock = (id) => {
    setUsers(users.map((u) => {
      if (u.id !== id) return u;
      const nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
      toast({
        title: nextStatus === 'ACTIVE' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
        description: `Tài khoản ${u.email} hiện ở trạng thái ${nextStatus}.`,
        type: 'info'
      });
      return { ...u, status: nextStatus };
    }));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập họ tên và email.', type: 'warning' });
      return;
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      fullName: newName,
      email: newEmail,
      phone: newPhone || 'Chưa cập nhật',
      role: newRole,
      roleLabel: newRole === 'store_owner' ? 'Chủ cửa hàng' : newRole === 'admin' ? 'Quản trị viên' : 'Nhân viên kho',
      status: 'ACTIVE',
      lastLogin: 'Chưa đăng nhập'
    };

    setUsers([newUser, ...users]);
    setIsAddOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    toast({ title: 'Thêm tài khoản thành công', description: `Đã cấp quyền cho ${newUser.fullName}.`, type: 'success' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý người dùng & Phân quyền (RBAC)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý danh sách tài khoản, vai trò truy cập (Chủ cửa hàng, Nhân viên kho, Admin) và trạng thái hoạt động.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20"
        >
          <UserPlus className="w-4 h-4" />
          Thêm người dùng mới
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="font-bold text-sm text-foreground">Danh sách tài khoản hệ thống ({users.length})</h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email / SĐT</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Đăng nhập gần nhất</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {u.fullName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-foreground block">{u.email}</span>
                    <span className="text-[11px] text-muted-foreground">{u.phone}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-foreground">
                      {u.roleLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {u.lastLogin.includes('T') ? new Date(u.lastLogin).toLocaleString('vi-VN') : u.lastLogin}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleLock(u.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                        u.status === 'ACTIVE'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <form onSubmit={handleAddUser} className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Cấp tài khoản mới</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Địa chỉ Email đăng nhập</label>
                <input
                  type="email"
                  placeholder="nhanvien@stockpilot.vn"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="0912 345 678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg bg-card"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Vai trò phân quyền (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                >
                  <option value="warehouse_staff">Nhân viên kho (Warehouse Staff)</option>
                  <option value="store_owner">Chủ cửa hàng (Store Owner)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold">
                Hủy
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
                Tạo người dùng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
