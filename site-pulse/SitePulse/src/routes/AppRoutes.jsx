import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import LoadingScreen from '@/components/common/LoadingScreen';

// ============================================
// Lazy-loaded pages with code splitting.
// ============================================

// Landing pages
const LandingPage = lazy(() => import('@/pages/Landing/index.jsx'));

// Auth pages
const AuthPage = lazy(() => import('@/pages/Auth/index.jsx'));

// Dashboard pages
const DashboardPage = lazy(() => import('@/pages/Dashboard/index.jsx'));

// Projects pages
const ProjectsPage = lazy(() => import('@/pages/Projects/index.jsx'));
const ProjectDetailPage = lazy(() => import('@/pages/Projects/ProjectDetail.jsx'));

// Sites pages
const SitesPage = lazy(() => import('@/pages/Sites/index.jsx'));
const SiteDetailPage = lazy(() => import('@/pages/Sites/SiteDetail.jsx'));

// HR pages
const HrPage = lazy(() => import('@/pages/HR/index.jsx'));

// Inventory pages
const InventoryPage = lazy(() => import('@/pages/Inventory/index.jsx'));

// Finance pages
const FinancePage = lazy(() => import('@/pages/Finance/index.jsx'));

// Documents pages
const DocumentsPage = lazy(() => import('@/pages/Documents/index.jsx'));

// Settings pages
const SettingsPage = lazy(() => import('@/pages/Settings/index.jsx'));

// AI pages
const AiOverviewPage = lazy(() => import('@/pages/AI/index.jsx'));
const AiChatPage = lazy(() => import('@/pages/AI/AiChat.jsx'));
const AiReportsPage = lazy(() => import('@/pages/AI/AiReports.jsx'));
const AiOcrPage = lazy(() => import('@/pages/AI/AiOcr.jsx'));
const AiAnalyticsPage = lazy(() => import('@/pages/AI/AiAnalytics.jsx'));
const AiInsightsPage = lazy(() => import('@/pages/AI/AiInsights.jsx'));
const AiSuggestionsPage = lazy(() => import('@/pages/AI/AiSuggestions.jsx'));
const AiUsagePage = lazy(() => import('@/pages/AI/AiUsage.jsx'));

// Error pages
const NotFoundPage = lazy(() => import('@/pages/NotFound/index.jsx'));

// Layouts
const LandingLayout = lazy(() => import('@/layouts/LandingLayout.jsx'));
const AuthLayout = lazy(() => import('@/layouts/AuthLayout.jsx'));
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout.jsx'));
const PlatformLayout = lazy(() => import('@/layouts/PlatformLayout.jsx'));
const CompanyAdminLayout = lazy(() => import('@/layouts/CompanyAdminLayout.jsx'));

// Platform pages
const PlatformPage = lazy(() => import('@/pages/Platform/index.jsx'));
const PlatformCompaniesPage = lazy(() => import('@/pages/Platform/Companies/index.jsx'));
const PlatformPlansPage = lazy(() => import('@/pages/Platform/Plans/index.jsx'));
const PlatformSubscriptionsPage = lazy(() => import('@/pages/Platform/Subscriptions/index.jsx'));
const PlatformCouponsPage = lazy(() => import('@/pages/Platform/Coupons/index.jsx'));
const PlatformAnalyticsPage = lazy(() => import('@/pages/Platform/Analytics/index.jsx'));
const PlatformSettingsPage = lazy(() => import('@/pages/Platform/Settings/index.jsx'));

// Company Admin pages
const CompanyAdminPage = lazy(() => import('@/pages/CompanyAdmin/index.jsx'));
const CompanyUsersPage = lazy(() => import('@/pages/CompanyAdmin/Users/index.jsx'));
const CompanyEmployeesPage = lazy(() => import('@/pages/CompanyAdmin/Employees/index.jsx'));
const CompanyRolesPage = lazy(() => import('@/pages/CompanyAdmin/Roles/index.jsx'));
const CompanyDepartmentsPage = lazy(() => import('@/pages/CompanyAdmin/Departments/index.jsx'));
const CompanyProfilePage = lazy(() => import('@/pages/CompanyAdmin/Profile/index.jsx'));
const CompanyModulesPage = lazy(() => import('@/pages/CompanyAdmin/Modules/index.jsx'));
const CompanyBrandingPage = lazy(() => import('@/pages/CompanyAdmin/Branding/index.jsx'));
const CompanySettingsPage = lazy(() => import('@/pages/CompanyAdmin/Settings/index.jsx'));

