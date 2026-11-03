import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Webhook } from 'lucide-react';
import { useToast } from '../common/Toast';

async function copyText(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(el);
  if (!ok) throw new Error('copy failed');
}

export function PayOSWebhookCard({ webhookUrl, isPublicDomain, isEn }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = async () => {
    if (!webhookUrl) return;
    try {
      await copyText(webhookUrl);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: isEn ? 'Could not copy' : 'Không sao chép được',
        description: isEn ? 'Select the URL and copy it manually.' : 'Hãy bôi đen đường dẫn và sao chép thủ công.',
        type: 'error',
      });
    }
  };

  const copyLabel = copied ? (isEn ? 'Copied!' : 'Đã sao chép!') : (isEn ? 'Copy URL' : 'Sao chép URL');

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]" aria-labelledby="payos-webhook-title">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 id="payos-webhook-title" className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Webhook className="size-4 text-slate-500" aria-hidden /> Webhook URL
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">{isEn ? 'Required' : 'Bắt buộc'}</span>
          </h3>
          <p className="text-sm text-slate-500">
            {isEn
              ? 'PayOS calls this address (IPN) the moment a customer pays, so the POS order completes and stock is deducted automatically.'
              : 'PayOS gọi địa chỉ này (IPN) ngay khi khách chuyển khoản, để đơn POS tự hoàn tất và trừ kho.'}
          </p>
        </div>
      </div>

      {webhookUrl ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="min-w-0 flex-1 select-all break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs leading-5 text-slate-800">
            {webhookUrl}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            title={isEn ? 'Copy the Webhook URL to paste into PayOS' : 'Sao chép Webhook URL để dán vào PayOS'}
            aria-live="polite"
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${copied ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copyLabel}
          </button>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          {isEn ? 'The server did not return a Webhook URL. Reload the page or contact support.' : 'Máy chủ chưa trả về Webhook URL. Hãy tải lại trang hoặc liên hệ hỗ trợ.'}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        {isEn ? 'Paste it in PayOS → Payment Channels → your channel → Webhook URL. Return/Cancel URLs are not needed: StockPilot shows the QR directly on the POS.' : 'Dán vào PayOS → Kênh thanh toán → kênh của bạn → Webhook URL. Không cần Return/Cancel URL vì StockPilot hiển thị mã QR ngay trên POS.'}
      </p>

      {!isPublicDomain && (
        <div role="note" className="mt-3 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <p>
            <span className="font-semibold">{isEn ? 'Local address detected. ' : 'Đang chạy ở địa chỉ cục bộ. '}</span>
            {isEn
              ? 'PayOS cannot reach localhost. Expose the backend with a public HTTPS tunnel (ngrok, Cloudflare Tunnel) and use that URL instead.'
              : 'PayOS không gọi được tới localhost. Hãy mở backend ra ngoài qua tunnel HTTPS công khai (ngrok, Cloudflare Tunnel) và dùng đường dẫn đó.'}
          </p>
        </div>
      )}
    </section>
  );
}
