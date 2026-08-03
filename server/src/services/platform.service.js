import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

// In-memory platform settings (in production, use database or Redis)
const platformSettings = {
  siteName: 'Site Pulse',
  siteDescription: 'Multi-tenant SaaS Platform',
  supportEmail: 'support@sitepulse.com',
  maxCompanies: 1000,
  maxUsersPerCompany: 100,
  defaultTrialDays: 14,
  allowRegistration: true,
  maintenanceMode: false,
  features: {
    ai: true,
    notifications: true,
    analytics: true,
    api: true,
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    fromEmail: 'noreply@sitepulse.com',
    fromName: 'Site Pulse',
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 15,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
  },
};

/**
 * Get platform settings
 */
export async function getPlatformSettings(req, res, next) {
  try {
    return response.success(res, platformSettings);
  } catch (error) {
    next(error);
  }
}

/**
 * Update platform settings
 */
export async function updatePlatformSettings(req, res, next) {
  try {
    const updates = req.body;

    // Merge updates with existing settings
    Object.assign(platformSettings, updates);

    // Deep merge nested objects
    if (updates.features) {
      platformSettings.features = { ...platformSettings.features, ...updates.features };
    }
    if (updates.email) {
      platformSettings.email = { ...platformSettings.email, ...updates.email };
    }
    if (updates.security) {
      platformSettings.security = { ...platformSettings.security, ...updates.security };
    }

    // TODO: Save to database
    // await prisma.platformSettings.upsert({...});

    return response.success(res, platformSettings, 'Platform settings updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get platform features
 */
export async function getPlatformFeatures(req, res, next) {
  try {
    return response.success(res, platformSettings.features);
  } catch (error) {
    next(error);
  }
}

/**
 * Update platform features
 */
export async function updatePlatformFeatures(req, res, next) {
  try {
    const { features } = req.body;

    platformSettings.features = { ...platformSettings.features, ...features };

    return response.success(res, platformSettings.features, 'Features updated successfully');
  } catch (error) {
    next(error);
  }
}