// Đọc file Excel/CSV xuất từ phần mềm bán hàng khác (KiotViet, Sapo, MISA eShop...) hoặc file tự soạn
// và chuyển thành dữ liệu cho API nhập của StockPilot. Cột được nhận diện theo tên (không phân biệt hoa thường,
// có dấu hay không dấu, bỏ qua dấu *), nên chịu được việc mỗi phần mềm đặt tên và thứ tự cột khác nhau.

export const IMPORT_KINDS = {
  PRODUCTS: 'PRODUCTS',
  SALES: 'SALES',
};

// Tên cột chuẩn hóa (bỏ dấu, chữ thường, bỏ ký tự đặc biệt) → trường của StockPilot. Thứ tự = độ ưu tiên.
const PRODUCT_COLUMNS = {
  sku: ['mahang', 'mahanghoa', 'masku', 'masp', 'masanpham', 'sku', 'mavattu'],
  productName: ['tenhang', 'tenhanghoa', 'tensanpham', 'tenvattu', 'productname', 'ten'],
  // "Loại hàng hóa" trong mẫu Excel miễn phí của KiotViet là nhóm hàng; khác "Loại hàng" (hàng hóa/dịch vụ) của file xuất.
  categoryName: ['nhomhang3cap', 'nhomhang', 'danhmuc', 'nhomsanpham', 'loaisanpham', 'loaihanghoa', 'nhomvattu', 'category', 'categoryname'],
  barcode: ['mavach', 'barcode', 'mabarcode'],
  // Sapo: "LC_CN1_Giá vốn khởi tạo" (giá vốn theo chi nhánh) được ưu tiên hơn "PL_Giá nhập".
  costPrice: ['giavon', 'giavonkhoitao', 'gianhap', 'costprice'],
  sellingPrice: ['giaban', 'giabanle', 'dongiaban', 'sellingprice', 'gia'],
  initialQuantity: [
    'tonkho', 'tonkhohientai', 'tonkhobandau', 'soluongton', 'soluongtonkho', 'soluonghangcotrongkho', 'soluongtrongkho',
    'ton', 'initialquantity', 'soluong',
  ],
  minStockLevel: ['tonnhonhat', 'tontoithieu', 'minstocklevel'],
  maxStockLevel: ['tonlonnhat', 'tontoida', 'maxstocklevel'],
  productType: ['loaihang'],
  isSelling: ['dangkinhdoanh'],
};

const SALES_COLUMNS = {
  externalOrderId: ['mahoadon', 'mahd', 'madonhang', 'sochungtu', 'chungtu', 'externalorderid', 'orderid'],
  soldAt: [
    'thoigian', 'thoigiantao', 'ngayban', 'ngaytaodon', 'ngaydathang', 'ngaychungtu', 'ngaythang', 'ngaythangphatsinh',
    'ngaytao', 'ngay', 'soldat',
  ],
  sku: ['mahang', 'mahanghoa', 'masku', 'masp', 'masanpham', 'sku'],
  quantity: ['soluong', 'soluongsanpham', 'sl', 'quantity'],
  // "Giá bán" trong chi tiết hóa đơn KiotViet là giá sau giảm; "Đơn giá" là giá niêm yết.
  unitPrice: ['giaban', 'giasanpham', 'unitprice', 'gia'],
  listPrice: ['dongia'],
  costPrice: ['giavon', 'costprice'],
  // File đơn hàng Sapo theo sản phẩm chỉ có tổng tiền dòng: suy ra đơn giá = thành tiền / số lượng.
  lineTotal: ['thanhtien', 'tongtientungsanpham', 'tongtien'],
  status: ['trangthai', 'trangthaidonhang', 'trangthaihoadon'],
};

export const FIELD_LABELS = {
  sku: 'Mã hàng',
  productName: 'Tên hàng',
  categoryName: 'Nhóm hàng',
  barcode: 'Mã vạch',
  costPrice: 'Giá vốn',
  sellingPrice: 'Giá bán',
  initialQuantity: 'Tồn kho',
  minStockLevel: 'Tồn nhỏ nhất',
  maxStockLevel: 'Tồn lớn nhất',
  productType: 'Loại hàng',
  isSelling: 'Đang kinh doanh',
  externalOrderId: 'Mã hóa đơn',
  soldAt: 'Thời gian bán',
  quantity: 'Số lượng',
  unitPrice: 'Giá bán',
  listPrice: 'Đơn giá',
  status: 'Trạng thái',
  lineTotal: 'Thành tiền',
};

