import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Store,
  Bot,
  Megaphone,
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
import { useAdminText } from './useAdminText';

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
        checked ? 'bg-blue-600' : 'bg-slate-300'
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function SettingCard({ title, description, icon: Icon, setting, children, dirty, saving, onSave, onReset }) {
  const { t } = useAdminText();
  return (
    <section className={`${ui.card} p-5 space-y-4`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
            {dirty && (
              <Badge tone="warning" dot={false}>
                {t('Chưa lưu', 'Unsaved')}
              </Badge>
            )}
          </div>
          <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="pt-2">{children}</div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[12px]">
        <span className="text-slate-400">
          {setting?.updatedAt
            ? t('Cập nhật lần cuối: ', 'Last updated: ') +
              formatVNDateTime(setting.updatedAt) +
              (setting.updatedBy ? t(` bởi ${setting.updatedBy.fullName}`, ` by ${setting.updatedBy.fullName}`) : '')
            : t('Đang áp dụng giá trị mặc định của hệ thống', 'Using the system default')}
        </span>

        {dirty && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              disabled={saving}
              className={`${ui.btnSecondary} h-8`}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              {t('Khôi phục', 'Revert')}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`${ui.btnPrimary} h-8`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
              {t('Lưu thay đổi', 'Save changes')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function AdminSettingsPanel() {
  const { t } = useAdminText();
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
      toast({ type: 'error', title: t('Không tải được cài đặt hệ thống', 'Could not load system settings'), description: apiErrorMessage(err) });
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
      toast({ type: 'success', title: t('Đã lưu cấu hình', 'Settings saved'), description: successText });
    } catch (err) {
      toast({ type: 'error', title: t('Không lưu được cài đặt', 'Could not save the setting'), description: apiErrorMessage(err) });
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
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-blue-200 bg-blue-50 text-[13px] text-blue-900">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
        <span className="leading-relaxed">
          {t(
            'Cài đặt được lưu trong cơ sở dữ liệu và có hiệu lực ngay lập tức cho mọi người dùng, không cần khởi động lại máy chủ.',
            'Settings are stored in the database and take effect immediately for every user — no server restart needed.'
          )}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Cài đặt 1: Đăng ký cửa hàng */}
        <SettingCard
          title={t('Đăng ký Cửa hàng mới', 'New store sign-up')}
          description={t('Kiểm soát khả năng tự mở cửa hàng từ trang chủ. Khi tạm tắt, form đăng ký mới sẽ bị khóa.', 'Controls self sign-up from the home page. When off, the sign-up form is locked.')}
          icon={Store}
          setting={settings['signup.enabled']}
          dirty={isDirty('signup.enabled')}
          saving={savingKey === 'signup.enabled'}
          onReset={() => resetKey('signup.enabled')}
          onSave={() =>
            save(
              'signup.enabled',
              signup ? t('Đã mở cổng đăng ký cửa hàng mới.', 'New store sign-up is open.') : t('Đã tạm ngừng tiếp nhận đăng ký cửa hàng mới.', 'New store sign-up is paused.')
            )
          }
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50">
            <div>
              <p className="font-semibold text-slate-900 text-[13px]">
                {signup ? t('Cổng đăng ký đang MỞ', 'Sign-up is OPEN') : t('Cổng đăng ký đang TẠM KHÓA', 'Sign-up is PAUSED')}
              </p>
              <p className="text-[12px] text-slate-500">
                {signup ? t('Khách hàng có thể tự tạo tài khoản và mở cửa hàng', 'Customers can create an account and open a store') : t('Trang đăng ký từ chối mở shop mới', 'The sign-up page rejects new stores')}
              </p>
            </div>
            <Switch
              checked={Boolean(signup)}
              onChange={(v) => setDraft((d) => ({ ...d, 'signup.enabled': v }))}
              label={t('Bật / Tắt đăng ký', 'Toggle sign-up')}
            />
          </div>
        </SettingCard>

        {/* Cài đặt 2: Hạn ngạch Trợ lý AI */}
        <SettingCard
          title={t('Hạn mức Trợ lý AI hằng ngày', 'Daily AI assistant quota')}
          description={t('Giới hạn số lượt hỏi trợ lý thông minh tối đa cho mỗi cửa hàng trong 24 giờ để kiểm soát chi phí API.', 'Caps AI assistant questions per store per 24 hours to control API cost.')}
          icon={Bot}
          setting={settings['ai.dailyQuotaPerStore']}
          dirty={isDirty('ai.dailyQuotaPerStore')}
          saving={savingKey === 'ai.dailyQuotaPerStore'}
          onReset={() => resetKey('ai.dailyQuotaPerStore')}
          onSave={() =>
            save(
              'ai.dailyQuotaPerStore',
              quota > 0
                ? t(`Mỗi cửa hàng được hỏi tối đa ${quota} lượt/ngày.`, `Each store can ask up to ${quota} questions/day.`)
                : t('Đã bỏ giới hạn lượt hỏi AI.', 'AI question limit removed.')
            )
          }
        >
          <div className="px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
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
                className={`${ui.input} h-9 w-28 tabular-nums font-medium`}
                aria-label={t('Số lượt mỗi ngày', 'Requests per day')}
              />
              <span className="text-[13px] font-medium text-slate-700">{t('lượt / cửa hàng / ngày', 'requests / store / day')}</span>
            </div>
            <p className="text-[12px] text-slate-500">
              {quota === 0 ? (
                <span className="text-emerald-700 font-semibold">{t('Không giới hạn số lượt hỏi', 'Unlimited questions')}</span>
              ) : (
                t(
                  `Mỗi cửa hàng bị giới hạn ${quota} câu hỏi mỗi ngày. Khi vượt quá, hệ thống sẽ yêu cầu chờ sang ngày hôm sau.`,
                  `Each store is limited to ${quota} questions per day. Beyond that, they must wait until the next day.`
                )
              )}
            </p>
          </div>
        </SettingCard>

        {/* Cài đặt 3: Thông báo bảo trì toàn hệ thống */}
        <div className="lg:col-span-2">
          <SettingCard
            title={t('Thông báo Toàn hệ thống (Broadcast Banner)', 'System-wide banner')}
            description={t('Hiển thị một dải biểu ngữ thông báo khẩn cấp phía trên thanh tiêu đề của mọi trang. Áp dụng cho toàn bộ cửa hàng và nhân sự khi cần bảo trì hoặc có tin tức quan trọng.', 'Shows an urgent banner above the header on every page, for all stores and staff — for maintenance or important news.')}
            icon={Megaphone}
            setting={settings['maintenance.banner']}
            dirty={isDirty('maintenance.banner')}
            saving={savingKey === 'maintenance.banner'}
            onReset={() => resetKey('maintenance.banner')}
            onSave={() =>
              save(
                'maintenance.banner',
                banner.enabled ? t('Đang phát thông báo tới toàn bộ người dùng.', 'The banner is now shown to every user.') : t('Đã tắt thông báo hệ thống.', 'System banner turned off.')
              )
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-900 text-[13px]">
                    {banner.enabled ? t('Thông báo đang PHÁT', 'Banner is LIVE') : t('Thông báo đang TẮT', 'Banner is OFF')}
                  </p>
                  <p className="text-[12px] text-slate-500">
                    {banner.enabled ? t('Người dùng toàn hệ thống đang nhìn thấy banner này', 'Every user currently sees this banner') : t('Banner đang ẩn', 'Banner is hidden')}
                  </p>
                </div>
                <Switch
                  checked={Boolean(banner.enabled)}
                  onChange={(v) => setDraft((d) => ({ ...d, 'maintenance.banner': { ...banner, enabled: v } }))}
                  label={t('Bật / Tắt biểu ngữ thông báo', 'Toggle banner')}
                />
              </div>

              <div>
                <label htmlFor="banner-message" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                  {t('Nội dung thông báo', 'Banner message')}
                </label>
                <textarea
                  id="banner-message"
                  rows={2}
                  maxLength={300}
                  value={banner.message}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, 'maintenance.banner': { ...banner, message: e.target.value } }))
                  }
                  placeholder={t('Ví dụ: Hệ thống bảo trì máy chủ từ 23:00 đến 23:30 hôm nay. Màn hình POS vẫn bán lẻ bình thường nhưng không đồng bộ đám mây.', 'e.g. Server maintenance tonight 23:00–23:30. POS keeps selling but will not sync to the cloud.')}
                  className={ui.input}
                />
              </div>

              {/* Live Preview */}
              {banner.enabled && banner.message.trim() && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-[13px] text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-amber-800 text-[12px] uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                    {t('Xem trước hiển thị thực tế', 'Live preview')}
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
