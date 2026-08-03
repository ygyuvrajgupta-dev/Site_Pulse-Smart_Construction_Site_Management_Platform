import { FiMenu } from 'react-icons/fi';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import Breadcrumb from './Breadcrumb';

/**
 * Top Navbar
 * Reusable top navigation bar with hamburger menu, search, notifications,
 * theme toggle, and user menu. Designed for professional SaaS dashboards.
 * 
 * @param {function} onMenuClick - Handler for mobile menu toggle
 * @param {function} onSearch - Search submit handler
 * @param {function} onSearchChange - Search change handler
 * @param {string} searchPlaceholder - Search placeholder text
 * @param {boolean} showBreadcrumb - Whether to show breadcrumb
 * @param {boolean} showSearch - Whether to show search bar
 */
function TopNavbar({
  onMenuClick,
  onSearch,
  onSearchChange,
  searchPlaceholder = 'Search...',
  showBreadcrumb = true,
  showSearch = true,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          {showBreadcrumb && (
            <div className="hidden md:block">
              <Breadcrumb />
            </div>
          )}
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="flex-1 max-w-md hidden sm:block">
            <SearchBar
              placeholder={searchPlaceholder}
              onSearch={onSearch}
              onChange={onSearchChange}
            />
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700" />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile Breadcrumb */}
      {showBreadcrumb && (
        <div className="md:hidden px-4 pb-2">
          <Breadcrumb />
        </div>
      )}
    </header>
  );
}

export default TopNavbar;