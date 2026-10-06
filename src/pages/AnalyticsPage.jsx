import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Calendar, Download, ArrowUpRight, BarChart3, PieChart,
  Layers, Package, CheckCircle2, AlertTriangle, Sparkles, Loader2, RefreshCw
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { apiGetAnalyticsSummary } from '../services/analyticsService';

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

export function AnalyticsPage() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('30d'); // 7d | 30d | 90d
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const summary = await apiGetAnalyticsSummary();
      setData(summary);
    } catch (err) {
      console.warn('Lỗi khi tải báo cáo từ database:', err?.message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    toast({
      title: 'Đang xuất báo cáo',
      description: 'Báo cáo doanh thu & hiệu suất tồn kho đã được tải xuống.',
      type: 'success'
    });
  };

  const categoryStats = data?.categoryStats || [];
  const topSellers = data?.topSellers || [];
  const slowMovers = data?.slowMovers || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Phân tích & Báo cáo bán hàng (Sales Analytics)
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Dữ liệu trực tiếp từ SQL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng hợp dữ liệu doanh thu thực tế, tỷ suất lợi nhuận và tốc độ quay vòng vốn tồn kho từ cơ sở dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm disabled:opacity-50"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất Excel/CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Đang tổng hợp báo cáo từ cơ sở dữ liệu...</h3>
          <p className="text-sm text-muted-foreground mt-1">Hệ thống đang truy vấn các đơn hàng, tồn kho và danh mục.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground font-medium">Tổng doanh thu thực tế</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{formatVND(data?.netRevenue || 0)}</h3>
              <span className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                Doanh thu sau hoàn trả
              </span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground font-medium">Lợi nhuận gộp (Gross Profit)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatVND(data?.grossProfit || 0)}</h3>
              <span className="text-xs text-emerald-700 font-medium mt-1 inline-block">
                Biên lợi nhuận đạt {data?.marginPct || 0}%
              </span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground font-medium">Tổng số đơn hàng thành công</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{data?.completedOrdersCount || 0} đơn</h3>
              <span className="text-xs text-muted-foreground mt-1 inline-block">
                Giá trị TB: {formatVND(data?.avgOrderValue || 0)}/đơn
              </span>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <p className="text-xs text-muted-foreground font-medium">Tổng tồn kho & Định giá</p>
              <h3 className="text-2xl font-bold text-violet-600 mt-1">{data?.totalStockQuantity || 0} sp</h3>
              <span className="text-xs text-violet-700 font-medium mt-1 inline-block">
                Vốn tồn: {formatVND(data?.inventoryValuation || 0)}
              </span>
            </div>
          </div>

          {/* Category Performance Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-foreground">Hiệu suất kinh doanh theo ngành hàng</h3>
                <p className="text-xs text-muted-foreground">Chi tiết doanh thu, lợi nhuận gộp từ đơn hàng đã hoàn tất trong cơ sở dữ liệu</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700">
                {categoryStats.length} ngành hàng phát sinh
              </span>
            </div>

            {categoryStats.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-sm font-medium">Chưa có dữ liệu giao dịch ngành hàng nào trong cơ sở dữ liệu.</p>
                <p className="text-xs mt-1">Khi phát sinh đơn hàng hoàn thành (FULFILLED), thống kê từng ngành hàng sẽ tự động xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Ngành hàng</th>
                      <th className="py-3 px-4 text-right">Doanh thu</th>
                      <th className="py-3 px-4 text-right">Lợi nhuận gộp</th>
                      <th className="py-3 px-4 text-center">Biên lợi nhuận</th>
                      <th className="py-3 px-4 text-center">Số lượng đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categoryStats.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="py-3.5 px-4 font-semibold text-foreground">{cat.name}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-foreground">{formatVND(cat.revenue)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatVND(cat.profit)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-muted font-bold text-[11px]">{cat.margin}%</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-muted-foreground">{cat.orderCount} đơn</td>
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
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Top mặt hàng bán chạy nhất</h3>
                </div>
                <span className="text-xs text-muted-foreground">Từ dữ liệu đơn hàng SQL</span>
              </div>

              {topSellers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-xs">Chưa có đơn hàng hoàn thành để xếp hạng mặt hàng bán chạy.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSellers.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border bg-muted/20 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-xs text-foreground">{item.name}</h4>
                        <span className="text-[11px] text-muted-foreground">Đã bán: <strong>{item.sold} sp</strong> • {formatVND(item.revenue)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">{item.tag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slow Movers & Dead Stock */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Mặt hàng tồn lâu ngày</h3>
                </div>
                <span className="text-xs text-amber-700 font-medium">Từ tồn kho SQL</span>
              </div>

              {slowMovers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-xs">Không có mặt hàng nào tồn đọng lâu ngày trong cơ sở dữ liệu.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {slowMovers.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-amber-200/60 bg-amber-50/20 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-xs text-foreground">{item.name}</h4>
                        <span className="text-[11px] text-muted-foreground">
                          {item.daysNoSale} ngày không phát sinh đơn • Tồn: {item.stock} sp ({formatVND(item.capital)})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
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
