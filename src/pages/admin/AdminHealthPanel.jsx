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
  Server,
  Clock,
  Layers,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { apiGetAdminSystemHealth, formatVNDateTime } from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from './adminLabels';
import { adminStyles as ui } from './adminStyles';
import { StatCard, TableCard, Th, Td, Badge } from './components/AdminUI';

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

export function AdminHealthPanel() {
  const { toast } = useToast();
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      setHealth(await apiGetAdminSystemHealth());
    } catch (err) {
      toast({ type: 'error', title: 'Không kiểm tra được sức khỏe hệ thống', description: apiErrorMessage(err) });
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
    toast({ type: 'success', title: 'Đã sao chép Request ID' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-[#E2E8F0] text-[13px] text-[#64748B] shadow-2xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            Kiểm tra lúc <strong className="text-[#0F172A]">{formatVNDateTime(health.checkedAt)}</strong>. Dữ liệu request tính từ{' '}
            <strong className="text-[#0F172A]">{formatVNDateTime(http.since)}</strong>.
          </span>
        </div>
        <button
          type="button"
          onClick={fetchHealth}
          disabled={isLoading}
          className={`${ui.btnSecondary} px-3 py-1.5 text-[12px] self-start sm:self-auto`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Kiểm tra lại
        </button>
      </div>

      {/* 4 Thẻ Sức Khỏe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cơ sở dữ liệu MySQL"
          value={isDbUp ? 'Kết nối tốt' : 'Mất kết nối'}
          subtitle={
            isDbUp
              ? database.latencyMs < 1
                ? 'Độ trễ phản hồi < 1 ms'
                : `Độ trễ phản hồi ${database.latencyMs} ms`
              : 'Kiểm tra máy chủ MySQL ngay'
          }
          icon={Database}
          iconBg={isDbUp ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}
          alert={!isDbUp}
        />
        <StatCard
          title="Lưu lượng HTTP 24h"
          value={(http.requests ?? 0).toLocaleString('vi-VN')}
          subtitle={`Thời gian xử lý TB ${http.avgLatencyMs ?? 0} ms`}
          icon={Activity}
          iconBg="bg-blue-50 text-[#2563EB] border-blue-100"
        />
        <StatCard
          title="Lỗi máy chủ (5xx)"
          value={(http.serverErrors ?? 0).toLocaleString('vi-VN')}
          subtitle={http.requests > 0 ? `${errorPercent}% trên tổng request` : 'Chưa có lỗi nào'}
          icon={AlertTriangle}
          iconBg={isHighError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
          alert={isHighError}
        />
        <StatCard
          title="Thời gian máy chủ chạy"
          value={formatUptime(proc.uptimeSeconds)}
          subtitle={`RAM: ${proc.memoryRssMb} MB · Node ${proc.nodeVersion}`}
          icon={Cpu}
          iconBg="bg-purple-50 text-purple-600 border-purple-100"
        />
      </div>

      {/* Bảng lỗi máy chủ gần đây */}
      <TableCard
        header={
          <div>
            <h3 className="text-[14px] font-bold text-[#0F172A]">Lỗi máy chủ gần đây (Mã lỗi 5xx)</h3>
            <p className="text-[12px] text-[#64748B]">Tối đa 20 sự kiện lỗi được lưu trữ tạm thời trong bộ nhớ máy chủ</p>
          </div>
        }
      >
        {http.recentServerErrors.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#64748B]">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-[#0F172A]">Không ghi nhận lỗi máy chủ nào</p>
            <p className="text-[12px] text-[#64748B] mt-0.5">Tất cả request trong 24 giờ qua đều được xử lý thành công.</p>
          </div>
        ) : (
          <table className="w-full min-w-175">
            <thead>
              <tr>
                <Th>Thời điểm</Th>
                <Th>Giao thức & Đường dẫn (API)</Th>
                <Th>Mã lỗi HTTP</Th>
                <Th>Mã tra cứu Request ID</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {http.recentServerErrors.map((e, idx) => (
                <tr key={`${e.at}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                  <Td className="whitespace-nowrap font-medium text-[#0F172A]" title={formatVNDateTime(e.at)}>
                    {formatRelativeTime(e.at) || formatVNDateTime(e.at)}
                  </Td>
                  <Td>
                    <span className="font-mono text-[12px] bg-slate-100 px-2 py-0.5 rounded text-[#334155] font-semibold mr-1.5">
                      {e.method}
                    </span>
                    <span className="font-mono text-[12px] text-[#475569]">{e.path}</span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {e.statusCode}
                    </span>
                  </Td>
                  <Td>
                    {e.requestId ? (
                      <button
                        type="button"
                        onClick={() => copyRequestId(e.requestId)}
                        className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[#2563EB] hover:underline cursor-pointer group"
                        title="Sao chép requestId"
                      >
                        {copiedId === e.requestId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB]" />
                        )}
                        <span>{e.requestId}</span>
                      </button>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
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
