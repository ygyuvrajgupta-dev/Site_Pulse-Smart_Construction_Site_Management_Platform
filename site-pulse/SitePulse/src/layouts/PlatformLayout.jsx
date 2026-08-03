import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  FiHome,
  FiBuilding,
  FiCreditCard,
  FiTag,
  FiBarChart2,
  FiSettings,
  FiSun,
  FiMoon,
  FiLogOut,
} from 'react-icons/fi';
import { ROUTES } from '@/constants/routes';

/**
 * Platform Layout.
 * Used for platform owner dashboard and management pages.
 */
function PlatformLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: ROUTES.PLATFORM, icon: FiHome, label: 'Dashboard' },
    { path: ROUTES.PLATFORM_COMPANIES, icon: FiBuilding, label: 'Companies' },
    { path: ROUTES.PLATFORM_PLANS, icon: FiCreditCard, label: 'Plans' },
    { path: ROUTES.PLATFORM_SUBSCRIPTIONS, icon: FiCreditCard, label: 'Subscriptions' },
    { path: ROUTES.PLATFORM_COUPONS, icon: FiTag, label: 'Coupons' },
    { path: ROUTES.PLATFORM_ANALYTICS, icon: FiBarChart2, label: 'Analytics' },
    { path: ROUTES.PLATFORM_SETTINGS, icon: FiSettings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Site Pulse
          </h1>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-secondary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Platform Owner Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'Platform Owner'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Platform Owner
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Logout"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PlatformLayout;