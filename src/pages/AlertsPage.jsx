import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, XCircle, Info,
  ArrowRight, Search, Filter, RefreshCw, Bot, ExternalLink,
  ChevronRight, Sparkles, TrendingDown, Package, Clock, Eye,
  Check, X, FileText, ArrowUpRight, BarChart2, ShieldCheck
} from 'lucide-react';
import { useAlertsStore } from '../components/store/alertsStore';
import { useToast } from '../components/common/Toast';

export function AlertsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { alerts, acknowledgeAlert, resolveAlert, dismissAlert, resetAlerts, fetchAlerts } = useAlertsStore();

  useEffect(() => { fetchAlerts(); }, []);

  const [activeTab, setActiveTab] = useState('open'); // open | acknowledged | all
  const [selectedType, setSelectedType] = useState('ALL'); // ALL | STOCKOUT | OVERSTOCK | SLOW_MOVING | SALES_DECLINE
  const [selectedSeverity, setSelectedSeverity] = useState('ALL'); // ALL | critical | warning | info
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalAlert, setActiveModalAlert] = useState(null);

  // Statistics
  const openAlerts = useMemo(() => alerts.filter((a) => a.status === 'open'), [alerts]);
  const criticalCount = useMemo(() => alerts.filter((a) => a.status === 'open' && a.severity === 'critical').length, [alerts]);
  const warningCount = useMemo(() => alerts.filter((a) => a.status === 'open' && a.severity === 'warning').length, [alerts]);
  const acknowledgedCount = useMemo(() => alerts.filter((a) => a.status === 'acknowledged').length, [alerts]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Tab filter
      if (activeTab === 'open' && alert.status !== 'open') return false;
      if (activeTab === 'acknowledged' && alert.status !== 'acknowledged') return false;
      // Type filter
      if (selectedType !== 'ALL' && alert.type !== selectedType) return false;
      // Severity filter
      if (selectedSeverity !== 'ALL' && alert.severity !== selectedSeverity) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          alert.productName.toLowerCase().includes(q) ||
          alert.sku.toLowerCase().includes(q) ||
          alert.category.toLowerCase().includes(q) ||
          alert.typeLabel.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, activeTab, selectedType, selectedSeverity, searchQuery]);

  const handleAcknowledge = (id, e) => {
    e?.stopPropagation();
    acknowledgeAlert(id);
    toast({ title: 'Đã tiếp nhận cảnh báo', description: 'Đã chuyển cảnh báo vào danh sách đang theo dõi.', type: 'info' });
  };

  const handleResolve = (id, e) => {
    e?.stopPropagation();
    resolveAlert(id);
    toast({ title: 'Đã xử lý xong', description: 'Cảnh báo đã được đóng thành công.', type: 'success' });
  };

  const handleDismiss = (id, e) => {
    e?.stopPropagation();
    dismissAlert(id, 'Người dùng đã bỏ qua');
    toast({ title: 'Đã bỏ qua cảnh báo', description: 'Cảnh báo đã được lưu trữ vào lịch sử.', type: 'info' });
  };

  const handleAskAI = (alert) => {
    navigate('/ai-assistant', {
      state: {
        presetQuery: `Phân tích giúp tôi cảnh báo rủi ro ${alert.typeLabel} của sản phẩm "${alert.productName}" (Mã: ${alert.sku}). Tồn kho hiện tại: ${alert.currentStock}, DOI: ${alert.doi} ngày. Tôi nên làm gì?`
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Cảnh báo rủi ro tồn kho (Stock Alerts)
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
              Live Engine v2.4
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Phát hiện sớm nguy cơ hết hàng, thừa hàng, ứ đọng và biến động bất thường từ hệ thống cảnh báo thông minh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetAlerts();
              toast({ title: 'Đã làm mới dữ liệu', description: 'Toàn bộ 12 cảnh báo thông minh đã được đồng bộ.', type: 'success' });
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới Engine
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Critical */}
        <div className="bg-card p-4 rounded-xl border border-red-200/60 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Mức nghiêm trọng (Critical)</p>
              <h3 className="text-2xl font-bold text-red-600">{criticalCount}</h3>
            </div>
          </div>
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Cần xử lý ngay</span>
        </div>

        {/* Warning */}
        <div className="bg-card p-4 rounded-xl border border-amber-200/60 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Mức cảnh báo (Warning)</p>
              <h3 className="text-2xl font-bold text-amber-600">{warningCount}</h3>
            </div>
          </div>
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Cần theo dõi</span>
        </div>

        {/* Total */}
        <div className="bg-card p-4 rounded-xl border border-blue-200/60 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng số cảnh báo mở</p>
              <h3 className="text-2xl font-bold text-blue-600">{openAlerts.length}</h3>
            </div>
          </div>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Trên 12 SKU</span>
        </div>
      </div>

      {/* Main Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'open'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Chưa xử lý ({openAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('acknowledged')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'acknowledged'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Đã tiếp nhận ({acknowledgedCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Tất cả lịch sử ({alerts.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm sản phẩm, SKU, loại rủi ro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Secondary Quick Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground flex items-center gap-1 font-medium">
          <Filter className="w-3.5 h-3.5" /> Lọc rủi ro:
        </span>
        {[
          { key: 'ALL', label: 'Tất cả loại' },
          { key: 'STOCKOUT', label: 'Hết hàng (Stockout)' },
          { key: 'OVERSTOCK', label: 'Tồn quá nhiều (Overstock)' },
          { key: 'SLOW_MOVING', label: 'Bán chậm (Slow-moving)' },
          { key: 'SALES_DECLINE', label: 'Giảm doanh số' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSelectedType(t.key)}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              selectedType === t.key
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}

        <div className="h-4 w-[1px] bg-border mx-1" />

        {[
          { key: 'ALL', label: 'Tất cả mức độ' },
          { key: 'critical', label: '🔴 Nghiêm trọng' },
          { key: 'warning', label: '🟡 Cảnh báo' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSelectedSeverity(s.key)}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              selectedSeverity === s.key
                ? 'bg-slate-100 border-slate-400 text-foreground font-semibold'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Kho hàng an toàn</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Không tìm thấy cảnh báo nào phù hợp với bộ lọc hiện tại. Tất cả sản phẩm đang ở mức tồn kho và tốc độ bán ổn định.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                onClick={() => setActiveModalAlert(alert)}
                className={`bg-card rounded-xl border p-4.5 transition-all hover:shadow-md cursor-pointer ${
                  isCritical
                    ? 'border-red-200 hover:border-red-300 bg-gradient-to-r from-red-50/20 to-transparent'
                    : isWarning
                    ? 'border-amber-200 hover:border-amber-300 bg-gradient-to-r from-amber-50/20 to-transparent'
                    : 'border-border hover:border-blue-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Product & Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Severity Badge */}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-red-100 text-red-700'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isCritical ? 'Mức nghiêm trọng' : isWarning ? 'Mức cảnh báo' : 'Thông tin'}
                      </span>

                      {/* Type Badge */}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                        {alert.typeLabel}
                      </span>

                      <span className="text-xs text-muted-foreground">Mã: {alert.sku}</span>
                      <span className="text-xs text-muted-foreground">• {alert.category}</span>
                    </div>

                    <h4 className="text-base font-bold text-foreground hover:text-blue-600 transition-colors">
                      {alert.productName}
                    </h4>

                    {/* Recommendation Snippet */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{alert.recommendedAction}</span>
                    </p>
                  </div>

                  {/* Middle: Metrics */}
                  <div className="flex items-center gap-6 text-xs shrink-0 py-2 lg:py-0 border-y lg:border-y-0 border-border">
                    <div>
                      <span className="text-muted-foreground block">Tồn hiện tại</span>
                      <span className="font-bold text-sm text-foreground">
                        {alert.currentStock} sp
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">DOI (Ngày bán)</span>
                      <span className={`font-bold text-sm ${alert.doi <= 3 ? 'text-red-600' : 'text-foreground'}`}>
                        {alert.doi} ngày
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground block">Tốc độ bán</span>
                      <span className="font-bold text-sm text-foreground">
                        {alert.salesVelocity} sp/ngày
                      </span>
                    </div>

                    {/* Risk Score Progress Bar */}
                    <div className="w-24">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-muted-foreground text-[11px]">Điểm rủi ro</span>
                        <span className="font-bold text-xs">{alert.riskScore}/100</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            alert.riskScore > 80 ? 'bg-red-500' : alert.riskScore > 60 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${alert.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalAlert(alert);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem vì sao?
                    </button>

                    {alert.status === 'open' && (
                      <button
                        onClick={(e) => handleAcknowledge(alert.id, e)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        Tiếp nhận
                      </button>
                    )}

                    <button
                      onClick={(e) => handleResolve(alert.id, e)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Đã xử lý
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Drawer: "Vì sao?" (Decision Factors Explanation) */}
      {activeModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  activeModalAlert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Giải thích nguyên nhân rủi ro (Decision Factors)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Thuật toán Decision Engine v2.4 • Độ tin cậy: {activeModalAlert.confidence}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveModalAlert(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Product Card */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    {activeModalAlert.typeLabel}
                  </span>
                  <h4 className="text-base font-bold text-foreground mt-0.5">
                    {activeModalAlert.productName}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mã SKU: <span className="font-semibold text-foreground">{activeModalAlert.sku}</span> • Danh mục: {activeModalAlert.category}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Tồn kho</span>
                    <span className="text-base font-bold text-foreground">{activeModalAlert.currentStock} sp</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Ngưỡng an toàn</span>
                    <span className="text-base font-bold text-foreground">{activeModalAlert.reorderPoint} sp</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Điểm rủi ro</span>
                    <span className="text-base font-bold text-red-600">{activeModalAlert.riskScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Factors Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Các yếu tố định lượng tác động (Contributing Factors)
                </h4>
                <div className="space-y-2">
                  {activeModalAlert.factors.map((factor, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border bg-card flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{factor.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            factor.impact === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {factor.impact.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{factor.desc}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-foreground block">{factor.value}</span>
                        <span className="text-[11px] text-muted-foreground">Chuẩn: {factor.threshold}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-900 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold text-sm">Hành động khuyến nghị từ hệ thống:</span>
                </div>
                <p className="text-xs leading-relaxed text-blue-800">
                  {activeModalAlert.recommendedAction}
                </p>
                <p className="text-[11px] text-blue-600 italic">
                  * Đây là gợi ý hỗ trợ ra quyết định từ dữ liệu bán hàng thực tế, không đảm bảo dự đoán tuyệt đối.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleAskAI(activeModalAlert)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors flex items-center gap-1.5"
              >
                <Bot className="w-4 h-4" />
                Hỏi trợ lý AI Pilot về cảnh báo này
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleResolve(activeModalAlert.id);
                    setActiveModalAlert(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Xác nhận đã xử lý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
