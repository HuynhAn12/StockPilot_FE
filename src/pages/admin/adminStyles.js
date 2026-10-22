// Shared Minimal SaaS styling tokens for StockPilot System Admin
// Adheres strictly to the UI Style Refinement specifications:
// - Background: #FAFAFA, Surface: #FFFFFF, Borders: #E5E7EB
// - Headings: #334155, Body: #475569, Secondary: #64748B
// - Primary: #3B82F6 (Hover: #2563EB), Error: #DC2626, Warning: #D97706
// - Radius: 6-10px (rounded-lg: 8px)
// - No dark mode, no gradients, no neon/glow, no excessive shadows

export const adminStyles = {
  // Layout containers
  pageContainer: 'w-full space-y-5 pb-12 text-[#475569]',
  pageHeader: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
  pageTitle: 'text-[22px] sm:text-[24px] font-semibold text-[#334155] tracking-tight',
  pageDesc: 'text-[13px] sm:text-sm text-[#64748B] mt-0.5',

  // Surfaces & Cards
  card: 'bg-white rounded-lg border border-[#E5E7EB]',
  cardHeader: 'px-4 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between',
  cardTitle: 'text-[15px] font-medium text-[#334155]',
  cardBody: 'p-4',

  // Buttons
  btnPrimary:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0',
  btnSecondary:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#475569] text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0',
  btnDanger:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0',
  btnGhost:
    'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[#64748B] hover:text-[#334155] hover:bg-slate-100 text-[13px] font-medium transition-colors cursor-pointer',

  // Form Controls
  input:
    'w-full px-3 py-1.5 text-[13px] rounded-lg border border-[#E5E7EB] bg-white text-[#475569] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]',
  select:
    'w-full px-3 py-1.5 text-[13px] rounded-lg border border-[#E5E7EB] bg-white text-[#475569] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] cursor-pointer',

  // Tables
  tableContainer: 'bg-white rounded-lg border border-[#E5E7EB] overflow-hidden',
  table: 'w-full text-left text-[13px] border-collapse',
  th: 'px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#64748B] text-[12px] font-medium',
  tr: 'border-b border-[#E5E7EB] hover:bg-slate-50/70 transition-colors',
  td: 'px-4 py-3 text-[#475569]',

  // Badges
  badge: 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-normal border',
  badgeGreen: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  badgeRed: 'bg-red-50 text-[#DC2626] border-red-200',
  badgeAmber: 'bg-amber-50 text-[#D97706] border-amber-200',
  badgeBlue: 'bg-blue-50 text-[#2563EB] border-blue-200',
  badgeGray: 'bg-slate-100 text-[#64748B] border-slate-200',

  // Modal / Drawer
  modalBackdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40',
  modalContent: 'bg-white rounded-lg max-w-md w-full border border-[#E5E7EB] shadow-lg',
  drawerBackdrop: 'fixed inset-0 z-50 bg-black/30 transition-opacity',
  drawerContent: 'fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white border-l border-[#E5E7EB] shadow-xl flex flex-col',
};
