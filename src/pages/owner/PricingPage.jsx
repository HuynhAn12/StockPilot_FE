import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag, TrendingUp, TrendingDown, ArrowRight, Check, X,
  Edit3, Sparkles, RefreshCw, AlertCircle, ShieldAlert,
  Percent, DollarSign, Bot, Eye, HelpCircle, History,
  Search, Filter, CheckCircle2, ChevronRight, Loader2
} from 'lucide-react';
import { usePricingStore } from '../../components/store/pricingStore';
import { useToast } from '../../components/common/Toast';
import { useTranslation } from '../../i18n/useTranslation';

function formatVND(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ';
}

export function PricingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const {
    recommendations,
    history,
    isLoading,
    fetchRecommendations,
    triggerRecalculate,
    acceptRecommendation,
    rejectRecommendation,
    modifyRecommendation,
    resetRecommendations
  } = usePricingStore();

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const [activeTab, setActiveTab] = useState('pending'); // pending | accepted | modified | rejected | history
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL'); // ALL | INCREASE | DECREASE | MAINTAIN

  // Modals state
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [modifyModalItem, setModifyModalItem] = useState(null);
  const [modifyPriceInput, setModifyPriceInput] = useState('');
  const [overrideMinMargin, setOverrideMinMargin] = useState(false);
  const [modifyReason, setModifyReason] = useState('');

  // Counts
  const pendingItems = useMemo(() => recommendations.filter((r) => r.status === 'pending'), [recommendations]);
  const acceptedItems = useMemo(() => recommendations.filter((r) => r.status === 'accepted'), [recommendations]);
  const modifiedItems = useMemo(() => recommendations.filter((r) => r.status === 'modified'), [recommendations]);
  const rejectedItems = useMemo(() => recommendations.filter((r) => r.status === 'rejected'), [recommendations]);

  // Filtered items
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((item) => {
      // Tab filter
      if (activeTab === 'pending' && item.status !== 'pending') return false;
      if (activeTab === 'accepted' && item.status !== 'accepted') return false;
      if (activeTab === 'modified' && item.status !== 'modified') return false;
      if (activeTab === 'rejected' && item.status !== 'rejected') return false;

      // Action filter
      if (selectedAction !== 'ALL' && item.action !== selectedAction) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.productName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [recommendations, activeTab, selectedAction, searchQuery]);

  const handleAccept = (item) => {
    acceptRecommendation(item.id);
    toast({
      title: isEn ? 'New price accepted' : 'Đã chấp nhận mức giá mới',
      description: isEn
        ? `Applied price ${formatVND(item.suggestedPrice)} for "${item.productName}".`
        : `Đã áp dụng mức giá ${formatVND(item.suggestedPrice)} cho sản phẩm "${item.productName}".`,
      type: 'success'
    });
  };

  const handleReject = (item) => {
    rejectRecommendation(item.id, isEn ? 'Not suitable for current business plan' : 'Chưa phù hợp kế hoạch hiện tại');
    toast({
      title: isEn ? 'Price recommendation rejected' : 'Đã từ chối đề xuất giá',
      description: isEn
        ? `Retained current price for "${item.productName}".`
        : `Đã giữ nguyên giá hiện tại cho "${item.productName}".`,
      type: 'info'
    });
  };

  const openModifyModal = (item) => {
    setModifyModalItem(item);
    setModifyPriceInput(String(item.suggestedPrice));
    setOverrideMinMargin(false);
    setModifyReason('');
  };

  const handleSaveModify = () => {
    if (!modifyModalItem) return;
    const finalPriceNum = Number(String(modifyPriceInput).replace(/\D/g, '') || 0);

    if (finalPriceNum <= 0) {
      toast({
        title: isEn ? 'Invalid price' : 'Giá không hợp lệ',
        description: isEn ? 'Please enter a selling price greater than 0.' : 'Vui lòng nhập giá bán lớn hơn 0.',
        type: 'error'
      });
      return;
    }

    if (finalPriceNum < modifyModalItem.minPrice && !overrideMinMargin) {
      toast({
        title: isEn ? 'Violates minimum safe margin' : 'Vi phạm biên lãi tối thiểu',
        description: isEn
          ? `Price must be at least ${formatVND(modifyModalItem.minPrice)} (Min Margin ${modifyModalItem.minMarginPct}%). Or check override.`
          : `Giá phải tối thiểu là ${formatVND(modifyModalItem.minPrice)} (Min Margin ${modifyModalItem.minMarginPct}%). Hoặc tích chọn ghi đè.`,
        type: 'error'
      });
      return;
    }

    modifyRecommendation(
      modifyModalItem.id,
      finalPriceNum,
      modifyReason || (isEn ? 'Customized by Store Owner' : 'Chủ shop tự điều chỉnh')
    );

    toast({
      title: isEn ? 'Custom price saved' : 'Đã lưu giá điều chỉnh',
      description: isEn
        ? `Set price to ${formatVND(finalPriceNum)} for "${modifyModalItem.productName}".`
        : `Đã cập nhật giá bán thành ${formatVND(finalPriceNum)} cho "${modifyModalItem.productName}".`,
      type: 'success'
    });

    setModifyModalItem(null);
  };

  const simulatedMargin = useMemo(() => {
    if (!modifyModalItem) return 0;
    const priceNum = Number(String(modifyPriceInput).replace(/\D/g, '') || 0);
    if (priceNum <= 0) return 0;
    return Number((((priceNum - modifyModalItem.costPrice) / priceNum) * 100).toFixed(1));
  }, [modifyModalItem, modifyPriceInput]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <style>{`
        .pricing-hero-header {
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
        .pricing-hero-header::before {
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
        .pricing-hero-header::after {
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
        .pricing-hero-left {
          position: relative;
          z-index: 1;
        }
        .pricing-hero-title {
          font-size: 22px;
          font-weight: 900;
          margin: 0 0 4px 0;
          letter-spacing: -0.4px;
          color: #082f49;
        }
        .pricing-hero-desc {
          font-size: 13px;
          color: #0c4a6e;
          font-weight: 500;
          margin: 0;
          line-height: 1.45;
          max-width: none;
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .pricing-hero-desc {
            white-space: normal;
          }
        }
      `}</style>

      {/* Header */}
      <div className="pricing-hero-header">
        <div className="pricing-hero-left">
          <h1 className="pricing-hero-title">
            {isEn ? 'Smart AI Pricing Suggestions' : 'Gợi ý giá bán thông minh'}
          </h1>
          <p className="pricing-hero-desc">
            {isEn
              ? 'Algorithmic optimization recommending optimal price points based on sales velocity, inventory levels, target margins and market dynamics.'
              : 'Thuật toán phân tích đề xuất mức giá tối ưu dựa trên tốc độ bán, tồn kho, biên lợi nhuận mục tiêu và biến động thị trường.'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-4.5 rounded-xl border border-blue-200/60 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{isEn ? 'Pending Approval' : 'Chờ phê duyệt'}</p>
              <h3 className="text-2xl font-bold text-blue-600">{pendingItems.length} SP</h3>
            </div>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded">
            {isEn ? 'Action needed' : 'Cần quyết định'}
          </span>
        </div>

        <div className="bg-card p-4.5 rounded-xl border border-emerald-200/60 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{isEn ? 'Estimated Margin Uplift' : 'Tỷ lệ lợi nhuận ước tính tăng'}</p>
              <h3 className="text-2xl font-bold text-emerald-600">+18.4%</h3>
            </div>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-1 rounded">
            {isEn ? 'If fully applied' : 'Nếu áp dụng hết'}
          </span>
        </div>

        <div className="bg-card p-4.5 rounded-xl border border-violet-200/60 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{isEn ? 'Projected Revenue Gain' : 'Doanh thu dự kiến tăng thêm'}</p>
              <h3 className="text-2xl font-bold text-violet-600">+12.500.000 đ</h3>
            </div>
          </div>
          <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-2 py-1 rounded">
            {isEn ? '30-day forecast' : 'Dự báo 30 ngày'}
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {isEn ? `Pending (${pendingItems.length})` : `Chờ phê duyệt (${pendingItems.length})`}
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'accepted'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {isEn ? `Accepted (${acceptedItems.length})` : `Đã chấp nhận (${acceptedItems.length})`}
          </button>
          <button
            onClick={() => setActiveTab('modified')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'modified'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {isEn ? `Modified (${modifiedItems.length})` : `Đã chỉnh sửa (${modifiedItems.length})`}
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'rejected'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {isEn ? `Rejected (${rejectedItems.length})` : `Đã từ chối (${rejectedItems.length})`}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <History className="w-4 h-4" />
            {isEn ? `Decision Log (${history.length})` : `Lịch sử đề xuất (${history.length})`}
          </button>
        </div>

        {/* Search */}
        {activeTab !== 'history' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isEn ? "Search product, SKU..." : "Tìm sản phẩm, mã SP..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Tab: History View */}
      {activeTab === 'history' ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h3 className="font-bold text-sm text-foreground">
              {isEn ? 'Price Decisions Audit Log' : 'Nhật ký quyết định giá (Price Decisions Log)'}
            </h3>
            <span className="text-xs text-muted-foreground">
              {isEn ? 'History of accepted, rejected, and modified prices' : 'Lưu trữ các thao tác phê duyệt, từ chối, chỉnh sửa giá'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">{isEn ? 'Time' : 'Thời gian'}</th>
                  <th className="py-3 px-4">{isEn ? 'Product' : 'Sản phẩm'}</th>
                  <th className="py-3 px-4">{isEn ? 'Old → New Price' : 'Giá cũ → Giá mới'}</th>
                  <th className="py-3 px-4">{isEn ? 'Decision' : 'Quyết định'}</th>
                  <th className="py-3 px-4">{isEn ? 'Actor' : 'Người thực hiện'}</th>
                  <th className="py-3 px-4">{isEn ? 'Recorded Reason' : 'Lý do ghi nhận'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {new Date(h.decidedAt).toLocaleString(isEn ? 'en-US' : 'vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">{h.productName}</td>
                    <td className="py-3 px-4">
                      <span className="line-through text-muted-foreground mr-1.5">{formatVND(h.oldPrice)}</span>
                      <span className="font-bold text-blue-600">{formatVND(h.newPrice)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        h.decision === 'accepted'
                          ? 'bg-emerald-100 text-emerald-700'
                          : h.decision === 'modified'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {h.decision === 'accepted' ? (isEn ? 'Accepted' : 'Đã chấp nhận') : h.decision === 'modified' ? (isEn ? 'Modified' : 'Đã chỉnh sửa') : (isEn ? 'Rejected' : 'Đã từ chối')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground">{h.decidedBy}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{h.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Recommendations List */
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">
                {isEn ? 'Loading price recommendations from system...' : 'Đang tải đề xuất giá từ hệ thống...'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isEn ? 'Synchronizing pricing database from SQL.' : 'Đang đồng bộ dữ liệu định giá từ cơ sở dữ liệu.'}
              </p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {isEn ? 'No price recommendations in database' : 'Không có đề xuất giá nào trong cơ sở dữ liệu'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {isEn
                  ? 'Currently no price change records in database. You can trigger a new scan to recalculate the entire warehouse catalog.'
                  : 'Hiện tại chưa có bản ghi đề xuất thay đổi giá nào trong SQL. Bạn có thể nhấn nút quét để thuật toán phân tích lại toàn bộ kho hàng hiện có.'}
              </p>
              <button
                onClick={async () => {
                  await triggerRecalculate();
                  toast({
                    title: isEn ? 'Analysis Complete' : 'Đã hoàn thành',
                    description: isEn ? 'Finished scanning inventory and optimal pricing.' : 'Đã quét xong tồn kho và giá bán.',
                    type: 'success'
                  });
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isEn ? 'Scan & Recalculate Now' : 'Quét & Tính toán đề xuất ngay'}
              </button>
            </div>
          ) : (
            filteredRecommendations.map((item) => {
              const isIncrease = item.action === 'INCREASE';
              const isDecrease = item.action === 'DECREASE';

              return (
                <div
                  key={item.id}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Product & Action Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isIncrease
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDecrease
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isIncrease ? <TrendingUp className="w-3.5 h-3.5" /> : isDecrease ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                          {isIncrease
                            ? (isEn ? 'INCREASE PRICE' : 'Đề xuất TĂNG GIÁ')
                            : isDecrease
                            ? (isEn ? 'DECREASE PRICE' : 'Đề xuất GIẢM GIÁ')
                            : (isEn ? 'MAINTAIN PRICE' : 'GIỮ NGUYÊN GIÁ')}
                        </span>
                        <span className="text-xs text-muted-foreground">{isEn ? 'SKU: ' : 'Mã: '}{item.sku}</span>
                        <span className="text-xs text-muted-foreground">• {item.category}</span>
                        <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                          {isEn ? 'Confidence: ' : 'Tin cậy: '}{item.confidence}%
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground">{item.productName}</h3>

                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span>{item.reasonSummary}</span>
                      </p>
                    </div>

                    {/* Middle: Price Comparison */}
                    <div className="flex items-center gap-5 shrink-0 bg-muted/20 p-3 rounded-xl border border-border/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">{isEn ? 'Current Price' : 'Giá hiện tại'}</span>
                        <span className="font-bold text-sm text-foreground line-through decoration-muted-foreground/60">
                          {formatVND(item.currentPrice)}
                        </span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted-foreground" />

                      <div>
                        <span className="text-[11px] text-muted-foreground block">{isEn ? 'AI Suggested' : 'Giá AI đề xuất'}</span>
                        <span className="font-bold text-base text-blue-600">
                          {formatVND(item.suggestedPrice)}
                        </span>
                      </div>

                      <div className="border-l border-border pl-4">
                        <span className="text-[11px] text-muted-foreground block">{isEn ? 'Difference' : 'Chênh lệch'}</span>
                        <span className={`font-bold text-xs ${item.priceDiff > 0 ? 'text-emerald-600' : item.priceDiff < 0 ? 'text-amber-600' : 'text-foreground'}`}>
                          {item.priceDiff > 0 ? '+' : ''}{formatVND(item.priceDiff)} ({item.pctDiff > 0 ? '+' : ''}{item.pctDiff}%)
                        </span>
                      </div>

                      <div className="border-l border-border pl-4">
                        <span className="text-[11px] text-muted-foreground block">{isEn ? 'Gross Margin' : 'Biên lợi nhuận'}</span>
                        <span className="text-xs font-semibold text-foreground">
                          {item.marginBefore}% → <span className="font-bold text-emerald-600">{item.marginAfter}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setDetailModalItem(item)}
                        className="p-2 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
                        title={isEn ? "View 4 core factor analysis" : "Xem phân tích 4 nhóm yếu tố"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isEn ? 'Why this price?' : 'Xem vì sao?'}</span>
                      </button>

                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openModifyModal(item)}
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {isEn ? 'Edit price' : 'Sửa giá'}
                          </button>

                          <button
                            onClick={() => handleReject(item)}
                            className="px-3 py-2 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          >
                            {isEn ? 'Reject' : 'Từ chối'}
                          </button>

                          <button
                            onClick={() => handleAccept(item)}
                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {isEn ? 'Accept' : 'Chấp nhận'}
                          </button>
                        </>
                      )}

                      {item.status === 'accepted' && (
                        <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? 'Applied' : 'Đã áp dụng'}
                        </span>
                      )}

                      {item.status === 'modified' && (
                        <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-100 text-blue-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? `Modified (${formatVND(item.finalPrice)})` : `Đã sửa (${formatVND(item.finalPrice)})`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal 1: "Vì sao?" Detail Factors Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isEn ? 'Decision Engine Price Factors' : 'Giải thích đề xuất giá (Decision Engine Factors)'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {detailModalItem.engineVersion} • {isEn ? 'Confidence: ' : 'Độ tin cậy: '}{detailModalItem.confidence}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Product Price Summary */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-foreground">{detailModalItem.productName}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{isEn ? 'SKU: ' : 'Mã SP: '}{detailModalItem.sku}</p>
                  <p className="text-xs text-muted-foreground mt-1">{isEn ? 'Cost price: ' : 'Giá vốn: '}<span className="font-semibold text-foreground">{formatVND(detailModalItem.costPrice)}</span></p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">{isEn ? 'Proposed New Price' : 'Đề xuất giá mới'}</span>
                  <span className="text-xl font-bold text-blue-600">{formatVND(detailModalItem.suggestedPrice)}</span>
                  <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                    {isEn ? 'Profit Margin: ' : 'Biên lãi: '}{detailModalItem.marginBefore}% → {detailModalItem.marginAfter}%
                  </span>
                </div>
              </div>

              {/* 4 Groups of Factors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  {isEn ? '4 Core Pricing Factor Dimensions' : '4 Nhóm yếu tố định giá cốt lõi'}
                </h4>
                <div className="space-y-2">
                  {detailModalItem.factors.map((f, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border bg-card flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-blue-600 block">{f.category}</span>
                        <h5 className="text-sm font-semibold text-foreground mt-0.5">{f.name}</h5>
                        <p className="text-xs text-muted-foreground mt-1">{f.detail}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-muted text-foreground shrink-0">
                        {f.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  {isEn ? 'Merchant Control Guarantee:' : 'Quyền tự quyết của người dùng:'}
                </span>
                <p>
                  {isEn
                    ? 'The system never forces automated price changes. You always maintain full authority to Accept, Reject, or Customize pricing.'
                    : 'Hệ thống không bao giờ tự động áp đặt giá lên gian hàng. Bạn luôn có quyền Chấp nhận, Từ chối hoặc Tự chỉnh mức giá phù hợp.'}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-2">
              <button
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                onClick={() => {
                  handleAccept(detailModalItem);
                  setDetailModalItem(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                {isEn ? 'Accept this suggestion' : 'Chấp nhận đề xuất này'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Modify Price Modal */}
      {modifyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
              <h3 className="text-base font-bold text-foreground">{isEn ? 'Customize Selling Price' : 'Chỉnh sửa giá bán thủ công'}</h3>
              <button onClick={() => setModifyModalItem(null)} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">{isEn ? 'Product' : 'Sản phẩm'}</p>
                <h4 className="text-sm font-bold text-foreground">{modifyModalItem.productName}</h4>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>{isEn ? 'Cost price: ' : 'Giá vốn: '}<strong>{formatVND(modifyModalItem.costPrice)}</strong></span>
                  <span>{isEn ? 'Current price: ' : 'Giá hiện tại: '}<strong>{formatVND(modifyModalItem.currentPrice)}</strong></span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {isEn ? 'Enter custom price (VND):' : 'Nhập mức giá bạn muốn áp dụng (VND):'}
                </label>
                <input
                  type="number"
                  value={modifyPriceInput}
                  onChange={(e) => setModifyPriceInput(e.target.value)}
                  className="w-full px-3 py-2 text-base font-bold border border-border rounded-lg bg-card focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Simulation Box */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isEn ? 'Estimated gross margin:' : 'Biên lợi nhuận ước tính:'}</span>
                  <span className={`font-bold ${simulatedMargin < 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {simulatedMargin}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isEn ? 'Profit per SP:' : 'Lợi nhuận trên mỗi SP:'}</span>
                  <span className="font-bold text-foreground">
                    {formatVND(Number(modifyPriceInput || 0) - modifyModalItem.costPrice)}
                  </span>
                </div>
              </div>

              {/* Warning if below min margin */}
              {Number(modifyPriceInput || 0) < modifyModalItem.minPrice && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    {isEn
                      ? 'Warning: This price falls below minimum safe margin (10%)!'
                      : 'Cảnh báo: Mức giá này thấp hơn biên lãi an toàn tối thiểu (10%)!'}
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-red-800">
                    <input
                      type="checkbox"
                      checked={overrideMinMargin}
                      onChange={(e) => setOverrideMinMargin(e.target.checked)}
                      className="rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    {isEn
                      ? 'I understand and wish to override minimum profit safety floor.'
                      : 'Tôi hiểu và xác nhận muốn ghi đè (override) mức lãi tối thiểu.'}
                  </label>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {isEn ? 'Adjustment reason (optional):' : 'Ghi chú lý do (tùy chọn):'}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? "E.g.: Summer clearance promo..." : "Ví dụ: Chiến dịch xả kho hè..."}
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-card"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-2">
              <button
                onClick={() => setModifyModalItem(null)}
                className="px-3.5 py-1.5 text-xs font-semibold border border-border rounded-lg text-foreground hover:bg-muted"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
              <button
                onClick={handleSaveModify}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isEn ? 'Save New Price' : 'Lưu giá mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
