import React from 'react';
import { useAuthStore } from '../store/authStore';
import { normalizeRole, permissions } from '../../config/permissions.config';

/**
 * RoleGuard Component:
 * Conditionally renders children if the authenticated user's role satisfies the required permission or roles.
 *
 * Usage:
 * <RoleGuard permission="canViewCostPrice">
 *   <span>{formatVND(costPrice)}</span>
 * </RoleGuard>
 *
 * <RoleGuard allowedRoles={['store_owner', 'admin']}>
 *   <button onClick={handleDelete}>Xóa</button>
 * </RoleGuard>
 */
export function RoleGuard({ permission, allowedRoles, fallback = null, children }) {
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);

  if (allowedRoles && Array.isArray(allowedRoles)) {
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    if (!normalizedAllowed.includes(role)) {
      return fallback;
    }
  }

  if (permission) {
    if (typeof permission === 'function') {
      if (!permission(role)) return fallback;
    } else if (typeof permissions[permission] === 'function') {
      if (!permissions[permission](role)) return fallback;
    }
  }

  return children;
}
