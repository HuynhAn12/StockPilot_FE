import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Database, Activity, AlertTriangle, Cpu } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { apiGetAdminSystemHealth, formatVNDateTime } from '../../services/adminService';
import { apiErrorMessage, formatRelativeTime } from './adminLabels';
import { adminStyles } from './adminStyles';

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

function Tile({ icon: Icon, label, value, detail, tone = 'normal' }) {
  const valueColor = tone === 'danger' ? 'text-[#DC2626]' : tone === 'warning' ? 'text-[#D97706]' : 'text-[#334155]';
  return (
    <div className={`${adminStyles.card} p-4`}>
      <div className="flex items-center justify-between text-[13px] text-[#64748B]">
        {label}
        <Icon className="w-4 h-4 text-[#94A3B8]" />
      </div>
      <div className={`mt-1.5 text-[22px] font-semibold tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-[12px] text-[#64748B] mt-0.5">{detail}</div>
    </div>
  );
}

export function AdminHealthPanel() {
  const { toast } = useToast();
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading && !health) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!health) return null;

  const { database, http, process: proc } = health;
  const errorPercent = (http.errorRate * 100).toFixed(1);
  const errorTone = http.serverErrors === 0 ? 'normal' : http.errorRate > 0.05 ? 'danger' : 'warning';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#64748B]">
        <span>
          Kiểm tra lúc {formatVNDateTime(health.checkedAt)}. Số liệu request tính từ {formatVNDateTime(http.since)} trên máy chủ này,
          được đặt lại khi máy chủ khởi động lại.
        </span>
        <button type="button" onClick={fetchHealth} disabled={isLoading} className={adminStyles.btnSecondary}>
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Kiểm tra lại
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Tile
          icon={Database}
          label="Cơ sở dữ liệu"
          value={database.status === 'UP' ? 'Kết nối tốt' : 'Mất kết nối'}
          detail={database.status === 'UP' ? database.latencyMs < 1 ? 'Phản hồi dưới 1 ms' : `Phản hồi trong ${database.latencyMs} ms` : 'Kiểm tra máy chủ MySQL ngay'}
          tone={database.status === 'UP' ? 'normal' : 'danger'}
        />
        <Tile
          icon={Activity}
          label="Request 24 giờ"
          value={http.requests.toLocaleString('vi-VN')}
          detail={`Thời gian xử lý trung bình ${http.avgLatencyMs} ms`}
        />
        <Tile
          icon={AlertTriangle}
          label="Lỗi máy chủ (5xx)"
          value={http.serverErrors.toLocaleString('vi-VN')}
          detail={http.requests > 0 ? `${errorPercent}% tổng số request` : 'Chưa có request'}
          tone={errorTone}
        />
        <Tile
          icon={Cpu}
          label="Máy chủ API"
          value={formatUptime(proc.uptimeSeconds)}
          detail={`Đã chạy liên tục · RAM ${proc.memoryRssMb} MB · Node ${proc.nodeVersion}`}
        />
      </div>

      <section className={adminStyles.tableContainer}>
        <div className={adminStyles.cardHeader}>
          <h2 className={adminStyles.cardTitle}>Lỗi máy chủ gần đây</h2>
          <span className="text-[12px] text-[#64748B]">Tối đa 20 lỗi trong 24 giờ</span>
        </div>
        {http.recentServerErrors.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[#64748B]">Không có lỗi máy chủ nào trong 24 giờ qua.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th className={adminStyles.th}>Thời gian</th>
                  <th className={adminStyles.th}>Request</th>
                  <th className={adminStyles.th}>Mã lỗi</th>
                  <th className={adminStyles.th}>Mã tra cứu log</th>
                </tr>
              </thead>
              <tbody>
                {http.recentServerErrors.map((e, i) => (
                  <tr key={`${e.at}-${i}`} className={adminStyles.tr}>
                    <td className={adminStyles.td} title={formatVNDateTime(e.at)}>
                      {formatRelativeTime(e.at) || formatVNDateTime(e.at)}
                    </td>
                    <td className={`${adminStyles.td} font-mono text-[12px]`}>
                      {e.method} {e.path}
                    </td>
                    <td className={`${adminStyles.td} text-[#DC2626]`}>{e.statusCode}</td>
                    <td className={`${adminStyles.td} font-mono text-[12px] text-[#64748B]`}>{e.requestId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminHealthPanel;
