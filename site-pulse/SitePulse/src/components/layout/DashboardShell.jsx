import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

/**
 * Dashboard Shell
 * Main reusable layout shell that combines Sidebar and TopNavbar.
 * Handles responsive state, sidebar collapse, and mobile menu.
 * 
 * @param {Array} navItems - Sidebar navigation items
 * @param {string} title - Brand title
 * @param {string} logo - Logo URL or component
 * @param {function} onSearch - Search handler
 * @param {function} onSearchChange - Search change handler
 * @param {string} searchPlaceholder - Search placeholder
 * @param {boolean} showBreadcrumb - Show breadcrumb in navbar
 * @param {boolean} showSearch - Show search in navbar
 * @param {boolean} collapsible - Allow sidebar collapse on desktop
 */
function DashboardShell({
  navItems = [],
  title = 'Site Pulse',
  logo,
  onSearch,
  onSearchChange,
  searchPlaceholder = 'Search...',
  showBreadcrumb = true,
  showSearch = true,
  collapsible = true,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        title={title}
        logo={logo}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={collapsible ? handleToggleCollapse : undefined}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top Navbar */}
        <TopNavbar
          onMenuClick={() => setMobileOpen(true)}
          onSearch={onSearch}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          showBreadcrumb={showBreadcrumb}
          showSearch={showSearch}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;