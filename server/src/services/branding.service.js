import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get company branding settings
 * Branding is stored as company settings with key prefix 'branding_'
 */
export async function getBranding(req, res, next) {
  try {
    const companyId = req.user.companyId;

    // Get all branding settings
    const brandingSettings = await prisma.companySetting.findMany({
      where: {
        companyId,
        key: { startsWith: 'branding_' },
      },
    });

    // Default branding
    const defaultBranding = {
      primaryColor: '#2563EB',
      secondaryColor: '#4F46E5',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      logoUrl: '',
      faviconUrl: '',
      companyName: '',
      tagline: '',
      customCss: '',
      emailTemplate: 'default',
      loginPageStyle: 'default',
      sidebarStyle: 'light',
    };

    // Merge with stored settings
    const branding = { ...defaultBranding };
    brandingSettings.forEach((setting) => {
      const key = setting.key.replace('branding_', '');
      branding[key] = setting.value;
    });

    // Get company name if not set
    if (!branding.companyName) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, logo: true },
      });

      if (company) {
        branding.companyName = company.name;
        if (company.logo && !branding.logoUrl) {
          branding.logoUrl = company.logo;
        }
      }
    }

    return response.success(res, branding);
  } catch (error) {
    next(error);
  }
}

/**
 * Update company branding
 */
export async function updateBranding(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const brandingData = req.body;

    // Update company logo if provided
    if (brandingData.logoUrl) {
      await prisma.company.update({
        where: { id: companyId },
        data: { logo: brandingData.logoUrl },
      });
    }

    // Update or create branding settings
    const updates = Object.entries(brandingData).map(([key, value]) =>
      prisma.companySetting.upsert({
        where: {
          companyId_key: {
            companyId,
            key: `branding_${key}`,
          },
        },
        update: { value: String(value) },
        create: {
          companyId,
          key: `branding_${key}`,
          value: String(value),
        },
      })
    );

    await Promise.all(updates);

    // Return updated branding
    const brandingSettings = await prisma.companySetting.findMany({
      where: {
        companyId,
        key: { startsWith: 'branding_' },
      },
    });

    const branding = {};
    brandingSettings.forEach((setting) => {
      const key = setting.key.replace('branding_', '');
      branding[key] = setting.value;
    });

    return response.success(res, branding, 'Branding updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Reset branding to defaults
 */
export async function resetBranding(req, res, next) {
  try {
    const companyId = req.user.companyId;

    // Delete all branding settings
    await prisma.companySetting.deleteMany({
      where: {
        companyId,
        key: { startsWith: 'branding_' },
      },
    });

    return response.success(res, null, 'Branding reset to defaults');
  } catch (error) {
    next(error);
  }
}