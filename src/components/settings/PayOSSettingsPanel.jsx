import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useTranslation } from '../../i18n/useTranslation';
import { apiGetPaymentConfig, apiTogglePaymentConfig } from '../../services/analyticsService';
import { PayOSStatusHeader } from './PayOSStatusHeader';
import { PayOSWebhookCard } from './PayOSWebhookCard';
import { PayOSCredentialsForm } from './PayOSCredentialsForm';
import { PayOSSideGuide } from './PayOSSideGuide';

const EMPTY_CONFIG = {
  configured: false,
  active: false,
  clientIdMasked: '',
  needsReentry: false,
  webhookUrl: '',
  isPublicDomain: true,
  updatedAt: null,
  configuredAt: null,
};

// Response của GET/PUT /store-payment-config/payos có cùng hình dạng; giữ giá trị cũ khi BE không trả trường đó.
function mergeConfig(prev, cfg) {
  if (!cfg) return prev;
  return {
    configured: cfg.configured ?? prev.configured,
    active: cfg.active ?? prev.active,
    clientIdMasked: cfg.clientIdMasked ?? prev.clientIdMasked,
    needsReentry: Boolean(cfg.needsReentry),
    webhookUrl: cfg.webhookUrl || prev.webhookUrl,
    isPublicDomain: typeof cfg.isPublicDomain === 'boolean' ? cfg.isPublicDomain : prev.isPublicDomain,
    updatedAt: cfg.updatedAt ?? prev.updatedAt,
    configuredAt: cfg.configuredAt ?? prev.configuredAt,
  };
}

const errorMessage = (err, fallback) => err?.response?.data?.error?.message || err?.message || fallback;

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-24 animate-pulse rounded-xl border border-slate-200/80 bg-white" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <div className="flex flex-col gap-6">
          <div className="h-36 animate-pulse rounded-xl border border-slate-200/80 bg-white" />
          <div className="h-96 animate-pulse rounded-xl border border-slate-200/80 bg-white" />
        </div>
        <div className="h-[28rem] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
      </div>
    </div>
  );
}

export function PayOSSettingsPanel() {
  const { toast } = useToast();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [toggling, setToggling] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoadState('loading');
    try {
      const cfg = await apiGetPaymentConfig();
      setConfig(prev => mergeConfig(prev, cfg));
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const applyConfig = useCallback((cfg) => setConfig(prev => mergeConfig(prev, cfg)), []);

  const handleToggle = async () => {
    if (toggling || !config.configured) return;
    const target = !config.active;
    setToggling(true);
    try {
      const res = await apiTogglePaymentConfig(target);
      const active = res?.active ?? target;
      setConfig(prev => ({ ...prev, active }));
      toast({
        title: active
          ? (isEn ? 'VietQR enabled on POS' : 'Đã bật VietQR tại quầy POS')
          : (isEn ? 'VietQR paused on POS' : 'Đã tạm tắt VietQR tại quầy POS'),
        description: active
          ? (isEn ? 'Cashiers can now show a dynamic VietQR code at checkout.' : 'Thu ngân có thể hiển thị mã VietQR động khi thanh toán.')
          : (isEn ? 'The VietQR option is hidden from the POS checkout screen.' : 'Lựa chọn VietQR sẽ được ẩn khỏi màn hình thanh toán POS.'),
        type: active ? 'success' : 'info',
      });
    } catch (err) {
      toast({
        title: isEn ? 'Could not change VietQR status' : 'Không đổi được trạng thái VietQR',
        description: errorMessage(err, isEn ? 'Please try again.' : 'Vui lòng thử lại.'),
        type: 'error',
      });
    } finally {
      setToggling(false);
    }
  };

  if (loadState === 'loading') return <PanelSkeleton />;

  if (loadState === 'error') {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-6 py-12 text-center">
        <span className="rounded-full bg-red-50 p-3 text-red-600"><AlertTriangle className="size-6" aria-hidden /></span>
        <p className="text-base font-semibold text-slate-900">
          {isEn ? 'Could not load PayOS settings' : 'Không tải được cấu hình PayOS'}
        </p>
        <p className="max-w-md text-sm text-slate-500">
          {isEn ? 'Check your network connection, then try again.' : 'Kiểm tra kết nối mạng rồi thử lại.'}
        </p>
        <button
          type="button"
          onClick={loadConfig}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <RefreshCw className="size-4" aria-hidden /> {isEn ? 'Try again' : 'Thử lại'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PayOSStatusHeader config={config} isEn={isEn} toggling={toggling} onToggle={handleToggle} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <PayOSWebhookCard webhookUrl={config.webhookUrl} isPublicDomain={config.isPublicDomain} isEn={isEn} />
          <PayOSCredentialsForm config={config} isEn={isEn} onSaved={applyConfig} />
        </div>
        <PayOSSideGuide config={config} isEn={isEn} />
      </div>
    </div>
  );
}
