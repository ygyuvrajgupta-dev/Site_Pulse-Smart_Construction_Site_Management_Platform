/**
 * Loading Screen component.
 * Displays a centered spinner while the application is loading.
 * Used during initial auth check and lazy-loaded route transitions.
 */
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full" />
          <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default LoadingScreen;