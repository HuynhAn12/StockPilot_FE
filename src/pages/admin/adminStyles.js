// StockPilot Executive Platform Administration Design Tokens & Styles
// Luxury Command-Center Aesthetic: Crystal Glassmorphism, Micro-Elevations,
// High-Contrast Precision Typography, and Deep Ambient Accents (Tailwind v4 Canonical Syntax).

export const adminStyles = {
  // Layout containers
  pageContainer: 'w-full space-y-6 pb-20 text-slate-700 animate-fade-in',
  pageHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
  pageTitle: 'text-[24px] sm:text-[30px] font-black text-slate-900 tracking-[-0.03em] leading-tight',
  pageDesc: 'text-[13px] sm:text-[14px] text-slate-500 mt-1 leading-relaxed font-normal',

  // Surfaces & Cards (Glassmorphism & Depth)
  card: 'bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06),0_2px_6px_-2px_rgba(15,23,42,0.03)] hover:shadow-[0_12px_32px_-6px_rgba(37,99,235,0.08),0_4px_12px_-2px_rgba(15,23,42,0.04)] transition-all duration-300',
  cardHeader: 'px-5 py-4.5 border-b border-slate-100/90 flex items-center justify-between gap-3 bg-linear-to-r from-slate-50/50 via-white to-transparent rounded-t-2xl',
  cardTitle: 'text-[15px] font-bold text-slate-900 tracking-[-0.015em]',
  cardBody: 'p-5 sm:p-6',

  // Buttons (High-Impact Gradients & Micro-Press)
  btnPrimary:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 active:from-blue-800 active:to-indigo-800 text-white text-[13px] font-semibold tracking-[-0.01em] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 text-slate-700 hover:text-slate-900 hover:border-slate-300 text-[13px] font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  btnDanger:
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 active:from-rose-800 active:to-red-800 text-white text-[13px] font-semibold tracking-[-0.01em] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-[0_4px_14px_0_rgba(225,29,72,0.32)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60 text-[13px] font-semibold transition-all duration-150 cursor-pointer',

  // Form Controls
  input:
    'w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all shadow-2xs hover:border-slate-300',
  select:
    'w-full px-3.5 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-white/90 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 cursor-pointer transition-all shadow-2xs hover:border-slate-300',

  // Tables
  tableContainer: 'bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] overflow-hidden transition-all',
  table: 'w-full text-left text-[13px] border-collapse',
  th: 'px-4 py-3.5 bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-[11px] font-bold tracking-wider uppercase select-none',
  tr: 'border-b border-slate-100/90 hover:bg-blue-50/40 active:bg-blue-50/60 transition-colors',
  td: 'px-4 py-3.5 text-slate-700 align-middle',

  // Badges
  badge: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold border transition-all',
  badgeGreen: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-[0_1px_4px_rgba(16,185,129,0.12)]',
  badgeRed: 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-[0_1px_4px_rgba(244,63,94,0.12)]',
  badgeAmber: 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-[0_1px_4px_rgba(245,158,11,0.12)]',
  badgeBlue: 'bg-blue-50 text-blue-700 border-blue-200/80 shadow-[0_1px_4px_rgba(59,130,246,0.12)]',
  badgeGray: 'bg-slate-100 text-slate-700 border-slate-200 shadow-2xs',

  // Modal / Drawer
  modalBackdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all',
  modalContent: 'bg-white rounded-3xl max-w-md w-full border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] overflow-hidden ring-1 ring-black/5',
  drawerBackdrop: 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-all',
  drawerContent: 'fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] bg-white border-l border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] flex flex-col',
};
