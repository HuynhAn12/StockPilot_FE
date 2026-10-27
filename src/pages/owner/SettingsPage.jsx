/* === SettingsPage.jsx === */

import React, { useState, useEffect } from 'react';
import {
  Settings, Store, Bell, Shield, Save, RefreshCw,
  CheckCircle2, Sparkles, CreditCard, Eye, EyeOff,
  Lock, Mail, X,
  Building2, Package, TrendingUp, Percent,
  AlertTriangle, Info, Loader2, User,
  Users, UserPlus, Plus,
  ExternalLink, ChevronDown, ChevronUp, QrCode,
  HelpCircle, Clock, KeyRound, Copy, Check, ArrowRight
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { useAuthStore } from '../../components/store/authStore';
import { useTranslation } from '../../i18n/useTranslation';
import {
  apiGetDecisionConfig,
  apiUpdateDecisionConfig,
  apiGetPaymentConfig,
  apiUpdatePaymentConfig,
  apiTestPaymentConfig,
  apiTogglePaymentConfig,
  apiGetNotificationSettings,
  apiUpdateNotificationSettings,
  apiUpdateStoreProfile,
  apiChangePassword,
} from '../../services/analyticsService';
import { apiClient } from '../../lib/apiClient';
import { StoreDataExportPanel } from '../../components/settings/StoreDataExportPanel';
import { Database } from 'lucide-react';

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
  const [payosNeedsReentry, setPayosNeedsReentry] = useState(false);
  const [savingPayos, setSavingPayos] = useState(false);
  const [togglingPayos, setTogglingPayos] = useState(false);
  const [showPayosGuide, setShowPayosGuide] = useState(false);
  const [payosConfiguredAt, setPayosConfiguredAt] = useState(null);
  const [payosUpdatedAt, setPayosUpdatedAt] = useState(null);
  const [payosWebhookUrl, setPayosWebhookUrl] = useState('');
  const [payosIsPublicDomain, setPayosIsPublicDomain] = useState(true);
  const [testingPayos, setTestingPayos] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

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
      setPayosConfigured(Boolean(cfg.configured));
      setPayosActive(Boolean(cfg.active));
      setPayosClientIdMasked(cfg.clientIdMasked || '');
      setPayosNeedsReentry(Boolean(cfg.needsReentry));
      setPayosConfiguredAt(cfg.configuredAt || null);
      setPayosUpdatedAt(cfg.updatedAt || null);
      if (cfg.webhookUrl) {
        setPayosWebhookUrl(cfg.webhookUrl);
      }
      if (typeof cfg.isPublicDomain === 'boolean') {
        setPayosIsPublicDomain(cfg.isPublicDomain);
      }
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

  const handleCopyWebhookUrl = () => {
    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
    const urlToCopy = payosWebhookUrl || `${fallbackOrigin}/api/v1/pos/payos/webhook`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(urlToCopy);
    } else {
      const el = document.createElement('textarea');
      el.value = urlToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);

    toast({
      title: isEn ? 'Callback URL Copied' : 'Đã sao chép Callback URL',
      description: isEn
        ? 'Paste this URL into the Webhook URL field in PayOS Dashboard.'
        : 'Đã sao chép Callback URL. Hãy dán URL này vào cấu hình Webhook trên PayOS.',
      type: 'success',
    });
  };

  const handleTestPayosConnection = async () => {
    setTestingPayos(true);
    setTestResult(null);
    try {
      const payload = {};
      if (payosClientId.trim()) payload.clientId = payosClientId.trim();
      if (payosApiKey.trim()) payload.apiKey = payosApiKey.trim();
      if (payosChecksumKey.trim()) payload.checksumKey = payosChecksumKey.trim();

      const res = await apiTestPaymentConfig(payload);
      const isSuccess = Boolean(res?.success);
      const msg = res?.message || (isSuccess
        ? (isEn ? 'PayOS credentials verified successfully!' : 'Xác thực cổng thanh toán PayOS thành công! Cổng thanh toán kết nối bình thường.')
        : (isEn ? 'Could not verify PayOS connection.' : 'Chưa thể xác minh kết nối PayOS. Vui lòng kiểm tra lại thông tin cấu hình.'));

      setTestResult({
        tested: true,
        success: isSuccess,
        message: msg,
      });

      toast({
        title: isSuccess
          ? (isEn ? 'Connection Test Passed' : 'Kiểm tra kết nối thành công')
          : (isEn ? 'Connection Test Failed' : 'Kiểm tra kết nối thất bại'),
        description: msg,
        type: isSuccess ? 'success' : 'error',
      });
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        (isEn ? 'Connection test failed. Please try again.' : 'Chưa thể xác minh kết nối PayOS. Vui lòng kiểm tra thông tin kết nối và thử lại.');

      setTestResult({
        tested: true,
        success: false,
        message: errMsg,
      });

      toast({
        title: isEn ? 'Connection Test Failed' : 'Kiểm tra kết nối thất bại',
        description: errMsg,
        type: 'error',
      });
    } finally {
      setTestingPayos(false);
    }
  };

  const handleSavePayos = async (e) => {
    e.preventDefault();
    if (!payosConfigured && (!payosClientId.trim() || !payosApiKey.trim() || !payosChecksumKey.trim())) {
      toast({
        title: isEn ? 'Missing Information' : 'Thông tin kết nối chưa đầy đủ',
        description: isEn
          ? 'Please enter Client ID, API Key, and Checksum Key.'
          : 'Thông tin kết nối chưa đầy đủ. Vui lòng kiểm tra lại Client ID và các khóa bảo mật.',
        type: 'error',
      });
      return;
    }

    setSavingPayos(true);
    try {
      const payload = {};
      if (payosClientId.trim()) payload.clientId = payosClientId.trim();
      if (payosApiKey.trim()) payload.apiKey = payosApiKey.trim();
      if (payosChecksumKey.trim()) payload.checksumKey = payosChecksumKey.trim();

      const res = await apiUpdatePaymentConfig(payload);
      setPayosConfigured(true);
      setPayosActive(res?.active ?? payosActive);
      if (res?.clientIdMasked) {
        setPayosClientIdMasked(res.clientIdMasked);
      }
      setPayosNeedsReentry(Boolean(res?.needsReentry));
      setPayosConfiguredAt(res?.configuredAt || new Date().toISOString());
      setPayosUpdatedAt(res?.updatedAt || new Date().toISOString());
      if (res?.webhookUrl) {
        setPayosWebhookUrl(res.webhookUrl);
      }
      if (typeof res?.isPublicDomain === 'boolean') {
        setPayosIsPublicDomain(res.isPublicDomain);
      }

      setPayosClientId('');
      setPayosApiKey('');
      setPayosChecksumKey('');
      setShowApiKey(false);
      setShowChecksumKey(false);
      setTestResult(null);

      toast({
        title: isEn ? 'Configuration Saved' : 'Đã lưu thông tin PayOS',
        description: isEn
          ? 'PayOS credentials saved. You can now test the connection.'
          : 'Thông tin PayOS đã được lưu. Bạn có thể tiếp tục kiểm tra kết nối.',
        type: 'success',
      });
    } catch (err) {
      toast({
        title: isEn ? 'Connection Failed' : 'Lỗi kết nối PayOS',
        description:
          err?.response?.data?.error?.message ||
          err?.message ||
          (isEn ? 'Invalid credentials or connection error.' : 'Không thể lưu cấu hình PayOS. Vui lòng kiểm tra lại thông tin.'),
        type: 'error',
      });
    } finally {
      setSavingPayos(false);
    }
  };

  const handleTogglePayos = async () => {
    if (togglingPayos || !payosConfigured) return;
    const targetState = !payosActive;
    setTogglingPayos(true);
    try {
      const res = await apiTogglePaymentConfig(targetState);
      setPayosActive(res.active);
      toast({
        title: res.active
          ? (isEn ? 'PayOS VietQR Activated' : 'Đã kích hoạt VietQR')
          : (isEn ? 'PayOS VietQR Paused' : 'Đã tạm dừng VietQR'),
        description: res.active
          ? (isEn ? 'VietQR payment method is now active on POS checkout.' : 'Phương thức VietQR tự động đã được bật tại màn hình POS.')
          : (isEn ? 'VietQR payment method is now paused on POS checkout.' : 'Phương thức VietQR tạm thời tắt, hệ thống sẽ ẩn mã QR tự động trên POS.'),
        type: res.active ? 'success' : 'info',
      });
    } catch (err) {
      toast({
        title: isEn ? 'Toggle Error' : 'Lỗi cập nhật trạng thái',
        description: err?.response?.data?.error?.message || err?.message || (isEn ? 'Could not toggle PayOS status.' : 'Không thể thay đổi trạng thái PayOS.'),
        type: 'error',
      });
    } finally {
      setTogglingPayos(false);
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
    { id: 'data', label: isEn ? 'Data Export' : 'Dữ liệu', icon: <Database size={14} /> },
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
          <div className="st-fade" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header Card: Connection Status & Overview */}
            <div className="st-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: payosConfigured ? (payosActive ? '#ecfdf5' : '#f8fafc') : '#fffbeb',
                    border: `2px solid ${payosConfigured ? (payosActive ? '#6ee7b7' : '#cbd5e1') : '#fde68a'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: payosConfigured && payosActive ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                  }}>
                    <QrCode size={26} color={payosConfigured ? (payosActive ? '#059669' : '#64748b') : '#d97706'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                        {isEn ? 'PayOS — Automated VietQR Payment Gateway' : 'PayOS — Cổng thanh toán VietQR tự động'}
                      </span>
                      {/* Status Badge */}
                      {!payosConfigured ? (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 99,
                          background: '#fffbeb',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <AlertTriangle size={12} />
                          {isEn ? 'Not Configured' : 'Chưa cấu hình'}
                        </span>
                      ) : payosActive ? (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 99,
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                            <span style={{
                              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                              position: 'absolute',
                              display: 'inline-flex',
                              height: '100%',
                              width: '100%',
                              borderRadius: '9999px',
                              background: '#34d399',
                              opacity: 0.75
                            }} />
                            <span style={{
                              position: 'relative',
                              display: 'inline-flex',
                              borderRadius: '9999px',
                              width: 8,
                              height: 8,
                              background: '#059669'
                            }} />
                          </span>
                          {isEn ? 'VietQR Active' : 'Đã kích hoạt VietQR'}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 99,
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8' }} />
                          {isEn ? 'VietQR Paused' : 'Đã tạm dừng VietQR'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                      {isEn
                        ? 'Automated bank transfer via VietQR dynamic QR code on POS screen with real-time order completion.'
                        : 'Thanh toán chuyển khoản tự động qua mã VietQR động tại quầy POS, tự động gạch nợ và xuất kho theo thời gian thực.'}
                    </div>

                    {payosConfigured && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {payosClientIdMasked && (
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 8,
                            background: '#eff6ff',
                            color: '#0284c7',
                            border: '1px solid #bfdbfe',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}>
                            <KeyRound size={12} />
                            Client ID: {payosClientIdMasked}
                          </span>
                        )}
                        {(payosUpdatedAt || payosConfiguredAt) && (
                          <span style={{
                            fontSize: 11,
                            color: '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <Clock size={12} />
                            {isEn ? 'Updated: ' : 'Cập nhật: '}
                            {new Date(payosUpdatedAt || payosConfiguredAt).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Switch Bật/Tắt thanh toán VietQR trên POS */}
                {payosConfigured && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#f8fafc',
                    padding: '8px 14px',
                    borderRadius: 14,
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                        {isEn ? 'POS Checkout' : 'Thanh toán POS'}
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: payosActive ? '#059669' : '#dc2626' }}>
                        {payosActive ? (isEn ? 'VietQR ON' : 'Đang Bật') : (isEn ? 'VietQR OFF' : 'Đang Tắt')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleTogglePayos}
                      disabled={togglingPayos}
                      style={{ background: 'none', border: 'none', cursor: togglingPayos ? 'not-allowed' : 'pointer', padding: 0 }}
                      title={isEn ? 'Toggle VietQR checkout on POS' : 'Bật/Tắt thanh toán VietQR trên POS'}
                    >
                      <div className={`st-toggle-track ${payosActive ? 'on' : 'off'}`} style={{ opacity: togglingPayos ? 0.6 : 1 }}>
                        <div className="st-toggle-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {togglingPayos && <Loader2 size={10} className="st-spinning" color="#0284c7" />}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 1: Connect to PayOS */}
            <div className="st-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                }}>
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <div className="st-section-title" style={{ fontSize: 15, marginBottom: 4 }}>
                    {isEn ? 'Step 1: Open PayOS Dashboard' : 'Bước 1: Mở cổng thanh toán PayOS'}
                  </div>
                  <div className="st-section-desc" style={{ fontSize: 13, lineHeight: 1.5 }}>
                    {isEn
                      ? 'Connect PayOS to let your customers pay using VietQR directly at your POS.'
                      : 'Kết nối PayOS để khách hàng có thể thanh toán qua VietQR trực tiếp tại quầy POS của cửa hàng.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingLeft: 46 }}>
                <a
                  href="https://my.payos.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="st-btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={15} />
                  <span>{isEn ? 'Open PayOS Dashboard ↗' : 'Mở PayOS Dashboard ↗'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowPayosGuide(v => !v)}
                  className="st-btn-secondary"
                >
                  <HelpCircle size={15} />
                  <span>{isEn ? 'View Setup Instructions' : 'Xem hướng dẫn thiết lập'}</span>
                  {showPayosGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Collapsible Step 1 Guidance */}
              {showPayosGuide && (
                <div style={{
                  marginTop: 18,
                  marginLeft: 46,
                  padding: 18,
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                    {isEn ? '3 Steps to link PayOS to StockPilot:' : '3 bước kết nối PayOS vào StockPilot:'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div style={{ padding: 12, borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, background: '#0284c7', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                        <span style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a' }}>{isEn ? 'Log into PayOS' : 'Đăng nhập PayOS'}</span>
                      </div>
                      <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        {isEn ? 'Go to my.payos.vn and log into your merchant account.' : 'Truy cập my.payos.vn và đăng nhập tài khoản chủ cửa hàng.'}
                      </p>
                    </div>

                    <div style={{ padding: 12, borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, background: '#0284c7', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                        <span style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a' }}>{isEn ? 'Payment Channels' : 'Chọn Kênh thanh toán'}</span>
                      </div>
                      <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        {isEn ? 'Navigate to Payment Channels and open your active VietQR channel.' : 'Vào mục Kênh thanh toán -> Chọn kênh đã liên kết tài khoản ngân hàng của bạn.'}
                      </p>
                    </div>

                    <div style={{ padding: 12, borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, background: '#0284c7', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                        <span style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a' }}>{isEn ? 'Configure Webhook & Keys' : 'Dán Webhook & Lấy khóa'}</span>
                      </div>
                      <p style={{ fontSize: 11.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        {isEn ? 'Paste the Webhook URL from Step 2, then copy the 3 keys into Step 3 below.' : 'Dán Webhook URL ở Bước 2 bên dưới, sau đó copy bộ 3 mã bảo mật dán vào Bước 3.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Configure the Callback / Webhook URL (PRIORITY: BEFORE CREDENTIALS) */}
            <div className="st-card" style={{
              padding: 24,
              border: '2px solid #93c5fd',
              background: 'linear-gradient(to bottom, #ffffff, #f0f9ff 120%)',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                }}>
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="st-section-title" style={{ fontSize: 15, margin: 0, color: '#0369a1' }}>
                      {isEn ? 'Step 2: Configure PayOS Webhook' : 'Bước 2: Cấu hình Webhook PayOS'}
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: '#dbeafe',
                      color: '#1d4ed8',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em'
                    }}>
                      {isEn ? 'Required' : 'Bắt buộc'}
                    </span>
                  </div>
                  <div className="st-section-desc" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>
                    {isEn
                      ? 'Copy the URL below and paste it into the Webhook URL field on PayOS. This is the server address PayOS uses to notify StockPilot when a payment is received.'
                      : 'Copy đường dẫn bên dưới và dán vào mục Webhook URL trong trang quản lý PayOS. Đây là địa chỉ PayOS sử dụng để gửi thông báo giao dịch về StockPilot.'}
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: 46, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Dynamically Generated URL Box with Copy Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: '#ffffff',
                  border: '1.5px solid #93c5fd',
                  borderRadius: 14,
                  padding: '10px 14px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                      flexShrink: 0
                    }}>
                      <QrCode size={16} />
                    </div>
                    <code style={{
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0369a1',
                      wordBreak: 'break-all',
                      userSelect: 'all'
                    }}>
                      {payosWebhookUrl || `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'}/api/v1/pos/payos/webhook`}
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyWebhookUrl}
                    className="st-btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: 12.5,
                      background: copiedWebhook ? '#059669' : 'linear-gradient(135deg,#38bdf8,#0284c7)',
                      boxShadow: copiedWebhook ? '0 2px 8px rgba(5, 150, 105, 0.3)' : undefined
                    }}
                  >
                    {copiedWebhook ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedWebhook ? (isEn ? 'Copied!' : 'Đã sao chép') : (isEn ? 'Copy URL' : 'Sao chép URL')}</span>
                  </button>
                </div>

                {/* Destination Navigation Guidance */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  color: '#475569',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {isEn ? 'Paste into:' : 'Vị trí dán trên PayOS:'}
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0284c7' }}>
                    <span>PayOS Dashboard</span>
                    <ArrowRight size={12} color="#94a3b8" />
                    <span>{isEn ? 'Payment Channels' : 'Kênh thanh toán'}</span>
                    <ArrowRight size={12} color="#94a3b8" />
                    <span style={{ background: '#e0f2fe', padding: '2px 8px', borderRadius: 6, color: '#0369a1' }}>
                      Webhook URL
                    </span>
                  </div>
                </div>

                {/* Technical Differentiation Callout */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  color: '#64748b',
                  lineHeight: 1.55
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    <Info size={14} color="#0284c7" />
                    <span>{isEn ? 'Distinction between Webhook URL and Return URL:' : 'Phân biệt Webhook URL và Return / Cancel URL:'}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>
                      <strong style={{ color: '#0f172a' }}>Webhook URL:</strong> {isEn
                        ? 'The backend server endpoint (/api/v1/pos/payos/webhook) that receives instant payment notifications from PayOS servers to settle orders and deduct stock automatically.'
                        : 'Đường dẫn máy chủ backend (/api/v1/pos/payos/webhook) nhận thông báo thanh toán tự động (IPN) từ máy chủ PayOS để hoàn tất đơn và xuất kho ngay lập tức.'}
                    </li>
                    <li>
                      <strong style={{ color: '#0f172a' }}>Return / Cancel URL:</strong> {isEn
                        ? 'Customer browser redirect pages used in hosted checkout. Since StockPilot displays dynamic VietQR directly on your POS screen, Return/Cancel URLs are handled automatically by the POS flow.'
                        : 'Trang chuyển hướng trình duyệt của khách hàng sau khi thanh toán. Vì StockPilot hiển thị mã QR động trực tiếp tại quầy POS, thu ngân không cần rời khỏi màn hình bán hàng.'}
                    </li>
                  </ul>
                </div>

                {/* Localhost / Development Notice */}
                {!payosIsPublicDomain && (
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    fontSize: 12,
                    color: '#92400e',
                    lineHeight: 1.5
                  }}>
                    <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong style={{ color: '#78350f' }}>
                        {isEn ? 'Localhost Notice:' : 'Lưu ý môi trường thử nghiệm (Localhost):'}
                      </strong>
                      <span style={{ marginLeft: 6 }}>
                        {isEn
                          ? 'You are running on a local address. PayOS servers require a public HTTPS Webhook URL (such as your production domain or a tunnel like ngrok / Cloudflare Tunnel) to deliver real-time payment notifications.'
                          : 'Hệ thống đang kết nối địa chỉ máy chủ cục bộ. Máy chủ PayOS yêu cầu một đường dẫn Webhook công khai có HTTPS (như domain máy chủ production hoặc địa chỉ tunnel ngrok/Cloudflare) để có thể gửi thông báo giao dịch về StockPilot theo thời gian thực.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: Enter PayOS Credentials */}
            <div className="st-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                }}>
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <div className="st-section-title" style={{ fontSize: 15, marginBottom: 4 }}>
                    {payosConfigured
                      ? (isEn ? 'Step 3: Update PayOS Security Credentials' : 'Bước 3: Cập nhật thông tin bảo mật PayOS')
                      : (isEn ? 'Step 3: Enter PayOS Credentials' : 'Bước 3: Nhập thông tin kết nối PayOS')}
                  </div>
                  <div className="st-section-desc" style={{ fontSize: 13 }}>
                    {isEn
                      ? 'Enter the 3 credentials from PayOS Dashboard to authenticate and generate VietQR codes.'
                      : 'Nhập Client ID, API Key và Checksum Key từ PayOS Dashboard để hệ thống xác thực và tạo mã VietQR.'}
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: 46 }}>
                {/* Verified AES-256 Encryption Notice */}
                <div className="st-info-box" style={{ marginBottom: 20 }}>
                  <Shield size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    {isEn
                      ? 'StockPilot encrypts all credentials using AES-256 before saving to the database. Secret keys are never exposed in clear text.'
                      : 'StockPilot mã hóa toàn bộ thông tin kết nối bằng thuật toán AES-256 trước khi lưu vào cơ sở dữ liệu. Khóa bảo mật sẽ không bao giờ hiển thị ở dạng văn bản thuần.'}
                  </span>
                </div>

                {payosNeedsReentry && (
                  <div
                    className="st-info-box"
                    role="alert"
                    style={{ marginBottom: 20, background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}
                  >
                    <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                      {isEn
                        ? 'The saved PayOS credentials can no longer be read because the server encryption key changed. QR payments are paused until you enter Client ID, API Key and Checksum Key again.'
                        : 'Không đọc được cấu hình PayOS đã lưu vì khóa mã hóa trên máy chủ đã thay đổi. Thanh toán QR tạm ngưng cho tới khi bạn nhập lại đầy đủ Client ID, API Key và Checksum Key bên dưới.'}
                    </span>
                  </div>
                )}

                <form onSubmit={handleSavePayos} autoComplete="off">
                  {/* Decoy inputs to prevent browser autofill */}
                  <div
                    style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <input type="text" name="chrome_decoy_username" tabIndex={-1} autoComplete="username" />
                    <input type="password" name="chrome_decoy_password" tabIndex={-1} autoComplete="current-password" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {/* Client ID */}
                    <div>
                      <label className="st-label" htmlFor="payosClientId">
                        Client ID {!payosConfigured && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input
                        id="payosClientId"
                        name="payos_channel_client_id_token"
                        className="st-input"
                        type="text"
                        value={payosClientId}
                        onChange={e => setPayosClientId(e.target.value)}
                        placeholder={
                          payosConfigured
                            ? (isEn ? `Configured: ${payosClientIdMasked} (Enter new to replace)` : `Đã lưu: ${payosClientIdMasked} (Nhập mới nếu muốn thay đổi)`)
                            : (isEn ? 'e.g. 550e8400-e29b-41d4-a716-446655440000' : 'Ví dụ: 550e8400-e29b-41d4-a716-446655440000')
                        }
                        autoComplete="new-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                      />
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, margin: '4px 0 0 0' }}>
                        {isEn
                          ? 'Public identifier of your payment channel (found under Payment Channels in PayOS).'
                          : 'Mã định danh công khai của kênh thanh toán (tìm thấy tại mục Kênh thanh toán trên PayOS).'}
                      </p>
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="st-label" htmlFor="payosApiKey">
                        API Key {!payosConfigured && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <div className="st-input-wrap">
                        <input
                          id="payosApiKey"
                          name="payos_api_secret_token"
                          className="st-input"
                          type={showApiKey ? 'text' : 'password'}
                          value={payosApiKey}
                          onChange={e => setPayosApiKey(e.target.value)}
                          placeholder={
                            payosConfigured
                              ? (isEn ? '•••••••••••••••••••••••• (Leave blank to keep existing)' : '•••••••••••••••••••••••• (Để trống nếu giữ nguyên khóa cũ)')
                              : (isEn ? 'Paste API Key from PayOS Dashboard' : 'Dán API Key từ PayOS Dashboard')
                          }
                          autoComplete="new-password"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck="false"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          data-form-type="other"
                        />
                        <button
                          type="button"
                          className="st-eye-btn"
                          onClick={() => setShowApiKey(v => !v)}
                          title={showApiKey ? (isEn ? 'Hide API Key' : 'Ẩn API Key') : (isEn ? 'Show API Key' : 'Hiện API Key')}
                        >
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, margin: '4px 0 0 0' }}>
                        {isEn
                          ? 'Secret key used to authenticate API requests to PayOS.'
                          : 'Khóa bảo mật dùng để xác thực các yêu cầu gửi đến máy chủ PayOS.'}
                      </p>
                    </div>

                    {/* Checksum Key */}
                    <div>
                      <label className="st-label" htmlFor="payosChecksumKey">
                        Checksum Key {!payosConfigured && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <div className="st-input-wrap">
                        <input
                          id="payosChecksumKey"
                          name="payos_checksum_secret_token"
                          className="st-input"
                          type={showChecksumKey ? 'text' : 'password'}
                          value={payosChecksumKey}
                          onChange={e => setPayosChecksumKey(e.target.value)}
                          placeholder={
                            payosConfigured
                              ? (isEn ? '•••••••••••••••••••••••• (Leave blank to keep existing)' : '•••••••••••••••••••••••• (Để trống nếu giữ nguyên khóa cũ)')
                              : (isEn ? 'Paste Checksum Key from PayOS Dashboard' : 'Dán Checksum Key từ PayOS Dashboard')
                          }
                          autoComplete="new-password"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck="false"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          data-form-type="other"
                        />
                        <button
                          type="button"
                          className="st-eye-btn"
                          onClick={() => setShowChecksumKey(v => !v)}
                          title={showChecksumKey ? (isEn ? 'Hide Checksum Key' : 'Ẩn Checksum Key') : (isEn ? 'Show Checksum Key' : 'Hiện Checksum Key')}
                        >
                          {showChecksumKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, margin: '4px 0 0 0' }}>
                        {isEn
                          ? 'HMAC-SHA256 signature key to verify Webhook data integrity.'
                          : 'Khóa tạo chữ ký HMAC-SHA256 để bảo vệ tính toàn vẹn và xác thực thông báo Webhook.'}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="submit"
                      className="st-btn-primary"
                      disabled={savingPayos || (!payosConfigured && (!payosClientId.trim() || !payosApiKey.trim() || !payosChecksumKey.trim()))}
                    >
                      {savingPayos ? (
                        <>
                          <Loader2 size={15} className="st-spinning" />
                          <span>{isEn ? 'Saving Configuration...' : 'Đang Lưu Thông Tin...'}</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>{payosConfigured ? (isEn ? 'Save Connection Credentials' : 'Lưu thông tin kết nối') : (isEn ? 'Save Connection Credentials' : 'Lưu thông tin kết nối')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* STEP 4: Verify and Activate */}
            <div className="st-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                }}>
                  4
                </div>
                <div style={{ flex: 1 }}>
                  <div className="st-section-title" style={{ fontSize: 15, marginBottom: 4 }}>
                    {isEn ? 'Step 4: Verify Connection & Activate' : 'Bước 4: Kiểm tra kết nối & Kích hoạt'}
                  </div>
                  <div className="st-section-desc" style={{ fontSize: 13 }}>
                    {isEn
                      ? 'Test the PayOS API integration to confirm your credentials before enabling POS checkout.'
                      : 'Kiểm tra kết nối với máy chủ PayOS để đảm bảo thông tin xác thực chính xác trước khi bật thanh toán cho thu ngân.'}
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: 46, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Connection Test Action */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                      {isEn ? 'Real-time PayOS Connection Test' : 'Xác minh kết nối PayOS thời gian thực'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {isEn
                        ? 'Sends an authenticated ping to PayOS API servers to verify credentials.'
                        : 'Gửi yêu cầu xác thực tới máy chủ PayOS để kiểm tra tính hợp lệ của Client ID, API Key và Checksum Key.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestPayosConnection}
                    disabled={testingPayos}
                    className="st-btn-secondary"
                    style={{
                      border: '1.5px solid #0284c7',
                      color: '#0284c7',
                      fontWeight: 800,
                      background: '#eff6ff'
                    }}
                  >
                    {testingPayos ? (
                      <>
                        <Loader2 size={15} className="st-spinning" />
                        <span>{isEn ? 'Verifying...' : 'Đang kiểm tra...'}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={15} />
                        <span>{isEn ? 'Test PayOS Connection' : 'Kiểm tra kết nối PayOS'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Connection Test Feedback Result */}
                {testResult && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: testResult.success ? '#ecfdf5' : '#fef2f2',
                    border: `1.5px solid ${testResult.success ? '#a7f3d0' : '#fecaca'}`,
                    color: testResult.success ? '#047857' : '#b91c1c'
                  }}>
                    {testResult.success ? (
                      <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    )}
                    <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>
                        {testResult.success
                          ? (isEn ? 'Connection Successful' : 'Xác thực kết nối thành công')
                          : (isEn ? 'Connection Verification Failed' : 'Xác thực kết nối thất bại')}
                      </div>
                      <div>{testResult.message}</div>
                    </div>
                  </div>
                )}

                {/* Activation Switch */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: 14,
                  background: payosActive ? '#f0fdf4' : '#ffffff',
                  border: `1.5px solid ${payosActive ? '#86efac' : '#e2e8f0'}`,
                  transition: 'all .2s'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                        {isEn ? 'Enable VietQR payment on POS checkout' : 'Kích hoạt thanh toán VietQR trên màn hình POS'}
                      </span>
                      {payosActive && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>
                          {isEn ? 'Active' : 'Đang bật'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {isEn
                        ? 'When enabled, cashiers can generate dynamic VietQR transfer codes during checkout.'
                        : 'Khi bật, nhân viên thu ngân có thể chọn phương thức thanh toán VietQR tự động khi tạo đơn hàng.'}
                    </div>
                  </div>

                  <Toggle
                    checked={payosActive}
                    onChange={() => handleTogglePayos()}
                  />
                </div>
              </div>
            </div>

            {/* Troubleshooting & FAQ Accordion */}
            <div className="st-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => setShowTroubleshoot(v => !v)}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: '#f8fafc',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HelpCircle size={18} color="#0284c7" />
                  <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>
                    {isEn ? 'Troubleshooting & Frequently Asked Questions' : 'Câu hỏi thường gặp & Khắc phục sự cố'}
                  </span>
                </div>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  {showTroubleshoot ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {showTroubleshoot && (
                <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                      {isEn
                        ? '1. Customer paid successfully, but POS order does not complete automatically?'
                        : '1. Khách đã chuyển khoản thành công nhưng đơn hàng POS không tự động hoàn tất?'}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.55 }}>
                      {isEn
                        ? 'Check whether the Webhook URL was correctly pasted in PayOS Dashboard under Payment Channels. Also verify that the Checksum Key in Step 3 matches your PayOS channel.'
                        : 'Kiểm tra xem Webhook URL ở Bước 2 đã được dán chính xác vào mục Webhook URL trên PayOS Dashboard chưa. Đồng thời kiểm tra Checksum Key có đúng với tài khoản kênh thanh toán không.'}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                      {isEn
                        ? '2. Error: "Invalid Signature" (Chữ ký không hợp lệ)?'
                        : '2. Báo lỗi chữ ký không hợp lệ (Invalid Signature)?'}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.55 }}>
                      {isEn
                        ? 'Checksum Key is used to calculate and verify HMAC-SHA256 signatures. Ensure you copied the exact Checksum Key without leading or trailing spaces.'
                        : 'Checksum Key được dùng để tạo và xác thực chữ ký HMAC-SHA256. Hãy copy lại chính xác Checksum Key từ PayOS Dashboard và nhấn "Lưu thông tin kết nối" lại.'}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                      {isEn
                        ? '3. How to test PayOS in a local development environment (Localhost)?'
                        : '3. Cách thử nghiệm trong môi trường cục bộ (Localhost)?'}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.55 }}>
                      {isEn
                        ? 'Since PayOS cannot send webhooks to localhost directly, you can use a tunneling tool such as ngrok (`ngrok http 5000`) and set your public HTTPS URL in the PayOS Webhook configuration.'
                        : 'Vì máy chủ PayOS không thể gửi webhook trực tiếp vào localhost, bạn có thể sử dụng công cụ tạo tunnel như ngrok (`ngrok http 5000`) và dán đường dẫn HTTPS ngrok kèm đuôi `/api/v1/pos/payos/webhook` vào PayOS.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Supported Payment Methods on POS */}
            <div className="st-card" style={{ padding: 24 }}>
              <div className="st-section-title" style={{ marginBottom: 6 }}>
                <CheckCircle2 size={16} color="#059669" />
                {isEn ? 'POS Checkout Payment Methods' : 'Phương thức thanh toán trên quầy POS'}
              </div>
              <div className="st-section-desc" style={{ marginBottom: 16 }}>
                {isEn
                  ? 'Manage which payment options cashiers can use at checkout.'
                  : 'Kiểm soát các phương thức thanh toán thu ngân có thể sử dụng khi tạo đơn hàng.'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    label: isEn ? 'Cash Payment (Tiền mặt)' : 'Tiền mặt',
                    desc: isEn ? 'Standard cash transaction, cashier enters received amount' : 'Thu tiền mặt trực tiếp tại quầy, thu ngân nhập tiền khách đưa',
                    active: true,
                    fixed: true
                  },
                  {
                    label: isEn ? 'Manual Bank Transfer (Chuyển khoản thủ công)' : 'Chuyển khoản ngân hàng (thủ công)',
                    desc: isEn ? 'Cashier checks bank app manually and confirms payment' : 'Khách chuyển khoản theo số tài khoản thủ công, thu ngân tự xác nhận',
                    active: true,
                    fixed: true
                  },
                  {
                    label: isEn ? 'VietQR Dynamic QR via PayOS' : 'Mã VietQR động tự động qua PayOS',
                    desc: isEn ? 'Real-time payment verification with automated order completion' : 'Tự động tạo mã QR động đúng số tiền đơn hàng, tự động hoàn tất đơn khi khách quét mã',
                    active: payosConfigured && payosActive,
                    fixed: !payosConfigured
                  },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="st-toggle-wrapper"
                    onClick={() => !m.fixed && handleTogglePayos()}
                    style={{
                      cursor: m.fixed ? 'default' : 'pointer',
                      border: m.active && !m.fixed ? '1.5px solid #a7f3d0' : '1.5px solid #e2e8f0',
                      background: m.active && !m.fixed ? '#f0fdf4' : '#fafbfc'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.desc}</div>
                    </div>
                    {m.fixed ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
                        {isEn ? 'Default' : 'Mặc định'}
                      </span>
                    ) : (
                      <Toggle checked={m.active} onChange={() => handleTogglePayos()} />
                    )}
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
        {activeTab === 'data' && <StoreDataExportPanel isEn={isEn} />}

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
