import React, { useState } from 'react';
import { CheckCircle2, Download, FileJson, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useToast } from '../common/Toast';
import { apiDownloadStoreDataExport } from '../../services/storeDataService';

const INCLUDED = {
  vi: ['Thông tin cửa hàng, kho, danh mục, sản phẩm, SKU (kèm giá vốn)', 'Tồn kho và lịch sử biến động kho', 'Đơn hàng, dòng đơn, phiếu trả hàng, giao dịch thanh toán', 'Danh sách tài khoản nhân viên (không có mật khẩu)'],
  en: ['Store profile, warehouses, categories, products, SKUs (with cost)', 'Stock levels and stock movement history', 'Orders, order lines, returns and payments', 'Staff accounts (no passwords)'],
};
const EXCLUDED = {
  vi: ['Mật khẩu và phiên đăng nhập', 'Khóa kết nối cổng thanh toán PayOS / MoMo', 'Nội dung trò chuyện với Trợ lý AI'],
  en: ['Passwords and login sessions', 'PayOS / MoMo gateway credentials', 'AI assistant conversations'],
};

/**
 * Tab "Dữ liệu" trong Cài đặt của chủ cửa hàng: tải bản sao dữ liệu cửa hàng (JSON).
 * Dùng các class `st-*` sẵn có của SettingsPage để đồng bộ giao diện.
 */
export function StoreDataExportPanel({ isEn = false }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const lang = isEn ? 'en' : 'vi';

  const download = async () => {
    setLoading(true);
    try {
      const fileName = await apiDownloadStoreDataExport();
      toast({ type: 'success', title: isEn ? 'Export ready' : 'Đã tải dữ liệu', message: fileName });
    } catch (err) {
      toast({
        type: 'error',
        title: isEn ? 'Export failed' : 'Không xuất được dữ liệu',
        message: err?.response?.data?.error?.message || (isEn ? 'Please try again later.' : 'Vui lòng thử lại sau.'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-fade" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="st-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
            <FileJson size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="st-section-title">{isEn ? 'Download a copy of your store data' : 'Tải bản sao dữ liệu cửa hàng'}</div>
            <div className="st-section-desc" style={{ marginTop: 4 }}>
              {isEn
                ? 'A JSON file you can keep as a backup or move to another system. Up to 50,000 rows per table.'
                : 'File JSON để lưu trữ dự phòng hoặc chuyển sang hệ thống khác. Tối đa 50.000 dòng mỗi loại dữ liệu.'}
            </div>
          </div>
          <button type="button" className="st-btn-primary" onClick={download} disabled={loading}>
            {loading ? <Loader2 size={14} className="st-spinning" /> : <Download size={14} />}
            {loading ? (isEn ? 'Preparing…' : 'Đang chuẩn bị…') : isEn ? 'Download (JSON)' : 'Tải xuống (JSON)'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{isEn ? 'Included' : 'Bao gồm'}</div>
            {INCLUDED[lang].map((t) => (
              <div key={t} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: '#334155', marginBottom: 6 }}>
                <CheckCircle2 size={14} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} /> {t}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{isEn ? 'Never included' : 'Không bao giờ xuất'}</div>
            {EXCLUDED[lang].map((t) => (
              <div key={t} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: '#334155', marginBottom: 6 }}>
                <XCircle size={14} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }} /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="st-info-box" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          {isEn
            ? 'File contains cost prices and customer phone numbers — store it securely. Each export is recorded in the audit log; limited to 5 exports per hour.'
            : 'File có giá vốn và số điện thoại khách hàng — hãy lưu ở nơi an toàn. Mỗi lần xuất đều được ghi nhật ký; tối đa 5 lần mỗi giờ.'}
        </span>
      </div>
    </div>
  );
}

export default StoreDataExportPanel;
