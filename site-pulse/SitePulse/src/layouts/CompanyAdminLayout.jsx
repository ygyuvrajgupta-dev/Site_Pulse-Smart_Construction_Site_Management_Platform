import DashboardShell from '@/components/layout/DashboardShell';
import { COMPANY_ADMIN_SIDEBAR } from '@/constants/sidebar';
import { useAuth } from '@/context/AuthContext';

/**
 * Company Admin Layout
 * Uses the reusable DashboardShell with company admin sidebar items.
 */
function CompanyAdminLayout() {
  const { user } = useAuth();

  return (
    <DashboardShell
      navItems={COMPANY_ADMIN_SIDEBAR}
      title={user?.companyName || 'Company Admin'}
      searchPlaceholder="Search users, employees, departments..."
    />
  );
}

export default CompanyAdminLayout;