// CRM pages
const CrmLeadsPage = lazy(() => import('@/pages/CRM/Leads/index.jsx'));
const CrmClientsPage = lazy(() => import('@/pages/CRM/Clients/index.jsx'));
const CrmPipelinePage = lazy(() => import('@/pages/CRM/Pipeline/index.jsx'));
const CrmMeetingsPage = lazy(() => import('@/pages/CRM/Meetings/index.jsx'));
const CrmFollowUpsPage = lazy(() => import('@/pages/CRM/FollowUps/index.jsx'));

/**
 * Suspense wrapper for lazy-loaded components.
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
        <Route path={ROUTES.LOGIN} element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } />
        <Route path={ROUTES.REGISTER} element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } />
        <Route path={ROUTES.FORGOT_PASSWORD} element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        } />
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
        <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
        <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
        <Route path={ROUTES.SITES} element={<SitesPage />} />
        <Route path={ROUTES.SITE_DETAIL} element={<SiteDetailPage />} />
        <Route path={ROUTES.LEADS} element={<DashboardPage />} />
        <Route path={ROUTES.CLIENTS} element={<DashboardPage />} />
        <Route path={ROUTES.EMPLOYEES} element={<DashboardPage />} />
        <Route path={ROUTES.HR} element={<HrPage />} />
        <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
        <Route path={ROUTES.FINANCE} element={<FinancePage />} />
        <Route path={ROUTES.DOCUMENTS} element={<DocumentsPage />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<DashboardPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path={ROUTES.PROFILE} element={<SettingsPage />} />
        <Route path={ROUTES.SECURITY} element={<SettingsPage />} />
        <Route path={ROUTES.BILLING} element={<SettingsPage />} />
        
        {/* AI routes */}
        <Route path={ROUTES.AI} element={<AiOverviewPage />} />
        <Route path={ROUTES.AI_CHAT} element={<AiChatPage />} />
        <Route path={ROUTES.AI_REPORTS} element={<AiReportsPage />} />
        <Route path={ROUTES.AI_OCR} element={<AiOcrPage />} />
        <Route path={ROUTES.AI_ANALYTICS} element={<AiAnalyticsPage />} />
        <Route path={ROUTES.AI_INSIGHTS} element={<AiInsightsPage />} />
        <Route path={ROUTES.AI_SUGGESTIONS} element={<AiSuggestionsPage />} />
        <Route path={ROUTES.AI_USAGE} element={<AiUsagePage />} />
        
        {/* CRM routes */}
        <Route path={ROUTES.CRM_LEADS} element={<CrmLeadsPage />} />
        <Route path={ROUTES.CRM_CLIENTS} element={<CrmClientsPage />} />
        <Route path={ROUTES.CRM_PIPELINE} element={<CrmPipelinePage />} />
        <Route path={ROUTES.CRM_MEETINGS} element={<CrmMeetingsPage />} />
        <Route path={ROUTES.CRM_FOLLOWUPS} element={<CrmFollowUpsPage />} />
      </Route>

      {/* Protected platform owner routes */}
      <Route
        element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <PlatformLayout />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.PLATFORM} element={<PlatformPage />} />
        <Route path={ROUTES.PLATFORM_COMPANIES} element={<PlatformCompaniesPage />} />
        <Route path={ROUTES.PLATFORM_PLANS} element={<PlatformPlansPage />} />
        <Route path={ROUTES.PLATFORM_SUBSCRIPTIONS} element={<PlatformSubscriptionsPage />} />
        <Route path={ROUTES.PLATFORM_COUPONS} element={<PlatformCouponsPage />} />
        <Route path={ROUTES.PLATFORM_ANALYTICS} element={<PlatformAnalyticsPage />} />
        <Route path={ROUTES.PLATFORM_SETTINGS} element={<PlatformSettingsPage />} />
      </Route>

      {/* Protected company admin routes */}
      <Route
        element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <CompanyAdminLayout />
            </SuspenseWrapper>
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.COMPANY} element={<CompanyAdminPage />} />
        <Route path={ROUTES.COMPANY_USERS} element={<CompanyUsersPage />} />
        <Route path={ROUTES.COMPANY_EMPLOYEES} element={<CompanyEmployeesPage />} />
        <Route path={ROUTES.COMPANY_ROLES} element={<CompanyRolesPage />} />
        <Route path={ROUTES.COMPANY_DEPARTMENTS} element={<CompanyDepartmentsPage />} />
        <Route path={ROUTES.COMPANY_PROFILE} element={<CompanyProfilePage />} />
        <Route path={ROUTES.COMPANY_MODULES} element={<CompanyModulesPage />} />
        <Route path={ROUTES.COMPANY_BRANDING} element={<CompanyBrandingPage />} />
        <Route path={ROUTES.COMPANY_SETTINGS} element={<CompanySettingsPage />} />
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