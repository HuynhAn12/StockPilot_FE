import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, ShoppingCart,
  Calendar, Download, ArrowUpRight, BarChart3, PieChart,
  Layers, Package, CheckCircle2, AlertTriangle, Sparkles, Loader2, RefreshCw,
  Box, CreditCard, Percent, ChevronRight
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { apiGetAnalyticsSummary } from '../services/analyticsService';

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

const TIME_RANGES = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày qua' },
  { key: '30d', label: '30 ngày qua' },
  { key: 'month', label: 'Tháng này' },
  { key: 'year', label: 'Năm nay' },
];

export function AnalyticsPage() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async (selectedRange = timeRange) => {
    setIsLoading(true);
    try {
      const summary = await apiGetAnalyticsSummary({ timeRange: selectedRange });
      setData(summary);
    } catch (err) {
      console.warn('Lỗi khi tải báo cáo từ database:', err?.message);
      toast({
        title: 'Lỗi tải báo cáo',
        description: err?.response?.data?.error?.message || 'Không thể kết nối cơ sở dữ liệu',
        type: 'error',
      });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const handleRangeChange = (rangeKey) => {
    setTimeRange(rangeKey);
  };

  // Real CSV Export with UTF-8 BOM for Excel Vietnamese text support
  const handleExportCSV = () => {
    if (!data) return;

    try {
      const lines = [];
      lines.push(['BÁO CÁO KINH DOANH VÀ TỒN KHO - STOCKPILOT']);
      lines.push([`Kỳ báo cáo: ${TIME_RANGES.find(t => t.key === timeRange)?.label || timeRange}`]);
      lines.push([`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`]);
      lines.push([]);

      // Section 1: Financial KPIs
      lines.push(['--- CHỈ SỐ TÀI CHÍNH CHÍNH ---']);
      lines.push(['Chỉ số', 'Giá trị', 'Tăng trưởng']);
      lines.push(['Tổng doanh thu thực tế (Net Revenue)', `${data.netRevenue || 0} đ`, data.growth?.revenue || '0%']);
      lines.push(['Giá vốn hàng bán (COGS)', `${data.cogs || 0} đ`, '']);
      lines.push(['Lợi nhuận gộp (Gross Profit)', `${data.grossProfit || 0} đ`, data.growth?.profit || '0%']);
      lines.push(['Biên lợi nhuận gộp', `${data.profitMargin || 0}%`, '']);
      lines.push(['Tổng số đơn hàng hoàn thành', `${data.orderCount || 0} đơn`, data.growth?.orders || '0%']);
      lines.push(['Giá trị đơn hàng trung bình (AOV)', `${data.avgOrderValue || 0} đ`, '']);
      lines.push(['Tổng số lượng hàng đã bán', `${data.totalUnitsSold || 0} sp`, '']);
      lines.push(['Giá trị vốn tồn kho', `${data.inventoryCostValuation || 0} đ`, '']);
      lines.push([]);

      // Section 2: Category Stats
      lines.push(['--- DOANH THU & LỢI NHUẬN THEO NGÀNH HÀNG ---']);
      lines.push(['Ngành hàng', 'Doanh thu (VNĐ)', 'Lợi nhuận (VNĐ)', 'Biên lợi nhuận', 'Số đơn']);
      (data.categoryStats || []).forEach(cat => {
        lines.push([cat.name, cat.revenue, cat.profit, `${cat.margin}%`, cat.orderCount]);
      });
      lines.push([]);

      // Section 3: Top Sellers
      lines.push(['--- TOP SẢN PHẨM BÁN CHẠY ---']);
      lines.push(['Tên sản phẩm', 'Mã SP', 'Ngành hàng', 'Số lượng bán', 'Doanh thu (VNĐ)', 'Lợi nhuận (VNĐ)']);
      (data.topSellers || []).forEach(p => {
        lines.push([p.name, p.sku, p.category, p.sold, p.revenue, p.profit]);
      });
      lines.push([]);

      // Section 4: Slow Movers
      lines.push(['--- MẶT HÀNG TỒN LÂU NGÀY ---']);
      lines.push(['Tên sản phẩm', 'Mã SP', 'Số lượng tồn', 'Vốn đọng (VNĐ)', 'Số ngày chưa bán', 'Đề xuất']);
      (data.slowMovers || []).forEach(p => {
        lines.push([p.name, p.sku, p.stock, p.capital, p.daysNoSale, p.suggestion]);
      });

      // Convert to CSV string with BOM
      const csvContent = '\uFEFF' + lines.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bao_cao_StockPilot_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Xuất file thành công',
        description: 'Báo cáo doanh thu & tồn kho đã được tải xuống máy tính dưới dạng CSV/Excel.',
        type: 'success',
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: 'Lỗi xuất file',
        description: err.message || 'Không thể tạo file CSV',
        type: 'error',
      });
    }
  };

  const categoryStats = data?.categoryStats || [];
  const topSellers = data?.topSellers || [];
  const slowMovers = data?.slowMovers || [];
  const chartSeries = data?.chartSeries || [];

  const maxSeriesRevenue = Math.max(1, ...(chartSeries.map(s => s.revenue) || [1]));

  return (
    <div className="analytics-page-scoped space-y-6 max-w-7xl mx-auto pb-16">
      <style>{`
        .analytics-page-scoped {
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

        .analytics-page-scoped h1,
        .analytics-page-scoped h2,
        .analytics-page-scoped h3,
        .analytics-page-scoped h4 {
          font-family: var(--font-ui);
          letter-spacing: -0.02em;
        }

        .analytics-page-scoped .analytics-code {
          font-family: var(--font-mono);
          font-size: 11.5px;
          background: #f0f7ff;
          color: #1d4ed8;
          padding: 2px 6px;
          border-radius: 5px;
          border: 1px solid rgba(37, 99, 235, 0.16);
          font-weight: 600;
        }

        .analytics-page-scoped .analytics-blockquote {
          border-left: 4px solid #2563eb;
          background-color: #f0f7ff;
          color: #1e293b;
          padding: 11px 15px;
          border-radius: 0 10px 10px 0;
          margin: 6px 0;
          font-size: 13.5px;
          line-height: 1.6;
        }

        .analytics-page-scoped .analytics-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .analytics-page-scoped .analytics-card:hover {
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03);
        }

        .analytics-page-scoped .analytics-card {
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .analytics-page-scoped .analytics-card:hover {
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03);
        }

        .analytics-hero-header {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
          border: 1px solid #7dd3fc;
          border-radius: 18px;
          padding: 18px 24px;
          color: #082f49;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 22px -5px rgba(14, 165, 233, 0.22), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
        }
        .analytics-hero-header::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .analytics-hero-header::after {
          content: '';
          position: absolute;
          bottom: -50px;
          left: 30%;
          width: 240px;
          height: 120px;
          background: radial-gradient(ellipse, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .analytics-hero-left {
          position: relative;
          z-index: 1;
        }
        .analytics-hero-title {
          font-size: 22px;
          font-weight: 900;
          margin: 0 0 4px 0;
          letter-spacing: -0.4px;
          color: #082f49;
        }
        .analytics-hero-desc {
          font-size: 13px;
          color: #0c4a6e;
          font-weight: 500;
          margin: 0;
          line-height: 1.45;
          max-width: none;
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .analytics-hero-desc {
            white-space: normal;
          }
        }
        .analytics-btn-action {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          color: #0284c7;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(8px);
        }
        .analytics-btn-action:hover:not(:disabled) {
          background: #ffffff;
          border-color: #38bdf8;
          color: #0369a1;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
        }
        .analytics-btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      {/* Header: KHUNG MÀU XANH GIỐNG TRANG SẢN PHẨM */}
      <div className="analytics-hero-header flex-col md:flex-row items-start md:items-center">
        <div className="analytics-hero-left">
          <h1 className="analytics-hero-title">
            Phân tích & Báo cáo bán hàng
          </h1>
          <p className="analytics-hero-desc">
            Tổng hợp doanh thu thực tế, giá vốn, biên lợi nhuận và tốc độ quay vòng vốn tồn kho từ cơ sở dữ liệu.
          </p>
        </div>

        <button
          onClick={() => fetchAnalytics(timeRange)}
          disabled={isLoading}
          className="analytics-btn-action"
          title="Làm mới số liệu"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Đang cập nhật...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* Toolbar: Bộ lọc thời gian & Xuất file chuyển xuống dưới khung banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
        {/* Time range selector pills */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/90 rounded-xl">
          {TIME_RANGES.map(t => (
            <button
              key={t.key}
              onClick={() => handleRangeChange(t.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                timeRange === t.key
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-white/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Nút Xuất Excel/CSV */}
        <button
          onClick={handleExportCSV}
          disabled={!data || isLoading}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Xuất Excel/CSV</span>
        </button>
      </div>

      {isLoading ? (
        <div className="analytics-card p-16 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Đang tổng hợp báo cáo từ cơ sở dữ liệu...</h3>
          <p className="text-sm text-slate-500 mt-1">Hệ thống đang truy vấn các đơn hàng, tồn kho và danh mục.</p>
        </div>
      ) : (
        <>
          {/* Executive Strategic Summary Callout */}
          <div className="analytics-blockquote flex items-start gap-3 shadow-2xs">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-800 space-y-1">
              <span className="font-bold text-blue-950">Gợi ý phân tích chiến lược ({TIME_RANGES.find(t => t.key === timeRange)?.label}): </span>
              Biên lợi nhuận gộp toàn kỳ đạt <strong className="text-blue-700 font-bold">{data?.profitMargin || 0}%</strong> với tổng doanh thu thuần <strong className="text-blue-700 font-bold">{formatVND(data?.netRevenue || 0)}</strong>. {slowMovers.length > 0 ? `Hệ thống ghi nhận ${slowMovers.length} mặt hàng chậm luân chuyển cần được ưu tiên kích cầu giải phóng vốn.` : 'Tốc độ luân chuyển dòng vốn tồn kho đang ở mức an toàn ổn định.'}
            </div>
          </div>

          {/* 6 Key Financial & Operational KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
            {/* 1. Net Revenue */}
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
                <div className="flex items-center gap-1.5 truncate">
                  <DollarSign className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">Doanh thu thuần</span>
                </div>
                {data?.growth?.revenue && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    data.growth.revenue.startsWith('+') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  }`}>
                    {data.growth.revenue}
                  </span>
                )}
              </div>
              <div className="px-2 pt-2.5 pb-1 flex-1 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{formatVND(data?.netRevenue || 0)}</h3>
                <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">Đã trừ hoàn trả {formatVND(data?.refundedAmount || 0)}</p>
              </div>
            </div>

            {/* 2. Gross Profit & Margin */}
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
                <div className="flex items-center gap-1.5 truncate">
                  <TrendingUp className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">Lợi nhuận gộp</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                  {data?.profitMargin || 0}%
                </span>
              </div>
              <div className="px-2 pt-2.5 pb-1 flex-1 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{formatVND(data?.grossProfit || 0)}</h3>
                <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">Biên LN gộp mục tiêu</p>
              </div>
            </div>

            {/* 3. COGS */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: 'rgba(48, 50, 51, 0.03) 2px 2px 8px 0px, rgba(48, 50, 51, 0.03) -2px -2px 8px 0px',
              }}
              className="border border-slate-200/80 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="px-3 py-2 rounded-lg bg-slate-100/90 flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <DollarSign className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">Giá vốn hàng bán</span>
                </div>
              </div>
              <div className="px-2 pt-2.5 pb-1 flex-1 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-slate-800 mt-0.5">{formatVND(data?.cogs || 0)}</h3>
                <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">Vốn xuất cho các đơn</p>
              </div>
            </div>

            {/* 4. Orders & AOV */}
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
                <div className="flex items-center gap-1.5 truncate">
                  <ShoppingCart className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">Đơn thành công</span>
                </div>
                {data?.growth?.orders && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                    {data.growth.orders}
                  </span>
                )}
              </div>
              <div className="px-2 pt-2.5 pb-1 flex-1 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-blue-600 mt-0.5">{data?.orderCount || 0} đơn</h3>
                <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">TB: {formatVND(data?.avgOrderValue || 0)}/đơn</p>
              </div>
            </div>

            {/* 5. Units Sold */}
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
                <div className="flex items-center gap-1.5 truncate">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#6366f1] shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">Hàng đã bán</span>
                </div>
              </div>
              <div className="px-2 pt-2.5 pb-1 flex-1 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-indigo-600 mt-0.5">{data?.totalUnitsSold || 0} sp</h3>
                <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">Tổng sản phẩm xuất</p>
              </div>
            </div>

            {/* 6. Inventory Valuation */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: 'rgba(48, 50, 51, 0.03) 2px 2px 8px 0px, rgba(48, 50, 51, 0.03) -2px -2px 8px 0px',
              }}
              className="border border-slate-200/80 flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="px-3 py-2 rounded-lg bg-[#faf5ff] flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Box className="w-3.5 h-3.5 text-[#9333ea] shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider truncate">Vốn tồn kho</span>
                </div>
              </div>
              <div className="px-2 pt-2.5 pb-1 flex-1 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-purple-800 mt-0.5">{formatVND(data?.inventoryCostValuation || 0)}</h3>
                <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">Tồn {data?.totalStockQuantity || 0} sản phẩm</p>
              </div>
            </div>
          </div>

          {/* Revenue Trend Visualizer */}
          {chartSeries.length > 0 && (
            <div className="analytics-card p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Biến động doanh thu theo thời gian ({TIME_RANGES.find(t => t.key === timeRange)?.label})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Theo dõi nhịp độ phát sinh doanh số thực tế của cửa hàng</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-2xs" /> Doanh thu
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-2xs" /> Lợi nhuận
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="pt-4 pb-2 flex items-end gap-2 h-44 overflow-x-auto">
                {chartSeries.map((s, idx) => {
                  const revHeight = Math.max(4, Math.round((s.revenue / maxSeriesRevenue) * 120));
                  const profitHeight = Math.max(2, Math.round((s.profit / maxSeriesRevenue) * 120));
                  return (
                    <div key={idx} className="flex-1 min-w-[32px] flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 pointer-events-none whitespace-nowrap z-20 shadow-lg border border-slate-800">
                        <p className="font-bold">{s.label}</p>
                        <p>Doanh thu: {formatVND(s.revenue)}</p>
                        <p className="text-emerald-400">Lãi: {formatVND(s.profit)} ({s.orderCount} đơn)</p>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-32">
                        <div
                          style={{ height: `${revHeight}px` }}
                          className="w-3 rounded-t bg-blue-600 group-hover:bg-blue-700 transition-all shadow-2xs"
                        />
                        <div
                          style={{ height: `${profitHeight}px` }}
                          className="w-3 rounded-t bg-emerald-500 group-hover:bg-emerald-600 transition-all shadow-2xs"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 truncate w-full text-center font-medium">
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Performance Table */}
          <div className="analytics-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Hiệu suất kinh doanh theo ngành hàng</h3>
                <p className="text-xs text-slate-500 mt-0.5">Chi tiết doanh thu, giá vốn và tỷ suất lợi nhuận từng nhóm sản phẩm</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                {categoryStats.length} ngành hàng
              </span>
            </div>

            {categoryStats.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Chưa có giao dịch phát sinh trong khoảng thời gian đã chọn.</p>
                <p className="text-xs mt-1">Các đơn hàng hoàn thành (FULFILLED) sẽ được tự động phân bổ vào ngành hàng tương ứng.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Ngành hàng</th>
                      <th className="py-3 px-4 text-right">Doanh thu</th>
                      <th className="py-3 px-4 text-right">Lợi nhuận gộp</th>
                      <th className="py-3 px-4 text-center">Biên lợi nhuận</th>
                      <th className="py-3 px-4 text-center">Số lượng đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoryStats.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800">{cat.name}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-foreground">{formatVND(cat.revenue)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatVND(cat.profit)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-muted font-bold text-[11px]">{cat.margin}%</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-medium">{cat.orderCount} đơn</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Two Column Grid: Top Sellers vs Slow Movers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Sellers */}
            <div className="analytics-card p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Top mặt hàng bán chạy nhất</h3>
                    <p className="text-[11px] text-slate-500">Xếp hạng theo số lượng bán thực tế</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                  SQL Live Data
                </span>
              </div>

              {topSellers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Chưa có đơn hàng hoàn tất trong kỳ để xếp hạng.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topSellers.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 flex justify-between items-center hover:bg-blue-50/50 hover:border-blue-200/60 transition-all">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-slate-950 shadow-2xs' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                            {item.sku && <span className="analytics-code">{item.sku}</span>}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Đã bán: <strong className="text-blue-700 font-bold">{item.sold} sp</strong> • {formatVND(item.revenue)} (Biên LN: <strong>{item.margin}%</strong>)
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 font-bold shrink-0">
                        {item.tag}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slow Movers & Dead Stock */}
            <div className="analytics-card p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Mặt hàng tồn lâu ngày</h3>
                    <p className="text-[11px] text-slate-500">Cần đẩy bán giải phóng dòng tiền</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                  Cảnh báo tồn
                </span>
              </div>

              {slowMovers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-semibold text-slate-700">Không có mặt hàng nào tồn đọng lâu ngày trong cơ sở dữ liệu.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Toàn bộ hàng hóa luân chuyển đều đặn.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {slowMovers.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 flex justify-between items-center hover:bg-amber-50/30 hover:border-amber-200/60 transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                          {item.sku && <span className="analytics-code">{item.sku}</span>}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          <strong className="text-rose-600">{item.daysNoSale} ngày</strong> chưa bán • Tồn: <strong>{item.stock} sp</strong> ({formatVND(item.capital)})
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-1 rounded-lg inline-block">
                          {item.suggestion}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
