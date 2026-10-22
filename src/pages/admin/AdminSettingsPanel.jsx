import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { apiGetAdminSettings, apiUpdateAdminSetting, formatVNDateTime } from '../../services/adminService';
import { apiErrorMessage } from './adminLabels';
import { adminStyles } from './adminStyles';

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
        checked ? 'bg-[#3B82F6]' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function SettingCard({ title, description, setting, children, dirty, saving, onSave, onReset }) {
  return (
    <section className={`${adminStyles.card} p-4 space-y-3`}>
      <div>
        <h3 className="text-[14px] font-medium text-[#334155]">{title}</h3>
        <p className="text-[13px] text-[#64748B] mt-0.5">{description}</p>
      </div>
      {children}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-[12px] text-[#94A3B8]">
          {setting?.updatedAt
            ? `Đổi lần cuối ${formatVNDateTime(setting.updatedAt)}${setting.updatedBy ? ` bởi ${setting.updatedBy.fullName}` : ''}`
            : 'Đang dùng giá trị mặc định'}
        </span>
        {dirty && (
          <div className="flex gap-2">
            <button type="button" onClick={onReset} disabled={saving} className={adminStyles.btnSecondary}>
              Hủy
            </button>
            <button type="button" onClick={onSave} disabled={saving} className={adminStyles.btnPrimary}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
      toast({ type: 'error', title: 'Không tải được cài đặt', description: apiErrorMessage(err) });
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
      toast({ type: 'success', title: 'Đã lưu cài đặt', description: successText });
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
          <div key={i} className="h-36 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const signup = draft['signup.enabled'];
  const banner = draft['maintenance.banner'] || { enabled: false, message: '' };
  const quota = draft['ai.dailyQuotaPerStore'] ?? 0;

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#64748B]">
        Thay đổi có hiệu lực ngay, không cần khởi động lại máy chủ. Mọi lần đổi đều được ghi vào nhật ký kiểm toán.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingCard
          title="Đăng ký cửa hàng mới"
          description="Khi tắt, trang đăng ký từ chối tạo cửa hàng mới. Khách vẫn để lại thông tin liên hệ được."
          setting={settings['signup.enabled']}
          dirty={isDirty('signup.enabled')}
          saving={savingKey === 'signup.enabled'}
          onReset={() => resetKey('signup.enabled')}
          onSave={() => save('signup.enabled', signup ? 'Đã mở lại đăng ký cửa hàng mới.' : 'Đã tạm ngừng đăng ký cửa hàng mới.')}
        >
          <label className="flex items-center gap-3 text-[13px] text-[#334155]">
            <Switch checked={Boolean(signup)} onChange={(v) => setDraft((d) => ({ ...d, 'signup.enabled': v }))} label="Cho phép đăng ký" />
            {signup ? 'Đang cho phép đăng ký' : <span className="text-[#D97706]">Đang tạm ngừng đăng ký</span>}
          </label>
        </SettingCard>

        <SettingCard
          title="Giới hạn trợ lý AI"
          description="Số lượt hỏi tối đa mỗi cửa hàng mỗi ngày, để kiểm soát chi phí. Nhập 0 nếu không giới hạn."
          setting={settings['ai.dailyQuotaPerStore']}
          dirty={isDirty('ai.dailyQuotaPerStore')}
          saving={savingKey === 'ai.dailyQuotaPerStore'}
          onReset={() => resetKey('ai.dailyQuotaPerStore')}
          onSave={() =>
            save('ai.dailyQuotaPerStore', quota > 0 ? `Mỗi cửa hàng được hỏi tối đa ${quota} lượt/ngày.` : 'Đã bỏ giới hạn lượt hỏi AI.')
          }
        >
          <label className="flex items-center gap-2 text-[13px] text-[#334155]">
            <input
              type="number"
              min={0}
              max={10000}
              step={1}
              value={quota}
              onChange={(e) => setDraft((d) => ({ ...d, 'ai.dailyQuotaPerStore': Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
              className={`${adminStyles.input} w-28 tabular-nums`}
            />
            lượt / cửa hàng / ngày {quota === 0 && <span className="text-[#64748B]">(không giới hạn)</span>}
          </label>
        </SettingCard>

        <div className="lg:col-span-2">
          <SettingCard
            title="Thông báo toàn hệ thống"
            description="Hiện một dải thông báo phía trên mọi trang của tất cả cửa hàng. Dùng khi bảo trì, có sự cố hoặc có cập nhật quan trọng."
            setting={settings['maintenance.banner']}
            dirty={isDirty('maintenance.banner')}
            saving={savingKey === 'maintenance.banner'}
            onReset={() => resetKey('maintenance.banner')}
            onSave={() => save('maintenance.banner', banner.enabled ? 'Thông báo đang hiển thị cho mọi cửa hàng.' : 'Đã tắt thông báo.')}
          >
            <label className="flex items-center gap-3 text-[13px] text-[#334155]">
              <Switch
                checked={banner.enabled}
                onChange={(v) => setDraft((d) => ({ ...d, 'maintenance.banner': { ...banner, enabled: v } }))}
                label="Hiển thị thông báo"
              />
              {banner.enabled ? 'Đang hiển thị' : 'Đang tắt'}
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={banner.message}
              onChange={(e) => setDraft((d) => ({ ...d, 'maintenance.banner': { ...banner, message: e.target.value } }))}
              placeholder="Ví dụ: Hệ thống bảo trì từ 22:00 đến 23:00 hôm nay, POS vẫn bán được nhưng không đồng bộ."
              className={adminStyles.input}
            />
            {banner.enabled && banner.message.trim() && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                <span className="text-[12px] text-amber-700 block mb-0.5">Xem trước</span>
                {banner.message}
              </div>
            )}
          </SettingCard>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsPanel;
