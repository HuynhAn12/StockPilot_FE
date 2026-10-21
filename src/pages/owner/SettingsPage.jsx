/* === SettingsPage.jsx === */

import React, { useState, useEffect } from 'react';
import {
  Settings, Store, Bell, Shield, Save, RefreshCw,
  CheckCircle2, Sparkles, CreditCard, Eye, EyeOff,
  Lock, Mail, Globe, Zap, X, Check,
  Building2, Package, TrendingUp, Percent,
  AlertTriangle, Info, Loader2, User,
  Users, UserPlus, UserCheck, UserX, Plus
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../components/store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import {
  apiGetDecisionConfig,
  apiUpdateDecisionConfig,
  apiGetPaymentConfig,
  apiUpdatePaymentConfig,
  apiTogglePaymentConfig,
  apiGetNotificationSettings,
  apiUpdateNotificationSettings,
  apiUpdateStoreProfile,
  apiChangePassword,
} from '../../services/analyticsService';
import { apiClient } from '../../lib/apiClient';

/* ─── Inline CSS ─── */
const CSS = `
.st-root { font-family:var(--font-ui); }
.st-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03), 0 4px 12px -2px rgba(15,23,42,.03);
  flex-wrap: wrap;
}
.st-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.st-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.st-header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}
.st-header h1 {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.3px;
}
.st-header p {
  font-size: 12.5px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}
.st-store-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #0284c7;
  border-radius: 99px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}
.st-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  flex-shrink: 0;
}
.st-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(2, 132, 199, .2);
}
.st-user-meta {
  display: flex;
  flex-direction: column;
}
.st-user-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.st-user-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}
.st-role-badge {
  font-size: 10px;
  font-weight: 700;
  color: #0284c7;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  border-radius: 4px;
  padding: 1px 5px;
}
.st-user-email {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  margin-top: 2px;
}
.st-tab-bar { display:flex; border-bottom:2px solid #e2e8f0; gap:0; overflow-x:auto; scrollbar-width:none; }
.st-tab-bar::-webkit-scrollbar { display:none; }
.st-tab {
  padding:11px 18px; font-size:13px; font-weight:700;
  border-bottom:2.5px solid transparent; margin-bottom:-2px;
  cursor:pointer; transition:all .18s; color:#64748b;
  display:flex; align-items:center; gap:7px; background:none;
  border-top:none; border-left:none; border-right:none;
  white-space:nowrap; flex-shrink:0;
}
.st-tab.active { border-bottom-color:#0ea5e9; color:#0284c7; }
.st-tab:hover:not(.active) { color:#0f172a; border-bottom-color:#cbd5e1; }
.st-card {
  background:#fff; border:1px solid #edf2f7; border-radius:18px;
  box-shadow:0 2px 8px rgba(0,0,0,.035);
}
.st-section-title {
  font-size:14px; font-weight:800; color:#0f172a;
  display:flex; align-items:center; gap:8px; margin-bottom:4px;
}
.st-section-desc { font-size:12px; color:#64748b; font-weight:500; }
.st-label { font-size:12px; font-weight:700; color:#374151; display:block; margin-bottom:6px; }
.st-input {
  width:100%; padding:10px 14px; border:1.5px solid #e2e8f0;
  border-radius:12px; font-size:13px; background:#f8fafc;
  transition:border-color .18s,box-shadow .18s; box-sizing:border-box;
  color:#0f172a; font-family:inherit;
}
.st-input:focus { outline:none; border-color:#38bdf8; box-shadow:0 0 0 3px rgba(56,189,248,.15); background:#fff; }
.st-input:disabled { background:#f1f5f9; color:#94a3b8; cursor:not-allowed; }
.st-input-wrap { position:relative; }
.st-input-wrap .st-input { padding-right:42px; }
.st-eye-btn {
  position:absolute; right:13px; top:50%; transform:translateY(-50%);
  background:none; border:none; cursor:pointer; color:#94a3b8;
  display:flex; align-items:center; padding:2px;
}
.st-eye-btn:hover { color:#0284c7; }
.st-btn-primary {
  display:inline-flex; align-items:center; gap:7px;
  padding:10px 22px; border-radius:12px;
  background:linear-gradient(135deg,#38bdf8,#0284c7);
  color:#fff; font-size:13px; font-weight:700;
  cursor:pointer; border:none; transition:all .2s;
  box-shadow:0 4px 14px rgba(2,132,199,.3);
}
.st-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(2,132,199,.4); }
.st-btn-primary:disabled { opacity:.55; cursor:not-allowed; transform:none; }
.st-btn-secondary {
  display:inline-flex; align-items:center; gap:6px;
  padding:9px 18px; border-radius:12px;
  background:#fff; border:1.5px solid #e2e8f0;
  color:#374151; font-size:13px; font-weight:700;
  cursor:pointer; transition:all .2s;
}
.st-btn-secondary:hover { border-color:#38bdf8; color:#0284c7; background:#f0f9ff; }
.st-btn-danger {
  display:inline-flex; align-items:center; gap:6px;
  padding:9px 18px; border-radius:12px;
  background:#fff; border:1.5px solid #fca5a5;
  color:#dc2626; font-size:13px; font-weight:700;
  cursor:pointer; transition:all .2s;
}
.st-btn-danger:hover { background:#fef2f2; border-color:#ef4444; }
.st-range {
  -webkit-appearance:none; appearance:none;
  width:100%; height:6px; border-radius:99px;
  outline:none; cursor:pointer;
}
.st-range::-webkit-slider-thumb {
  -webkit-appearance:none; appearance:none;
  width:18px; height:18px; border-radius:50%;
  background:#0284c7; cursor:pointer; border:2px solid #fff;
  box-shadow:0 2px 6px rgba(2,132,199,.4);
}
.st-range::-moz-range-thumb {
  width:18px; height:18px; border-radius:50%;
  background:#0284c7; cursor:pointer; border:2px solid #fff;
  box-shadow:0 2px 6px rgba(2,132,199,.4); border-style:solid;
}
.st-toggle-wrapper {
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 16px; border:1.5px solid #e2e8f0; border-radius:14px;
  background:#fafbfc; cursor:pointer; transition:all .18s;
}
.st-toggle-wrapper:hover { border-color:#7dd3fc; background:#f0f9ff; }
.st-toggle-track {
  width:44px; height:24px; border-radius:99px; transition:background .2s;
  position:relative; flex-shrink:0;
}
.st-toggle-track.on { background:#0284c7; }
.st-toggle-track.off { background:#cbd5e1; }
.st-toggle-thumb {
  position:absolute; top:3px; width:18px; height:18px;
  border-radius:50%; background:#fff; transition:left .2s;
  box-shadow:0 2px 5px rgba(0,0,0,.2);
}
.st-toggle-track.on .st-toggle-thumb { left:23px; }
.st-toggle-track.off .st-toggle-thumb { left:3px; }
.st-kpi-card {
  background:#fff; border:1px solid #edf2f7; border-radius:14px;
  padding:12px 16px; display:flex; align-items:center; gap:12px;
}
.st-info-box {
  display:flex; gap:10px; padding:12px 14px; border-radius:12px;
  border:1px solid #bae6fd; background:#f0f9ff;
  font-size:12px; color:#0369a1; font-weight:500;
}
.st-warn-box {
  display:flex; gap:10px; padding:12px 14px; border-radius:12px;
  border:1px solid #fde68a; background:#fffbeb;
  font-size:12px; color:#92400e; font-weight:500;
}
@keyframes st-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
.st-spinning { animation:st-spin .8s linear infinite; display:inline-block; }
@keyframes st-fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.st-fade { animation:st-fadeIn .2s ease; }
`;

function SliderField({ label, value, min, max, unit, desc, onChange }) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  const trackBg = `linear-gradient(to right, #bae6fd, #0284c7 ${pct}%, #e2e8f0 ${pct}%)`;
  return (
    <div>
      <label className="st-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        <span style={{ color: '#0369a1', fontWeight: 900, fontSize: 13 }}>{value}{unit}</span>
      </label>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="st-range"
        style={{ background: trackBg }}
      />
      {desc && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{desc}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={e => { e.stopPropagation(); onChange(!checked); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <div className={`st-toggle-track ${checked ? 'on' : 'off'}`}>
        <div className="st-toggle-thumb" />
      </div>
    </button>
  );
}

export function SettingsPage() {
  const { toast } = useToast();
  const { user, fetchMe } = useAuthStore();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState('store');
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [fullName, setFullName] = useState('');

  const [salesWindow, setSalesWindow] = useState(7);
  const [minDOI, setMinDOI] = useState(3);
  const [maxDOI, setMaxDOI] = useState(45);
  const [slowDays, setSlowDays] = useState(14);
  const [minMargin, setMinMargin] = useState(10);
  const [maxPriceChange, setMaxPriceChange] = useState(15);
  const [engineDirty, setEngineDirty] = useState(false);

  const [payosConfigured, setPayosConfigured] = useState(false);
  const [payosActive, setPayosActive] = useState(false);
  const [payosClientId, setPayosClientId] = useState('');
  const [payosApiKey, setPayosApiKey] = useState('');
  const [payosChecksumKey, setPayosChecksumKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showChecksumKey, setShowChecksumKey] = useState(false);
  const [payosClientIdMasked, setPayosClientIdMasked] = useState('');

  const [notif, setNotif] = useState({
    criticalStockout: true, aiPriceSuggestion: true,
    slowMoving: false, dailySalesReport: true, overstockAlert: true,
  });

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Staff management state for Shop Owner
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [updatingStaffId, setUpdatingStaffId] = useState(null);

  useEffect(() => {
    if (user) {
      setStoreName(user.storeName || user.store?.name || '');
      setStoreCode(user.storeCode || user.store?.code || '');
      setStorePhone(user.store?.phone || '');
      setStoreAddress(user.store?.address || '');
      setFullName(user.fullName || user.name || '');
    }
  }, [user]);

  useEffect(() => {
    apiGetDecisionConfig().then(cfg => {
      if (!cfg) return;
      setSalesWindow(cfg.leadTimeDays || cfg.salesWindow || 7);
      setMinDOI(cfg.safetyDays || 3);
      setMaxDOI(cfg.targetCoverageDays || 45);
      setSlowDays(cfg.slowMovingDays || 14);
      setMinMargin(cfg.minimumMarginPct != null ? Math.round(cfg.minimumMarginPct * 100) : 10);
      setMaxPriceChange(cfg.maxMarkdownPct != null ? Math.round(cfg.maxMarkdownPct * 100) : 15);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    apiGetPaymentConfig().then(cfg => {
      if (!cfg) return;
      setPayosConfigured(cfg.configured);
      setPayosActive(cfg.active);
      setPayosClientIdMasked(cfg.clientIdMasked || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    apiGetNotificationSettings().then(cfg => {
      if (cfg) setNotif(prev => ({ ...prev, ...cfg }));
    }).catch(() => {});
  }, []);

  const fetchStaff = async () => {
    if (user?.role !== 'SHOP_OWNER' && user?.role !== 'ADMIN') return;
    setLoadingStaff(true);
    try {
      const res = await apiClient.get('/users');
      const items = res.data?.items || res.data?.data || [];
      setStaffList(items);
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'account') {
      fetchStaff();
    }
  }, [activeTab]);

  const handleToggleStaffStatus = async (staff) => {
    setUpdatingStaffId(staff.id);
    try {
      const nextStatus = !staff.isActive;
      await apiClient.patch(`/users/${staff.id}`, { isActive: nextStatus });
      toast({
        title: nextStatus ? (isEn ? 'Account Unlocked' : 'Đã mở khóa tài khoản') : (isEn ? 'Account Locked' : 'Đã khóa tài khoản nhân viên'),
        description: isEn
          ? `Account ${staff.email} has been ${nextStatus ? 'activated' : 'locked and session revoked'}.`
          : `Tài khoản ${staff.email} đã được ${nextStatus ? 'kích hoạt' : 'khóa thành công và thu hồi phiên đăng nhập'}.`,
        type: nextStatus ? 'success' : 'info',
      });
      await fetchStaff();
    } catch (err) {
      toast({
        title: isEn ? 'Failed to update status' : 'Lỗi cập nhật trạng thái',
        description: err?.response?.data?.error?.message || err?.message,
        type: 'error',
      });
    } finally {
      setUpdatingStaffId(null);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword) {
      toast({ title: isEn ? 'Missing Information' : 'Thiếu thông tin', description: isEn ? 'Please enter staff full name, email and initial password.' : 'Vui lòng nhập họ tên, email và mật khẩu khởi tạo.', type: 'error' });
      return;
    }
    if (newStaffPassword.length < 6) {
      toast({ title: isEn ? 'Password Too Short' : 'Mật khẩu quá ngắn', description: isEn ? 'Password must be at least 6 characters.' : 'Mật khẩu phải có tối thiểu 6 ký tự.', type: 'error' });
      return;
    }
    setCreatingStaff(true);
    try {
      await apiClient.post('/users', {
        fullName: newStaffName.trim(),
        email: newStaffEmail.toLowerCase().trim(),
        password: newStaffPassword,
      });
      toast({
        title: isEn ? 'Staff Created Successfully' : 'Tạo tài khoản nhân viên thành công',
        description: isEn
          ? `Staff account ${newStaffEmail} granted WAREHOUSE_STAFF role.`
          : `Nhân viên ${newStaffEmail} đã được cấp vai trò WAREHOUSE_STAFF cho cửa hàng của bạn.`,
        type: 'success',
      });
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setIsAddStaffModalOpen(false);
      await fetchStaff();
    } catch (err) {
      toast({
        title: isEn ? 'Failed to Create Staff' : 'Lỗi tạo nhân viên',
        description: err?.response?.data?.error?.message || err?.message,
        type: 'error',
      });
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: isEn ? 'Missing Name' : 'Thiếu họ tên', description: isEn ? 'Please enter your full name.' : 'Vui lòng nhập họ tên.', type: 'error' });
      return;
    }
    setSavingProfile(true);
    try {
      await apiClient.put('/auth/profile', { fullName: fullName.trim() });
      toast({ title: isEn ? 'Profile Updated' : 'Cập nhật thành công', description: isEn ? 'Your full name has been saved.' : 'Họ tên của bạn đã được cập nhật.', type: 'success' });
      if (fetchMe) fetchMe();
    } catch (err) {
      toast({ title: isEn ? 'Update Failed' : 'Lỗi cập nhật', description: err?.response?.data?.error?.message || err?.message, type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeName.trim()) {
      toast({ title: isEn ? 'Missing Information' : 'Thiếu thông tin', description: isEn ? 'Please enter store name.' : 'Vui lòng nhập tên cửa hàng.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await apiUpdateStoreProfile({ name: storeName.trim(), phone: storePhone.trim(), address: storeAddress.trim() });
      toast({ title: isEn ? 'Saved' : 'Đã lưu', description: isEn ? 'Store profile updated successfully.' : 'Thông tin cửa hàng đã được cập nhật thành công.', type: 'success' });
      if (fetchMe) fetchMe();
    } catch (err) {
      toast({ title: isEn ? 'Save Failed' : 'Lỗi lưu dữ liệu', description: err?.response?.data?.error?.message || (isEn ? 'Could not save store info.' : 'Không thể lưu thông tin cửa hàng.'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEngine = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiUpdateDecisionConfig({
        leadTimeDays: salesWindow,
        safetyDays: minDOI,
        targetCoverageDays: maxDOI,
        slowMovingDays: slowDays,
        minimumMarginPct: minMargin / 100,
        maxMarkdownPct: maxPriceChange / 100,
      });
      setEngineDirty(false);
      toast({ title: isEn ? 'Engine Parameters Saved' : 'Đã lưu tham số', description: isEn ? 'Decision engine settings updated and synchronized.' : 'Cấu hình AI Decision Engine đã được cập nhật và đồng bộ.', type: 'success' });
    } catch (err) {
      toast({ title: isEn ? 'Save Failed' : 'Lỗi lưu tham số', description: err?.response?.data?.error?.message || (isEn ? 'Could not save parameters.' : 'Không thể lưu tham số.'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetEngine = () => {
    setSalesWindow(7);
    setMinDOI(3);
    setMaxDOI(45);
    setSlowDays(14);
    setMinMargin(10);
    setMaxPriceChange(15);
    setEngineDirty(true);
  };

  const eChange = (setter) => (val) => {
    setter(val);
    setEngineDirty(true);
  };

  const handleSavePayos = async (e) => {
    e.preventDefault();
    if (!payosClientId || !payosApiKey || !payosChecksumKey) {
      toast({ title: isEn ? 'Missing Information' : 'Thiếu thông tin', description: isEn ? 'Please enter Client ID, API Key, and Checksum Key.' : 'Vui lòng nhập đầy đủ Client ID, API Key và Checksum Key.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const res = await apiUpdatePaymentConfig({
        clientId: payosClientId.trim(),
        apiKey: payosApiKey.trim(),
        checksumKey: payosChecksumKey.trim(),
      });
      setPayosConfigured(true);
      setPayosActive(true);
      setPayosClientIdMasked(res.clientIdMasked || payosClientId.slice(0, 8) + '...');
      setPayosClientId('');
      setPayosApiKey('');
      setPayosChecksumKey('');
      toast({ title: isEn ? 'Connected' : 'Đã kết nối', description: isEn ? 'PayOS connected successfully. VietQR is now available.' : 'Cổng PayOS đã được kết nối thành công. Quét mã VietQR đã sẵn sàng.', type: 'success' });
    } catch (err) {
      toast({ title: isEn ? 'Connection Failed' : 'Lỗi kết nối', description: err?.response?.data?.error?.message || (isEn ? 'Invalid credentials or connection error.' : 'Không thể lưu cấu hình PayOS. Kiểm tra lại thông tin.'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePayos = async () => {
    try {
      const res = await apiTogglePaymentConfig();
      setPayosActive(res.active);
      toast({
        title: res.active ? (isEn ? 'PayOS Activated' : 'Đã kích hoạt PayOS') : (isEn ? 'PayOS Deactivated' : 'Đã tắt PayOS'),
        description: res.active ? (isEn ? 'VietQR active on POS.' : 'Phương thức VietQR tự động đã được bật tại màn hình POS.') : (isEn ? 'VietQR disabled on POS.' : 'Phương thức VietQR tạm thời tắt, hệ thống sẽ ẩn mã QR tự động.'),
        type: res.active ? 'success' : 'info',
      });
    } catch (err) {
      toast({ title: isEn ? 'Error' : 'Lỗi', description: isEn ? 'Could not toggle PayOS status.' : 'Không thể thay đổi trạng thái PayOS.', type: 'error' });
    }
  };

  const handleSaveNotif = async () => {
    setSaving(true);
    try {
      await apiUpdateNotificationSettings(notif);
      toast({ title: isEn ? 'Saved' : 'Đã lưu', description: isEn ? 'Notification settings updated.' : 'Cài đặt nhận thông báo đã được lưu thành công.', type: 'success' });
    } catch (err) {
      toast({ title: isEn ? 'Error' : 'Lỗi', description: isEn ? 'Could not save notifications.' : 'Không thể lưu cài đặt thông báo.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPwd || !newPwd || !confirmPwd) {
      toast({ title: isEn ? 'Missing Information' : 'Thiếu thông tin', description: isEn ? 'Please fill in all password fields.' : 'Vui lòng điền đầy đủ các trường mật khẩu.', type: 'error' });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: isEn ? 'Mismatch' : 'Mật khẩu không khớp', description: isEn ? 'New password and confirmation do not match.' : 'Mật khẩu mới và xác nhận mật khẩu không giống nhau.', type: 'error' });
      return;
    }
    if (newPwd.length < 8) {
      toast({ title: isEn ? 'Too Short' : 'Mật khẩu quá ngắn', description: isEn ? 'Password must be at least 8 characters.' : 'Mật khẩu mới phải có ít nhất 8 ký tự.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await apiChangePassword({ oldPassword: oldPwd, newPassword: newPwd });
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
      toast({ title: isEn ? 'Password Changed' : 'Đổi mật khẩu thành công', description: isEn ? 'Password updated. Please use new password next login.' : 'Mật khẩu của bạn đã được cập nhật. Hãy dùng mật khẩu mới từ lần đăng nhập sau.', type: 'success' });
    } catch (err) {
      toast({ title: isEn ? 'Change Password Failed' : 'Đổi mật khẩu thất bại', description: err?.response?.data?.error?.message || (isEn ? 'Current password is incorrect.' : 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'store', label: isEn ? 'Store Profile' : 'Thông tin cửa hàng', icon: <Store size={14} /> },
    { id: 'engine', label: isEn ? 'Decision Engine' : 'Decision Engine', icon: <Sparkles size={14} /> },
    { id: 'payment', label: isEn ? 'Payment Gateway' : 'Thanh toán', icon: <CreditCard size={14} /> },
    { id: 'notifications', label: isEn ? 'Notifications' : 'Thông báo', icon: <Bell size={14} /> },
    { id: 'account', label: isEn ? 'Account & Security' : 'Tài khoản & Bảo mật', icon: <Shield size={14} /> },
  ];

  const pwdStr = newPwd.length === 0 ? 0 : newPwd.length < 8 ? 1 : newPwd.length < 12 ? 2 : 3;
  const pwdColors = ['#e2e8f0', '#ef4444', '#f59e0b', '#059669'];
  const pwdLabels = ['', isEn ? 'Weak' : 'Yếu', isEn ? 'Medium' : 'Trung bình', isEn ? 'Strong' : 'Mạnh'];

  return (
    <>
      <style>{CSS}</style>
      <div className="st-root" style={{ maxWidth: 920, margin: '0 auto', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero Header */}
        <div className="st-header">
          <div className="st-header-left">
            <div className="st-header-icon">
              <Settings size={22} />
            </div>
            <div>
              <div className="st-header-title-row">
                <h1>{isEn ? 'System Settings' : 'Cài đặt hệ thống'}</h1>
              </div>
              <p>
                {isEn
                  ? 'Manage store profile, AI Decision Engine parameters, payment gateway and account security.'
                  : 'Quản lý hồ sơ cửa hàng, tham số AI Decision Engine, cổng thanh toán và bảo mật tài khoản.'}
              </p>
            </div>
          </div>

          <div className="st-user-card">
            <div className="st-user-avatar">
              {(user?.name || user?.email || 'U')
                .trim()
                .split(/\s+/)
                .slice(-2)
                .map(w => w[0].toUpperCase())
                .join('') || 'U'}
            </div>
            <div className="st-user-meta">
              <div className="st-user-name-row">
                <span className="st-user-name">{user?.name || (isEn ? 'Store Owner' : 'Chủ cửa hàng')}</span>
                <span className="st-role-badge">
                  {user?.role === 'ADMIN' ? (isEn ? 'Admin' : 'Quản trị') : (isEn ? 'Store Owner' : 'Chủ shop')}
                </span>
              </div>
              <span className="st-user-email">{user?.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="st-tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`st-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* STORE TAB */}
        {activeTab === 'store' && (
          <div className="st-fade">
            <form onSubmit={handleSaveStore}>
              <div className="st-card" style={{ padding: 26 }}>
                <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                  <div className="st-section-title"><Store size={16} color="#0284c7" /> {isEn ? 'Store Profile' : 'Hồ sơ cửa hàng'}</div>
                  <div className="st-section-desc">{isEn ? 'Information displayed on invoices, receipts, and system interfaces.' : 'Thông tin hiển thị trên hóa đơn và toàn bộ giao diện hệ thống.'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
                  <div>
                    <label className="st-label">{isEn ? 'Store Name' : 'Tên cửa hàng'}</label>
                    <input className="st-input" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={isEn ? "Minh Phat Grocery" : "Tạp hóa Minh Phát"} required />
                  </div>
                  <div>
                    <label className="st-label">{isEn ? 'Phone / Hotline' : 'Số điện thoại / Hotline'}</label>
                    <input className="st-input" value={storePhone} onChange={e => setStorePhone(e.target.value)} placeholder="0908 123 456" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="st-label">{isEn ? 'Main Warehouse Address' : 'Địa chỉ kho hàng chính'}</label>
                    <input className="st-input" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder={isEn ? "Address, street, ward, city" : "Số nhà, đường, phường, quận, thành phố"} />
                  </div>
                  <div>
                    <label className="st-label">{isEn ? 'Store Code (immutable)' : 'Mã cửa hàng (không thể thay đổi)'}</label>
                    <input className="st-input" value={storeCode} disabled />
                  </div>
                  <div>
                    <label className="st-label">{isEn ? 'Currency' : 'Đơn vị tiền tệ'}</label>
                    <input className="st-input" value="VND (₫)" disabled />
                  </div>
                  <div>
                    <label className="st-label">{isEn ? 'System Timezone' : 'Múi giờ hệ thống'}</label>
                    <input className="st-input" value="Asia/Ho_Chi_Minh (GMT+7)" disabled />
                  </div>
                </div>
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="st-btn-primary" disabled={saving}>
                    {saving ? <Loader2 size={14} className="st-spinning" /> : <Save size={14} />} {isEn ? 'Save Store Profile' : 'Lưu thông tin cửa hàng'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ENGINE TAB */}
        {activeTab === 'engine' && (
          <div className="st-fade">
            <form onSubmit={handleSaveEngine}>
              <div className="st-card" style={{ padding: 26 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div className="st-section-title"><Sparkles size={16} color="#7c3aed" /> {isEn ? 'AI Decision Engine Parameters' : 'Tham số AI Decision Engine'}</div>
                    <div className="st-section-desc">{isEn ? 'Fine-tune threshold levels affecting inventory risk alerts and pricing algorithms.' : 'Điều chỉnh các ngưỡng ảnh hưởng trực tiếp đến cảnh báo tồn kho và đề xuất giá bán.'}</div>
                  </div>
                  <button type="button" onClick={handleResetEngine} className="st-btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}>
                    <RefreshCw size={13} /> {isEn ? 'Defaults' : 'Mặc định'}
                  </button>
                </div>
                {engineDirty && (
                  <div className="st-warn-box" style={{ marginBottom: 20 }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{isEn ? 'You have unsaved changes. Click Save Parameters to apply.' : 'Bạn có thay đổi chưa được lưu. Nhấn Lưu cấu hình để áp dụng.'}</span>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 26 }}>
                  <SliderField
                    label={isEn ? "Sales Velocity Window (Moving Average)" : "Cửa sổ tính tốc độ bán (Moving Average)"}
                    value={salesWindow}
                    min={3}
                    max={30}
                    unit={isEn ? " days" : " ngày"}
                    desc={isEn ? "Number of past days used to calculate average consumption rate (SP/day)." : "Số ngày gần nhất dùng để tính tốc độ tiêu thụ trung bình (sp/ngày)."}
                    onChange={eChange(setSalesWindow)}
                  />
                  <SliderField
                    label={isEn ? "Stockout Alert Threshold (Min DOI)" : "Ngưỡng cảnh báo hết hàng (Min DOI)"}
                    value={minDOI}
                    min={1}
                    max={10}
                    unit={isEn ? " days" : " ngày"}
                    desc={isEn ? "Trigger alert when remaining days of inventory ≤ this value." : "Kích hoạt cảnh báo khi số ngày tồn kho còn lại ≤ giá trị này."}
                    onChange={eChange(setMinDOI)}
                  />
                  <SliderField
                    label={isEn ? "Overstock Alert Threshold (Max DOI)" : "Ngưỡng cảnh báo tồn quá nhiều (Overstock)"}
                    value={maxDOI}
                    min={20}
                    max={90}
                    unit={isEn ? " days" : " ngày"}
                    desc={isEn ? "Trigger tied capital alert when stock exceeds this threshold." : "Kích hoạt cảnh báo ứ đọng khi tồn kho vượt quá mức này."}
                    onChange={eChange(setMaxDOI)}
                  />
                  <SliderField
                    label={isEn ? "Slow-Moving Threshold (Days without sale)" : "Số ngày không bán để coi là bán chậm"}
                    value={slowDays}
                    min={7}
                    max={60}
                    unit={isEn ? " days" : " ngày"}
                    desc={isEn ? "System recommends clearance markdown when no sales in this duration." : "Hệ thống đề xuất xả hàng khi không có đơn trong khoảng thời gian này."}
                    onChange={eChange(setSlowDays)}
                  />
                  <SliderField
                    label={isEn ? "Minimum Safety Margin (Min Margin)" : "Biên lợi nhuận an toàn tối thiểu (Min Margin)"}
                    value={minMargin}
                    min={5}
                    max={30}
                    unit="%"
                    desc={isEn ? "AI recommended price will never fall below this threshold." : "Giá gợi ý từ AI không bao giờ thấp hơn ngưỡng này."}
                    onChange={eChange(setMinMargin)}
                  />
                  <SliderField
                    label={isEn ? "Max Price Adjustment Magnitude" : "Biên độ biến động giá tối đa mỗi lần gợi ý"}
                    value={maxPriceChange}
                    min={5}
                    max={30}
                    unit="%"
                    desc={isEn ? "Limit price changes per suggestion to avoid consumer price shock." : "Giới hạn tăng/giảm tối đa để tránh gây sốc tâm lý người tiêu dùng."}
                    onChange={eChange(setMaxPriceChange)}
                  />
                </div>
                <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { l: 'Velocity', v: `${salesWindow} ${isEn ? 'days' : 'ngày'}` },
                    { l: 'Min DOI', v: `${minDOI} ${isEn ? 'days' : 'ngày'}` },
                    { l: 'Max DOI', v: `${maxDOI} ${isEn ? 'days' : 'ngày'}` },
                    { l: 'Slow', v: `${slowDays} ${isEn ? 'days' : 'ngày'}` },
                    { l: 'Min Margin', v: `${minMargin}%` },
                    { l: 'Max ΔPrice', v: `±${maxPriceChange}%` },
                  ].map(ch => (
                    <span key={ch.l} style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#eff6ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
                      {ch.l}: {ch.v}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="st-btn-primary" disabled={saving || !engineDirty}>
                    {saving ? <Loader2 size={14} className="st-spinning" /> : <Save size={14} />} {isEn ? 'Save Engine Parameters' : 'Lưu cấu hình tham số'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* PAYMENT TAB */}
        {activeTab === 'payment' && (
          <div className="st-fade" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="st-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: payosConfigured ? '#f0fdf4' : '#f8fafc', border: `2px solid ${payosConfigured ? '#86efac' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard size={22} color={payosConfigured ? '#16a34a' : '#94a3b8'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>PayOS — VietQR Code Payment</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{isEn ? 'Automated bank transfer via VietQR dynamic QR code' : 'Cổng thanh toán chuyển khoản tự động qua VietQR'}</div>
                    {payosConfigured && (
                      <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: payosActive ? '#dcfce7' : '#f1f5f9', color: payosActive ? '#16a34a' : '#64748b' }}>
                          {payosActive ? (isEn ? '● Active' : '● Đang hoạt động') : (isEn ? '○ Inactive' : '○ Đã tắt')}
                        </span>
                        {payosClientIdMasked && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 99, background: '#eff6ff', color: '#0284c7' }}>Client: {payosClientIdMasked}</span>}
                      </div>
                    )}
                  </div>
                </div>
                {payosConfigured && (
                  <button type="button" onClick={handleTogglePayos} className={payosActive ? 'st-btn-danger' : 'st-btn-secondary'} style={{ fontSize: 12 }}>
                    {payosActive ? <X size={14} /> : <Check size={14} />} {payosActive ? (isEn ? 'Deactivate' : 'Vô hiệu hóa') : (isEn ? 'Reactivate' : 'Kích hoạt lại')}
                  </button>
                )}
              </div>
            </div>

            <div className="st-card" style={{ padding: 26 }}>
              <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div className="st-section-title"><Zap size={16} color="#f59e0b" />{payosConfigured ? (isEn ? 'Update PayOS Credentials' : 'Cập nhật thông tin PayOS') : (isEn ? 'Connect PayOS' : 'Kết nối PayOS')}</div>
                <div className="st-section-desc">{isEn ? 'Enter API keys from your PayOS Dashboard at' : 'Nhập thông tin từ trang quản trị PayOS tại'} <strong>business.payos.vn</strong></div>
              </div>
              <div className="st-info-box" style={{ marginBottom: 18 }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{isEn ? 'Credentials are encrypted with AES-256 before saving. Full keys are never exposed again.' : 'Thông tin được mã hóa AES-256 trước khi lưu. Key đầy đủ sẽ không hiển thị lại sau khi lưu.'}</span>
              </div>
              <form onSubmit={handleSavePayos}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="st-label">Client ID</label>
                    <input className="st-input" value={payosClientId} onChange={e => setPayosClientId(e.target.value)} placeholder={payosConfigured ? (isEn ? `Current: ${payosClientIdMasked} — enter to change` : `Hiện tại: ${payosClientIdMasked} — nhập để thay đổi`) : (isEn ? 'Paste Client ID from PayOS Dashboard' : 'Dán Client ID từ PayOS Dashboard')} />
                  </div>
                  <div>
                    <label className="st-label">API Key</label>
                    <div className="st-input-wrap">
                      <input className="st-input" type={showApiKey ? 'text' : 'password'} value={payosApiKey} onChange={e => setPayosApiKey(e.target.value)} placeholder={isEn ? "Paste API Key from PayOS Dashboard" : "Dán API Key từ PayOS Dashboard"} />
                      <button type="button" className="st-eye-btn" onClick={() => setShowApiKey(v => !v)}>{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="st-label">Checksum Key</label>
                    <div className="st-input-wrap">
                      <input className="st-input" type={showChecksumKey ? 'text' : 'password'} value={payosChecksumKey} onChange={e => setPayosChecksumKey(e.target.value)} placeholder={isEn ? "Paste Checksum Key from PayOS Dashboard" : "Dán Checksum Key từ PayOS Dashboard"} />
                      <button type="button" className="st-eye-btn" onClick={() => setShowChecksumKey(v => !v)}>{showChecksumKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="st-btn-primary" disabled={saving || (!payosClientId && !payosApiKey && !payosChecksumKey)}>
                    {saving ? <Loader2 size={14} className="st-spinning" /> : <Zap size={14} />} {payosConfigured ? (isEn ? 'Update PayOS' : 'Cập nhật PayOS') : (isEn ? 'Connect PayOS' : 'Kết nối PayOS')}
                  </button>
                </div>
              </form>
            </div>

            <div className="st-card" style={{ padding: 22 }}>
              <div className="st-section-title" style={{ marginBottom: 14 }}><CheckCircle2 size={16} color="#059669" /> {isEn ? 'Supported Payment Methods' : 'Phương thức thanh toán hỗ trợ'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: isEn ? 'Cash' : 'Tiền mặt', desc: isEn ? 'Always active, zero setup required' : 'Luôn hoạt động, không cần cấu hình', active: true, fixed: true },
                  { label: isEn ? 'Manual Bank Transfer' : 'Chuyển khoản ngân hàng (thủ công)', desc: isEn ? 'Cashier manually confirms receipt' : 'Xác nhận thủ công bởi nhân viên', active: true, fixed: true },
                  { label: isEn ? 'VietQR automated via PayOS' : 'QR VietQR qua PayOS', desc: isEn ? 'Requires PayOS credentials connected above' : 'Yêu cầu kết nối PayOS ở trên', active: payosActive, fixed: false },
                ].map((m, i) => (
                  <div key={i} className="st-toggle-wrapper" onClick={() => !m.fixed && handleTogglePayos()} style={{ cursor: m.fixed ? 'default' : 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.desc}</div>
                    </div>
                    <Toggle checked={m.active} onChange={() => !m.fixed && handleTogglePayos()} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="st-fade">
            <div className="st-card" style={{ padding: 26 }}>
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div className="st-section-title"><Bell size={16} color="#7c3aed" /> {isEn ? 'Alert Notification Channels' : 'Cấu hình kênh nhận cảnh báo'}</div>
                <div className="st-section-desc">{isEn ? 'Choose system trigger events to receive alerts.' : 'Chọn các sự kiện cần nhận thông báo trong hệ thống.'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  {
                    key: 'criticalStockout',
                    label: isEn ? 'Critical Stockout Alerts' : 'Cảnh báo hết hàng nguy cơ cao',
                    desc: isEn ? 'Immediate alert when product stock reaches 0 or DOI < 2 days.' : 'Gửi thông báo ngay khi sản phẩm chạm mức 0 hoặc DOI < 2 ngày.',
                    icon: <AlertTriangle size={16} color="#dc2626" />,
                    bg: '#fef2f2',
                    border: '#fca5a5'
                  },
                  {
                    key: 'aiPriceSuggestion',
                    label: isEn ? 'AI Pricing Suggestions' : 'Gợi ý giá mới từ AI Decision Engine',
                    desc: isEn ? 'Daily notification when new price recommendations are ready for review.' : 'Thông báo hàng ngày khi có đề xuất giá mới cần phê duyệt.',
                    icon: <Sparkles size={16} color="#7c3aed" />,
                    bg: '#faf5ff',
                    border: '#c4b5fd'
                  },
                  {
                    key: 'overstockAlert',
                    label: isEn ? 'Overstock & Tied Capital Alerts' : 'Cảnh báo tồn kho ứ đọng',
                    desc: isEn ? 'Notify when stock exceeds configured Overstock DOI limit.' : 'Thông báo khi sản phẩm vượt ngưỡng Overstock DOI đã thiết lập.',
                    icon: <Package size={16} color="#d97706" />,
                    bg: '#fffbeb',
                    border: '#fde68a'
                  },
                  {
                    key: 'slowMoving',
                    label: isEn ? 'Slow-Moving Goods Weekly Digest' : 'Cảnh báo hàng bán chậm (Slow-moving)',
                    desc: isEn ? 'Weekly summary of slow-moving inventory tying up capital.' : 'Tổng hợp hàng tuần các mặt hàng đọng vốn lâu ngày.',
                    icon: <TrendingUp size={16} color="#64748b" />,
                    bg: '#f8fafc',
                    border: '#e2e8f0'
                  },
                  {
                    key: 'dailySalesReport',
                    label: isEn ? 'End-of-Day Sales Report' : 'Báo cáo doanh số cuối ngày',
                    desc: isEn ? 'Automated summary of revenue and orders sent every evening at 22:00.' : 'Tự động gửi thống kê doanh thu và đơn hàng mỗi 22:00 tối.',
                    icon: <Percent size={16} color="#0284c7" />,
                    bg: '#eff6ff',
                    border: '#bae6fd'
                  },
                ].map(item => (
                  <div key={item.key} className="st-toggle-wrapper" onClick={() => setNotif(p => ({ ...p, [item.key]: !p[item.key] }))}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: item.bg, border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </div>
                    <Toggle checked={notif[item.key]} onChange={v => setNotif(p => ({ ...p, [item.key]: v }))} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="st-btn-primary" onClick={handleSaveNotif} disabled={saving}>
                  {saving ? <Loader2 size={14} className="st-spinning" /> : <Save size={14} />} {isEn ? 'Save Notification Settings' : 'Lưu cài đặt thông báo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="st-fade" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="st-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {(user?.name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>{user?.name || user?.fullName || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span><Mail size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{user?.email || '—'}</span>
                    <span>
                      <Shield size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      {{
                        ADMIN: isEn ? 'Administrator' : 'Quản trị viên',
                        SHOP_OWNER: isEn ? 'Store Owner' : 'Chủ cửa hàng',
                        WAREHOUSE_STAFF: isEn ? 'Warehouse Staff' : 'Nhân viên kho',
                      }[user?.role] || user?.role || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form chỉnh sửa thông tin cá nhân */}
            <div className="st-card" style={{ padding: 26 }}>
              <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div className="st-section-title"><User size={16} color="#0284c7" /> {isEn ? 'Personal Information' : 'Thông tin cá nhân'}</div>
                <div className="st-section-desc">{isEn ? 'Update full name displayed across system.' : 'Cập nhật họ tên hiển thị trong toàn bộ hoạt động của hệ thống.'}</div>
              </div>
              <form onSubmit={handleUpdateProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, maxWidth: 600 }}>
                  <div>
                    <label className="st-label">{isEn ? 'Full Name' : 'Họ và tên'}</label>
                    <input className="st-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder={isEn ? "Enter your full name" : "Nhập họ và tên của bạn"} required />
                  </div>
                  <div>
                    <label className="st-label">{isEn ? 'Account Email (immutable)' : 'Email tài khoản (không thể đổi)'}</label>
                    <input className="st-input" value={user?.email || ''} disabled />
                  </div>
                </div>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="st-btn-primary" disabled={savingProfile}>
                    {savingProfile ? <Loader2 size={14} className="st-spinning" /> : <Save size={14} />} {isEn ? 'Save Name' : 'Lưu họ tên'}
                  </button>
                </div>
              </form>
            </div>

            <div className="st-card" style={{ padding: 22 }}>
              <div className="st-section-title" style={{ marginBottom: 14 }}><Shield size={16} color="#0284c7" /> {isEn ? 'Active Session & Credentials' : 'Phiên đăng nhập & Thông tin tài khoản'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                {[
                  {
                    label: isEn ? 'Role' : 'Vai trò',
                    value: {
                      ADMIN: isEn ? 'Administrator' : 'Quản trị viên',
                      SHOP_OWNER: isEn ? 'Store Owner' : 'Chủ cửa hàng',
                      WAREHOUSE_STAFF: isEn ? 'Staff' : 'Nhân viên kho',
                    }[user?.role] || user?.role || '—',
                    icon: <Shield size={14} color="#7c3aed" />
                  },
                  { label: isEn ? 'Store' : 'Cửa hàng', value: user?.storeName || user?.store?.name || '—', icon: <Store size={14} color="#0284c7" /> },
                  { label: isEn ? 'Store Code' : 'Mã cửa hàng', value: user?.storeCode || user?.store?.code || '—', icon: <Building2 size={14} color="#059669" /> },
                  { label: 'Email', value: user?.email || '—', icon: <Mail size={14} color="#f59e0b" /> },
                ].map((item, i) => (
                  <div key={i} className="st-kpi-card">
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2, wordBreak: 'break-all' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quản lý tài khoản nhân viên nội bộ của cửa hàng (Chỉ Chủ Shop & Admin) */}
            {(user?.role === 'SHOP_OWNER' || user?.role === 'ADMIN') && (
              <div className="st-card" style={{ padding: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div className="st-section-title"><Users size={16} color="#0284c7" /> {isEn ? 'Store Staff Management (WAREHOUSE_STAFF)' : 'Quản lý nhân viên cửa hàng (WAREHOUSE_STAFF)'}</div>
                    <div className="st-section-desc">{isEn ? 'Store owners can create and manage cashier/warehouse staff accounts directly.' : 'Chủ shop chủ động Tạo & Khóa tài khoản nhân viên kho/thu ngân thuộc cửa hàng của mình, không phụ thuộc Admin hệ thống.'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddStaffModalOpen(true)}
                    className="st-btn-primary"
                    style={{ fontSize: 12, padding: '8px 16px' }}
                  >
                    <Plus size={14} /> {isEn ? '+ Add New Staff' : 'Thêm nhân viên mới'}
                  </button>
                </div>

                {loadingStaff ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={16} className="st-spinning" /> {isEn ? 'Loading store staff members...' : 'Đang tải danh sách nhân viên cửa hàng...'}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          <th style={{ padding: '10px 12px' }}>{isEn ? 'Staff' : 'Nhân viên'}</th>
                          <th style={{ padding: '10px 12px' }}>{isEn ? 'Role' : 'Vai trò'}</th>
                          <th style={{ padding: '10px 12px' }}>{isEn ? 'Status' : 'Trạng thái'}</th>
                          <th style={{ padding: '10px 12px' }}>{isEn ? 'Created At' : 'Ngày tạo'}</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>{isEn ? 'Actions' : 'Thao tác'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.filter(u => u.role === 'WAREHOUSE_STAFF' || u.role === 'SHOP_OWNER').length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8' }}>
                              {isEn ? 'No staff members created yet. Click "+ Add New Staff" above to start!' : 'Chưa có tài khoản nhân viên nào được tạo cho cửa hàng này. Bấm nút "Thêm nhân viên mới" ở trên để bắt đầu!'}
                            </td>
                          </tr>
                        ) : (
                          staffList.map((member) => (
                            <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: member.role === 'WAREHOUSE_STAFF' ? '#ecfdf5' : '#eff6ff',
                                    border: member.role === 'WAREHOUSE_STAFF' ? '1px solid #a7f3d0' : '1px solid #bfdbfe',
                                    color: member.role === 'WAREHOUSE_STAFF' ? '#059669' : '#0284c7',
                                    fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}>
                                    {(member.fullName || member.email || 'U')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{member.fullName || (isEn ? 'Staff' : 'Nhân viên')}</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>{member.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                                  background: member.role === 'WAREHOUSE_STAFF' ? '#f0fdf4' : '#eff6ff',
                                  color: member.role === 'WAREHOUSE_STAFF' ? '#166534' : '#1d4ed8',
                                  border: member.role === 'WAREHOUSE_STAFF' ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                                }}>
                                  {member.role === 'WAREHOUSE_STAFF' ? (isEn ? 'Staff / Cashier' : 'Nhân viên kho / Thu ngân') : (isEn ? 'Store Owner' : 'Chủ shop')}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                                  background: member.isActive ? '#f0fdf4' : '#fef2f2',
                                  color: member.isActive ? '#15803d' : '#b91c1c',
                                  border: member.isActive ? '1px solid #bbf7d0' : '1px solid #fecaca',
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: member.isActive ? '#22c55e' : '#ef4444' }} />
                                  {member.isActive ? (isEn ? 'Active' : 'Đang hoạt động') : (isEn ? 'Locked' : 'Đã khóa')}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#64748b', fontSize: 11 }}>
                                {member.createdAt ? new Date(member.createdAt).toLocaleDateString(isEn ? 'en-US' : 'vi-VN') : '—'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                {member.role === 'WAREHOUSE_STAFF' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStaffStatus(member)}
                                    disabled={updatingStaffId === member.id}
                                    style={{
                                      padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                      cursor: 'pointer', transition: 'all .15s',
                                      border: member.isActive ? '1px solid #fca5a5' : '1px solid #86efac',
                                      background: member.isActive ? '#fff' : '#f0fdf4',
                                      color: member.isActive ? '#dc2626' : '#15803d',
                                    }}
                                  >
                                    {updatingStaffId === member.id ? (
                                      <Loader2 size={12} className="st-spinning" />
                                    ) : member.isActive ? (
                                      isEn ? 'Lock Account' : 'Khóa tài khoản'
                                    ) : (
                                      isEn ? 'Unlock' : 'Mở khóa'
                                    )}
                                  </button>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>{isEn ? 'Primary Account' : 'Tài khoản chính'}</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="st-card" style={{ padding: 26 }}>
              <div style={{ marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div className="st-section-title"><Lock size={16} color="#dc2626" /> {isEn ? 'Change Password' : 'Đổi mật khẩu'}</div>
                <div className="st-section-desc">{isEn ? 'Use a strong password with at least 8 characters to protect your account.' : 'Sử dụng mật khẩu mạnh với ít nhất 8 ký tự để bảo vệ tài khoản.'}</div>
              </div>
              <form onSubmit={handleChangePassword}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440 }}>
                  <div>
                    <label className="st-label">{isEn ? 'Current Password' : 'Mật khẩu hiện tại'}</label>
                    <div className="st-input-wrap">
                      <input className="st-input" type={showOld ? 'text' : 'password'} value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder={isEn ? "Enter current password" : "Nhập mật khẩu hiện tại"} autoComplete="current-password" />
                      <button type="button" className="st-eye-btn" onClick={() => setShowOld(v => !v)}>{showOld ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div>
                    <label className="st-label">{isEn ? 'New Password' : 'Mật khẩu mới'}</label>
                    <div className="st-input-wrap">
                      <input className="st-input" type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder={isEn ? "Minimum 8 characters" : "Tối thiểu 8 ký tự"} autoComplete="new-password" />
                      <button type="button" className="st-eye-btn" onClick={() => setShowNew(v => !v)}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                    {newPwd && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: pwdStr >= i ? pwdColors[pwdStr] : '#e2e8f0', transition: 'background .25s' }} />)}
                        <span style={{ fontSize: 11, fontWeight: 700, color: pwdColors[pwdStr], flexShrink: 0, minWidth: 60 }}>{pwdLabels[pwdStr]}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="st-label">{isEn ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}</label>
                    <div className="st-input-wrap">
                      <input className="st-input" type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder={isEn ? "Re-enter new password" : "Nhập lại mật khẩu mới"} autoComplete="new-password" style={confirmPwd && newPwd !== confirmPwd ? { borderColor: '#ef4444' } : {}} />
                      <button type="button" className="st-eye-btn" onClick={() => setShowConfirm(v => !v)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                    {confirmPwd && newPwd !== confirmPwd && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 5, fontWeight: 600 }}>{isEn ? '⚠ Passwords do not match' : '⚠ Mật khẩu không khớp'}</p>}
                  </div>
                </div>
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="st-btn-primary" disabled={saving}>
                    {saving ? <Loader2 size={14} className="st-spinning" /> : <Lock size={14} />} {isEn ? 'Change Password' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Thêm nhân viên mới */}
        {isAddStaffModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{isEn ? 'Create Staff Account' : 'Tạo tài khoản Nhân viên'}</h3>
                    <p style={{ margin: 0, fontSize: 11.5, color: '#64748b' }}>{isEn ? 'Assign Warehouse Staff / Cashier permissions' : 'Phân quyền Nhân viên kho / Thu ngân cho cửa hàng'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="st-label">{isEn ? 'Staff Full Name' : 'Họ và tên nhân viên'}</label>
                  <input
                    className="st-input"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    placeholder={isEn ? "E.g.: John Doe" : "Ví dụ: Nguyễn Văn Kho"}
                    required
                  />
                </div>

                <div>
                  <label className="st-label">{isEn ? 'Login Email' : 'Email đăng nhập'}</label>
                  <input
                    className="st-input"
                    type="email"
                    value={newStaffEmail}
                    onChange={e => setNewStaffEmail(e.target.value)}
                    placeholder="nhanvien@cuahang.vn"
                    required
                  />
                </div>

                <div>
                  <label className="st-label">{isEn ? 'Initial Password' : 'Mật khẩu khởi tạo'}</label>
                  <input
                    className="st-input"
                    type="password"
                    value={newStaffPassword}
                    onChange={e => setNewStaffPassword(e.target.value)}
                    placeholder={isEn ? "Minimum 6 characters" : "Tối thiểu 6 ký tự"}
                    required
                  />
                </div>

                <div className="st-info-box" style={{ marginTop: 4 }}>
                  <span>{isEn ? 'New account will automatically receive WAREHOUSE_STAFF permissions for your store. Staff can log in immediately for POS checkout and inventory operations.' : 'Tài khoản mới sẽ tự động được gán quyền WAREHOUSE_STAFF thuộc cửa hàng của bạn. Nhân viên có thể đăng nhập ngay để bán hàng POS và quản lý kho vận.'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddStaffModalOpen(false)}
                    className="st-btn-secondary"
                  >
                    {isEn ? 'Cancel' : 'Hủy bỏ'}
                  </button>
                  <button
                    type="submit"
                    className="st-btn-primary"
                    disabled={creatingStaff}
                  >
                    {creatingStaff ? <Loader2 size={14} className="st-spinning" /> : <UserPlus size={14} />} {isEn ? 'Create Staff' : 'Tạo nhân viên'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
