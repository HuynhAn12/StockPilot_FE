import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes, DollarSign, TrendingUp, AlertTriangle,
  BarChart3, Zap, Printer, FileText,
  PackagePlus, ArrowDownUp, ArrowUpRight,
  X, Download, RefreshCw,
  ShoppingCart, Tag,
  ChevronRight,
  Clock,
  Calendar, ChevronLeft, ChevronDown,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import {
  FreshProduceBasketIllustration,
  GroceryBagIllustration
} from '../../components/DashboardIllustrations';
import { apiGetAnalyticsSummary } from '../../services/analyticsService';
import { useTranslation } from '../../i18n/useTranslation';

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getFirstDayOfWeekVN(year, monthIndex) {
  const day = new Date(year, monthIndex, 1).getDay();
  return (day + 6) % 7; // Monday = 0, Sunday = 6
}

// Format currency VND
const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const formatMillions = (n) => {
  const val = (n ?? 0) / 1_000_000;
  return val >= 1000 ? `${(val / 1000).toFixed(3)} tỷ` : `${val.toFixed(3)} tr`;
};

// Compact VND formatting (e.g. 72k, 1.200tr, 1.200 tỷ)
const formatCompactVND = (n) => {
  const val = Number(n) || 0;
  if (val === 0) return '0 ₫';
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(3)} tỷ ₫`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(3)} tr ₫`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k ₫`;
  return `${val.toLocaleString('vi-VN')} ₫`;
};

// Split value and unit for top KPI cards
const formatKPIValue = (n, isEn = false) => {
  const val = Number(n) || 0;
  if (val === 0) return { val: '0', unit: '₫' };
  if (val >= 1_000_000_000) return { val: (val / 1_000_000_000).toFixed(3), unit: isEn ? 'B ₫' : 'tỷ ₫' };
  if (val >= 1_000_000) return { val: (val / 1_000_000).toFixed(3), unit: isEn ? 'M ₫' : 'tr ₫' };
  return { val: val.toLocaleString('vi-VN'), unit: '₫' };
};

const BAR_SOLID = '#2563eb'; // Classic flat blue — no gradient

const STANDARD_CATEGORIES = [
  { name: 'Thực phẩm', nameEn: 'Food', lines: ['Thực phẩm'], linesEn: ['Food'], match: ['thực phẩm', 'thuc pham', 'tpcn', 'thuc-pham', 'do-an'] },
  { name: 'Đồ uống', nameEn: 'Beverages', lines: ['Đồ uống'], linesEn: ['Beverages'], match: ['đồ uống', 'do uong', 'drink', 'do-uong'] },
  { name: 'Gia vị & Đồ khô', nameEn: 'Spices & Dry', lines: ['Gia vị &', 'Đồ khô'], linesEn: ['Spices &', 'Dry Food'], match: ['gia vị', 'gia vi', 'đồ khô', 'do kho', 'spice', 'gia-vi'] },
  { name: 'Đồ dùng gia đình', nameEn: 'Household', lines: ['Đồ dùng', 'gia đình'], linesEn: ['Household', 'Goods'], match: ['gia đình', 'gia dinh', 'đồ dùng gia đình', 'house', 'gia-dinh', 'gia-dung'] },
  { name: 'Chăm sóc cá nhân', nameEn: 'Personal Care', lines: ['Chăm sóc', 'cá nhân'], linesEn: ['Personal', 'Care'], match: ['cá nhân', 'ca nhan', 'chăm sóc cá nhân', 'care', 'ca-nhan'] },
  { name: 'Đồ dùng văn phòng', nameEn: 'Office Supplies', lines: ['Đồ dùng', 'văn phòng'], linesEn: ['Office', 'Supplies'], match: ['văn phòng', 'van phong', 'đồ dùng văn phòng', 'office', 'van-phong'] },
  { name: 'Tiêu dùng khác', nameEn: 'Other Goods', lines: ['Tiêu dùng', 'khác'], linesEn: ['Other', 'Goods'], match: ['khác', 'khac', 'tiêu dùng khác', 'chưa phân loại', 'misc', 'tieu-dung'] },
];

export function ProductionDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useTranslation();
  const isEn = language === 'en';

  // API data state
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Filters & State
  const [timeRange, setTimeRange] = useState('today');
  const [customFilterMode, setCustomFilterMode] = useState('day'); // 'day' | 'month'
  const [selectedCustomDate, setSelectedCustomDate] = useState('2026-10-17');
  const [selectedCustomMonth, setSelectedCustomMonth] = useState('2026-10');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(2026);
  const [pickerMonthIndex, setPickerMonthIndex] = useState(9); // 0-indexed: 9 = Tháng 10

  const [c3Tab, setC3Tab] = useState('best');
  const [hoveredDonut, setHoveredDonut] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredCatBar, setHoveredCatBar] = useState(null);

  // Modals state
  const [activeQuickAction, setActiveQuickAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Live timestamp & refresh
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getCustomRange = (mode = customFilterMode, dayStr = selectedCustomDate, monthStr = selectedCustomMonth) => {
    if (mode === 'day') {
      const [y, m, d] = (dayStr || '2026-10-17').split('-').map(Number);
      return {
        from: new Date(Date.UTC(y, m - 1, d, -7, 0, 0, 0)).toISOString(),
        to: new Date(Date.UTC(y, m - 1, d, 16, 59, 59, 999)).toISOString(),
      };
    }
    if (mode === 'month') {
      const [y, m] = (monthStr || '2026-10').split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      return {
        from: new Date(Date.UTC(y, m - 1, 1, -7, 0, 0, 0)).toISOString(),
        to: new Date(Date.UTC(y, m - 1, lastDay, 16, 59, 59, 999)).toISOString(),
      };
    }
    return { from: undefined, to: undefined };
  };

  // Fetch dashboard data from API
  const fetchMetrics = useCallback(async (
    range = 'today',
    mode = customFilterMode,
    dayStr = selectedCustomDate,
    monthStr = selectedCustomMonth
  ) => {
    try {
      let params = {};
      if (range === 'custom') {
        const { from, to } = getCustomRange(mode, dayStr, monthStr);
        params = { timeRange: 'custom', from, to };
      } else {
        const rangeMap = { today: 'today', '7days': '7d', '30days': '30d' };
        params = { timeRange: rangeMap[range] ?? range };
      }
      const data = await apiGetAnalyticsSummary(params);
      setMetrics(data);
      const now = new Date();
      setLastUpdated(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoadingMetrics(false);
      setIsRefreshing(false);
    }
  }, [customFilterMode, selectedCustomDate, selectedCustomMonth]);

  const handleTimeRangeChange = (rangeId) => {
    setTimeRange(rangeId);
    if (rangeId === 'custom') {
      fetchMetrics('custom', customFilterMode, selectedCustomDate, selectedCustomMonth);
    } else {
      fetchMetrics(rangeId);
    }
  };

  const handleCustomModeChange = (mode) => {
    setCustomFilterMode(mode);
    fetchMetrics('custom', mode, selectedCustomDate, selectedCustomMonth);
  };

  const handleCustomDateChange = (dateStr) => {
    setSelectedCustomDate(dateStr);
    fetchMetrics('custom', 'day', dateStr, selectedCustomMonth);
  };

  const handleCustomMonthChange = (monthStr) => {
    setSelectedCustomMonth(monthStr);
    fetchMetrics('custom', 'month', selectedCustomDate, monthStr);
  };

  useEffect(() => {
    fetchMetrics(timeRange);

    const handleSync = () => {
      fetchMetrics(timeRange);
    };
    window.addEventListener('stockpilot_product_updated', handleSync);

    let bc = null;
    try {
      bc = new BroadcastChannel('stockpilot_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PRODUCTS_UPDATED' || event.data?.type === 'ORDERS_UPDATED') {
          fetchMetrics(timeRange);
        }
      };
    } catch (_) {}

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMetrics(timeRange);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('stockpilot_product_updated', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (bc) bc.close();
    };
  }, [fetchMetrics, timeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics(timeRange, customFilterMode, selectedCustomDate, selectedCustomMonth);
    setIsRefreshing(false);
    toast({ type: 'success', title: 'Đã làm mới dữ liệu', message: 'Dữ liệu thực từ database đã được đồng bộ!' });
  };

  // Derived data from API — C1 bar chart with 7 requested categories
  const revenueByCat = STANDARD_CATEGORIES.map((std, i) => {
    const found = (metrics?.categoryStats ?? []).find((c) => {
      const cName = String(c.name || '').toLowerCase();
      return std.match.some(m => cName.includes(m)) || cName === std.name.toLowerCase();
    });
    const revRaw = found ? (found.revenue ?? 0) : 0;
    const margin = found ? (found.margin ?? 0) : 0;
    const rev = revRaw >= 1_000_000_000
      ? `${(revRaw / 1_000_000_000).toFixed(3)}${isEn ? 'B' : 'tỷ'}`
      : revRaw >= 1_000_000
        ? `${(revRaw / 1_000_000).toFixed(3)}${isEn ? 'M' : 'tr'}`
        : revRaw > 0
          ? `${(revRaw / 1000).toFixed(0)}k`
          : '0₫';
    return {
      name: isEn ? (std.nameEn || std.name) : std.name,
      lines: isEn ? (std.linesEn || std.lines) : std.lines,
      revRaw,
      rev,
      pct: margin > 0 ? `+${margin}%` : `${margin}%`,
      isPos: margin >= 0,
    };
  });

  const totalCatRev = revenueByCat.reduce((sum, c) => sum + c.revRaw, 0);

  // ─── C1: Setup Vertical Column Chart for 7 Categories ───
  const C1_SVG_W = 580;
  const C1_SVG_H = 360;
  const C1_CHART_LEFT = 45;
  const C1_CHART_RIGHT = 563;
  const C1_CHART_TOP = 20;
  const C1_CHART_BTM = 295;
  const C1_USABLE_W = C1_CHART_RIGHT - C1_CHART_LEFT;
  const C1_SLOT_W = C1_USABLE_W / 7;
  const C1_BAR_W = 42;

  const maxCatRev = Math.max(...revenueByCat.map(c => c.revRaw), 0);
  const getAutoAxisCeiling = (max) => {
    if (max <= 0) return 100_000;
    // Round up to a clean number with 5 equal steps
    const rawStep = max / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
    return niceStep * 5;
  };
  const c1Ceiling = getAutoAxisCeiling(maxCatRev);

  const formatTickLabel = (val) => {
    if (val === 0) return '0';
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(val % 1_000_000_000 === 0 ? 0 : 1)}${isEn ? 'B' : 'tỷ'}`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}${isEn ? 'M' : 'tr'}`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return `${val}`;
  };

  const C1_Y_TICKS = [
    { val: c1Ceiling, label: formatTickLabel(c1Ceiling) },
    { val: Math.round(c1Ceiling * 0.8), label: formatTickLabel(Math.round(c1Ceiling * 0.8)) },
    { val: Math.round(c1Ceiling * 0.6), label: formatTickLabel(Math.round(c1Ceiling * 0.6)) },
    { val: Math.round(c1Ceiling * 0.4), label: formatTickLabel(Math.round(c1Ceiling * 0.4)) },
    { val: Math.round(c1Ceiling * 0.2), label: formatTickLabel(Math.round(c1Ceiling * 0.2)) },
    { val: 0, label: '0' },
  ];

  const catBars = revenueByCat.map((cat, idx) => {
    const centerX = Math.round(C1_CHART_LEFT + (idx + 0.5) * C1_SLOT_W);
    const barX = Math.round(centerX - C1_BAR_W / 2);
    const barH = cat.revRaw > 0
      ? Math.max(6, Math.round((cat.revRaw / c1Ceiling) * (C1_CHART_BTM - C1_CHART_TOP)))
      : 0;
    const barY = C1_CHART_BTM - barH;
    return {
      ...cat,
      idx,
      centerX,
      barX,
      barH,
      barY,
    };
  });

  const topSellers = (metrics?.topSellers ?? []).slice(0, 5).map((s) => ({
    name: s.name,
    qty: s.sold,
    pct: Math.round((s.sold / Math.max(...(metrics?.topSellers ?? []).map(x => x.sold), 1)) * 100),
  }));

  const slowMovers = (metrics?.slowMovers ?? []).slice(0, 5).map((s) => ({
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

  // ─── C2: 6-month revenue trend from API (real data) ───
  const rawMonthly = (metrics?.monthlyRevenue && metrics.monthlyRevenue.length > 0)
    ? metrics.monthlyRevenue
    : [];

  // Build 6-month buckets aligned to current month
  const buildMonthBuckets = () => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({
        month: isEn ? `M${d.getMonth() + 1}` : `T${d.getMonth() + 1}`,
        ym,
        label: isEn ? `Month ${d.getMonth() + 1}/${d.getFullYear()}` : `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
      });
    }
    return buckets;
  };
  const monthBuckets = buildMonthBuckets();

  const SVG_W = 600;
  const SVG_H = 352;
  const CHART_LEFT = 58;
  const CHART_RIGHT = 582;
  const CHART_TOP = 20;
  const CHART_BTM = 295;
  const PAD_X = 36; // Lùi điểm T5 và T10 vào trong để không bị sát cột dọc trục tung và mép phải
  const POINT_START_X = CHART_LEFT + PAD_X;
  const POINT_END_X = CHART_RIGHT - PAD_X;
  const STEP_X = (POINT_END_X - POINT_START_X) / 5; // 5 khoảng đều nhau cho 6 điểm

  const monthlyRevenue = monthBuckets.map((b, idx) => {
    const found = rawMonthly.find(r => r.ym === b.ym || r.month === b.month);
    const rev = found ? (found.revenue ?? (found.cur ? Math.round(found.cur * 1_000_000) : 0)) : 0;
    const cnt = found ? (found.orderCount ?? 0) : 0;
    return {
      month: b.month,
      ym: b.ym,
      label: b.label,
      revenue: rev,
      orderCount: cnt,
      x: Math.round(POINT_START_X + idx * STEP_X),
    };
  });

  // Auto-scale C2 ceiling based on max monthly revenue
  const maxMonthlyRev = Math.max(...monthlyRevenue.map(m => m.revenue), 0);
  const chartCeiling = getAutoAxisCeiling(maxMonthlyRev);
  const Y_TICKS = [
    { val: chartCeiling,                                label: formatTickLabel(chartCeiling) },
    { val: Math.round(chartCeiling * 0.8), label: formatTickLabel(Math.round(chartCeiling * 0.8)) },
    { val: Math.round(chartCeiling * 0.6), label: formatTickLabel(Math.round(chartCeiling * 0.6)) },
    { val: Math.round(chartCeiling * 0.4), label: formatTickLabel(Math.round(chartCeiling * 0.4)) },
    { val: Math.round(chartCeiling * 0.2), label: formatTickLabel(Math.round(chartCeiling * 0.2)) },
    { val: 0,                              label: '0' },
  ];

  const toChartY = (val) => {
    if (val <= 0) return CHART_BTM;
    const ratio = Math.min(1, Math.max(0, val / chartCeiling));
    const rawY = CHART_BTM - ratio * (CHART_BTM - CHART_TOP);
    // Elevate at least 8px above baseline so dot and label are always visible
    return Math.min(CHART_BTM - 8, Math.round(rawY));
  };

  const monthlyPoints = monthlyRevenue.map(m => ({
    ...m,
    cy: toChartY(m.revenue),
  }));

  const total6MonthsRev = monthlyRevenue.reduce((s, p) => s + p.revenue, 0);
  const total6MonthsOrders = monthlyRevenue.reduce((s, p) => s + p.orderCount, 0);

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
    <div className="dashboard-page-scoped w-full space-y-6 pb-12 animate-in fade-in duration-300">
      <style>{`
        .dashboard-page-scoped {
          --ifm-color-primary: #2563eb;
          --ifm-color-primary-dark: #1d4ed8;
          --ifm-color-primary-darker: #1e40af;
          --ifm-color-primary-darkest: #172554;
          --ifm-color-primary-light: #3b82f6;
          --ifm-color-primary-lighter: #60a5fa;
          --ifm-color-primary-lightest: #eff6ff;
          --font-ui: "SF Pro Text", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          --font-prose: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          --font-mono: "SF Mono", ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          --fs-paragraph: 15px;
          --lh-paragraph: 1.625;
          --ifm-leading: 1.1rem;
          --ifm-paragraph-margin-bottom: 1rem;
          font-family: var(--font-ui);
          -webkit-font-smoothing: antialiased;
        }

        .dashboard-page-scoped h1,
        .dashboard-page-scoped h2,
        .dashboard-page-scoped h3,
        .dashboard-page-scoped h4 {
          font-family: var(--font-ui);
          letter-spacing: -0.02em;
        }

        .dashboard-page-scoped .stat-number,
        .dashboard-page-scoped .analytics-num {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          font-weight: 800 !important;
        }

        .dashboard-page-scoped .stat-unit {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          font-weight: 600 !important;
          color: #94a3b8 !important; /* text-slate-400 */
        }

        .dashboard-page-scoped .dashboard-code {
          font-family: var(--font-mono);
          font-size: 11.5px;
          background: #f0f7ff;
          color: #1d4ed8;
          padding: 2px 6px;
          border-radius: 5px;
          border: 1px solid rgba(37, 99, 235, 0.16);
          font-weight: 600;
        }
      `}</style>

      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER                                           */}
      {/* ============================================================== */}
      <header
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
          border: '1px solid #7dd3fc',
          borderRadius: 18,
          padding: '18px 24px',
          boxShadow: '0 8px 22px -5px rgba(14, 165, 233, 0.22), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        }}
        className="relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="hidden sm:flex items-center shrink-0">
          <FreshProduceBasketIllustration className="w-24 h-20 sm:w-28 sm:h-22" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1 w-full">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900" style={{ color: '#0f172a' }}>
            {isEn ? 'Warehouse & Inventory Management' : 'Hệ thống Quản lý & Tồn kho'}
          </h1>
          <p className="text-xs sm:text-sm font-medium" style={{ color: '#0f172a' }}>
            <strong style={{ color: '#0f172a', fontWeight: 800 }}>StockPilot</strong>
          </p>
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
            { id: 'today', label: isEn ? 'Today' : 'Hôm nay' },
            { id: '7days', label: isEn ? '7 days' : '7 ngày' },
            { id: '30days', label: isEn ? '30 days' : '30 ngày' },
            { id: 'custom', label: isEn ? 'Custom' : 'Tùy chọn' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleTimeRangeChange(t.id)}
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{isEn ? `Updated at ${lastUpdated}` : `Cập nhật lúc ${lastUpdated}`}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer border border-blue-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* Custom Date / Month Selector Bar - Khi chọn 'Tùy chọn' */}
      {timeRange === 'custom' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl animate-in fade-in-0 duration-200 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{isEn ? 'View mode:' : 'Chế độ xem:'}</span>
            </div>

            {/* Sub-mode switcher */}
            <div className="inline-flex p-0.5 bg-white border border-slate-200/90 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => handleCustomModeChange('day')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  customFilterMode === 'day'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isEn ? 'By day' : 'Theo ngày'}
              </button>
              <button
                type="button"
                onClick={() => handleCustomModeChange('month')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  customFilterMode === 'month'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isEn ? 'By month' : 'Theo tháng'}
              </button>
            </div>

            {/* Custom Vietnamese Day Picker */}
            {customFilterMode === 'day' ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const [y, m] = (selectedCustomDate || '2026-10-17').split('-').map(Number);
                    setPickerYear(y || 2026);
                    setPickerMonthIndex((m || 10) - 1);
                    setIsDayPickerOpen(!isDayPickerOpen);
                    setIsMonthPickerOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs font-bold text-slate-800 text-xs transition-all cursor-pointer group"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>{isEn ? `Date ${selectedCustomDate.split('-').reverse().join('/')}` : `Ngày ${selectedCustomDate.split('-').reverse().join('/')}`}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {isDayPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDayPickerOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 w-[310px] animate-in fade-in-0 zoom-in-95 duration-150">
                      {/* Header: Tháng X, Năm YYYY with Prev/Next */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (pickerMonthIndex === 0) {
                              setPickerMonthIndex(11);
                              setPickerYear(pickerYear - 1);
                            } else {
                              setPickerMonthIndex(pickerMonthIndex - 1);
                            }
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Tháng trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {isEn ? `Month ${pickerMonthIndex + 1}, Year ${pickerYear}` : `Tháng ${pickerMonthIndex + 1}, Năm ${pickerYear}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (pickerMonthIndex === 11) {
                              setPickerMonthIndex(0);
                              setPickerYear(pickerYear + 1);
                            } else {
                              setPickerMonthIndex(pickerMonthIndex + 1);
                            }
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Tháng sau"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Weekday labels */}
                      <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center text-[10px] font-extrabold text-slate-400">
                        <span>{isEn ? 'Mon' : 'T2'}</span>
                        <span>{isEn ? 'Tue' : 'T3'}</span>
                        <span>{isEn ? 'Wed' : 'T4'}</span>
                        <span>{isEn ? 'Thu' : 'T5'}</span>
                        <span>{isEn ? 'Fri' : 'T6'}</span>
                        <span className="text-blue-500">{isEn ? 'Sat' : 'T7'}</span>
                        <span className="text-rose-500">{isEn ? 'Sun' : 'CN'}</span>
                      </div>

                      {/* Days grid */}
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {Array.from({ length: getFirstDayOfWeekVN(pickerYear, pickerMonthIndex) }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}

                        {Array.from({ length: getDaysInMonth(pickerYear, pickerMonthIndex) }).map((_, i) => {
                          const d = i + 1;
                          const dateStr = `${pickerYear}-${String(pickerMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          const isSelected = selectedCustomDate === dateStr;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                handleCustomDateChange(dateStr);
                                setIsDayPickerOpen(false);
                              }}
                              className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                                  : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleCustomDateChange('2026-10-18');
                              setPickerYear(2026);
                              setPickerMonthIndex(9);
                              setIsDayPickerOpen(false);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            {isEn ? 'Today (18/10)' : 'Hôm nay (18/10)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleCustomDateChange('2026-10-17');
                              setPickerYear(2026);
                              setPickerMonthIndex(9);
                              setIsDayPickerOpen(false);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                          >
                            {isEn ? 'Yesterday (17/10)' : 'Hôm qua (17/10)'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDayPickerOpen(false)}
                          className="text-slate-400 hover:text-slate-600 font-semibold px-1.5 py-1 cursor-pointer"
                        >
                          {isEn ? 'Close' : 'Đóng'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Custom Vietnamese Month Picker */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const [y] = (selectedCustomMonth || '2026-10').split('-').map(Number);
                    setPickerYear(y || 2026);
                    setIsMonthPickerOpen(!isMonthPickerOpen);
                    setIsDayPickerOpen(false);
                  }}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs font-bold text-slate-800 text-xs transition-all cursor-pointer group"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>{isEn ? `Month ${selectedCustomMonth.split('-')[1]} / ${selectedCustomMonth.split('-')[0]}` : `Tháng ${selectedCustomMonth.split('-')[1]} / ${selectedCustomMonth.split('-')[0]}`}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </button>

                {isMonthPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMonthPickerOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 w-[310px] animate-in fade-in-0 zoom-in-95 duration-150">
                      {/* Header: Năm with Prev/Next */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setPickerYear(pickerYear - 1)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Năm trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {isEn ? `Year ${pickerYear}` : `Năm ${pickerYear}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => setPickerYear(pickerYear + 1)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
                          title="Năm sau"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 12 Months Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-3 pb-1">
                        {Array.from({ length: 12 }).map((_, i) => {
                          const m = i + 1;
                          const monthStr = `${pickerYear}-${String(m).padStart(2, '0')}`;
                          const isSelected = selectedCustomMonth === monthStr;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                handleCustomMonthChange(monthStr);
                                setIsMonthPickerOpen(false);
                              }}
                              className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-102'
                                  : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                            >
                              {isEn ? `Month ${m}` : `Tháng ${m}`}
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            handleCustomMonthChange('2026-10');
                            setPickerYear(2026);
                            setIsMonthPickerOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer"
                        >
                          {isEn ? 'Oct 2026 (Current)' : 'Tháng 10/2026 (Hiện tại)'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMonthPickerOpen(false)}
                          className="text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 cursor-pointer"
                        >
                          {isEn ? 'Close' : 'Đóng'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 border border-blue-200/60 px-3 py-1.5 rounded-xl">
            {customFilterMode === 'day'
              ? (isEn ? `Filtered: Date ${selectedCustomDate.split('-').reverse().join('/')}` : `Đang lọc: Ngày ${selectedCustomDate.split('-').reverse().join('/')}`)
              : (isEn ? `Filtered: Month ${selectedCustomMonth.split('-')[1]}/${selectedCustomMonth.split('-')[0]}` : `Đang lọc: Tháng ${selectedCustomMonth.split('-')[1]}/${selectedCustomMonth.split('-')[0]}`)}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. 5 STAT CARDS                                                */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Doanh thu — Xanh Dương Pastel */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: 'rgba(48, 50, 51, 0.03) 2px 2px 8px 0px, rgba(48, 50, 51, 0.03) -2px -2px 8px 0px',
          }}
          className="border border-slate-200/80 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="px-3 py-2 rounded-lg bg-[#eff6ff] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#2563eb] shrink-0" />
              <span className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider">{isEn ? '1. TOTAL REVENUE' : '1. DOANH THU'}</span>
            </div>
          </div>
          <div className="px-3 pt-3 pb-2 flex-1 flex flex-col justify-between">
            <div className="my-2">
              {(() => {
                const kpi = formatKPIValue(metrics?.netRevenue ?? 0, isEn);
                return (
                  <div className="stat-number text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight font-sans">
                    {kpi.val} <span className="stat-unit text-sm font-semibold text-slate-400">{kpi.unit}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
              <span className="text-[#2563eb] font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> {isEn ? 'Net Revenue' : 'Doanh thu thuần'}
              </span>
              <span className="text-slate-500 text-[11px]">{isEn ? 'Profit' : 'Lợi nhuận'} {metrics?.marginPct ?? 0}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Số đơn hàng — Tím / Chàm Pastel */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: 'rgba(48, 50, 51, 0.03) 2px 2px 8px 0px, rgba(48, 50, 51, 0.03) -2px -2px 8px 0px',
          }}
          className="border border-slate-200/80 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="px-3 py-2 rounded-lg bg-[#f5f3ff] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#6366f1] shrink-0" />
              <span className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider">{isEn ? '2. TOTAL ORDERS' : '2. SỐ ĐƠN HÀNG'}</span>
            </div>
          </div>
          <div className="px-3 pt-3 pb-2 flex-1 flex flex-col justify-between">
            <div className="my-2">
              <div className="stat-number text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight font-sans">
                {(metrics?.completedOrdersCount ?? metrics?.orderCount ?? 0).toLocaleString('vi-VN')} <span className="stat-unit text-sm font-semibold text-slate-400">{isEn ? 'orders' : 'đơn'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
              <span className="text-[#6366f1] font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> {isEn ? 'Completed' : 'Đã hoàn thành'}
              </span>
              <span className="text-slate-500 text-[11px]">{formatCompactVND(metrics?.avgOrderValue ?? 0)}{isEn ? '/order' : '/đơn'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Giá trị tồn kho — Đỏ San Hô Pastel */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: 'rgba(48, 50, 51, 0.03) 2px 2px 8px 0px, rgba(48, 50, 51, 0.03) -2px -2px 8px 0px',
          }}
          className="border border-slate-200/80 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="px-3 py-2 rounded-lg bg-[#fff1f2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#fb7185] shrink-0" />
              <span className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider">{isEn ? '3. INVENTORY VALUE' : '3. GIÁ TRỊ TỒN KHO'}</span>
            </div>
          </div>
          <div className="px-3 pt-3 pb-2 flex-1 flex flex-col justify-between">
            <div className="my-2">
              {(() => {
                const kpi = formatKPIValue(metrics?.inventoryValuation ?? metrics?.inventoryCostValuation ?? 0, isEn);
                return (
                  <div className="stat-number text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight font-sans">
                    {kpi.val} <span className="stat-unit text-sm font-semibold text-slate-400">{kpi.unit}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
              <span className="text-[#fb7185] font-bold">{(metrics?.totalStockQuantity ?? 0).toLocaleString('vi-VN')} SP</span>
              <span className="text-slate-500 text-[11px]">{isEn ? 'Cost Value' : 'Giá nhập kho'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cảnh báo hàng tồn — Hồng Pastel */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: 'rgba(48, 50, 51, 0.03) 2px 2px 8px 0px, rgba(48, 50, 51, 0.03) -2px -2px 8px 0px',
          }}
          className="border border-slate-200/80 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="px-3 py-2 rounded-lg bg-[#fdf2f8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#db2777] shrink-0" />
              <span className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider">{isEn ? '4. STOCK ALERTS' : '4. CẢNH BÁO TỒN'}</span>
            </div>
          </div>
          <div className="px-3 pt-3 pb-2 flex-1 flex flex-col justify-between">
            <div className="my-2">
              <div className="stat-number text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight font-sans">
                {interventionProducts.length} <span className="stat-unit text-sm font-semibold text-slate-400">{isEn ? 'slow-moving' : 'bán chậm'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
              <span className="text-[#db2777] font-semibold text-[11px]">{isEn ? 'Action needed' : 'Cần xử lý ngay'}</span>
              <span onClick={() => navigate('/alerts')} className="text-[#db2777] font-bold hover:underline cursor-pointer">{isEn ? 'View →' : 'Xem →'}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Lợi nhuận gộp — Xanh Lá Cây Pastel */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: 'rgba(48, 50, 51, 0.03) 2px 2px 8px 0px, rgba(48, 50, 51, 0.03) -2px -2px 8px 0px',
          }}
          className="border border-slate-200/80 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="px-3 py-2 rounded-lg bg-[#f0fdf4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#16a34a] shrink-0" />
              <span className="text-[11.5px] font-bold text-slate-800 uppercase tracking-wider">{isEn ? '5. GROSS PROFIT' : '5. LỢI NHUẬN GỘP'}</span>
            </div>
          </div>
          <div className="px-3 pt-3 pb-2 flex-1 flex flex-col justify-between">
            <div className="my-2">
              {(() => {
                const kpi = formatKPIValue(metrics?.grossProfit ?? 0, isEn);
                return (
                  <div className="stat-number text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight font-sans">
                    {kpi.val} <span className="stat-unit text-sm font-semibold text-slate-400">{kpi.unit}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
              <span className="text-slate-500 text-[11px]">{isEn ? 'Margin' : 'Biên LN'}</span>
              <span className="text-[#16a34a] font-bold bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 rounded-full">{metrics?.marginPct ?? metrics?.profitMargin ?? 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. SECTION C: CHARTS (2x2 Grid: Trái C1, Phải C2, Trái C3, Phải C4) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART C1: Doanh thu theo danh mục — BIỂU ĐỒ CỘT DỌC BÊN TRÁI */}
        <div className="bg-white rounded-2xl px-3.5 py-4 sm:py-5 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">{isEn ? 'C1. Revenue by Category' : 'C1. Doanh thu theo danh mục'}</h3>
              </div>
            </div>

            {/* SVG Vertical Column Chart */}
            <div className="relative pt-2">
              <svg
                viewBox={`0 0 ${C1_SVG_W} ${C1_SVG_H}`}
                preserveAspectRatio="none"
                className="w-full h-72 sm:h-80 overflow-visible select-none"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  textRendering: 'geometricPrecision',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                }}
              >
                <defs>
                  <linearGradient id="c1BarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="100%" stopColor="#93c5fd" />
                  </linearGradient>
                  <linearGradient id="c1BarGradHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                  <filter id="c1BarShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#93c5fd" floodOpacity="0.2" />
                  </filter>
                </defs>

                {/* Grid lines */}
                {C1_Y_TICKS.map((tick, i) => {
                  const y = Math.round(C1_CHART_TOP + (i / 5) * (C1_CHART_BTM - C1_CHART_TOP));
                  const isZero = i === 5;
                  return (
                    <g key={tick.label + i}>
                      <line
                        x1={C1_CHART_LEFT}
                        y1={y}
                        x2={C1_CHART_RIGHT}
                        y2={y}
                        stroke={isZero ? "#cbd5e1" : "#f1f5f9"}
                        strokeWidth={isZero ? "1.5" : "1"}
                        strokeDasharray={isZero ? "none" : "4 4"}
                      />
                      <text
                        x={C1_CHART_LEFT - 6}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="11"
                        fontWeight="600"
                        fill={isZero ? "#334155" : "#64748b"}
                      >
                        {tick.label}
                      </text>
                    </g>
                  );
                })}

                {/* 7 Vertical Columns */}
                {catBars.map((b) => {
                  const isHovered = hoveredCatBar?.name === b.name;
                  return (
                    <g
                      key={b.name}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredCatBar(b)}
                      onMouseLeave={() => setHoveredCatBar(null)}
                    >
                      {/* Transparent hit area */}
                      <rect
                        x={b.barX - 6}
                        y={C1_CHART_TOP}
                        width={C1_BAR_W + 12}
                        height={C1_CHART_BTM - C1_CHART_TOP + 55}
                        fill="transparent"
                      />

                      {/* Subtle column background track */}
                      <rect
                        x={b.barX}
                        y={C1_CHART_TOP}
                        width={C1_BAR_W}
                        height={C1_CHART_BTM - C1_CHART_TOP}
                        rx="6"
                        ry="6"
                        fill="#f8fafc"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />

                      {/* Value bar (cột dọc bo góc mềm mại) */}
                      {b.barH > 0 && (
                        <rect
                          x={b.barX}
                          y={b.barY}
                          width={C1_BAR_W}
                          height={b.barH}
                          rx="6"
                          ry="6"
                          fill={isHovered ? 'url(#c1BarGradHover)' : 'url(#c1BarGrad)'}
                          filter="url(#c1BarShadow)"
                          className="transition-all duration-150"
                        />
                      )}

                      {/* Top value text: Tự nhiên, không bo viền */}
                      {b.revRaw > 0 && (
                        <text
                          x={b.centerX}
                          y={b.barH > 0 ? b.barY - 8 : C1_CHART_BTM - 8}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight={isHovered ? '800' : '700'}
                          fill={isHovered ? '#0284c7' : '#0369a1'}
                          letterSpacing="0.2px"
                          className="transition-all duration-150"
                        >
                          {b.rev}
                        </text>
                      )}

                      {/* Category name label below X-axis: Chữ thoáng đãng, sắc sảo */}
                      {b.lines?.length === 1 ? (
                        <text
                          x={b.centerX}
                          y={314}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight={isHovered ? '800' : '700'}
                          fill={isHovered ? '#0284c7' : '#1e293b'}
                          letterSpacing="0.2px"
                        >
                          {b.lines[0]}
                        </text>
                      ) : (
                        <text
                          x={b.centerX}
                          y={309}
                          textAnchor="middle"
                          fontSize="11.5"
                          fontWeight={isHovered ? '800' : '700'}
                          fill={isHovered ? '#0284c7' : '#1e293b'}
                          letterSpacing="0.15px"
                        >
                          <tspan x={b.centerX} dy="0">{b.lines?.[0]}</tspan>
                          <tspan x={b.centerX} dy="15">{b.lines?.[1]}</tspan>
                        </text>
                      )}

                      {/* Margin % label: Khoảng cách thoáng, màu xanh lục đậm rõ nét, không mờ */}
                      {b.revRaw > 0 ? (
                        <text
                          x={b.centerX}
                          y={b.lines?.length === 1 ? 334 : 344}
                          textAnchor="middle"
                          fontSize="11.5"
                          fontWeight="700"
                          fill={b.isPos ? '#15803d' : '#dc2626'}
                          letterSpacing="0.3px"
                        >
                          {b.pct}
                        </text>
                      ) : (
                        <text
                          x={b.centerX}
                          y={b.lines?.length === 1 ? 334 : 344}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="#94a3b8"
                        >
                          —
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip on hover */}
              {hoveredCatBar && (
                <div
                  className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-xl text-xs shadow-xl border border-slate-700/50 whitespace-nowrap min-w-[130px]"
                  style={{
                    left: `${(hoveredCatBar.centerX / C1_SVG_W) * 100}%`,
                    top: '25px',
                    transform: hoveredCatBar.centerX > C1_SVG_W * 0.7 ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}
                >
                  <p className="font-bold text-sky-300">{hoveredCatBar.name}</p>
                  <p className="font-extrabold text-sm text-white mt-0.5">{formatVND(hoveredCatBar.revRaw)}</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">{isEn ? 'Profit margin:' : 'Biên lợi nhuận:'} {hoveredCatBar.pct}</p>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* CHART C2: Xu hướng doanh thu 6 tháng — BÊN PHẢI */}
        <div className="bg-white rounded-2xl px-3.5 py-4 sm:py-5 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {isEn ? 'C2. 6-Month Revenue Trend' : 'C2. Xu hướng doanh thu 6 tháng'}
                </h3>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="relative pt-2">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                preserveAspectRatio="none"
                className="w-full h-72 sm:h-80 overflow-visible select-none"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  textRendering: 'geometricPrecision',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                }}
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="shadowGlow" x="-20%" y="-30%" width="140%" height="160%">
                    <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#2563eb" floodOpacity="0.35" />
                  </filter>
                  <filter id="dotGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.5" />
                  </filter>
                </defs>

                {/* Grid lines */}
                {Y_TICKS.map((tick, i) => {
                  const y = Math.round(CHART_TOP + (i / 5) * (CHART_BTM - CHART_TOP));
                  const isZero = i === 5;
                  return (
                    <g key={tick.val}>
                      <line
                        x1={CHART_LEFT}
                        y1={y}
                        x2={CHART_RIGHT}
                        y2={y}
                        stroke={isZero ? '#cbd5e1' : '#f1f5f9'}
                        strokeWidth={isZero ? '1.5' : '1'}
                        strokeDasharray={isZero ? 'none' : '4 4'}
                      />
                      <text
                        x={CHART_LEFT - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="11"
                        fontWeight="600"
                        fill={isZero ? '#334155' : '#64748b'}
                      >
                        {tick.label}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill under curve */}
                {monthlyPoints.length > 0 && (
                  <polygon
                    fill="url(#areaGrad)"
                    points={[
                      ...monthlyPoints.map(p => `${p.x},${p.cy}`),
                      `${monthlyPoints[monthlyPoints.length - 1].x},${CHART_BTM}`,
                      `${monthlyPoints[0].x},${CHART_BTM}`,
                    ].join(' ')}
                  />
                )}

                {/* Revenue polyline */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#shadowGlow)"
                  points={monthlyPoints.map(p => `${p.x},${p.cy}`).join(' ')}
                />

                {/* Month labels & Data point dots & values */}
                {monthlyPoints.map((p) => {
                  const isHovered = hoveredPoint?.ym === p.ym;
                  const valLabel = p.revenue >= 1_000_000_000
                    ? `${(p.revenue / 1_000_000_000).toFixed(3)}${isEn ? 'B' : 'tỷ'}`
                    : p.revenue >= 1_000_000
                      ? `${(p.revenue / 1_000_000).toFixed(3)}${isEn ? 'M' : 'tr'}`
                      : p.revenue >= 1_000
                        ? `${(p.revenue / 1_000).toFixed(0)}k`
                        : p.revenue > 0
                          ? `${p.revenue}₫`
                          : '';
                  return (
                    <g
                      key={p.ym}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Vertical guide bar on hover */}
                      {isHovered && (
                        <line
                          x1={p.x}
                          y1={CHART_TOP}
                          x2={p.x}
                          y2={CHART_BTM}
                          stroke="#93c5fd"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Interactive hit area */}
                      <circle cx={p.x} cy={p.cy} r="20" fill="transparent" />

                      {/* Glow ring on hover */}
                      {isHovered && (
                        <circle
                          cx={p.x}
                          cy={p.cy}
                          r="13"
                          fill="#3b82f6"
                          opacity="0.15"
                        />
                      )}

                      {/* Outer dot ring */}
                      <circle
                        cx={p.x}
                        cy={p.cy}
                        r={isHovered ? 8 : 6}
                        fill="#ffffff"
                        stroke={p.revenue > 0 ? '#2563eb' : '#94a3b8'}
                        strokeWidth={isHovered ? 3.5 : 2.5}
                        filter={isHovered ? 'url(#dotGlow)' : undefined}
                        className="transition-all duration-200"
                      />

                      {/* Inner colored fill dot */}
                      {p.revenue > 0 && (
                        <circle
                          cx={p.x}
                          cy={p.cy}
                          r={isHovered ? 3.5 : 2.5}
                          fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                          className="transition-all duration-200"
                        />
                      )}

                      {/* Value label above point */}
                      {valLabel && (
                        <text
                          x={p.x}
                          y={p.cy - 11}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight={isHovered ? '800' : '700'}
                          fill={isHovered ? '#0284c7' : '#0369a1'}
                          letterSpacing="0.2px"
                          className="transition-all duration-150"
                        >
                          {valLabel}
                        </text>
                      )}

                      {/* Month label centered directly under point at X-axis */}
                      <text
                        x={p.x}
                        y={324}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight={isHovered ? '800' : '700'}
                        fill={isHovered ? '#0284c7' : '#1e293b'}
                        letterSpacing="0.2px"
                        style={{ transition: 'fill 0.15s' }}
                      >
                        {p.month}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Box */}
              {hoveredPoint && (
                <div
                  className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-xl text-xs shadow-xl border border-slate-700/50 whitespace-nowrap min-w-[135px]"
                  style={{
                    left: `${(hoveredPoint.x / SVG_W) * 100}%`,
                    top: '25px',
                    transform: hoveredPoint.x > SVG_W * 0.7 ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}
                >
                  <p className="font-bold text-sky-300">{hoveredPoint.label}</p>
                  <p className="font-extrabold text-sm text-white mt-0.5">{formatVND(hoveredPoint.revenue)}</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">{hoveredPoint.orderCount} {isEn ? 'orders completed' : 'đơn đã hoàn thành'}</p>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* CHART C3: Top sản phẩm bán chạy vs bán chậm — BÊN TRÁI */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {c3Tab === 'best'
                    ? (isEn ? 'C3. Top 5 Best Sellers' : 'C3. Top 5 sản phẩm bán chạy')
                    : (isEn ? 'C3. Top 5 Slow Movers' : 'C3. Top 5 sản phẩm bán chậm')}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setC3Tab('best')} className={`px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${ c3Tab === 'best' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600' }`}>
                  {isEn ? 'Best Sellers' : 'Bán chạy'}
                </button>
                <button onClick={() => setC3Tab('slow')} className={`px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${ c3Tab === 'slow' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-blue-600' }`}>
                  {isEn ? 'Slow Movers' : 'Bán chậm'}
                </button>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {(c3Tab === 'best' ? topSellers : slowMovers).length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8">{isEn ? 'No data available' : 'Chưa có dữ liệu'}</div>
              ) : (
                (c3Tab === 'best' ? topSellers : slowMovers).map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[240px]">{item.name}</span>
                      <span className="font-bold text-blue-600">
                        {c3Tab === 'best' ? `${item.qty} SP` : `${item.days} ${isEn ? 'days' : 'ngày'}`}
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

        {/* CHART C4: Tình trạng tồn kho — BÊN PHẢI */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">{isEn ? 'C4. Inventory Health' : 'C4. Tình trạng tồn kho'}</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">{(metrics?.totalStockQuantity ?? 0).toLocaleString('vi-VN')} {isEn ? 'products' : 'sản phẩm'}</span>
            </div>

            {/* Summary cards: 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { label: isEn ? 'Gross Revenue' : 'Doanh thu gộp', value: formatCompactVND(metrics?.grossRevenue ?? 0), color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
                { label: isEn ? 'Refunded' : 'Đã hoàn tiền', value: formatCompactVND(metrics?.refundedAmount ?? 0), color: 'bg-rose-50 text-rose-700', border: 'border-rose-200' },
                { label: isEn ? 'Cost Value' : 'Giá trị nhập', value: formatCompactVND(metrics?.inventoryValuation ?? 0), color: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
                { label: isEn ? 'Retail Value' : 'Giá bán lẻ', value: formatCompactVND(metrics?.inventoryRetailValuation ?? 0), color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
              ].map(({ label, value, color, border }) => (
                <div key={label} className={`rounded-xl border ${border} p-3 ${color}`}>
                  <p className="text-[11px] font-semibold opacity-70 mb-0.5">{label}</p>
                  <p className="text-sm font-extrabold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. THAO TÁC NHANH (⚡) & TỔNG KẾT NHANH (📊) (Hub Layout)      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Quick Actions */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-blue-600 fill-blue-600" />
            <h3 className="text-base font-bold text-slate-800">
              {isEn ? 'Quick Actions' : 'Thao tác nhanh'}
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
                {isEn ? 'Add Product' : 'Thêm sản phẩm'}
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
                {isEn ? 'Stock In / Out' : 'Nhập / Xuất kho'}
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
                {isEn ? 'Inventory Report' : 'Tạo báo cáo tồn'}
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
                {isEn ? 'Print Barcode' : 'In tem mã vạch'}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT: Mặt hàng cần can thiệp */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] border border-blue-100/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    {isEn ? 'Items Requiring Action' : 'Mặt hàng cần can thiệp'}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {isEn ? '4 Slowest Movers' : '4 Bán chậm nhất'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isEn ? 'Prioritize clearance & release tied working capital' : 'Ưu tiên xử lý xả kho & giải phóng vốn lưu động'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/alerts')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>{isEn ? 'Details' : 'Chi tiết'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of slow-selling products from DB */}
            <div className="space-y-2.5">
              {interventionProducts.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">{isEn ? 'No products require action' : 'Không có sản phẩm cần can thiệp'}</div>
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
                            <Clock className="w-3 h-3" /> {p.daysNoSale} {isEn ? 'days no sale' : 'ngày không bán'}
                          </span>
                          <span>•</span>
                          <span>{isEn ? 'Stock:' : 'Tồn:'} <strong className="text-slate-700">{p.stock}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-blue-700 block">{p.tiedCapital}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">{isEn ? 'tied capital' : 'vốn ứ đọng'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Total tied capital:' : 'Tổng vốn đọng:'} <strong className="text-blue-700 font-bold">{formatVND(totalTiedCapital)}</strong> ({interventionProducts.length} SP)
            </span>
            <button
              onClick={() => toast({ type: 'info', title: isEn ? 'Clearance Suggestion' : 'Đề xuất xả kho', message: isEn ? 'Consider discounts or combos for slow-moving products.' : 'Xem xét giảm giá hoặc combo cho các sản phẩm bán chậm.' })}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
            >
              <span>{isEn ? 'Clearance Action' : 'Xử lý xả kho'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. MODALS: QUICK ACTIONS                                       */}
      {/* ============================================================== */}
      {activeQuickAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {activeQuickAction === 'add_product' && <PackagePlus className="w-5 h-5 text-blue-600" />}
                {activeQuickAction === 'stock_trans' && <ArrowDownUp className="w-5 h-5 text-emerald-600" />}
                {activeQuickAction === 'report' && <FileText className="w-5 h-5 text-amber-600" />}
                {activeQuickAction === 'print_barcode' && <Printer className="w-5 h-5 text-indigo-600" />}

                {activeQuickAction === 'add_product' && (isEn ? 'Add new product to warehouse' : 'Thêm sản phẩm mới vào kho')}
                {activeQuickAction === 'stock_trans' && (isEn ? 'Create Stock In / Out receipt' : 'Tạo phiếu Nhập / Xuất kho')}
                {activeQuickAction === 'report' && (isEn ? 'Export inventory & sales report' : 'Xuất báo cáo tồn kho & doanh số')}
                {activeQuickAction === 'print_barcode' && (isEn ? 'Print barcode & price tag' : 'In tem mã vạch & bảng giá')}
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
                      {isEn ? 'Product Name' : 'Tên sản phẩm'}
                    </label>
                    <input
                      required
                      placeholder={isEn ? 'Example: Robusta Coffee Dak Lak 500g' : 'Ví dụ: Cà phê Robusta Đắk Lắk 500g'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isEn ? 'Category' : 'Danh mục'}
                      </label>
                      <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none">
                        {revenueByCat.map((c, i) => (
                          <option key={i}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isEn ? 'Initial Stock' : 'Số lượng ban đầu'}
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
                    <p className="font-semibold">{isEn ? 'Automated inventory balance tracking:' : 'Hệ thống hỗ trợ cân bằng tồn kho tự động:'}</p>
                    <p>{isEn ? '• Real-time stock level updates upon submission.' : '• Phiếu sẽ cập nhật số lượng tồn khả dụng ngay lập tức.'}</p>
                    <p>{isEn ? '• Automated low stock & tied-capital alerts.' : '• Tự động kiểm tra cảnh báo thiếu hàng hoặc đọng vốn.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="p-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">
                      {isEn ? 'Stock In' : 'Nhập kho hàng'}
                    </button>
                    <button type="button" className="p-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">
                      {isEn ? 'Stock Out' : 'Xuất bán / Điều chuyển'}
                    </button>
                  </div>
                </div>
              )}

              {activeQuickAction === 'report' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    {isEn ? 'Select report type to export' : 'Chọn loại báo cáo cần kết xuất'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="p-3 rounded-xl border-2 border-blue-500 bg-blue-50/50 text-blue-700 text-xs font-bold flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> {isEn ? 'Sales Report (.xlsx)' : 'Báo cáo Doanh số (.xlsx)'}
                    </button>
                    <button type="button" className="p-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> {isEn ? 'Inventory Report (.pdf)' : 'Báo cáo Tồn kho (.pdf)'}
                    </button>
                  </div>
                </div>
              )}

              {activeQuickAction === 'print_barcode' && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 space-y-1">
                  <p className="font-semibold">{isEn ? 'Standard Label Format:' : 'Định dạng tem in chuẩn:'}</p>
                  <p>{isEn ? '• 3 labels per row (Thermal decal 35x22mm)' : '• Khổ tem: 3 tem / hàng (chuẩn Decal nhiệt 35x22mm)'}</p>
                  <p>{isEn ? '• Auto-generate Code128 with item name and retail price.' : '• Tự động sinh mã Code128 cùng tên sản phẩm và giá niêm yết.'}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveQuickAction(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{isEn ? 'Confirm Action' : 'Xác nhận thực hiện'}</span>
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
