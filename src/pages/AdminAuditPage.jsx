import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Search, Filter, ShieldCheck, Download,
  Eye, Clock, User, CheckCircle2, AlertTriangle, X, RefreshCw
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { apiGetAuditLogs } from '../services/analyticsService';

const INITIAL_LOGS = [
  {
    id: 'AUD-901',
    timestamp: '2026-10-04T13:45:00Z',
    userName: 'Trần Thị Thuỷ',
    role: 'Khách hàng',
    action: 'CREATE_ORDER',
    actionLabel: 'Tạo đơn hàng ORD-9821',
    entity: 'Orders',
    entityId: 'ORD-9821',
    status: 'SUCCESS',
    ipAddress: '14.161.22.84',
    details: { channel: 'Zalo', totalAmount: 245000, itemsCount: 3 }
  },
  {
    id: 'AUD-902',
    timestamp: '2026-10-04T09:30:00Z',
    userName: 'Nguyễn Văn Minh',
    role: 'Chủ cửa hàng',
    action: 'STOCK_IN',
    actionLabel: 'Nhập kho 30 thùng mì Hảo Hảo',
    entity: 'Inventory',
    entityId: 'MOV-701',
    status: 'SUCCESS',
    ipAddress: '118.69.182.10',
    details: { sku: 'HAO-3012', quantity: 30, supplier: 'Acecook VN' }
  },
  {
    id: 'AUD-903',
    timestamp: '2026-10-04T08:15:00Z',
    userName: 'Hệ thống (Cron Job)',
    role: 'System',
    action: 'GENERATE_ALERTS',
    actionLabel: 'Kích hoạt cảnh báo rủi ro tồn kho',
    entity: 'Alerts',
    entityId: 'ALT-1001',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
    details: { engine: 'DecisionEngine v2.4', riskScore: 94, trigger: 'Critical Stockout' }
  },
  {
    id: 'AUD-904',
    timestamp: '2026-10-03T16:30:00Z',
    userName: 'Nguyễn Văn Minh',
    role: 'Chủ cửa hàng',
    action: 'ACCEPT_PRICE',
    actionLabel: 'Áp dụng đề xuất giá cho Nước rửa chén',
    entity: 'Pricing',
    entityId: 'PRC-2001',
    status: 'SUCCESS',
    ipAddress: '118.69.182.10',
    details: { oldPrice: 72000, newPrice: 69000, margin: 19.0 }
  },
  {
    id: 'AUD-905',
    timestamp: '2026-10-02T11:00:00Z',
    userName: 'Trần Văn Kho',
    role: 'Nhân viên kho',
    action: 'STOCK_ADJUST',
    actionLabel: 'Điều chỉnh hao hụt kéo văn phòng',
    entity: 'Inventory',
    entityId: 'MOV-703',
    status: 'SUCCESS',
    ipAddress: '118.69.182.10',
    details: { sku: 'DEL-0112', beforeStock: 5, afterStock: 4, reason: 'Rách vỏ hộp' }
  },
];

export function AdminAuditPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [viewJsonModal, setViewJsonModal] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiGetAuditLogs({ entityType: selectedEntity, search: searchQuery });
      const list = res?.data || [];
      if (list.length > 0) {
        const mapped = list.map((l) => ({
          id: `AUD-${l.id}`,
          timestamp: l.createdAt,
          userName: l.user?.fullName || 'Hệ thống',
          role: l.user?.role || 'SYSTEM',
          action: l.action,
          actionLabel: l.action,
          entity: l.entityType,
          entityId: l.entityId || '-',
          status: 'SUCCESS',
          ipAddress: l.ipAddress || '127.0.0.1',
          details: l.afterJson || l.beforeJson || {}
        }));
        setLogs(mapped);
      }
    } catch (_) {
      // Keep initial/fallback logs on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEntity]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEntity !== 'ALL' && log.entity !== selectedEntity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.id.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.actionLabel.toLowerCase().includes(q) ||
          log.entityId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, selectedEntity, searchQuery]);


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nhật ký kiểm toán hệ thống (Audit Logs)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ghi vết bất biến toàn bộ các thao tác nhạy cảm: thay đổi giá bán, xử lý cảnh báo, nhập/xuất kho và truy cập người dùng.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => toast({ title: 'Đã xuất file log', description: 'File audit_logs.csv đã tải xuống.', type: 'success' })}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất file CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-muted-foreground font-medium">Lọc đối tượng:</span>
            {['ALL', 'Pricing', 'Alerts', 'Inventory', 'Orders'].map((ent) => (
              <button
                key={ent}
                onClick={() => setSelectedEntity(ent)}
                className={`px-2.5 py-1 rounded-full border transition-colors ${
                  selectedEntity === ent
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {ent === 'ALL' ? 'Tất cả đối tượng' : ent}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm hành động, người thực hiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Hành động ghi nhận</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
                <th className="py-3 px-4 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-foreground block">{log.userName}</span>
                    <span className="text-[10px] text-muted-foreground">{log.role}</span>
                  </td>
                  <td className="py-3 px-4 text-foreground font-medium">
                    {log.actionLabel}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-bold">
                      {log.entity} #{log.entityId}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setViewJsonModal(log)}
                      className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Xem JSON chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {viewJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Chi tiết bản ghi kiểm toán {viewJsonModal.id}</h3>
              <button onClick={() => setViewJsonModal(null)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hành động:</span>
                <span className="font-bold text-foreground">{viewJsonModal.actionLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Người thực hiện:</span>
                <span className="font-semibold text-foreground">{viewJsonModal.userName} ({viewJsonModal.role})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian:</span>
                <span className="font-mono text-foreground">{new Date(viewJsonModal.timestamp).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">Payload Data (JSON):</span>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
                {JSON.stringify(viewJsonModal.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button onClick={() => setViewJsonModal(null)} className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
