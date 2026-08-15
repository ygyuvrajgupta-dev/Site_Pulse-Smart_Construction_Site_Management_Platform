import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { ROUTES } from '@/constants/routes';

/**
 * Settings Page.
 * Minimal account settings view.
 */
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(ROUTES.HOME);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Name</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-white">
              {user?.name || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-white">
              {user?.email || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Role</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-white">
              {user?.role?.name || user?.role || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Company ID</dt>
            <dd className="mt-1 font-medium text-gray-900 dark:text-white truncate">
              {user?.companyId || '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Account</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Additional account preferences (security, notifications, billing) arrive
          with the next iteration.
        </p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <FiLogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}