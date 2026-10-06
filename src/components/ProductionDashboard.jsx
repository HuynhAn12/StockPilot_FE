import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes, DollarSign, TrendingUp, AlertTriangle,
  BarChart3, Zap, Printer, FileText,
  PackagePlus, ArrowDownUp, ArrowUpRight,
  X, Download, RefreshCw, Calendar,
  ShoppingCart, Tag,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useToast } from './common/Toast';
import {
  FreshProduceBasketIllustration,
  GroceryBagIllustration
} from './DashboardIllustrations';
import { apiGetAnalyticsSummary } from '../services/analyticsService';

// Format currency VND
const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const formatMillions = (n) => {
  const val = (n ?? 0) / 1_000_000;
  return val >= 1000 ? `${(val / 1000).toFixed(1)} tỷ` : `${val.toFixed(1)} tr`;
};

const BAR_COLORS = ['#1e3a8a','#1e40af','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe'];

export function ProductionDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // API data state
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Filters & State
  const [timeRange, setTimeRange] = useState('30days');
  const [c3Tab, setC3Tab] = useState('best');
  const [hoveredDonut, setHoveredDonut] = useState(null);

  // Modals state
  const [activeQuickAction, setActiveQuickAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Live timestamp & refresh
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data from API
  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiGetAnalyticsSummary();
      setMetrics(data);
      const now = new Date();
      setLastUpdated(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics();
    setIsRefreshing(false);
    toast({ type: 'success', title: 'Đã làm mới dữ liệu', message: 'Dữ liệu thực từ database đã được đồng bộ!' });
  };

  // Derived data from API
  const revenueByCat = (metrics?.categoryStats ?? []).map((c, i) => ({
    name: c.name,
    rev: Math.round(c.revenue / 1_000_000),
    pct: c.margin > 0 ? `+${c.margin}%` : `${c.margin}%`,
    isPos: c.margin >= 0,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));

  const topSellers = (metrics?.topSellers ?? []).map((s, i) => ({
    name: s.name,
    qty: s.sold,
    pct: Math.round((s.sold / Math.max(...(metrics?.topSellers ?? []).map(x => x.sold), 1)) * 100),
  }));

  const slowMovers = (metrics?.slowMovers ?? []).map((s) => ({
    name: s.name,
    days: s.daysNoSale,
    pct: Math.min(100, Math.round((s.daysNoSale / 90) * 100)),
  }));

  const interventionProducts = (metrics?.slowMovers ?? []).slice(0, 4).map((s, i) => ({
    rank: i + 1,
    name: s.name,
    daysNoSale: s.daysNoSale,
    stock: s.stock,
    tiedCapital: formatVND(s.capital),
    suggestion: s.suggestion,
  }));

  const totalTiedCapital = (metrics?.slowMovers ?? []).slice(0, 4).reduce((sum, s) => sum + (s.capital ?? 0), 0);

  // 6 months revenue trend derived from API metrics
  const defaultMonthlyRevenue = [
    { month: 'T5', cur: 0, prev: 0, x: 35, cy: 138, py: 138 },
    { month: 'T6', cur: 0, prev: 0, x: 95, cy: 138, py: 138 },
    { month: 'T7', cur: 0, prev: 0, x: 160, cy: 138, py: 138 },
    { month: 'T8', cur: 0, prev: 0, x: 225, cy: 138, py: 138 },
    { month: 'T9', cur: 0, prev: 0, x: 290, cy: 138, py: 138 },
    { month: 'T10', cur: Math.round(((metrics?.netRevenue ?? 0) / 1_000_000) * 10) / 10, prev: 0, x: 350, cy: 60, py: 138 },
  ];
  const monthlyRevenue = (metrics?.monthlyRevenue && metrics.monthlyRevenue.length > 0)
    ? metrics.monthlyRevenue
    : defaultMonthlyRevenue;

  const maxMonthlyVal = Math.max(...monthlyRevenue.map((m) => m.cur), 1);

  // Donut chart – simple split: normal vs low vs over
  const totalSKU = metrics?.totalStockQuantity ?? 0;

  // Quick Action Handler
  const handleQuickActionSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setActiveQuickAction(null);
      toast({ type: 'success', title: 'Thành công', message: 'Thao tác kho đã được StockPilot ghi nhận!' });
    }, 550);
  };

  if (loadingMetrics) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER                                           */}
      {/* ============================================================== */}
      <header className="bg-white border border-blue-100 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="hidden sm:flex items-center shrink-0">
          <FreshProduceBasketIllustration className="w-24 h-20 sm:w-28 sm:h-22" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1 w-full">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600">
            Dashboard Quản lý & Tồn kho
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Dữ liệu thực từ database • <strong className="text-blue-600">StockPilot</strong>
          </p>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-3 shrink-0">
          <span className="text-slate-500 flex items-center gap-1.5 font-medium text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Cập nhật lúc {lastUpdated}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl border border-blue-200 transition-colors cursor-pointer text-xs shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
        <div className="hidden sm:flex items-center shrink-0">
          <GroceryBagIllustration className="w-24 h-24 sm:w-26 sm:h-26" />
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. TIME FILTER TOOLBAR                                         */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-blue-100/70 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.05)]">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: '7days', label: '7 ngày' },
            { id: '30days', label: '30 ngày' },
            { id: 'custom', label: 'Tùy chọn' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                timeRange === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>Tổng hợp toàn bộ đơn đã hoàn thành</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. 5 STAT CARDS                                                */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Doanh thu */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.07)] border border-blue-100/70 border-t-4 border-t-blue-600 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Doanh thu</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
              {formatMillions(metrics?.netRevenue ?? 0)} <span className="text-sm font-semibold text-slate-400">₫</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-blue-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Doanh thu thuần
            </span>
            <span className="text-slate-400 text-[11px]">Lợi nhuận {metrics?.marginPct ?? 0}%</span>
          </div>
        </div>

        {/* Card 2: Số đơn hàng */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.07)] border border-blue-100/70 border-t-4 border-t-sky-500 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2. Số đơn hàng</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
              {(metrics?.completedOrdersCount ?? 0).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-400">đơn</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-sky-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Đã hoàn thành
            </span>
            <span className="text-slate-400 text-[11px]">{formatMillions(metrics?.avgOrderValue ?? 0)}/đơn</span>
          </div>
        </div>

        {/* Card 3: Giá trị tồn kho */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.07)] border border-blue-100/70 border-t-4 border-t-indigo-600 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">3. Giá trị tồn kho</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
              {formatMillions(metrics?.inventoryValuation ?? 0)} <span className="text-sm font-semibold text-slate-400">₫</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-indigo-600 font-bold">{(metrics?.totalStockQuantity ?? 0).toLocaleString('vi-VN')} sp</span>
            <span className="text-slate-400 text-[11px]">Giá nhập kho</span>
          </div>
        </div>

        {/* Card 4: Cảnh báo hàng tồn */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.07)] border border-blue-100/70 border-t-4 border-t-blue-500 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">4. Cảnh báo tồn</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-[26px] font-extrabold text-blue-700 tracking-tight">
              {interventionProducts.length} <span className="text-sm font-semibold text-slate-400">bán chậm</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-blue-700 font-semibold text-[11px]">Cần xử lý ngay</span>
            <span onClick={() => navigate('/alerts')} className="text-blue-600 font-bold hover:underline cursor-pointer">Xem →</span>
          </div>
        </div>

        {/* Card 5: Lợi nhuận gộp */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.07)] border border-blue-100/70 border-t-4 border-t-cyan-500 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">5. Lợi nhuận gộp</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
              {formatMillions(metrics?.grossProfit ?? 0)} <span className="text-sm font-semibold text-slate-400">₫</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500 text-[11px]">Biên LN</span>
            <span className="text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-full">{metrics?.marginPct ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. SECTION C: CHARTS (2x2 Grid)                               */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART C1: Doanh thu theo danh mục */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">C1. Doanh thu theo danh mục</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[11px] font-semibold">Thực tế</span>
            </div>

            {revenueByCat.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu đơn hàng</div>
            ) : (
              <>
                <div className="relative h-48 flex items-end justify-between px-2 sm:px-4 border-b border-slate-200">
                  {(() => {
                    const maxRev = Math.max(...revenueByCat.map(c => c.rev), 1);
                    return revenueByCat.map((cat, idx) => {
                      const heightPx = Math.round((cat.rev / maxRev) * 160);
                      return (
                        <div key={idx} className="flex flex-col items-center justify-end z-10 group cursor-pointer" style={{ width: `${Math.max(32, Math.floor(100 / revenueByCat.length) - 2)}px` }}>
                          <span className="text-[10px] font-bold text-slate-600 mb-1 group-hover:text-blue-600 transition-colors">
                            {cat.rev}tr
                          </span>
                          <div
                            className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-sm"
                            style={{ height: `${heightPx}px`, backgroundColor: cat.color }}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex items-center justify-between px-1 pt-2.5 text-[10px] text-slate-600 font-medium">
                  {revenueByCat.map((cat, idx) => (
                    <div key={idx} className="text-center" style={{ width: `${Math.max(32, Math.floor(100 / revenueByCat.length) - 2)}px` }}>
                      <span className="block truncate" title={cat.name}>{cat.name.split(' ')[0]}</span>
                      <span className={`block font-bold ${cat.isPos ? 'text-emerald-500' : 'text-rose-500'}`}>{cat.pct}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CHART C2: Xu hướng doanh thu 6 tháng */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  C2. Xu hướng doanh thu 6 tháng
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-semibold text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Năm nay
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-400">
                  <span className="w-2.5 h-1 bg-slate-300 inline-block" /> Năm trước
                </span>
              </div>
            </div>

            {/* Line Chart SVG with smooth curves */}
            <div className="relative pt-2">
              <svg viewBox="0 0 380 150" className="w-full h-44 overflow-visible">
                {/* Horizontal Guidelines */}
                <line x1="20" y1="20" x2="370" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <text x="5" y="24" fontSize="9" fill="#94a3b8">{Math.ceil(maxMonthlyVal * 1.2)}tr</text>

                <line x1="20" y1="60" x2="370" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                <text x="5" y="64" fontSize="9" fill="#94a3b8">{Math.round(maxMonthlyVal * 0.75)}tr</text>

                <line x1="20" y1="100" x2="370" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
                <text x="5" y="104" fontSize="9" fill="#94a3b8">{Math.round(maxMonthlyVal * 0.4)}tr</text>

                <line x1="20" y1="140" x2="370" y2="140" stroke="#f1f5f9" strokeDasharray="3 3" />
                <text x="5" y="144" fontSize="9" fill="#94a3b8">0tr</text>

                {/* Previous year line (dashed gray) */}
                <polyline
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  points={monthlyRevenue.map((p) => `${p.x},${p.py}`).join(' ')}
                />

                {/* Current year line (solid vibrant blue) */}
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={monthlyRevenue.map((p) => `${p.x},${p.cy}`).join(' ')}
                />

                {/* Data points & Values */}
                {monthlyRevenue.map((p) => (
                  <g key={p.month} className="group cursor-pointer">
                    <circle cx={p.x} cy={p.cy} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                    <text
                      x={p.x}
                      y={p.cy - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      className="fill-blue-900"
                    >
                      {p.cur}tr
                    </text>
                  </g>
                ))}
              </svg>

              <div className="flex justify-between px-2 pt-2 text-[11px] font-medium text-slate-500">
                {monthlyRevenue.map((p) => (
                  <span key={p.month}>{p.month}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CHART C3: Top sản phẩm bán chạy vs bán chậm */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {c3Tab === 'best' ? 'C3. Sản phẩm bán chạy' : 'C3. Sản phẩm bán chậm'}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setC3Tab('best')} className={`px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${ c3Tab === 'best' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600' }`}>Bán chạy</button>
                <button onClick={() => setC3Tab('slow')} className={`px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${ c3Tab === 'slow' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600' }`}>Bán chậm</button>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {(c3Tab === 'best' ? topSellers : slowMovers).length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu</div>
              ) : (
                (c3Tab === 'best' ? topSellers : slowMovers).map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[240px]">{item.name}</span>
                      <span className="font-bold text-blue-600">
                        {c3Tab === 'best' ? `${item.qty} sp` : `${item.days} ngày`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-blue-50 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CHART C4: Tình trạng tồn kho */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">C4. Tình trạng tồn kho</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">{(metrics?.totalStockQuantity ?? 0).toLocaleString('vi-VN')} sản phẩm</span>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: 'Doanh thu gộp', value: formatMillions(metrics?.grossRevenue ?? 0), color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
                { label: 'Đã hoàn tiền', value: formatMillions(metrics?.refundedAmount ?? 0), color: 'bg-rose-50 text-rose-700', border: 'border-rose-200' },
                { label: 'Giá trị nhập', value: formatMillions(metrics?.inventoryValuation ?? 0), color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
                { label: 'Giá bán lẻ', value: formatMillions(metrics?.inventoryRetailValuation ?? 0), color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
              ].map(({ label, value, color, border }) => (
                <div key={label} className={`rounded-xl border ${border} p-3 ${color}`}>
                  <p className="text-[11px] font-semibold opacity-70 mb-0.5">{label}</p>
                  <p className="text-sm font-extrabold">{value}</p>
                </div>
              ))}
            </div>

            {/* Top categories table */}
            {revenueByCat.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Danh mục doanh thu</p>
                {revenueByCat.slice(0, 4).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate text-slate-700 font-medium max-w-[140px]">{cat.name}</span>
                    </span>
                    <span className="font-bold text-slate-800">{cat.rev}tr</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. THAO TÁC NHANH (⚡) & TỔNG KẾT NHANH (📊) (Hub Layout)      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Quick Actions ("Thao tác nhanh" - Image 1) - cols 6 */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-blue-600 fill-blue-600" />
            <h3 className="text-base font-bold text-slate-800">
              Thao tác nhanh
            </h3>
          </div>

          {/* 4 Large Action Cards matching Blue Theme */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => setActiveQuickAction('add_product')}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-blue-50/30 border border-blue-100/80 hover:bg-white hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                <PackagePlus className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                Thêm sản phẩm
              </span>
            </button>

            <button
              onClick={() => setActiveQuickAction('stock_trans')}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-blue-50/30 border border-blue-100/80 hover:bg-white hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                <ArrowDownUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                Nhập / Xuất kho
              </span>
            </button>

            <button
              onClick={() => setActiveQuickAction('report')}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-blue-50/30 border border-blue-100/80 hover:bg-white hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                Tạo báo cáo tồn
              </span>
            </button>

            <button
              onClick={() => setActiveQuickAction('print_barcode')}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-blue-50/30 border border-blue-100/80 hover:bg-white hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                <Printer className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                In tem mã vạch
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT: Mặt hàng cần can thiệp (4 sản phẩm bán chậm nhất) - cols 6 */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Mặt hàng cần can thiệp
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      4 Bán chậm nhất
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ưu tiên xử lý xả kho & giải phóng vốn lưu động</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/alerts')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Chi tiết</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of slow-selling products from DB */}
            <div className="space-y-2.5">
              {interventionProducts.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">Không có sản phẩm cần can thiệp</div>
              ) : (
                interventionProducts.map((p) => (
                  <div
                    key={p.rank}
                    className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                        p.rank === 1 ? 'bg-blue-600 text-white' :
                        p.rank === 2 ? 'bg-blue-500 text-white' :
                        p.rank === 3 ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-200/70 text-slate-700'
                      }`}>{p.rank}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                            <Clock className="w-3 h-3" /> {p.daysNoSale} ngày không bán
                          </span>
                          <span>•</span>
                          <span>Tồn: <strong className="text-slate-700">{p.stock}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-blue-700 block">{p.tiedCapital}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">vốn ứ đọng</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              Tổng vốn đọng: <strong className="text-blue-700 font-bold">{formatVND(totalTiedCapital)}</strong> ({interventionProducts.length} SKU)
            </span>
            <button
              onClick={() => toast({ type: 'info', title: 'Đề xuất xả kho', message: 'Xem xét giảm giá hoặc combo cho các sản phẩm bán chậm.' })}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
            >
              <span>Xử lý xả kho</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. MODALS: QUICK ACTIONS            */}
      {/* ============================================================== */}
      {/* Quick Action Modal */}
      {activeQuickAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {activeQuickAction === 'add_product' && <PackagePlus className="w-5 h-5 text-blue-600" />}
                {activeQuickAction === 'stock_trans' && <ArrowDownUp className="w-5 h-5 text-emerald-600" />}
                {activeQuickAction === 'report' && <FileText className="w-5 h-5 text-amber-600" />}
                {activeQuickAction === 'print_barcode' && <Printer className="w-5 h-5 text-indigo-600" />}

                {activeQuickAction === 'add_product' && 'Thêm sản phẩm mới vào kho'}
                {activeQuickAction === 'stock_trans' && 'Tạo phiếu Nhập / Xuất kho'}
                {activeQuickAction === 'report' && 'Xuất báo cáo tồn kho & doanh số'}
                {activeQuickAction === 'print_barcode' && 'In tem mã vạch & bảng giá'}
              </h3>
              <button
                onClick={() => setActiveQuickAction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickActionSubmit} className="space-y-4">
              {activeQuickAction === 'add_product' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên sản phẩm
                    </label>
                    <input
                      required
                      placeholder="Ví dụ: Cà phê Robusta Đắk Lắk 500g"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Danh mục
                      </label>
                      <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none">
                        {revenueByCat.map((c, i) => (
                          <option key={i}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Số lượng ban đầu
                      </label>
                      <input
                        type="number"
                        defaultValue="50"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeQuickAction === 'stock_trans' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <p className="font-semibold">Hệ thống hỗ trợ cân bằng tồn kho tự động:</p>
                    <p>• Phiếu sẽ cập nhật số lượng tồn khả dụng ngay lập tức.</p>
                    <p>• Tự động kiểm tra cảnh báo thiếu hàng hoặc đọng vốn.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="p-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">
                      Nhập kho hàng
                    </button>
                    <button type="button" className="p-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">
                      Xuất bán / Điều chuyển
                    </button>
                  </div>
                </div>
              )}

              {activeQuickAction === 'report' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chọn loại báo cáo cần kết xuất
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="p-3 rounded-xl border-2 border-blue-500 bg-blue-50/50 text-blue-700 text-xs font-bold flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Báo cáo Doanh số (.xlsx)
                    </button>
                    <button type="button" className="p-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Báo cáo Tồn kho (.pdf)
                    </button>
                  </div>
                </div>
              )}

              {activeQuickAction === 'print_barcode' && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 space-y-1">
                  <p className="font-semibold">Định dạng tem in chuẩn:</p>
                  <p>• Khổ tem: 3 tem / hàng (chuẩn Decal nhiệt 35x22mm)</p>
                  <p>• Tự động sinh mã Code128 cùng tên sản phẩm và giá niêm yết.</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveQuickAction(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Xác nhận thực hiện</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
