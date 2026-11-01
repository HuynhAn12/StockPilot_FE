import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb, RefreshCw, Loader2, CheckCircle2, XCircle, BellRing, PackagePlus,
  ArrowUpRight, X, AlertTriangle,
} from 'lucide-react';
import { apiAcceptPricingRecommendation, apiRejectPricingRecommendation } from '../../services/analyticsService';
import { assistantKeys, useAssistantScope, useAssistantSuggestions } from '../../features/assistant/queries';
import { apiAcknowledgeAlert } from '../../services/inventoryService';
import { useToast } from '../common/Toast';
import { AISourceBadge } from './AISourceBadge';

const PRIORITY_STYLE = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-slate-50 text-slate-600 border-slate-200',
};

const PRIORITY_LABEL = {
  HIGH: { vi: 'Cao', en: 'High' },
  MEDIUM: { vi: 'Vừa', en: 'Medium' },
  LOW: { vi: 'Thấp', en: 'Low' },
};

function kindConfig(kind, isEn) {
  switch (kind) {
    case 'APPROVE_PRICE':
      return {
        icon: CheckCircle2,
        action: isEn ? 'Approve price' : 'Duyệt giá',
        confirm: isEn ? 'The selling price will be updated to the recommended price.' : 'Giá bán sẽ được cập nhật theo mức đề xuất.',
        run: apiAcceptPricingRecommendation,
        done: isEn ? 'Price approved' : 'Đã duyệt giá',
      };
    case 'REJECT_PRICE':
      return {
        icon: XCircle,
        action: isEn ? 'Reject' : 'Từ chối',
        confirm: isEn ? 'The recommendation will be closed; the price stays the same.' : 'Đề xuất sẽ bị đóng, giá bán giữ nguyên.',
        run: apiRejectPricingRecommendation,
        done: isEn ? 'Recommendation rejected' : 'Đã từ chối đề xuất',
      };
    case 'ACK_ALERT':
      return {
        icon: BellRing,
        action: isEn ? 'Acknowledge' : 'Xác nhận đã xem',
        confirm: isEn ? 'The alert will be marked as acknowledged.' : 'Cảnh báo sẽ chuyển sang trạng thái đã xác nhận.',
        run: apiAcknowledgeAlert,
        done: isEn ? 'Alert acknowledged' : 'Đã xác nhận cảnh báo',
      };
    default:
      // REORDER never writes anything: it only opens the inventory page.
      return { icon: PackagePlus, action: isEn ? 'Open inventory' : 'Mở trang tồn kho', path: '/inventory' };
  }
}

const errorMessage = (err, fallback) => err?.response?.data?.error?.message || err?.message || fallback;

/**
 * Approval-based action suggestions. The assistant only proposes; every write goes through the
 * existing business endpoint (pricing accept/reject, alert acknowledge) with its own permission checks.
 */
export function AISuggestionsPanel({ isEn, onClose }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId, storeId } = useAssistantScope();
  // Cache TanStack Query: quay lại trang hiện ngay gợi ý đã có, làm mới ở nền khi dữ liệu cũ hơn 60 giây.
  const suggestionsQuery = useAssistantSuggestions();
  const [confirmKey, setConfirmKey] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [doneKeys, setDoneKeys] = useState({});

  const status = suggestionsQuery.isPending ? 'loading' : suggestionsQuery.isError ? 'error' : 'ready';
  const loadError = suggestionsQuery.isError
    ? errorMessage(suggestionsQuery.error, isEn ? 'Could not load suggestions' : 'Không tải được gợi ý')
    : null;

  const load = () => {
    setConfirmKey(null);
    setDoneKeys({});
    suggestionsQuery.refetch();
  };

  const runAction = async (suggestion, key) => {
    const config = kindConfig(suggestion.kind, isEn);
    setBusyKey(key);
    try {
      await config.run(suggestion.targetId);
      setDoneKeys((prev) => ({ ...prev, [key]: config.done }));
      queryClient.invalidateQueries({ queryKey: assistantKeys.suggestions(userId, storeId), refetchType: 'none' });
      toast({ type: 'success', title: config.done, message: suggestion.title });
    } catch (err) {
      toast({ type: 'error', title: isEn ? 'Action failed' : 'Không thực hiện được', message: errorMessage(err, '') });
    } finally {
      setBusyKey(null);
      setConfirmKey(null);
    }
  };

  const suggestions = suggestionsQuery.data?.suggestions || [];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
          <h3 className="truncate text-sm font-semibold text-slate-900">{isEn ? 'Suggested actions' : 'Gợi ý hành động'}</h3>
          {status === 'ready' && <AISourceBadge source={suggestionsQuery.data?.source} isEn={isEn} />}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={load}
            disabled={suggestionsQuery.isFetching}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
            title={isEn ? 'Refresh suggestions' : 'Làm mới gợi ý'}
          >
            <RefreshCw className={`h-4 w-4 ${suggestionsQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              title={isEn ? 'Close' : 'Đóng'}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="border-b border-slate-100 px-4 py-2 text-[11px] leading-snug text-slate-500">
        {isEn
          ? 'Suggestions are only proposals. Nothing changes until you confirm.'
          : 'Đây chỉ là đề xuất. Không có gì thay đổi cho tới khi bạn xác nhận.'}
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {status === 'loading' && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              {isEn ? 'Could not load suggestions' : 'Không tải được gợi ý'}
            </div>
            <p className="mt-1">{loadError}</p>
            <button type="button" onClick={load} className="mt-2 font-semibold underline cursor-pointer">
              {isEn ? 'Try again' : 'Thử lại'}
            </button>
          </div>
        )}

        {status === 'ready' && suggestions.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium text-slate-900">{isEn ? 'Nothing needs attention' : 'Chưa có việc cần xử lý'}</p>
            <p className="mt-1 text-xs text-slate-500">
              {isEn ? 'No open alerts or pending price recommendations.' : 'Không có cảnh báo mở hay đề xuất giá đang chờ duyệt.'}
            </p>
          </div>
        )}

        {status === 'ready' &&
          suggestions.map((suggestion) => {
            const key = `${suggestion.kind}:${suggestion.targetId}`;
            const config = kindConfig(suggestion.kind, isEn);
            const Icon = config.icon;
            const done = doneKeys[key];
            const busy = busyKey === key;

            return (
              <div key={key} className={`rounded-xl border border-slate-200 p-3 ${done ? 'bg-slate-50 opacity-70' : 'bg-white'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold leading-snug text-slate-900">{suggestion.title}</p>
                  <span className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-semibold ${PRIORITY_STYLE[suggestion.priority] || PRIORITY_STYLE.LOW}`}>
                    {PRIORITY_LABEL[suggestion.priority]?.[isEn ? 'en' : 'vi'] || suggestion.priority}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">{suggestion.reason}</p>

                <div className="mt-2.5">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {done}
                    </span>
                  ) : config.path ? (
                    <button
                      type="button"
                      onClick={() => navigate(config.path)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {config.action}
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  ) : confirmKey === key ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                      <p className="text-[11px] text-amber-800">{config.confirm}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => runAction(suggestion, key)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                        >
                          {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                          {isEn ? 'Confirm' : 'Xác nhận'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmKey(null)}
                          disabled={busy}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          {isEn ? 'Cancel' : 'Hủy'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmKey(key)}
                      disabled={busyKey !== null}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {config.action}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
