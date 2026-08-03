import DashboardShell from '@/components/layout/DashboardShell';
import { DASHBOARD_SIDEBAR } from '@/constants/sidebar';

/**
 * Dashboard Layout
 * Main application layout using the reusable DashboardShell.
 * Used for all authenticated dashboard pages.
 */
function DashboardLayout() {
  return (
    <DashboardShell
      navItems={DASHBOARD_SIDEBAR}
      title="Site Pulse"
      searchPlaceholder="Search projects, leads, companies..."
    />
  );
}

export default DashboardLayout;