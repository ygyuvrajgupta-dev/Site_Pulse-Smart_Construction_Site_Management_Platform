import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import LoadingScreen from '@/components/common/LoadingScreen';

// ============================================
// Lazy-loaded pages with code splitting.
// Each page chunk is loaded only when needed.
// ============================================

// Landing pages
const LandingPage = lazy(() => import('@/pages/Landing/index.jsx'));

// Auth pages
const AuthPage = lazy(() => import('@/pages/Auth/index.jsx'));

// Dashboard pages
const DashboardPage = lazy(() => import('@/pages/Dashboard/index.jsx'));

// Settings pages
const SettingsPage = lazy(() => import('@/pages/Settings/index.jsx'));

// Error pages
const NotFoundPage = lazy(() => import('@/pages/NotFound/index.jsx'));

// Layouts
const LandingLayout = lazy(() => import('@/layouts/LandingLayout.jsx'));
const AuthLayout = lazy(() => import('@/layouts/AuthLayout.jsx'));
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout.jsx'));

/**
 * Suspense wrapper for lazy-loaded components.
 * Shows a loading spinner while the component chunk is being fetched.
 */
function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
}

/**
 * Application route structure with lazy loading and route guards.
 *
 * Route hierarchy:
 *   /                  → LandingLayout > Landing (public)
 *   /login             → AuthLayout > Auth (public, redirects if authenticated)
 *   /register          → AuthLayout > Auth (public, redirects if authenticated)
 *   /dashboard         → DashboardLayout > Dashboard (protected)
 *   /companies         → DashboardLayout > Dashboard (protected)
 *   /projects          → DashboardLayout > Dashboard (protected)
 *   /leads             → DashboardLayout > Dashboard (protected)
 *   /settings          → DashboardLayout > Settings (protected)
 *   *                  → NotFound
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Landing routes — public */}
      <Route
        element={
          <SuspenseWrapper>
            <LandingLayout />
          </SuspenseWrapper>
        }
      >
        <Route index element={<LandingPage />} />
      </Route>

      {/* Auth routes — public, redirect if authenticated */}
      <Route
        element={
          <SuspenseWrapper>
            <AuthLayout />
          </SuspenseWrapper>
        }
      >
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
      </Route>

      {/* Protected dashboard routes */}
      <Route
        element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <DashboardLayout />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.COMPANIES} element={<DashboardPage />} />
        <Route path={ROUTES.PROJECTS} element={<DashboardPage />} />
        <Route path={ROUTES.LEADS} element={<DashboardPage />} />
        <Route path={ROUTES.CLIENTS} element={<DashboardPage />} />
        <Route path={ROUTES.EMPLOYEES} element={<DashboardPage />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<DashboardPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path={ROUTES.PROFILE} element={<SettingsPage />} />
        <Route path={ROUTES.SECURITY} element={<SettingsPage />} />
        <Route path={ROUTES.BILLING} element={<SettingsPage />} />
      </Route>

      {/* 404 catch-all */}
      <Route
        path="*"
        element={
          <SuspenseWrapper>
            <NotFoundPage />
          </SuspenseWrapper>
        }
      />
    </Routes>
  );
}

export default AppRoutes;