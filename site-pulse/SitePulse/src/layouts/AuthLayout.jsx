import { Outlet } from 'react-router-dom';

/**
 * Auth Layout.
 * Used for login, register, forgot password pages.
 * Minimal layout with centered card and branding.
 */
function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Site Pulse
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Monitor your sites with confidence
          </p>
        </div>

        {/* Auth content */}
        <div className="card">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;