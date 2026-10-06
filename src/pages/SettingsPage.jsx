import React, { useState, useEffect } from 'react';
import {
  Settings, Store, Sliders, Bell, Shield, Save,
  RefreshCw, CheckCircle2, HelpCircle, Sparkles
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { apiGetDecisionConfig, apiUpdateDecisionConfig } from '../services/analyticsService';

export function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('engine'); // store | engine | notifications
  const [loading, setLoading] = useState(false);

  // Store profile
  const [storeName, setStoreName] = useState('Tạp hóa Minh Phát - Chi nhánh 1');
  const [hotline, setHotline] = useState('0908 123 456');
  const [address, setAddress] = useState('Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh');
  const [currency] = useState('VND (₫)');

  // Engine thresholds
  const [salesWindow, setSalesWindow] = useState('7'); // days
  const [minDOI, setMinDOI] = useState('3'); // days
  const [maxDOI, setMaxDOI] = useState('45'); // days
  const [slowDays, setSlowDays] = useState('14'); // days
  const [minMargin, setMinMargin] = useState('10'); // %
  const [maxPriceChange, setMaxPriceChange] = useState('15'); // %

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await apiGetDecisionConfig();
        if (config) {
          if (config.targetCoverageDays) setMaxDOI(String(config.targetCoverageDays));
          if (config.safetyDays) setMinDOI(String(config.safetyDays));
          if (config.slowMovingDays) setSlowDays(String(config.slowMovingDays));
          if (config.minimumMarginPct != null) setMinMargin(String(Math.round(config.minimumMarginPct * 100)));
          if (config.maxMarkdownPct != null) setMaxPriceChange(String(Math.round(config.maxMarkdownPct * 100)));
        }
      } catch (_) {}
    }
    loadConfig();
  }, []);

  const handleSaveStore = (e) => {
    e.preventDefault();
    toast({ title: 'Đã lưu thông tin cửa hàng', description: 'Cập nhật hồ sơ thành công.', type: 'success' });
  };

  const handleSaveEngine = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiUpdateDecisionConfig({
        safetyDays: Number(minDOI),
        targetCoverageDays: Number(maxDOI),
        slowMovingDays: Number(slowDays),
        minimumMarginPct: Number(minMargin) / 100,
        maxMarkdownPct: Number(maxPriceChange) / 100,
      });
      toast({
        title: 'Đã lưu tham số Decision Engine',
        description: 'Hệ thống đã lưu vào cơ sở dữ liệu và sẽ áp dụng trong chu kỳ tính toán tiếp theo.',
        type: 'success'
      });
    } catch (err) {
      toast({
        title: 'Lỗi cập nhật cấu hình',
        description: err?.response?.data?.error?.message || err?.message || 'Không thể lưu cấu hình',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetEngine = async () => {
    setSalesWindow('7');
    setMinDOI('3');
    setMaxDOI('45');
    setSlowDays('14');
    setMinMargin('10');
    setMaxPriceChange('15');
    try {
      await apiUpdateDecisionConfig({
        safetyDays: 3,
        targetCoverageDays: 45,
        slowMovingDays: 14,
        minimumMarginPct: 0.1,
        maxMarkdownPct: 0.15,
      });
    } catch (_) {}
    toast({ title: 'Đã khôi phục mặc định', description: 'Các tham số đã được đưa về cấu hình khuyến nghị.', type: 'info' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Cài đặt hệ thống (System Settings)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cấu hình thông tin cửa hàng, phân quyền và điều chỉnh các ngưỡng tham số của thuật toán AI Decision Engine.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('engine')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'engine'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Tham số Decision Engine
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'store'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Store className="w-4 h-4" />
          Thông tin cửa hàng
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bell className="w-4 h-4" />
          Thông báo & Cảnh báo
        </button>
      </div>

      {/* Tab 1: Decision Engine Thresholds */}
      {activeTab === 'engine' && (
        <form onSubmit={handleSaveEngine} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-start border-b border-border pb-4">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Cấu hình thuật toán gợi ý giá & cảnh báo tồn kho
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Các thông số này ảnh hưởng trực tiếp đến thời điểm kích hoạt cảnh báo rủi ro và biên độ đề xuất giá bán.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetEngine}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Khôi phục mặc định
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Sales Velocity Window */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>Cửa sổ tính tốc độ bán (Moving Average)</span>
                <span className="text-blue-600 font-bold">{salesWindow} ngày</span>
              </label>
              <input
                type="range"
                min="3"
                max="30"
                value={salesWindow}
                onChange={(e) => setSalesWindow(e.target.value)}
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-muted-foreground">
                Số ngày dữ liệu gần nhất được dùng để tính tốc độ tiêu thụ trung bình (sp/ngày).
              </p>
            </div>

            {/* Min DOI */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>Ngưỡng cảnh báo hết hàng (Min DOI)</span>
                <span className="text-red-600 font-bold">{minDOI} ngày</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={minDOI}
                onChange={(e) => setMinDOI(e.target.value)}
                className="w-full accent-red-600"
              />
              <p className="text-[11px] text-muted-foreground">
                Kích hoạt cảnh báo đỏ khi số ngày tồn kho còn lại (DOI) nhỏ hơn hoặc bằng giá trị này.
              </p>
            </div>

            {/* Max DOI */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>Ngưỡng cảnh báo tồn quá nhiều (Overstock DOI)</span>
                <span className="text-amber-600 font-bold">{maxDOI} ngày</span>
              </label>
              <input
                type="range"
                min="20"
                max="90"
                value={maxDOI}
                onChange={(e) => setMaxDOI(e.target.value)}
                className="w-full accent-amber-600"
              />
              <p className="text-[11px] text-muted-foreground">
                Kích hoạt cảnh báo tồn kho ứ đọng khi số ngày tồn kho vượt quá giá trị này.
              </p>
            </div>

            {/* Slow Moving Days */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>Số ngày không bán để coi là bán chậm</span>
                <span className="text-amber-600 font-bold">{slowDays} ngày</span>
              </label>
              <input
                type="range"
                min="7"
                max="60"
                value={slowDays}
                onChange={(e) => setSlowDays(e.target.value)}
                className="w-full accent-amber-600"
              />
              <p className="text-[11px] text-muted-foreground">
                Nếu một mặt hàng không phát sinh đơn trong khoảng thời gian này, hệ thống sẽ đề xuất xả hàng.
              </p>
            </div>

            {/* Min Profit Margin */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>Biên lợi nhuận an toàn tối thiểu (Min Margin)</span>
                <span className="text-emerald-600 font-bold">{minMargin}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={minMargin}
                onChange={(e) => setMinMargin(e.target.value)}
                className="w-full accent-emerald-600"
              />
              <p className="text-[11px] text-muted-foreground">
                Giá gợi ý từ AI không bao giờ được thấp hơn ngưỡng này trừ khi có sự ghi đè (override) rõ ràng.
              </p>
            </div>

            {/* Max Price Change */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>Biên độ biến động giá tối đa mỗi lần gợi ý</span>
                <span className="text-blue-600 font-bold">±{maxPriceChange}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={maxPriceChange}
                onChange={(e) => setMaxPriceChange(e.target.value)}
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-muted-foreground">
                Giới hạn mức tăng hoặc giảm tối đa nhằm tránh gây sốc tâm lý người tiêu dùng.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              <Save className="w-4 h-4" />
              Lưu cấu hình tham số
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Store Information */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStore} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-base text-foreground border-b border-border pb-3">
            Hồ sơ cửa hàng & Tiền tệ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1">Tên cửa hàng</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Hotline liên hệ</label>
              <input
                type="text"
                value={hotline}
                onChange={(e) => setHotline(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Địa chỉ kho hàng chính</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Đơn vị tiền tệ hiển thị</label>
              <input
                type="text"
                value={currency}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Múi giờ hệ thống</label>
              <input
                type="text"
                value="Asia/Ho_Chi_Minh (GMT+7)"
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              <Save className="w-4 h-4" />
              Lưu thông tin cửa hàng
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-base text-foreground border-b border-border pb-3">
            Cấu hình kênh nhận cảnh báo
          </h3>

          <div className="space-y-3">
            {[
              { title: 'Cảnh báo hết hàng nguy cơ cao (Critical Stockout)', desc: 'Gửi thông báo ngay khi có sản phẩm chạm mức 0 hoặc DOI < 2 ngày.', checked: true },
              { title: 'Gợi ý giá mới từ AI Decision Engine', desc: 'Thông báo hàng ngày khi có đề xuất giá mới cần phê duyệt.', checked: true },
              { title: 'Cảnh báo hàng bán chậm (Slow-moving)', desc: 'Tổng hợp hàng tuần các mặt hàng đọng vốn lâu ngày.', checked: false },
              { title: 'Báo cáo doanh số cuối ngày', desc: 'Tự động gửi thống kê doanh thu và đơn hàng mỗi 22:00 tối.', checked: true }
            ].map((item, idx) => (
              <label key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/20 cursor-pointer">
                <input type="checkbox" defaultChecked={item.checked} className="mt-0.5 rounded border-border text-blue-600" />
                <div>
                  <span className="font-bold text-foreground text-sm block">{item.title}</span>
                  <span className="text-muted-foreground">{item.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
