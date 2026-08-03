import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all modules for a company
 * Modules are stored as company settings with key prefix 'module_'
 */
export async function getModules(req, res, next) {
  try {
    const companyId = req.user.companyId;

    // Get all module settings
    const moduleSettings = await prisma.companySetting.findMany({
      where: {
        companyId,
        key: { startsWith: 'module_' },
      },
    });

    // Define available modules
    const availableModules = [
      {
        id: 'crm',
        name: 'CRM',
        description: 'Manage leads, clients, and customer relationships',
        icon: 'FiUsers',
        enabled: true,
      },
      {
        id: 'projects',
        name: 'Project Management',
        description: 'Track projects, tasks, and milestones',
        icon: 'FiBriefcase',
        enabled: true,
      },
      {
        id: 'hr',
        name: 'Human Resources',
        description: 'Manage employees, departments, and attendance',
        icon: 'FiUserCheck',
        enabled: true,
      },
      {
        id: 'inventory',
        name: 'Inventory',
        description: 'Track inventory items and stock levels',
        icon: 'FiBox',
        enabled: false,
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing',
        description: 'Manage manufacturing orders and production',
        icon: 'FiSettings',
        enabled: false,
      },
      {
        id: 'finance',
        name: 'Finance',
        description: 'Track transactions and financial reports',
        icon: 'FiDollarSign',
        enabled: true,
      },
      {
        id: 'documents',
        name: 'Documents',
        description: 'Store and manage company documents',
        icon: 'FiFileText',
        enabled: true,
      },
      {
        id: 'ai',
        name: 'AI Features',
        description: 'AI-powered insights and automation',
        icon: 'FiCpu',
        enabled: false,
      },
      {
        id: 'notifications',
        name: 'Notifications',
        description: 'In-app and email notifications',
        icon: 'FiBell',
        enabled: true,
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Business intelligence and reporting',
        icon: 'FiBarChart2',
        enabled: true,
      },
    ];

    // Merge with stored settings
    const modules = availableModules.map((module) => {
      const setting = moduleSettings.find((s) => s.key === `module_${module.id}`);
      return {
        ...module,
        enabled: setting ? setting.value === 'true' : module.enabled,
      };
    });

    return response.success(res, modules);
  } catch (error) {
    next(error);
  }
}

/**
 * Update module settings
 */
export async function updateModuleSettings(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { enabled } = req.body;

    const key = `module_${id}`;

    await prisma.companySetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key,
        },
      },
      update: { value: String(enabled) },
      create: {
        companyId,
        key,
        value: String(enabled),
      },
    });

    return response.success(res, { id, enabled }, 'Module settings updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get enabled modules only
 */
export async function getEnabledModules(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const moduleSettings = await prisma.companySetting.findMany({
      where: {
        companyId,
        key: { startsWith: 'module_' },
        value: 'true',
      },
    });

    const enabledModuleIds = moduleSettings.map((s) => s.key.replace('module_', ''));

    return response.success(res, enabledModuleIds);
  } catch (error) {
    next(error);
  }
}