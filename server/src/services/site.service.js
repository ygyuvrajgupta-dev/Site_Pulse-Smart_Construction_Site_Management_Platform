import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all sites for a company
 */
export async function getSites(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const projectId = req.query.projectId;

    const skip = (page - 1) * limit;
    const where = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, name: true },
          },
          project: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              reports: true,
              progressEntries: true,
              materials: true,
              attendance: true,
              expenses: true,
              photos: true,
              issues: true,
            },
          },
        },
      }),
      prisma.site.count({ where }),
    ]);

    return response.success(res, {
      sites,
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
 * Get site by ID with full details
 */
export async function getSiteById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const site = await prisma.site.findFirst({
      where: { id, companyId },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        reports: {
          orderBy: { reportDate: 'desc' },
          take: 10,
        },
        progressEntries: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
        materials: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
          take: 10,
        },
        photos: {
          orderBy: { takenAt: 'desc' },
          take: 20,
        },
        issues: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    return response.success(res, site);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new site
 */
export async function createSite(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const {
      name,
      code,
      description,
      clientId,
      projectId,
      type,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      notes,
    } = req.body;

    const site = await prisma.site.create({
      data: {
        companyId,
        name,
        code,
        description,
        clientId,
        projectId,
        type,
        address,
        city,
        state,
        country,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return response.success(res, site, 'Site created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update site
 */
export async function updateSite(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      name,
      code,
      description,
      clientId,
      projectId,
      type,
      status,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      notes,
    } = req.body;

    const site = await prisma.site.findFirst({
      where: { id, companyId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    const updatedSite = await prisma.site.update({
      where: { id },
      data: {
        name,
        code,
        description,
        clientId,
        projectId,
        type,
        status,
        address,
        city,
        state,
        country,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        notes,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return response.success(res, updatedSite, 'Site updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete site
 */
export async function deleteSite(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const site = await prisma.site.findFirst({
      where: { id, companyId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    await prisma.site.delete({ where: { id } });

    return response.success(res, null, 'Site deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get site statistics
 */
export async function getSiteStats(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const site = await prisma.site.findFirst({
      where: { id, companyId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    const [
      reportStats,
      progressStats,
      materialStats,
      attendanceStats,
      expenseStats,
      issueStats,
    ] = await Promise.all([
      prisma.siteReport.aggregate({
        where: { siteId: id, companyId },
        _count: { id: true },
      }),
      prisma.siteProgress.findFirst({
        where: { siteId: id, companyId },
        orderBy: { recordedAt: 'desc' },
        select: { progress: true },
      }),
      prisma.siteMaterial.aggregate({
        where: { siteId: id, companyId },
        _count: { id: true },
        _sum: { quantityUsed: true, quantityRequired: true },
      }),
      prisma.siteAttendance.aggregate({
        where: { siteId: id, companyId },
        _count: { id: true },
      }),
      prisma.siteExpense.aggregate({
        where: { siteId: id, companyId },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.siteIssue.groupBy({
        by: ['status'],
        where: { siteId: id, companyId },
        _count: { id: true },
      }),
    ]);

    return response.success(res, {
      totalReports: reportStats._count.id,
      currentProgress: progressStats?.progress || 0,
      totalMaterials: materialStats._count.id,
      materialsUsed: materialStats._sum.quantityUsed || 0,
      materialsRequired: materialStats._sum.quantityRequired || 0,
      totalAttendanceRecords: attendanceStats._count.id,
      totalExpenses: expenseStats._count.id,
      totalExpenseAmount: expenseStats._sum.amount || 0,
      issueStats: issueStats.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
}