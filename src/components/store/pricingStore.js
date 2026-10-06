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
      const response = await apiClient.get('/pricing');
      const payload = response.data?.data || response.data || [];
      const items = Array.isArray(payload) ? payload : [];

      const mapped = items.map((item) => {
        const currentPrice = Number(item.currentPrice || 0);
        const suggestedPrice = Number(item.recommendedPrice || 0);
        const costPrice = Number(item.stockItem?.costPrice || 0);
        const reason = item.reasonJson || {};

        return {
          id: item.id,
          productId: item.stockItemId || item.stockItem?.id,
          productName: item.stockItem?.name || item.stockItem?.product?.name || `Mã hàng #${item.stockItemId}`,
          sku: item.stockItem?.sku || `SKU-${item.stockItemId}`,
          category: item.stockItem?.category || 'Chung',
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
          factors: reason.factors || []
        };
      });

      set({ recommendations: mapped, isLoading: false });
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
        history: [
          {
            id: `HIST-${Date.now()}`,
            recommendationId: id,
            action: 'ACCEPTED',
            decision: 'accepted',
            decidedAt: new Date().toISOString(),
            reason: 'Đã chấp nhận mức giá gợi ý theo thuật toán.'
          },
          ...state.history
        ]
      }));
      get().fetchRecommendations();
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
        history: [
          {
            id: `HIST-${Date.now()}`,
            recommendationId: id,
            action: 'REJECTED',
            decision: 'rejected',
            decidedAt: new Date().toISOString(),
            reason: reason || 'Từ chối thay đổi giá.'
          },
          ...state.history
        ]
      }));
      get().fetchRecommendations();
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
        reason
      });
      set((state) => ({
        recommendations: state.recommendations.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'modified',
                finalPrice: customPrice,
                modifyReason: reason,
                decidedAt: new Date().toISOString()
              }
            : r
        )
      }));
      get().fetchRecommendations();
    } catch (err) {
      console.error('Error modifying recommendation:', err);
      throw err;
    }
  },

  triggerRecalculate: async () => {
    set({ isLoading: true });
    try {
      await apiClient.post('/decision-engine/recalculate');
      await get().fetchRecommendations();
    } catch (err) {
      console.error('Error recalculating pricing engine:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  resetRecommendations: () => {
    set({ recommendations: [], history: [] });
  }
}));
