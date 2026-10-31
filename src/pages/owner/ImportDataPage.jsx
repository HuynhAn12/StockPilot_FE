import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import readXlsxFile from 'read-excel-file/browser';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Package, Receipt, LifeBuoy, ArrowLeft, Download, ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import {
  IMPORT_KINDS, FIELD_LABELS, detectSheet, pickSheet, toProductItems, toSalesRows, parseCsv, buildTemplateCsv,
} from '../../lib/spreadsheetImport';
import { apiPreviewProductImport, apiCommitProductImport, apiPreviewSalesImport, apiCommitSalesImport } from '../../services/importService';
import { adminStyles as ui } from '../admin/adminStyles';

const SALES_BATCH = 5000;
const MAX_FILE_MB = 10;
const ACCEPTED = /\.(xlsx|csv)$/i;

const KINDS = [
  { id: IMPORT_KINDS.PRODUCTS, icon: Package, title: 'Sản phẩm & tồn kho', desc: 'Mã hàng, tên, nhóm hàng, giá bán, giá vốn, tồn kho hiện tại.' },
  { id: IMPORT_KINDS.SALES, icon: Receipt, title: 'Lịch sử bán hàng', desc: 'Hóa đơn cũ giúp dự báo và cảnh báo tồn kho chính xác hơn.' },
];

// Hướng dẫn xuất file theo từng phần mềm, đối chiếu tài liệu chính thức (10/2026):
// kiotviet.vn/huong-dan-su-dung-kiotviet, help.sapo.vn, helpeshop.misa.vn. Tên menu có thể đổi theo phiên bản.
const SOURCES = [
  {
    id: 'kiotviet',
    name: 'KiotViet',
    PRODUCTS: ['Mở Hàng hóa → Danh sách hàng hóa.', 'Bấm Xuất file để tải toàn bộ hàng hóa.'],
    SALES: ['Mở Giao dịch → Hóa đơn, lọc khoảng thời gian cần chuyển.', 'Bấm Xuất file, chọn File chi tiết (mỗi dòng một mặt hàng).'],
    note: 'Đang dùng file Excel mẫu miễn phí của KiotViet (chưa dùng phần mềm)? Tải nguyên file lên: hệ thống tự lấy trang Danh mục cho sản phẩm và trang Xuất hàng cho lịch sử bán, bỏ qua trang Nhập hàng.',
  },
  {
    id: 'sapo',
    name: 'Sapo',
    PRODUCTS: ['Mở Sản phẩm → Danh sách sản phẩm.', 'Bấm Xuất file. Các cột như PL_Giá bán lẻ, LC_CN1_Tồn kho ban đầu được nhận diện tự động.'],
    SALES: ['Mở Đơn hàng → Danh sách đơn hàng, lọc khoảng thời gian.', 'Bấm Xuất file, chọn File tổng quan theo sản phẩm.'],
  },
  {
    id: 'misa',
    name: 'MISA eShop',
    PRODUCTS: ['Mở Danh mục → Hàng hóa.', 'Xuất danh sách hàng hóa ra Excel (hoặc dùng tệp mẫu Nhập khẩu đã điền).'],
    SALES: ['Mở báo cáo bán hàng chi tiết theo mặt hàng.', 'Xuất ra Excel, cần có cột mã SKU, số lượng, đơn giá và ngày bán.'],
  },
  {
    id: 'other',
    name: 'Excel / phần mềm khác',
    PRODUCTS: ['Xuất danh sách sản phẩm ra Excel từ phần mềm đang dùng, hoặc điền vào file mẫu bên cạnh.'],
    SALES: ['Xuất chi tiết hóa đơn (mỗi dòng một mặt hàng) ra Excel, hoặc điền vào file mẫu bên cạnh.'],
  },
];

const REQUIRED_HINT = {
  PRODUCTS: 'Bắt buộc: Mã hàng, Tên hàng. Nên có: Nhóm hàng, Giá bán, Giá vốn, Tồn kho.',
  SALES: 'Bắt buộc: Mã hàng, Số lượng, Giá bán (hoặc Đơn giá), Thời gian bán. Mã hàng phải có sẵn trong StockPilot.',
};

