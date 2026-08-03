import DashboardShell from '@/components/layout/DashboardShell';
import { PLATFORM_SIDEBAR } from '@/constants/sidebar';

/**
 * Platform Owner Layout
 * Uses the reusable DashboardShell with platform owner sidebar items.
 */
function PlatformLayout() {
  return (
    <DashboardShell
      navItems={PLATFORM_SIDEBAR}
      title="Site Pulse Admin"
      searchPlaceholder="Search companies, plans, subscriptions..."
    />
  );
}

export default PlatformLayout;