import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Store,
  Bot,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { apiGetAdminSettings, apiUpdateAdminSetting, formatVNDateTime } from '../../services/adminService';
import { apiErrorMessage } from './adminLabels';
import { adminStyles as ui } from './adminStyles';
import { Badge } from './components/AdminUI';

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
        checked ? 'bg-[#2563EB]' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function SettingCard({ title, description, icon: Icon, iconBg, setting, children, dirty, saving, onSave, onReset }) {
  return (
    <section className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] p-5 space-y-4 transition-all">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">{title}</h3>
          <p className="text-[13px] text-[#64748B] mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="pt-2">{children}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9] text-[12px]">
        <span className="text-[#94A3B8]">
          {setting?.updatedAt
            ? `Cập nhật lần cuối: ${formatVNDateTime(setting.updatedAt)}${
                setting.updatedBy ? ` bởi ${setting.updatedBy.fullName}` : ''
              }`
            : 'Đang áp dụng giá trị mặc định của hệ thống'}
        </span>

        {dirty && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              disabled={saving}
              className={`${ui.btnSecondary} px-3 py-1.5 text-[12px]`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi phục
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`${ui.btnPrimary} px-3.5 py-1.5 text-[12px]`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Lưu thay đổi
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function AdminSettingsPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({});
  const [draft, setDraft] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await apiGetAdminSettings();
      const byKey = Object.fromEntries(list.map((s) => [s.key, s]));
      setSettings(byKey);
      setDraft(Object.fromEntries(list.map((s) => [s.key, s.value])));
    } catch (err) {
      toast({ type: 'error', title: 'Không tải được cài đặt hệ thống', description: apiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isDirty = (key) => JSON.stringify(draft[key]) !== JSON.stringify(settings[key]?.value);
  const resetKey = (key) => setDraft((d) => ({ ...d, [key]: settings[key]?.value }));

  const save = async (key, successText) => {
    setSavingKey(key);
    try {
      const saved = await apiUpdateAdminSetting(key, draft[key]);
      setSettings((s) => ({ ...s, [key]: saved }));
      setDraft((d) => ({ ...d, [key]: saved.value }));
      toast({ type: 'success', title: 'Đã lưu cấu hình', description: successText });
    } catch (err) {
      toast({ type: 'error', title: 'Không lưu được cài đặt', description: apiErrorMessage(err) });
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const signup = draft['signup.enabled'];
  const banner = draft['maintenance.banner'] || { enabled: false, message: '' };
  const quota = draft['ai.dailyQuotaPerStore'] ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/40 text-[13px] text-blue-900 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0" />
        <span className="leading-relaxed">
          Cài đặt được lưu trữ tại cơ sở dữ liệu và <strong>có hiệu lực ngay lập tức</strong> cho mọi người dùng toàn hệ thống mà không cần khởi động lại máy chủ.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Cài đặt 1: Đăng ký cửa hàng */}
        <SettingCard
          title="Đăng ký Cửa hàng mới"
          description="Kiểm soát khả năng tự mở cửa hàng từ trang chủ. Khi tạm tắt, form đăng ký mới sẽ bị khóa."
          icon={Store}
          iconBg="bg-blue-50 text-[#2563EB] border-blue-100"
          setting={settings['signup.enabled']}
          dirty={isDirty('signup.enabled')}
          saving={savingKey === 'signup.enabled'}
          onReset={() => resetKey('signup.enabled')}
          onSave={() =>
            save(
              'signup.enabled',
              signup ? 'Đã mở cổng đăng ký cửa hàng mới.' : 'Đã tạm ngừng tiếp nhận đăng ký cửa hàng mới.'
            )
          }
        >
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-slate-50/60">
            <div>
              <p className="font-semibold text-[#0F172A] text-[13px]">
                {signup ? 'Cổng đăng ký đang MỞ' : 'Cổng đăng ký đang TẠM KHÓA'}
              </p>
              <p className="text-[12px] text-[#64748B]">
                {signup ? 'Khách hàng có thể tự tạo tài khoản và mở cửa hàng' : 'Trang đăng ký từ chối mở shop mới'}
              </p>
            </div>
            <Switch
              checked={Boolean(signup)}
              onChange={(v) => setDraft((d) => ({ ...d, 'signup.enabled': v }))}
              label="Bật / Tắt đăng ký"
            />
          </div>
        </SettingCard>

        {/* Cài đặt 2: Hạn ngạch Trợ lý AI */}
        <SettingCard
          title="Hạn mức Trợ lý AI hằng ngày"
          description="Giới hạn số lượt hỏi trợ lý thông minh tối đa cho mỗi cửa hàng trong 24 giờ để kiểm soát chi phí API."
          icon={Bot}
          iconBg="bg-purple-50 text-purple-600 border-purple-100"
          setting={settings['ai.dailyQuotaPerStore']}
          dirty={isDirty('ai.dailyQuotaPerStore')}
          saving={savingKey === 'ai.dailyQuotaPerStore'}
          onReset={() => resetKey('ai.dailyQuotaPerStore')}
          onSave={() =>
            save(
              'ai.dailyQuotaPerStore',
              quota > 0 ? `Mỗi cửa hàng được hỏi tối đa ${quota} lượt/ngày.` : 'Đã bỏ giới hạn lượt hỏi AI.'
            )
          }
        >
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={10000}
                step={1}
                value={quota}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    'ai.dailyQuotaPerStore': Math.max(0, Math.floor(Number(e.target.value) || 0)),
                  }))
                }
                className={`${ui.input} w-32 tabular-nums font-bold text-[14px]`}
              />
              <span className="text-[13px] font-medium text-[#334155]">lượt / cửa hàng / ngày</span>
            </div>
            <p className="text-[12px] text-[#64748B]">
              {quota === 0 ? (
                <span className="text-emerald-700 font-semibold">Không giới hạn số lượt hỏi</span>
              ) : (
                `Mỗi cửa hàng bị giới hạn ${quota} câu hỏi mỗi ngày. Khi vượt quá, hệ thống sẽ yêu cầu chờ sang ngày hôm sau.`
              )}
            </p>
          </div>
        </SettingCard>

        {/* Cài đặt 3: Thông báo bảo trì toàn hệ thống */}
        <div className="lg:col-span-2">
          <SettingCard
            title="Thông báo Toàn hệ thống (Broadcast Banner)"
            description="Hiển thị một dải biểu ngữ thông báo khẩn cấp phía trên thanh tiêu đề của mọi trang. Áp dụng cho toàn bộ cửa hàng và nhân sự khi cần bảo trì hoặc có tin tức quan trọng."
            icon={Megaphone}
            iconBg="bg-amber-50 text-amber-700 border-amber-100"
            setting={settings['maintenance.banner']}
            dirty={isDirty('maintenance.banner')}
            saving={savingKey === 'maintenance.banner'}
            onReset={() => resetKey('maintenance.banner')}
            onSave={() =>
              save(
                'maintenance.banner',
                banner.enabled ? 'Đang phát thông báo tới toàn bộ người dùng.' : 'Đã tắt thông báo hệ thống.'
              )
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-slate-50/60">
                <div>
                  <p className="font-semibold text-[#0F172A] text-[13px]">
                    {banner.enabled ? 'Thông báo đang PHÁT' : 'Thông báo đang TẮT'}
                  </p>
                  <p className="text-[12px] text-[#64748B]">
                    {banner.enabled ? 'Người dùng toàn hệ thống đang nhìn thấy banner này' : 'Banner đang ẩn'}
                  </p>
                </div>
                <Switch
                  checked={Boolean(banner.enabled)}
                  onChange={(v) => setDraft((d) => ({ ...d, 'maintenance.banner': { ...banner, enabled: v } }))}
                  label="Bật / Tắt biểu ngữ thông báo"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">Nội dung thông báo</label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={banner.message}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, 'maintenance.banner': { ...banner, message: e.target.value } }))
                  }
                  placeholder="Ví dụ: Hệ thống bảo trì máy chủ từ 23:00 đến 23:30 hôm nay. Màn hình POS vẫn bán lẻ bình thường nhưng không đồng bộ đám mây."
                  className={ui.input}
                />
              </div>

              {/* Live Preview */}
              {banner.enabled && banner.message.trim() && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-900 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-800 text-[12px] uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Xem trước hiển thị thực tế
                  </div>
                  <p className="leading-relaxed font-medium">{banner.message}</p>
                </div>
              )}
            </div>
          </SettingCard>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsPanel;