function Step({ n, title, active, done, children }) {
  return (
    <section className={`${ui.card} p-5 transition-opacity ${active ? '' : 'opacity-60'}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <span
          className={`w-6 h-6 rounded-full text-[12px] font-semibold flex items-center justify-center ${
            done ? 'bg-emerald-600 text-white' : active ? 'bg-[#3B82F6] text-white' : 'bg-slate-200 text-[#64748B]'
          }`}
        >
          {done ? '✓' : n}
        </span>
        <h2 className="text-[15px] font-semibold text-[#334155]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function downloadTemplate(kind) {
  const blob = new Blob([buildTemplateCsv(kind)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = kind === IMPORT_KINDS.PRODUCTS ? 'stockpilot-mau-san-pham.csv' : 'stockpilot-mau-lich-su-ban-hang.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** Every sheet of the workbook as [{ sheet, data }]; a CSV is a single sheet. */
async function readSheets(file) {
  if (/\.csv$/i.test(file.name)) return [{ sheet: 'CSV', data: parseCsv(await file.text()) }];
  return readXlsxFile(file);
}

function convertSheet(sheet, kind, detection = detectSheet(sheet.data, kind)) {
  if (!detection.kind) return { detection, payload: [], skipped: [] };
  const converted = kind === IMPORT_KINDS.PRODUCTS ? toProductItems(sheet.data, detection) : toSalesRows(sheet.data, detection);
  return { detection, payload: converted.items || converted.rows, skipped: converted.skipped };
}

export function ImportDataPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [kind, setKind] = useState(searchParams.get('type') === IMPORT_KINDS.SALES ? IMPORT_KINDS.SALES : IMPORT_KINDS.PRODUCTS);
  const [sourceId, setSourceId] = useState('kiotviet');
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [productMode, setProductMode] = useState('CREATE_ONLY');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState('');

  const reset = () => {
    setFileName('');
    setParsed(null);
    setSheets([]);
    setPreview(null);
    setResult(null);
  };

  const selectKind = (next) => {
    setKind(next);
    reset();
  };

  const handleFile = async (file) => {
    if (!file) return;
    reset();
    if (!ACCEPTED.test(file.name)) {
      toast({ type: 'warning', title: 'Chưa hỗ trợ định dạng này', description: 'Dùng file .xlsx hoặc .csv. File .xls cũ: mở bằng Excel rồi lưu lại dạng .xlsx.' });
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ type: 'warning', title: 'File quá lớn', description: `Tối đa ${MAX_FILE_MB} MB. Hãy chia file theo khoảng thời gian.` });
      return;
    }
    setBusy('read');
    try {
      const workbook = await readSheets(file);
      // Workbooks such as the free KiotViet Excel template hold several sheets (catalogue, purchases, sales...).
      const picked = pickSheet(workbook, kind);
      const index = picked.index >= 0 ? picked.index : 0;
      setFileName(file.name);
      setSheets(workbook);
      setSheetIndex(index);
      setParsed(convertSheet(workbook[index], kind, picked.detection || undefined));
    } catch {
      toast({ type: 'error', title: 'Không đọc được file', description: 'File có thể bị hỏng hoặc đang đặt mật khẩu. Hãy xuất lại file.' });
    } finally {
      setBusy('');
    }
  };

  const productPayload = () =>
    productMode === 'UPSERT_METADATA' ? parsed.payload.map((item) => ({ ...item, initialQuantity: 0 })) : parsed.payload;

  const handleCheck = async () => {
    setBusy('check');
    setPreview(null);
    try {
      if (kind === IMPORT_KINDS.PRODUCTS) {
        const res = await apiPreviewProductImport(productPayload(), productMode);
        setPreview({ batches: [res.jobId], total: res.totalRows, valid: res.validRows, invalid: res.invalidRows, warnings: res.warningRows, issues: res.issues || [] });
      } else {
        // Backend nhận tối đa 5.000 dòng/lần: chia lô, mỗi lô một job.
        const totals = { batches: [], total: 0, valid: 0, invalid: 0, warnings: 0, issues: [] };
        for (let i = 0; i < parsed.payload.length; i += SALES_BATCH) {
          const res = await apiPreviewSalesImport(parsed.payload.slice(i, i + SALES_BATCH));
          totals.batches.push(res.jobId);
          totals.total += res.totalRows;
          totals.valid += res.validRows;
          totals.invalid += res.invalidRows;
          totals.warnings += (res.warningRows || 0) + (res.duplicateRows || 0);
          totals.issues.push(
            ...(res.previewSample || [])
              .filter((r) => r.status && r.status !== 'VALID')
              .map((r) => ({
                row: r.rowNumber + i,
                sku: r.sku,
                severity: r.status === 'INVALID' ? 'ERROR' : 'WARNING',
                message: r.message || (r.status === 'DUPLICATE' ? 'Đã nhập trước đó, sẽ bỏ qua' : 'Cần kiểm tra'),
              }))
          );
        }
        setPreview(totals);
      }
    } catch (err) {
      toast({ type: 'error', title: 'Kiểm tra thất bại', description: err?.response?.data?.error?.message || 'Không kết nối được máy chủ.' });
    } finally {
      setBusy('');
    }
  };

  const handleCommit = async () => {
    setBusy('commit');
    try {
      if (kind === IMPORT_KINDS.PRODUCTS) {
        const res = await apiCommitProductImport(preview.batches[0]);
        const sum = res.summary || res.data?.summary || {};
        setResult(`Đã nhập ${sum.createdSkus ?? preview.valid} mã hàng${sum.updatedSkus ? `, cập nhật ${sum.updatedSkus}` : ''}.`);
      } else {
        for (const jobId of preview.batches) await apiCommitSalesImport(jobId);
        setResult(`Đã nhập ${preview.valid.toLocaleString('vi-VN')} dòng lịch sử bán hàng.`);
      }
      toast({ type: 'success', title: 'Nhập dữ liệu thành công' });
    } catch (err) {
      toast({ type: 'error', title: 'Nhập dữ liệu thất bại', description: err?.response?.data?.error?.message || 'Không kết nối được máy chủ.' });
    } finally {
      setBusy('');
    }
  };

  const source = SOURCES.find((s) => s.id === sourceId);
  const detection = parsed?.detection;
  const step2Done = Boolean(parsed && detection?.kind && detection.missing.length === 0 && parsed.payload.length > 0);

  return (
    <div className={ui.pageContainer}>
      <div className={ui.pageHeader}>
        <div>
          <h1 className={ui.pageTitle}>Nhập dữ liệu</h1>
          <p className={ui.pageDesc}>Chuyển sản phẩm và lịch sử bán hàng từ phần mềm cũ hoặc file Excel sang StockPilot.</p>
        </div>
        <button type="button" onClick={() => navigate('/support?new=DATA_IMPORT')} className={ui.btnSecondary}>
          <LifeBuoy className="w-3.5 h-3.5" />
          Nhờ đội hỗ trợ
        </button>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        {/* Các bước */}
        <div className="space-y-4 min-w-0">
          <Step n={1} title="Chọn loại dữ liệu" active done={Boolean(parsed)}>
            <div className="grid sm:grid-cols-2 gap-3">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => selectKind(k.id)}
                  className={`flex gap-3 text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                    kind === k.id ? 'border-[#3B82F6] ring-1 ring-[#3B82F6] bg-blue-50/40' : 'border-[#E5E7EB] hover:border-[#93C5FD]'
                  }`}
                >
                  <span className="w-9 h-9 rounded-lg bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
                    <k.icon className="w-[18px] h-[18px]" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-medium text-[#334155]">{k.title}</span>
                    <span className="block text-[13px] text-[#64748B] mt-0.5">{k.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {kind === IMPORT_KINDS.SALES && (
              <p className="mt-3 text-[13px] text-[#64748B]">Nhập sản phẩm trước: lịch sử bán hàng chỉ ghép được với mã hàng đã có trong StockPilot.</p>
            )}
          </Step>

          <Step n={2} title="Tải file lên" active done={step2Done}>
            <label
              className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-blue-50/30 cursor-pointer text-center transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files?.[0]);
              }}
            >
              {busy === 'read' ? <Loader2 className="w-7 h-7 animate-spin text-[#3B82F6]" /> : <Upload className="w-7 h-7 text-[#94A3B8]" />}
              <span className="text-[14px] text-[#334155]">
                {fileName ? (
                  <span className="inline-flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    {fileName}
                    <span className="text-[#3B82F6] ml-1">· Chọn file khác</span>
                  </span>
                ) : (
                  'Kéo thả file vào đây hoặc bấm để chọn'
                )}
              </span>
              <span className="text-[12px] text-[#94A3B8]">Excel (.xlsx) hoặc CSV · tối đa {MAX_FILE_MB} MB</span>
              <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} onClick={(e) => (e.target.value = '')} />
            </label>

            {sheets.length > 1 && (
              <label className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[#475569]">
                Trang tính:
                <select
                  value={sheetIndex}
                  onChange={(e) => {
                    const index = Number(e.target.value);
                    setSheetIndex(index);
                    setPreview(null);
                    setParsed(convertSheet(sheets[index], kind));
                  }}
                  className={`${ui.select} w-auto`}
                >
                  {sheets.map((sh, i) => (
                    <option key={sh.sheet} value={i}>
                      {sh.sheet}
                    </option>
                  ))}
                </select>
                <span className="text-[12px] text-[#94A3B8]">File có {sheets.length} trang, hệ thống đã tự chọn trang phù hợp nhất.</span>
              </label>
            )}

            {parsed && !detection.kind && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-800">
                Không nhận ra cột nào trong file. Kiểm tra lại loại dữ liệu đã chọn ở bước 1, hoặc dùng file mẫu bên cạnh. Dòng tiêu đề cần nằm trong 10 dòng đầu.
              </div>
            )}

            {parsed && detection.kind && (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[13px] font-medium text-[#334155] mb-1.5">Cột đã nhận diện</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(detection.mapping).map(([field, index]) => (
                      <span key={field} className={`${ui.badge} ${ui.badgeGray}`}>
                        {FIELD_LABELS[field]} ← “{detection.headers[index]}”
                      </span>
                    ))}
                  </div>
                </div>
                {detection.missing.length > 0 ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-800">
                    Thiếu cột bắt buộc: {detection.missing.map((f) => FIELD_LABELS[f]).join(', ')}.
                  </div>
                ) : (
                  <p className="text-[13px] text-[#475569]">
                    Đọc được <b>{parsed.payload.length.toLocaleString('vi-VN')}</b> dòng
                    {parsed.skipped.length > 0 && (
                      <>
                        , bỏ qua <b>{parsed.skipped.length}</b> dòng
                      </>
                    )}
                    .
                  </p>
                )}
                {parsed.skipped.length > 0 && (
                  <details className="text-[12px] text-[#64748B]">
                    <summary className="cursor-pointer">Xem các dòng bị bỏ qua</summary>
                    <ul className="mt-1.5 max-h-40 overflow-y-auto space-y-0.5">
                      {parsed.skipped.slice(0, 200).map((s) => (
                        <li key={s.row}>
                          Dòng {s.row}: {s.reason}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </Step>

          <Step n={3} title="Kiểm tra và nhập" active={step2Done} done={Boolean(result)}>
            {kind === IMPORT_KINDS.PRODUCTS && (
              <div className="grid sm:grid-cols-2 gap-2 mb-4 text-[13px]">
                {[
                  ['CREATE_ONLY', 'Chỉ thêm mã hàng mới', 'Mã đã có trong StockPilot được báo lỗi, không bị ghi đè.'],
                  ['UPSERT_METADATA', 'Cập nhật tên, giá, nhóm hàng', 'Không thay đổi tồn kho hiện có.'],
                ].map(([value, label, hint]) => (
                  <label key={value} className={`flex gap-2 p-3 rounded-lg border cursor-pointer ${productMode === value ? 'border-[#3B82F6]' : 'border-[#E5E7EB]'}`}>
                    <input
                      type="radio"
                      name="mode"
                      checked={productMode === value}
                      onChange={() => {
                        setProductMode(value);
                        setPreview(null);
                      }}
                      disabled={!step2Done}
                    />
                    <span>
                      <span className="block text-[#334155] font-medium">{label}</span>
                      <span className="block text-[12px] text-[#64748B]">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {!preview && (
              <button type="button" onClick={handleCheck} disabled={!step2Done || busy === 'check'} className={ui.btnPrimary}>
                {busy === 'check' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Kiểm tra với dữ liệu cửa hàng
              </button>
            )}

            {preview && !result && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Sẽ nhập', preview.valid, 'text-emerald-700'],
                    ['Cảnh báo', preview.warnings, preview.warnings ? 'text-[#D97706]' : 'text-[#334155]'],
                    ['Lỗi, sẽ bỏ qua', preview.invalid, preview.invalid ? 'text-[#DC2626]' : 'text-[#334155]'],
                  ].map(([label, value, color]) => (
                    <div key={label} className="p-3 rounded-lg border border-[#E5E7EB]">
                      <p className="text-[12px] text-[#64748B]">{label}</p>
                      <p className={`text-[20px] font-semibold tabular-nums ${color}`}>{value.toLocaleString('vi-VN')}</p>
                    </div>
                  ))}
                </div>
                {preview.issues.length > 0 && (
                  <ul className="max-h-56 overflow-y-auto border border-[#E5E7EB] rounded-lg divide-y divide-[#E5E7EB] text-[13px]">
                    {preview.issues.slice(0, 100).map((issue, i) => (
                      <li key={i} className="px-3 py-2 flex gap-2">
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${issue.severity === 'ERROR' ? 'text-[#DC2626]' : 'text-[#D97706]'}`} />
                        <span>
                          Dòng {issue.row}
                          {issue.sku ? ` · ${issue.sku}` : ''}: {issue.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleCommit} disabled={busy === 'commit' || preview.valid === 0} className={ui.btnPrimary}>
                    {busy === 'commit' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Nhập {preview.valid.toLocaleString('vi-VN')} dòng hợp lệ
                  </button>
                  <button type="button" onClick={() => setPreview(null)} disabled={busy === 'commit'} className={ui.btnSecondary}>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kiểm tra lại
                  </button>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-[14px] text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                  {result}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate(kind === IMPORT_KINDS.PRODUCTS ? '/products' : '/analytics')} className={ui.btnPrimary}>
                    {kind === IMPORT_KINDS.PRODUCTS ? 'Xem sản phẩm' : 'Xem phân tích'}
                  </button>
                  {kind === IMPORT_KINDS.PRODUCTS && (
                    <button type="button" onClick={() => selectKind(IMPORT_KINDS.SALES)} className={ui.btnSecondary}>
                      Tiếp tục nhập lịch sử bán hàng
                    </button>
                  )}
                </div>
              </div>
            )}
          </Step>
        </div>

        {/* Hướng dẫn theo phần mềm nguồn */}
        <aside className="space-y-4 xl:sticky xl:top-20">
          <section className={`${ui.card} p-5`}>
            <h2 className="text-[14px] font-semibold text-[#334155]">Xuất file từ phần mềm đang dùng</h2>
            <div className="flex flex-wrap gap-1.5 mt-3" role="tablist">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={sourceId === s.id}
                  onClick={() => setSourceId(s.id)}
                  className={`px-2.5 py-1 rounded-md text-[12px] border cursor-pointer ${
                    sourceId === s.id ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'border-[#E5E7EB] text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <ol className="mt-3 space-y-1.5 text-[13px] text-[#475569] list-decimal pl-4">
              {source[kind].map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>Tải file vừa xuất lên ở bước 2.</li>
            </ol>
            {source.note && <p className="mt-3 text-[12px] text-[#475569] bg-slate-50 border border-[#E5E7EB] rounded-lg p-2.5">{source.note}</p>}
            <p className="mt-3 text-[12px] text-[#94A3B8]">
              Tên menu có thể khác tùy phiên bản. Hệ thống tự nhận diện cột theo tên nên không cần sửa file.
            </p>
          </section>

          <section className={`${ui.card} p-5`}>
            <h2 className="text-[14px] font-semibold text-[#334155]">Tự soạn file</h2>
            <p className="mt-1 text-[13px] text-[#64748B]">{REQUIRED_HINT[kind]}</p>
            <button type="button" onClick={() => downloadTemplate(kind)} className={`${ui.btnSecondary} mt-3 w-full`}>
              <Download className="w-3.5 h-3.5" />
              Tải file mẫu {kind === IMPORT_KINDS.PRODUCTS ? 'sản phẩm' : 'lịch sử bán hàng'}
            </button>
          </section>

          <section className="rounded-lg border border-[#E5E7EB] bg-slate-50 p-4 text-[12px] text-[#64748B] space-y-1.5">
            <p className="flex items-center gap-1.5 text-[#334155] font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              An toàn khi nhập
            </p>
            <p>File được đọc ngay trên máy bạn. Dữ liệu chỉ gửi lên khi bạn bấm Kiểm tra, và chỉ được ghi khi bạn bấm Nhập.</p>
            <p>Bấm Nhập nhiều lần cũng không bị nhập trùng.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ImportDataPage;