const REQUIRED = {
  PRODUCTS: ['sku', 'productName'],
  SALES: ['sku', 'quantity', 'soldAt'],
};

const MAX_HEADER_SCAN_ROWS = 10;
const DEFAULT_MAX_STOCK = 1000;
// Loại hàng KiotViet không có tồn kho thật: bỏ qua khi nhập.
const NON_STOCK_TYPES = ['dichvu', 'combodonggoi', 'combo'];

// Sapo đặt tiền tố cho cột giá/tồn: "PL_" (bảng giá) và "LC_<mã chi nhánh>_" (theo chi nhánh).
const SAPO_PREFIX = /^\s*(PL|LC_[A-Za-z0-9]+)_/i;

export function normalizeHeader(value) {
  return String(value ?? '')
    .replace(SAPO_PREFIX, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function matchColumns(headerRow, columns) {
  const normalized = headerRow.map(normalizeHeader);
  const mapping = {};
  const used = new Set();
  for (const [field, aliases] of Object.entries(columns)) {
    for (const alias of aliases) {
      const index = normalized.findIndex((h, i) => h === alias && !used.has(i));
      if (index !== -1) {
        mapping[field] = index;
        used.add(index);
        break;
      }
    }
  }
  return mapping;
}

function missingFields(mapping, kind) {
  const missing = REQUIRED[kind].filter((field) => mapping[field] === undefined);
  // Hóa đơn cần ít nhất một cột giá: "Giá bán" hoặc "Đơn giá".
  if (kind === IMPORT_KINDS.SALES && mapping.unitPrice === undefined && mapping.listPrice === undefined && mapping.lineTotal === undefined) {
    missing.push('unitPrice');
  }
  return missing;
}

function isComplete(mapping, kind) {
  return missingFields(mapping, kind).length === 0;
}

/**
 * Tìm dòng tiêu đề (trong 10 dòng đầu) và đoán loại file.
 * Trả về { kind, headerIndex, headers, mapping, missing } hoặc kind = null nếu không nhận ra.
 */
export function detectSheet(rows, preferredKind) {
  const kinds = preferredKind ? [preferredKind] : [IMPORT_KINDS.SALES, IMPORT_KINDS.PRODUCTS];
  let best = null;

  for (let i = 0; i < Math.min(rows.length, MAX_HEADER_SCAN_ROWS); i += 1) {
    for (const kind of kinds) {
      const mapping = matchColumns(rows[i] || [], kind === IMPORT_KINDS.SALES ? SALES_COLUMNS : PRODUCT_COLUMNS);
      const score = Object.keys(mapping).length + (isComplete(mapping, kind) ? 100 : 0);
      if (!best || score > best.score) best = { kind, headerIndex: i, mapping, score };
    }
  }

  if (!best || best.score < 2) return { kind: null, headerIndex: -1, headers: [], mapping: {}, missing: [] };
  const missing = missingFields(best.mapping, best.kind);
  return {
    kind: best.kind,
    headerIndex: best.headerIndex,
    headers: (rows[best.headerIndex] || []).map((h) => String(h ?? '')),
    mapping: best.mapping,
    missing,
  };
}

function cell(row, mapping, field) {
  const index = mapping[field];
  if (index === undefined) return undefined;
  const value = row[index];
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

function text(value) {
  return value === undefined ? '' : String(value).trim();
}

/** "1.250.000", "1,250,000", "1250000.5", 1250000 → số. Trả về undefined nếu không đọc được. */
export function parseNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  let s = String(value).trim().replace(/\s|₫|đ|vnd/gi, '');
  if (s === '') return undefined;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    // Dấu xuất hiện sau cùng là dấu thập phân.
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma !== -1) {
    s = /,\d{3}(,|$)/.test(s) && !/,\d{1,2}$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (lastDot !== -1 && /\.\d{3}(\.|$)/.test(s) && !/\.\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Date của Excel, "dd/MM/yyyy[ HH:mm[:ss]]" (kiểu KiotViet) hoặc ISO → Date. */
export function parseDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const [, d, mo, y, h = '0', mi = '0', se = '0'] = m;
    // Giờ trong file KiotViet là giờ Việt Nam (UTC+7).
    const date = new Date(Date.UTC(+y, +mo - 1, +d, +h - 7, +mi, +se));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? undefined : iso;
}

function slugCode(name) {
  return (
    normalizeHeader(name)
      .toUpperCase()
      .slice(0, 40) || 'KHAC'
  );
}

/**
 * Chuyển các dòng dữ liệu thành payload cho POST /import/preview (sản phẩm).
 * Trả về { items, skipped: [{ row, reason }] }. `row` là số dòng trong Excel (bắt đầu từ 1).
 */
export function toProductItems(rows, detection) {
  const { headerIndex, mapping } = detection;
  const items = [];
  const skipped = [];

  rows.slice(headerIndex + 1).forEach((row, i) => {
    const excelRow = headerIndex + i + 2;
    if (!row || row.every((v) => v === null || v === undefined || String(v).trim() === '')) return;

    const sku = text(cell(row, mapping, 'sku'));
    const productName = text(cell(row, mapping, 'productName'));
    if (!sku || !productName) {
      skipped.push({ row: excelRow, reason: 'Thiếu mã hàng hoặc tên hàng' });
      return;
    }
    const type = normalizeHeader(cell(row, mapping, 'productType'));
    if (type && NON_STOCK_TYPES.includes(type)) {
      skipped.push({ row: excelRow, reason: `Bỏ qua loại hàng "${text(cell(row, mapping, 'productType'))}" (không quản lý tồn kho)` });
      return;
    }

    // KiotViet ghi nhóm nhiều cấp dạng "Đồ uống>>Trà": lấy cấp cuối làm danh mục.
    const categoryPath = text(cell(row, mapping, 'categoryName'));
    const categoryName = categoryPath ? categoryPath.split('>>').map((s) => s.trim()).filter(Boolean).pop() : 'Chưa phân loại';
    const quantity = parseNumber(cell(row, mapping, 'initialQuantity'));
    const minStock = parseNumber(cell(row, mapping, 'minStockLevel'));
    const maxStock = parseNumber(cell(row, mapping, 'maxStockLevel'));
    const min = minStock !== undefined && minStock > 0 ? Math.round(minStock) : 0;
    const max = maxStock !== undefined && maxStock > 0 ? Math.round(maxStock) : DEFAULT_MAX_STOCK;

    items.push({
      categoryName,
      categoryCode: slugCode(categoryName),
      productName,
      productCode: sku,
      sku,
      barcode: text(cell(row, mapping, 'barcode')) || undefined,
      costPrice: Math.max(0, parseNumber(cell(row, mapping, 'costPrice')) ?? 0),
      sellingPrice: Math.max(0, parseNumber(cell(row, mapping, 'sellingPrice')) ?? 0),
      // Tồn âm trong KiotViet (bán khi chưa nhập) được đưa về 0.
      initialQuantity: quantity !== undefined && quantity > 0 ? Math.round(quantity) : 0,
      minStockLevel: min,
      maxStockLevel: Math.max(max, min),
    });
  });

  return { items, skipped };
}

/** Chuyển chi tiết hóa đơn thành payload cho POST /historical-sales/preview. Hóa đơn đã hủy bị bỏ qua. */
export function toSalesRows(rows, detection) {
  const { headerIndex, mapping } = detection;
  const salesRows = [];
  const skipped = [];

  rows.slice(headerIndex + 1).forEach((row, i) => {
    const excelRow = headerIndex + i + 2;
    if (!row || row.every((v) => v === null || v === undefined || String(v).trim() === '')) return;

    const status = normalizeHeader(cell(row, mapping, 'status'));
    if (status && (status.includes('huy') || status.includes('cancel'))) {
      skipped.push({ row: excelRow, reason: 'Hóa đơn đã hủy' });
      return;
    }
    const sku = text(cell(row, mapping, 'sku'));
    const quantity = parseNumber(cell(row, mapping, 'quantity'));
    const lineTotal = parseNumber(cell(row, mapping, 'lineTotal'));
    const unitPrice =
      parseNumber(cell(row, mapping, 'unitPrice')) ??
      parseNumber(cell(row, mapping, 'listPrice')) ??
      (lineTotal !== undefined && quantity > 0 ? lineTotal / quantity : undefined);
    const soldAt = parseDate(cell(row, mapping, 'soldAt'));
    if (!sku || !quantity || quantity <= 0 || unitPrice === undefined || !soldAt) {
      skipped.push({ row: excelRow, reason: 'Thiếu hoặc sai mã hàng, số lượng, giá bán hay thời gian' });
      return;
    }
    const costPrice = parseNumber(cell(row, mapping, 'costPrice'));

    salesRows.push({
      externalOrderId: text(cell(row, mapping, 'externalOrderId')) || undefined,
      sku,
      quantity: Math.round(quantity),
      unitPrice: Math.max(0, unitPrice),
      ...(costPrice !== undefined && costPrice >= 0 ? { costPrice } : {}),
      soldAt: soldAt.toISOString(),
      source: 'KIOTVIET',
    });
  });

  return { rows: salesRows, skipped };
}


/**
 * Đọc CSV (UTF-8, có hoặc không BOM). Tự nhận dấu phân cách , ; hoặc tab theo dòng đầu.
 * Hỗ trợ ô có ngoặc kép, dấu phân cách và xuống dòng bên trong ngoặc kép.
 */
export function parseCsv(content) {
  const textContent = content.replace(/^\uFEFF/, '');
  const firstLine = textContent.split(/\r?\n/, 1)[0] || '';
  const delimiter = [',', ';', '\t'].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ',');

  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < textContent.length; i += 1) {
    const ch = textContent[i];
    if (quoted) {
      if (ch === '"' && textContent[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(value);
      value = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && textContent[i + 1] === '\n') i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += ch;
    }
  }
  if (value !== '' || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

const TEMPLATES = {
  PRODUCTS: [
    ['Mã hàng', 'Tên hàng', 'Nhóm hàng', 'Mã vạch', 'Giá bán', 'Giá vốn', 'Tồn kho', 'Tồn nhỏ nhất', 'Tồn lớn nhất'],
    ['SP001', 'Trà xanh 0 độ 455ml', 'Đồ uống', '8934563000011', '12000', '8000', '25', '5', '200'],
  ],
  SALES: [
    ['Mã hóa đơn', 'Thời gian', 'Mã hàng', 'Số lượng', 'Giá bán', 'Giá vốn'],
    ['HD0001', '21/10/2026 14:30', 'SP001', '2', '11000', '8000'],
  ],
};

/** File mẫu CSV (UTF-8 có BOM để Excel hiển thị đúng tiếng Việt). */
export function buildTemplateCsv(kind) {
  const quote = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return '\uFEFF' + TEMPLATES[kind].map((r) => r.map(quote).join(',')).join('\r\n') + '\r\n';
}

// Tên trang tính gợi ý nội dung: trang "Nhập hàng" có cùng cột với trang "Xuất hàng" nhưng là hàng mua vào,
// nên không bao giờ được chọn làm lịch sử bán hàng.
const SALES_SHEET_HINTS = ['xuat', 'ban', 'hoadon', 'donhang', 'sales', 'order', 'invoice'];
const PURCHASE_SHEET_HINTS = ['nhap', 'muahang', 'purchase'];
const PRODUCT_SHEET_HINTS = ['danhmuc', 'hanghoa', 'sanpham', 'product', 'tonkho'];

/**
 * Chọn trang tính phù hợp nhất với loại dữ liệu trong file nhiều trang (vd. mẫu Excel có các trang
 * Danh mục / Nhập hàng / Xuất hàng / Báo cáo). Trả về { index, detection } hoặc index = -1 nếu không trang nào khớp.
 */
export function pickSheet(sheets, kind) {
  let best = { index: -1, detection: null, score: -Infinity };
  sheets.forEach((sheet, index) => {
    const name = normalizeHeader(sheet.sheet);
    if (kind === IMPORT_KINDS.SALES && PURCHASE_SHEET_HINTS.some((h) => name.includes(h))) return;
    const detection = detectSheet(sheet.data, kind);
    if (!detection.kind) return;
    const hints = kind === IMPORT_KINDS.SALES ? SALES_SHEET_HINTS : PRODUCT_SHEET_HINTS;
    const score =
      (detection.missing.length === 0 ? 100 : 0) +
      Object.keys(detection.mapping).length +
      (hints.some((h) => name.includes(h)) ? 10 : 0);
    if (score > best.score) best = { index, detection, score };
  });
  return { index: best.index, detection: best.detection };
}
