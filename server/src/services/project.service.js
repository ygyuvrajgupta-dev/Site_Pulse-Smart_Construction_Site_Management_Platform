import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all projects for a company
 */
export async function getProjects(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const clientId = req.query.clientId;

    const skip = (page - 1) * limit;
    const where = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              tasks: true,
              milestones: true,
              sites: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return response.success(res, {
      projects,
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
 * Get project by ID with full details
 */
export async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        milestones: {
          orderBy: { dueDate: 'asc' },
        },
        tasks: {
          orderBy: { sortOrder: 'asc' },
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        sites: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return response.success(res, project);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new project
 */
export async function createProject(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const {
      name,
      code,
      description,
      clientId,
      status,
      priority,
      startDate,
      endDate,
      budget,
      currency,
      progress,
      notes,
    } = req.body;

    const project = await prisma.project.create({
      data: {
        companyId,
        name,
        code,
        description,
        clientId,
        status: status || 'PLANNING',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        currency: currency || 'USD',
        progress: progress ? parseInt(progress) : 0,
        notes,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, project, 'Project created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update project
 */
export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      name,
      code,
      description,
      clientId,
      status,
      priority,
      startDate,
      endDate,
      budget,
      actualCost,
      currency,
      progress,
      notes,
    } = req.body;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        code,
        description,
        clientId,
        status,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget !== undefined ? parseFloat(budget) : undefined,
        actualCost: actualCost !== undefined ? parseFloat(actualCost) : undefined,
        currency,
        progress: progress !== undefined ? parseInt(progress) : undefined,
        notes,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, updatedProject, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete project
 */
export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    await prisma.project.delete({ where: { id } });

    return response.success(res, null, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get project statistics
 */
export async function getProjectStats(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const [taskStats, milestoneStats] = await Promise.all([
      prisma.task.aggregate({
        where: { projectId: id, companyId },
        _count: { id: true },
        _sum: {
          estimatedHours: true,
          actualHours: true,
        },
      }),
      prisma.milestone.aggregate({
        where: { projectId: id, companyId },
        _count: { id: true },
      }),
    ]);

    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: id, companyId },
      _count: { id: true },
    });

    const milestoneCounts = await prisma.milestone.groupBy({
      by: ['status'],
      where: { projectId: id, companyId },
      _count: { id: true },
    });

    return response.success(res, {
      totalTasks: taskStats._count.id,
      totalEstimatedHours: taskStats._sum.estimatedHours || 0,
      totalActualHours: taskStats._sum.actualHours || 0,
      taskCounts: taskCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      totalMilestones: milestoneStats._count.id,
      milestoneCounts: milestoneCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
    });
  } catch (error) {
    next(error);
  }
}