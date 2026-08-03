import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get company dashboard overview
 */
export async function getDashboard(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const [users, employees, projects, leads, clients] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.employee.count({ where: { companyId } }),
      prisma.project.count({ where: { companyId } }),
      prisma.lead.count({ where: { companyId } }),
      prisma.client.count({ where: { companyId } }),
    ]);

    return response.success(res, {
      users,
      employees,
      projects,
      leads,
      clients,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get company profile
 */
export async function getCompanyProfile(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        settings: true,
        branding: true,
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return response.success(res, company);
  } catch (error) {
    next(error);
  }
}

/**
 * Update company profile
 */
export async function updateCompanyProfile(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, email, phone, website, address, city, state, country, postalCode, taxId, registrationNo } = req.body;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        email,
        phone,
        website,
        address,
        city,
        state,
        country,
        postalCode,
        taxId,
        registrationNo,
      },
    });

    return response.success(res, company, 'Company profile updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get company settings
 */
export async function getCompanySettings(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const settings = await prisma.companySetting.findMany({
      where: { companyId },
    });

    // Convert to key-value object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return response.success(res, settingsObject);
  } catch (error) {
    next(error);
  }
}

/**
 * Update company settings
 */
export async function updateCompanySettings(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const settings = req.body;

    // Update or create settings
    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.companySetting.upsert({
        where: {
          companyId_key: {
            companyId,
            key,
          },
        },
        update: { value: String(value) },
        create: {
          companyId,
          key,
          value: String(value),
        },
      })
    );

    await Promise.all(updates);

    return response.success(res, settings, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
}