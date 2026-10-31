import { create } from 'zustand';
import { apiClient } from '../../lib/apiClient';

export const usePricingStore = create((set, get) => ({
  recommendations: [],
  history: [],
  isLoading: false,
  error: null,

  getPendingCount: () => {
    return get().recommendations.filter((r) => r.status?.toLowerCase() === 'pending').length;
  },

  fetchRecommendations: async () => {
    set({ isLoading: true, error: null });
    try {
      const [resRecs, resHist] = await Promise.allSettled([
        apiClient.get('/pricing'),
        apiClient.get('/pricing/history'),
      ]);

      let mapped = [];
      if (resRecs.status === 'fulfilled') {
        const payload = resRecs.value.data?.data || resRecs.value.data || [];
        const items = Array.isArray(payload) ? payload : [];

        mapped = items.map((item) => {
          const currentPrice = Number(item.currentPrice || 0);
          const suggestedPrice = Number(item.recommendedPrice || 0);
          const costPrice = Number(item.stockItem?.costPrice || 0);
          const reason = item.reasonJson || {};

          return {
            id: item.id,
            productId: item.stockItemId || item.stockItem?.id,
            productName: item.stockItem?.name || item.stockItem?.product?.name || `Mã hàng #${item.stockItemId}`,
            sku: item.stockItem?.sku || `SP-${item.stockItemId}`,
            category: item.stockItem?.product?.category?.name || item.stockItem?.category || 'Chung',
            currentPrice,
            costPrice,
            suggestedPrice,
            minPrice: Number(reason.minimumPrice || costPrice),
            action: item.action || 'MAINTAIN',
            priceDiff: suggestedPrice - currentPrice,
            pctDiff: currentPrice > 0 ? Number((((suggestedPrice - currentPrice) / currentPrice) * 100).toFixed(1)) : 0,
            marginBefore: currentPrice > 0 ? Number((((currentPrice - costPrice) / currentPrice) * 100).toFixed(1)) : 0,
            marginAfter: suggestedPrice > 0 ? Number((((suggestedPrice - costPrice) / suggestedPrice) * 100).toFixed(1)) : 0,
            confidence: Math.round(Number(item.confidence || 100)),
            status: String(item.status || 'PENDING').toLowerCase(),
            engineVersion: item.engineVersion || 'DecisionEngine',
            createdAt: item.createdAt || new Date().toISOString(),
            reasonSummary: reason.factors?.[0]?.label || 'Đề xuất tối ưu giá từ thuật toán định giá kho hàng.',
            factors: reason.factors || [],
          };
        });
      }

      let history = [];
      if (resHist.status === 'fulfilled') {
        const hItems = resHist.value.data?.data || [];
        history = hItems.map((h) => ({
          id: h.id,
          recommendationId: h.recommendationId,
          productName: h.stockItem?.name || `Mã hàng #${h.stockItemId}`,
          sku: h.stockItem?.sku || '',
          oldPrice: Number(h.oldPrice),
          newPrice: Number(h.newPrice),
          action: Number(h.newPrice) > Number(h.oldPrice) ? 'TĂNG_GIÁ' : 'GIẢM_GIÁ',
          decidedAt: h.changedAt,
          decidedBy: h.changedBy?.fullName || h.changedBy?.email || 'Chủ shop',
          reason: h.reason || 'Cập nhật giá theo đề xuất hệ thống.',
        }));
      }

      set({ recommendations: mapped, history, isLoading: false });

      // If no recommendations exist, trigger automatic initial calculation
      if (mapped.length === 0 && !get().isCalculating) {
        get().triggerRecalculate({ background: true });
      }
    } catch (err) {
      console.warn('Could not fetch pricing recommendations from backend:', err?.message);
      set({ recommendations: [], isLoading: false, error: err?.message });
    }
  },

  acceptRecommendation: async (id) => {
    try {
      await apiClient.post(`/pricing/${id}/accept`, { applyToStockItem: true });
      set((state) => ({
        recommendations: state.recommendations.map((r) =>
          r.id === id ? { ...r, status: 'accepted', decidedAt: new Date().toISOString() } : r
        ),
      }));
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error accepting recommendation:', err);
      throw err;
    }
  },

  rejectRecommendation: async (id, reason = '') => {
    try {
      await apiClient.post(`/pricing/${id}/reject`, { reason });
      set((state) => ({
        recommendations: state.recommendations.map((r) =>
          r.id === id ? { ...r, status: 'rejected', rejectReason: reason, decidedAt: new Date().toISOString() } : r
        ),
      }));
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error rejecting recommendation:', err);
      throw err;
    }
  },

  modifyRecommendation: async (id, customPrice, overrideMinMargin = false, reason = '') => {
    try {
      await apiClient.post(`/pricing/${id}/modify`, {
        customPrice: Number(customPrice),
        overrideMinMargin,
        reason,
      });
      set((state) => ({
        recommendations: state.recommendations.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'modified',
                finalPrice: customPrice,
                modifyReason: reason,
                decidedAt: new Date().toISOString(),
              }
            : r
        ),
      }));
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error modifying recommendation:', err);
      throw err;
    }
  },

  triggerRecalculate: async (options = {}) => {
    if (!options.background) {
      set({ isLoading: true });
    }
    set({ isCalculating: true });
    try {
      await apiClient.post('/decision-engine/recalculate');
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error recalculating pricing engine:', err);
    } finally {
      set({ isLoading: false, isCalculating: false });
    }
  },

  resetRecommendations: () => {
    get().triggerRecalculate();
  },
}));
