import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import { ROUTE_CONFIG } from '@/constants/routes';

/**
 * Breadcrumb Navigation
 * Reusable breadcrumb component that auto-generates from current route.
 */
function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Build breadcrumb items from path
  const items = [];
  let currentPath = '';

  pathnames.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const config = ROUTE_CONFIG[currentPath];

    if (config) {
      items.push({
        path: currentPath,
        label: config.label,
        isLast: index === pathnames.length - 1,
      });
    } else {
      // Capitalize segment if no config found
      items.push({
        path: currentPath,
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        isLast: index === pathnames.length - 1,
      });
    }
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {/* Home Link */}
      <Link
        to="/"
        className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <FiHome className="w-4 h-4" />
      </Link>

      {items.map((item) => (
        <div key={item.path} className="flex items-center gap-1.5">
          <FiChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          {item.isLast ? (
            <span className="font-medium text-gray-900 dark:text-white">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Breadcrumb;