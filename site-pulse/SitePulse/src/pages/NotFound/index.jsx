import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

/**
 * NotFound Page.
 * Shown for any unmatched route.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 text-center">
      <p className="text-7xl font-extrabold text-blue-600 dark:text-blue-400">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
      <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={ROUTES.HOME} className="btn btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}