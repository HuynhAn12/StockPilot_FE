import { Sparkles, ListChecks } from 'lucide-react';

const FALLBACK_HINT = {
  QUOTA: { vi: 'Tài khoản AI đã hết credit/hạn mức', en: 'The AI account has no credits or quota left' },
  TIMEOUT: { vi: 'AI phản hồi quá lâu', en: 'The AI took too long to respond' },
  HTTP: { vi: 'Không gọi được AI', en: 'The AI service could not be reached' },
  INVALID_RESPONSE: { vi: 'AI trả về dữ liệu không hợp lệ', en: 'The AI returned an invalid response' },
  DISABLED: { vi: 'AI chưa được bật', en: 'AI is not configured' },
};

/**
 * Shows where an assistant answer came from: the language model ("AI") or the
 * rule-based fallback ("Luật"). Numbers always come from the Decision Engine either way.
 */
export function AISourceBadge({ source, fallbackReason, isEn, className = '' }) {
  if (!source) return null;
  const isAi = source === 'AI';
  const Icon = isAi ? Sparkles : ListChecks;
  const label = isAi ? 'AI' : isEn ? 'Rules' : 'Luật';
  const hint = FALLBACK_HINT[fallbackReason]?.[isEn ? 'en' : 'vi'];
  const title = isAi
    ? isEn
      ? 'Written by the AI model from Decision Engine data'
      : 'Do mô hình AI viết dựa trên số liệu của Decision Engine'
    : isEn
      ? `Rule-based answer${hint ? `: ${hint}` : ' (AI is off or unavailable)'}`
      : `Câu trả lời theo luật${hint ? `: ${hint}` : ' (AI đang tắt hoặc chưa phản hồi)'}`;

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-semibold ${
        isAi ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600'
      } ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
