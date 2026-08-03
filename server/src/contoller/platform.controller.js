import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Create a new company (Platform Owner only)
 */
export async function createCompany(req, res, next) {
  try {
    const { name, slug, email, phone, website, address, city, state, country, postalCode, taxId, registrationNo } = req.body;

    // Check if slug already exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug },
    });

    if (existingCompany) {
      throw new AppError('Company with this slug already exists', 409);
    }

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        slug,
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
        isActive: true,
      },
    });

    return response.success(res, company, 'Company created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all companies with pagination
 */
export async function getAllCompanies(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status !== undefined) {
      where.isActive = status === 'active';
    }

    // Get companies with counts
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              projects: true,
              clients: true,
              leads: true,
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return response.success(res, {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get company by ID
 */
export async function getCompanyById(req, res, next) {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            role: true,
            createdAt: true,
          },
        },
        subscriptions: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            users: true,
            projects: true,
            clients: true,
            leads: true,
            sites: true,
            tasks: true,
          },
        },
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
 * Update company
 */
export async function updateCompany(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, email, phone, website, address, city, state, country, postalCode, taxId, registrationNo, isActive, metadata } = req.body;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      throw new AppError('Company not found', 404);
    }

    // Check if slug is being changed and already exists
    if (slug && slug !== existingCompany.slug) {
      const slugExists = await prisma.company.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new AppError('Company with this slug already exists', 409);
      }
    }

    // Update company
    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        slug,
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
        isActive,
        metadata,
      },
    });

    return response.success(res, company, 'Company updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete company (hard delete)
 */
export async function deleteCompany(req, res, next) {
  try {
    const { id } = req.params;

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
            clients: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Check if company has data
    const hasData = company._count.users > 0 || company._count.projects > 0 || company._count.clients > 0;

    if (hasData) {
      throw new AppError('Cannot delete company with existing data. Please suspend instead.', 400);
    }

    // Delete company
    await prisma.company.delete({
      where: { id },
    });

    return response.success(res, null, 'Company deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Suspend company
 */
export async function suspendCompany(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    await prisma.company.update({
      where: { id },
      data: { isActive: false },
    });

    // TODO: Log activity
    // TODO: Send notification to company admins

    return response.success(res, null, 'Company suspended successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Activate company
 */
export async function activateCompany(req, res, next) {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    await prisma.company.update({
      where: { id },
      data: { isActive: true },
    });

    // TODO: Log activity
    // TODO: Send notification to company admins

    return response.success(res, null, 'Company activated successfully');
  } catch (error) {
    next(error);
  }
}