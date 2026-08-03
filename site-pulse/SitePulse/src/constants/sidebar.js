import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiShield,
  FiGrid,
  FiBox,
  FiPalette,
  FiSettings,
  FiEdit,
  FiBriefcase,
  FiTrendingUp,
  FiCreditCard,
  FiTag,
  FiBarChart2,
  FiBuilding,
} from 'react-icons/fi';
import { ROUTES } from './routes';

/**
 * Sidebar navigation items for different layouts.
 * Each item has: path, icon, label
 */

// Main Dashboard sidebar items
export const DASHBOARD_SIDEBAR = [
  { path: ROUTES.DASHBOARD, icon: FiHome, label: 'Dashboard' },
  { path: ROUTES.COMPANIES, icon: FiBuilding, label: 'Companies' },
  { path: ROUTES.PROJECTS, icon: FiBriefcase, label: 'Projects' },
  { path: ROUTES.LEADS, icon: FiTrendingUp, label: 'Leads' },
  { path: ROUTES.SETTINGS, icon: FiSettings, label: 'Settings' },
];

// Platform Owner sidebar items
export const PLATFORM_SIDEBAR = [
  { path: ROUTES.PLATFORM, icon: FiHome, label: 'Dashboard' },
  { path: ROUTES.PLATFORM_COMPANIES, icon: FiBuilding, label: 'Companies' },
  { path: ROUTES.PLATFORM_PLANS, icon: FiCreditCard, label: 'Plans' },
  { path: ROUTES.PLATFORM_SUBSCRIPTIONS, icon: FiUsers, label: 'Subscriptions' },
  { path: ROUTES.PLATFORM_COUPONS, icon: FiTag, label: 'Coupons' },
  { path: ROUTES.PLATFORM_ANALYTICS, icon: FiBarChart2, label: 'Analytics' },
  { path: ROUTES.PLATFORM_SETTINGS, icon: FiSettings, label: 'Settings' },
];

// Company Admin sidebar items
export const COMPANY_ADMIN_SIDEBAR = [
  { path: ROUTES.COMPANY, icon: FiHome, label: 'Dashboard' },
  { path: ROUTES.COMPANY_USERS, icon: FiUsers, label: 'Users' },
  { path: ROUTES.COMPANY_EMPLOYEES, icon: FiUserCheck, label: 'Employees' },
  { path: ROUTES.COMPANY_ROLES, icon: FiShield, label: 'Roles' },
  { path: ROUTES.COMPANY_DEPARTMENTS, icon: FiGrid, label: 'Departments' },
  { path: ROUTES.COMPANY_PROFILE, icon: FiEdit, label: 'Company Profile' },
  { path: ROUTES.COMPANY_MODULES, icon: FiBox, label: 'Modules' },
  { path: ROUTES.COMPANY_BRANDING, icon: FiPalette, label: 'Branding' },
  { path: ROUTES.COMPANY_SETTINGS, icon: FiSettings, label: 'Settings' },
];