/**
 * Centralized route definitions.
 * Prevents typos and enables easy refactoring of route paths.
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  COMPANIES: '/companies',
  PROJECTS: '/projects',
  LEADS: '/leads',
  CLIENTS: '/clients',
  EMPLOYEES: '/employees',
  NOTIFICATIONS: '/notifications',
  
  // Settings
  SETTINGS: '/settings',
  PROFILE: '/settings/profile',
  SECURITY: '/settings/security',
  BILLING: '/settings/billing',
  
  // Error pages
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
  
  // Redirects
  LOGIN_REDIRECT: '/dashboard',
};

/**
 * Route configuration with metadata for navigation and route guards.
 */
export const ROUTE_CONFIG = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    label: 'Home',
    isPublic: true,
  },
  [ROUTES.LOGIN]: {
    path: ROUTES.LOGIN,
    label: 'Login',
    isPublic: true,
    requiresAuth: false,
  },
  [ROUTES.REGISTER]: {
    path: ROUTES.REGISTER,
    label: 'Register',
    isPublic: true,
    requiresAuth: false,
  },
  [ROUTES.DASHBOARD]: {
    path: ROUTES.DASHBOARD,
    label: 'Dashboard',
    isPublic: false,
    requiresAuth: true,
    layout: 'dashboard',
  },
  [ROUTES.COMPANIES]: {
    path: ROUTES.COMPANIES,
    label: 'Companies',
    isPublic: false,
    requiresAuth: true,
    layout: 'dashboard',
  },
  [ROUTES.PROJECTS]: {
    path: ROUTES.PROJECTS,
    label: 'Projects',
    isPublic: false,
    requiresAuth: true,
    layout: 'dashboard',
  },
  [ROUTES.LEADS]: {
    path: ROUTES.LEADS,
    label: 'Leads',
    isPublic: false,
    requiresAuth: true,
    layout: 'dashboard',
  },
  [ROUTES.SETTINGS]: {
    path: ROUTES.SETTINGS,
    label: 'Settings',
    isPublic: false,
    requiresAuth: true,
    layout: 'dashboard',
  },
};