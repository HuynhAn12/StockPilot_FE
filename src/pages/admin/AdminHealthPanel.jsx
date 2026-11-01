import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Database,
  Activity,
  AlertTriangle,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { apiGetAdminSystemHealth, formatVNDateTime } from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from './adminLabels';
import { adminStyles as ui } from './adminStyles';
import { StatCard, TableCard, Th, Td } from './components/AdminUI';
import { currentAdminLang, useAdminText } from './useAdminText';

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return '–';
  const en = currentAdminLang() === 'en';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return en ? `${days} d ${hours} h` : `${days} ngày ${hours} giờ`;
  if (hours > 0) return en ? `${hours} h ${minutes} min` : `${hours} giờ ${minutes} phút`;
  return en ? `${minutes} min` : `${minutes} phút`;
}

export function AdminHealthPanel() {
  const { t, isEn } = useAdminText();
  const { toast } = useToast();
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      setHealth(await apiGetAdminSystemHealth());
    } catch (err) {
      toast({ type: 'error', title: t('Không kiểm tra được sức khỏe hệ thống', 'Could not check system health'), description: apiErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const copyRequestId = (reqId) => {
    if (!reqId) return;
    navigator.clipboard.writeText(reqId);
    setCopiedId(reqId);
    toast({ type: 'success', title: t('Đã sao chép Request ID', 'Request ID copied') });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading && !health) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!health) return null;

  const { database, http, process: proc } = health;
  const errorPercent = ((http.errorRate || 0) * 100).toFixed(1);
  const isDbUp = database.status === 'UP';
  const isHighError = (http.serverErrors || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Thanh trạng thái kiểm tra */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-[13px] text-slate-500 ">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            {t('Kiểm tra lúc', 'Checked at')} <strong className="font-medium text-slate-900 tabular-nums">{formatVNDateTime(health.checkedAt)}</strong>.{' '}
            {t('Dữ liệu request tính từ', 'Request data since')}{' '}
            <strong className="font-medium text-slate-900 tabular-nums">{formatVNDateTime(http.since)}</strong>.
          </span>
        </div>
        <button
          type="button"
          onClick={fetchHealth}
          disabled={isLoading}
          className={`${ui.btnSecondary} h-8 self-start sm:self-auto`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {t('Kiểm tra lại', 'Check again')}
        </button>
      </div>

      {/* 4 Thẻ Sức Khỏe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('Cơ sở dữ liệu MySQL', 'MySQL database')}
          value={isDbUp ? t('Kết nối tốt', 'Connected') : t('Mất kết nối', 'Disconnected')}
          subtitle={
            isDbUp
              ? database.latencyMs < 1
                ? t('Độ trễ phản hồi < 1 ms', 'Response latency < 1 ms')
                : t(`Độ trễ phản hồi ${database.latencyMs} ms`, `Response latency ${database.latencyMs} ms`)
              : t('Kiểm tra máy chủ MySQL ngay', 'Check the MySQL server now')
          }
          icon={Database}
          iconBg={isDbUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
          alert={!isDbUp}
        />
        <StatCard
          title={t('Lưu lượng HTTP 24h', 'HTTP traffic (24h)')}
          value={(http.requests ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
          subtitle={t(`Thời gian xử lý TB ${http.avgLatencyMs ?? 0} ms`, `Avg handling time ${http.avgLatencyMs ?? 0} ms`)}
          icon={Activity}
          iconBg="bg-slate-100 text-slate-600"
        />
        <StatCard
          title={t('Lỗi máy chủ (5xx)', 'Server errors (5xx)')}
          value={(http.serverErrors ?? 0).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
          subtitle={http.requests > 0 ? t(`${errorPercent}% trên tổng request`, `${errorPercent}% of all requests`) : t('Chưa có lỗi nào', 'No errors yet')}
          icon={AlertTriangle}
          iconBg={isHighError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
          alert={isHighError}
        />
        <StatCard
          title={t('Thời gian máy chủ chạy', 'Server uptime')}
          value={formatUptime(proc.uptimeSeconds)}
          subtitle={`RAM: ${proc.memoryRssMb} MB · Node ${proc.nodeVersion}`}
          icon={Cpu}
          iconBg="bg-slate-100 text-slate-600"
        />
      </div>

      {/* Bảng lỗi máy chủ gần đây */}
      <TableCard
        header={
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">{t('Lỗi máy chủ gần đây (Mã lỗi 5xx)', 'Recent server errors (5xx)')}</h3>
            <p className="text-[12px] text-slate-500">{t('Tối đa 20 sự kiện lỗi được lưu trữ tạm thời trong bộ nhớ máy chủ', 'Up to 20 error events kept in server memory')}</p>
          </div>
        }
      >
        {http.recentServerErrors.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" aria-hidden="true" />
            <p className="font-semibold text-slate-900">{t('Không ghi nhận lỗi máy chủ nào', 'No server errors recorded')}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{t('Tất cả request trong 24 giờ qua đều được xử lý thành công.', 'Every request in the last 24 hours succeeded.')}</p>
          </div>
        ) : (
          <table className={`${ui.table} min-w-175`}>
            <thead>
              <tr>
                <Th>{t('Thời điểm', 'Time')}</Th>
                <Th>{t('Giao thức & Đường dẫn (API)', 'Method & path (API)')}</Th>
                <Th>{t('Mã lỗi HTTP', 'HTTP status')}</Th>
                <Th>{t('Mã tra cứu Request ID', 'Request ID')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {http.recentServerErrors.map((e, idx) => (
                <tr key={`${e.at}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                  <Td className="whitespace-nowrap font-medium text-slate-900" title={formatVNDateTime(e.at)}>
                    {formatRelativeTime(e.at) || formatVNDateTime(e.at)}
                  </Td>
                  <Td>
                    <span className="font-mono text-[12px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold mr-1.5">
                      {e.method}
                    </span>
                    <span className="font-mono text-[12px] text-slate-600">{e.path}</span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {e.statusCode}
                    </span>
                  </Td>
                  <Td>
                    {e.requestId ? (
                      <button
                        type="button"
                        onClick={() => copyRequestId(e.requestId)}
                        className="inline-flex items-center gap-1.5 font-mono text-[12px] text-blue-600 hover:underline cursor-pointer group"
                        title={t('Sao chép requestId', 'Copy request ID')}
                      >
                        {copiedId === e.requestId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                        )}
                        <span>{e.requestId}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}

export default AdminHealthPanel;
