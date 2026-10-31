import { Sparkles, ListChecks } from 'lucide-react';

/**
 * Shows where an assistant answer came from: the language model ("AI") or the
 * rule-based fallback ("Luật"). Numbers always come from the Decision Engine either way.
 */
export function AISourceBadge({ source, isEn, className = '' }) {
  if (!source) return null;
  const isAi = source === 'AI';
  const Icon = isAi ? Sparkles : ListChecks;
  const label = isAi ? 'AI' : isEn ? 'Rules' : 'Luật';
  const title = isAi
    ? isEn
      ? 'Written by the AI model from Decision Engine data'
      : 'Do mô hình AI viết dựa trên số liệu của Decision Engine'
    : isEn
      ? 'Rule-based answer (AI is off or unavailable)'
      : 'Câu trả lời theo luật (AI đang tắt hoặc chưa phản hồi)';

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
