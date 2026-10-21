import React from 'react';
import { createPortal } from 'react-dom';

function safeNum(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'object') {
    if (typeof val.toNumber === 'function') return val.toNumber();
    if (Array.isArray(val.d) && val.d.length > 0) {
      return Number(val.d[0]) * (val.s < 0 ? -1 : 1);
    }
    return 0;
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function formatVND(num) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(safeNum(num));
}

/**
 * ReceiptPrintContent: Giao diện hóa đơn bán lẻ chuẩn POS K80 (80mm)
 * Thiết kế siêu gọn gàng, tinh tế, đảm bảo luôn vừa khít 1 trang in (Page 1 of 1).
 */
export function ReceiptPrintContent({ data, isPreview = false }) {
  if (!data) return null;

  return (
    <div
      className={`receipt-content-wrapper font-sans text-slate-900 bg-white ${
        isPreview ? 'p-5 max-h-[75vh] overflow-y-auto select-none' : 'p-2'
      }`}
      style={{
        width: '100%',
        maxWidth: isPreview ? '400px' : '78mm',
        margin: '0 auto',
        fontSize: '11px',
        lineHeight: '1.3',
        color: '#000000',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* ── THÔNG TIN CỬA HÀNG ── */}
      <div className="text-center pb-2 mb-2 border-b border-dashed border-gray-400" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-black leading-tight">
          {data.storeName || 'CỬA HÀNG STOCKPILOT'}
        </h2>
        {data.storeAddress && (
          <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">{data.storeAddress}</p>
        )}
        {data.storePhone && (
          <p className="text-[10px] text-gray-600 leading-snug">ĐT: {data.storePhone}</p>
        )}
        <div className="mt-2 pt-1 border-t border-dotted border-gray-300">
          <h3 className="text-xs font-black uppercase tracking-wider text-black">HÓA ĐƠN BÁN HÀNG</h3>
          <p className="text-[10px] text-gray-700 font-mono mt-0.5 font-semibold">Số HĐ: {data.orderNumber}</p>
          <p className="text-[10px] text-gray-500">{data.createdAt}</p>
        </div>
      </div>

      {/* ── THÔNG TIN KHÁCH HÀNG & THU NGÂN ── */}
      <div className="pb-1.5 mb-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="flex justify-between">
          <span>Khách hàng: <strong>{data.customerName || 'Khách lẻ'}</strong></span>
          {data.customerPhone && <span>SĐT: {data.customerPhone}</span>}
        </div>
        <div className="flex justify-between">
          <span>Thu ngân: {data.cashier || 'Thu ngân'}</span>
          <span>PTTT: <strong className="uppercase">{data.paymentMethod || 'Tiền mặt'}</strong></span>
        </div>
      </div>

      {/* ── BẢNG DANH SÁCH MẶT HÀNG ── */}
      <table className="w-full text-left border-collapse text-[10px] mb-2" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <thead>
          <tr className="border-b border-gray-800 text-[10px]">
            <th className="py-1 font-bold">Mặt hàng</th>
            <th className="py-1 text-center font-bold w-6">SL</th>
            <th className="py-1 text-right font-bold w-14">Đ.Giá</th>
            <th className="py-1 text-right font-bold w-16">T.Tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {(data.items || []).map((it, idx) => (
            <tr key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <td className="py-1 pr-1">
                <span className="font-semibold block leading-tight">{it.name}</span>
                {it.sku && <span className="text-[9px] text-gray-500 font-mono">{it.sku}</span>}
              </td>
              <td className="py-1 text-center align-top font-medium">{it.quantity}</td>
              <td className="py-1 text-right align-top tabular-nums">{safeNum(it.price).toLocaleString('vi-VN')}</td>
              <td className="py-1 text-right align-top font-bold tabular-nums">
                {safeNum(it.subtotal || it.quantity * it.price).toLocaleString('vi-VN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TỔNG KẾT TIỀN HÀNG ── */}
      <div className="border-t border-dashed border-gray-400 pt-1.5 space-y-0.5 text-[10px]" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="flex justify-between">
          <span className="text-gray-600">Tổng tiền hàng:</span>
          <span className="font-medium tabular-nums">{formatVND(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Chiết khấu:</span>
            <span className="font-medium text-red-600 tabular-nums">-{formatVND(data.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-black pt-1 border-t border-gray-600 text-black">
          <span>THANH TOÁN:</span>
          <span className="tabular-nums">{formatVND(data.total)}</span>
        </div>
        {data.amountGiven !== undefined && data.amountGiven > 0 && (
          <div className="flex justify-between text-gray-700 pt-0.5">
            <span>Tiền khách đưa:</span>
            <span className="font-medium tabular-nums">{formatVND(data.amountGiven)}</span>
          </div>
        )}
        {data.changeDue !== undefined && (
          <div className="flex justify-between text-gray-700">
            <span>Tiền trả lại:</span>
            <span className="font-bold text-black tabular-nums">{formatVND(data.changeDue)}</span>
          </div>
        )}
      </div>

      {data.totalInWords && (
        <div className="pt-1 italic text-[9px] text-gray-600 text-center" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          ({data.totalInWords})
        </div>
      )}

      {/* ── LỜI CẢM ƠN & CHÂN TRANG ── */}
      <div className="text-center pt-2 mt-2 border-t border-dashed border-gray-400 space-y-0.5" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <p className="font-bold text-black text-[10px]">Cảm ơn & Hẹn gặp lại Quý khách!</p>
        <p className="text-[8px] text-gray-400">Hệ thống StockPilot POS Retail</p>
      </div>
    </div>
  );
}

/**
 * ReceiptPrintPortal: Render trực tiếp vào document.body bằng React Portal.
 * Giúp cô lập 100% tài liệu in khỏi #root, triệt tiêu hoàn toàn trang rác/trang thứ 2.
 */
export function ReceiptPrintPortal({ data }) {
  if (!data || typeof document === 'undefined') return null;

  return createPortal(
    <div id="receipt-print-portal" aria-hidden="true">
      <ReceiptPrintContent data={data} isPreview={false} />
    </div>,
    document.body
  );
}
