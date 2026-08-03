import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiX, FiChevronsLeft } from 'react-icons/fi';

/**
 * Sidebar Navigation
 * Reusable, collapsible sidebar component with responsive mobile support.
 * 
 * @param {Array} navItems - Array of { path, icon, label } objects
 * @param {string} title - Sidebar title/brand name
 * @param {string} logo - Logo URL or component
 * @param {boolean} isOpen - Mobile open state (controlled by parent)
 * @param {function} onClose - Close handler for mobile
 * @param {boolean} collapsed - Desktop collapsed state
 * @param {function} onToggleCollapse - Toggle collapse handler
 */
function Sidebar({ navItems = [], title = 'Site Pulse', logo, isOpen = false, onClose, collapsed = false, onToggleCollapse }) {
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300
          ${collapsed ? 'w-16' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 overflow-hidden">
            {logo && (
              <div className="flex-shrink-0">
                {typeof logo === 'string' ? (
                  <img src={logo} alt={title} className="w-8 h-8 rounded" />
                ) : (
                  logo
                )}
              </div>
            )}
            {!collapsed && (
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <FiChevronsLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-secondary text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              {item.icon && (
                <item.icon className="w-5 h-5 flex-shrink-0" />
              )}
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;