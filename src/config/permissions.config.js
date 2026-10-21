/**
 * Centralized RBAC Permissions Matrix for StockPilot
 * Defines route access, feature permissions, and data visibility per role.
 */

export const ROLES = {
  SHOP_OWNER: 'store_owner',
  WAREHOUSE_STAFF: 'warehouse_staff',
  ADMIN: 'admin',
};

export function normalizeRole(role) {
  if (!role) return ROLES.WAREHOUSE_STAFF;
  const lower = String(role).toLowerCase().trim();
  if (lower === 'shop_owner' || lower === 'store_owner') return ROLES.SHOP_OWNER;
  if (lower === 'warehouse_staff' || lower === 'staff') return ROLES.WAREHOUSE_STAFF;
  if (lower === 'admin') return ROLES.ADMIN;
  return lower;
}

export const isStaff = (role) => normalizeRole(role) === ROLES.WAREHOUSE_STAFF;
export const isOwner = (role) => normalizeRole(role) === ROLES.SHOP_OWNER;
export const isAdmin = (role) => normalizeRole(role) === ROLES.ADMIN;

// ─── Individual Permission Checkers ───
export const canViewCostPrice = (role) => !isStaff(role);
export const canViewRevenue = (role) => !isStaff(role);
export const canViewProfit = (role) => !isStaff(role);
export const canViewTotalInventoryValue = (role) => !isStaff(role);
export const canViewFinancialCharts = (role) => !isStaff(role);

export const canDeleteProduct = (role) => isOwner(role) || isAdmin(role);
export const canEditCostPrice = (role) => isOwner(role) || isAdmin(role);
export const canEditSellingPrice = (role) => isOwner(role) || isAdmin(role);
export const canApprovePricing = (role) => isOwner(role) || isAdmin(role);
export const canCancelOrder = (role) => isOwner(role) || isAdmin(role);
export const canAccessOrders = (role) => isOwner(role) || isAdmin(role);
export const canViewOrderFinancialSummary = (role) => isOwner(role) || isAdmin(role);
export const canAccessPricing = (role) => isOwner(role) || isAdmin(role);
export const canAccessAnalytics = (role) => isOwner(role) || isAdmin(role);
export const canAccessSettings = (role) => isOwner(role) || isAdmin(role);
export const canManageUsers = (role) => isAdmin(role);
export const canViewAuditLog = (role) => isAdmin(role);

// ─── Feature & Data Field Permissions Object ───
export const permissions = {
  canViewCostPrice,
  canViewRevenue,
  canViewProfit,
  canViewTotalInventoryValue,
  canViewFinancialCharts,
  canDeleteProduct,
  canEditCostPrice,
  canEditSellingPrice,
  canApprovePricing,
  canCancelOrder,
  canAccessOrders,
  canViewOrderFinancialSummary,
  canAccessPricing,
  canAccessAnalytics,
  canAccessSettings,
  canManageUsers,
  canViewAuditLog,
};

// ─── Route Access Matrix (Đã tối ưu chuẩn hoá 12 phân hệ) ───
export const ROUTE_PERMISSIONS = {
  '/dashboard': [ROLES.SHOP_OWNER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN],
  '/products': [ROLES.SHOP_OWNER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN],
  '/pos': [ROLES.SHOP_OWNER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN],
  '/orders': [ROLES.SHOP_OWNER, ROLES.ADMIN],
  '/inventory': [ROLES.SHOP_OWNER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN],
  '/alerts': [ROLES.SHOP_OWNER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN],
  '/ai-assistant': [ROLES.SHOP_OWNER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN],
  '/pricing': [ROLES.SHOP_OWNER, ROLES.ADMIN],
  '/analytics': [ROLES.SHOP_OWNER, ROLES.ADMIN],
  '/settings': [ROLES.SHOP_OWNER, ROLES.ADMIN],
  '/staff': [ROLES.SHOP_OWNER, ROLES.ADMIN],
  '/admin/users': [ROLES.ADMIN],
  '/admin/audit-log': [ROLES.ADMIN],
};

export function canAccessRoute(role, path) {
  const norm = normalizeRole(role);
  const allowed = ROUTE_PERMISSIONS[path];
  if (!allowed) return true; // public or unlisted route
  return allowed.includes(norm);
}
