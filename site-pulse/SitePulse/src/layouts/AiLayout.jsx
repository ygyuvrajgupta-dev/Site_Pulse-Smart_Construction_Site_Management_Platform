import DashboardShell from '@/components/layout/DashboardShell';
import { AI_SIDEBAR } from '@/constants/sidebar';

/**
 * AI Layout
 * Specialized layout for AI feature pages with dedicated AI navigation.
 */
function AiLayout() {
  return (
    <DashboardShell
      navItems={AI_SIDEBAR}
      title="AI Features"
      searchPlaceholder="Search AI features..."
      showBreadcrumb={true}
      showSearch={false}
    />
  );
}

export default AiLayout;
