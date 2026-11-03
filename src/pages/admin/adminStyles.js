// StockPilot Admin — class Tailwind dùng chung cho khu quản trị.
// Phong cách: tối giản kiểu Swiss / Linear — nền phẳng, viền mảnh, một màu nhấn xanh,
// số liệu là trọng tâm. Không gradient, không bóng màu, không nhấc phần tử khi hover.

export const adminStyles = {
  // Layout containers
  pageContainer: 'w-full space-y-6 pb-16 text-slate-700',
  pageHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
  pageTitle: 'text-[22px] sm:text-[24px] font-semibold text-slate-900 tracking-tight leading-tight',
  pageDesc: 'text-[13px] sm:text-[14px] text-slate-500 mt-1 leading-relaxed',

  // Surfaces & Cards
  card: 'bg-white rounded-xl border border-slate-200 shadow-xs',
  cardHeader: 'px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3',
  cardTitle: 'text-[15px] font-semibold text-slate-900',
  cardBody: 'p-5',

  // Buttons
  btnPrimary:
    'inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[13px] font-medium transition-colors duration-150 cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-[13px] font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
  btnDanger:
    'inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[13px] font-medium transition-colors duration-150 cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-[13px] font-medium transition-colors duration-150 cursor-pointer',

  // Form Controls
  input:
    'w-full px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors',
  select:
    'w-full px-3 py-2 text-[13px] rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 cursor-pointer transition-colors',

  // Tables
  tableContainer: 'bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden',
  table: 'w-full text-left text-[13px] border-collapse',
  th: 'px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold tracking-wide uppercase select-none',
  tr: 'border-b border-slate-100 hover:bg-slate-50 transition-colors',
  td: 'px-4 py-3 text-slate-700 align-middle',

  // Badges
  badge: 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[12px] font-medium ring-1 ring-inset',
  badgeGreen: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  badgeRed: 'bg-red-50 text-red-700 ring-red-600/20',
  badgeAmber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  badgeBlue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  badgeGray: 'bg-slate-100 text-slate-700 ring-slate-500/20',

  // Modal / Drawer
  modalBackdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40',
  modalContent: 'bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden',
  drawerBackdrop: 'fixed inset-0 z-50 bg-slate-900/40',
  drawerContent: 'fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] bg-white border-l border-slate-200 shadow-xl flex flex-col',
};
