// Production B2B SaaS design tokens for StockPilot Platform Administration.
// Refined palette: Crisp slate borders, high-contrast readable typography,
// deliberate accent highlights, subtle elevation and micro-interactions.

export const adminStyles = {
  // Layout containers
  pageContainer: 'w-full space-y-6 pb-16 text-[#334155]',
  pageHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
  pageTitle: 'text-[24px] sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.025em] leading-tight',
  pageDesc: 'text-[13px] sm:text-[14px] text-[#64748B] mt-1 leading-normal',

  // Surfaces & Cards
  card: 'bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] transition-all',
  cardHeader: 'px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-3',
  cardTitle: 'text-[15px] font-semibold text-[#0F172A] tracking-[-0.01em]',
  cardBody: 'p-5',

  // Buttons
  btnPrimary:
    'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-[0.98]',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] text-[13px] font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-2xs hover:border-[#94A3B8] active:scale-[0.98]',
  btnDanger:
    'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-[0.98]',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] text-[13px] font-medium transition-colors cursor-pointer',

  // Form Controls
  input:
    'w-full px-3.5 py-2 text-[13px] rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15 transition-all shadow-2xs',
  select:
    'w-full px-3.5 py-2 text-[13px] rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15 cursor-pointer transition-all shadow-2xs',

  // Tables
  tableContainer: 'bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.06)] overflow-hidden',
  table: 'w-full text-left text-[13px] border-collapse',
  th: 'px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] text-[12px] font-semibold tracking-wider uppercase select-none',
  tr: 'border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/90 transition-colors',
  td: 'px-4 py-3.5 text-[#334155] align-middle',

  // Badges
  badge: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border',
  badgeGreen: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  badgeRed: 'bg-red-50 text-red-700 border-red-200',
  badgeAmber: 'bg-amber-50 text-amber-800 border-amber-200',
  badgeBlue: 'bg-blue-50 text-blue-700 border-blue-200',
  badgeGray: 'bg-slate-100 text-slate-700 border-slate-200',

  // Modal / Drawer
  modalBackdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs transition-opacity',
  modalContent: 'bg-white rounded-2xl max-w-md w-full border border-[#E2E8F0] shadow-2xl overflow-hidden',
  drawerBackdrop: 'fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs transition-opacity',
  drawerContent: 'fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col',
};

