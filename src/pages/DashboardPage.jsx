import { useAuthStore } from '../store/authStore';
import { normalizeRole } from '../config/permissions.config';
import { ProductionDashboard } from '../components/ProductionDashboard';
import { StaffOperationalDashboard } from '../components/StaffOperationalDashboard';
import { AdminSystemDashboard } from '../components/AdminSystemDashboard';

export function DashboardPage() {
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);

  if (role === 'warehouse_staff') {
    return (
      <div className="w-full">
        <StaffOperationalDashboard />
      </div>
    );
  }

  if (role === 'admin') {
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
