import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/common/LoadingScreen';
import { ROUTES } from '@/constants/routes';

/**
 * Public Route guard.
 * Redirects authenticated users away from auth pages (login, register, etc.)
 * to the dashboard. Shows a loading screen while auth state is being determined.
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN_REDIRECT} replace />;
  }

  return children;
}

export default PublicRoute;