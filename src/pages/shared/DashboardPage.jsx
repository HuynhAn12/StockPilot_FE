import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { normalizeRole } from '../../config/permissions.config';
import { ProductionDashboard } from '../owner/ProductionDashboard';
import { StaffOperationalDashboard } from '../staff/StaffOperationalDashboard';
import { AdminSystemDashboard } from '../admin/AdminSystemDashboard';

export function DashboardPage() {
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);

  if (role === 'warehouse_staff' || role === 'STAFF') {
    return (
      <div className="w-full">
        <StaffOperationalDashboard />
      </div>
    );
  }

  if (role === 'admin' || role === 'ADMIN') {
    return (
      <div className="w-full">
        <AdminSystemDashboard />
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProductionDashboard />
    </div>
  );
}

export default DashboardPage;
