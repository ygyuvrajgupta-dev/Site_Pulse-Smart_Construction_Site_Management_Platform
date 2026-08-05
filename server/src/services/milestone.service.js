import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all milestones for a project
 */
export async function getMilestones(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { projectId } = req.params;
    const status = req.query.status;

    const where = { companyId, projectId };

    if (status) {
      where.status = status;
    }

    const milestones = await prisma.milestone.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    return response.success(res, milestones);
  } catch (error) {
    next(error);
  }
}

/**
 * Get milestone by ID
 */
export async function getMilestoneById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const milestone = await prisma.milestone.findFirst({
      where: { id, companyId },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    return response.success(res, milestone);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new milestone
 */
export async function createMilestone(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { projectId } = req.params;
    const { name, description, status, dueDate } = req.body;

    // Verify project exists and belongs to company
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const milestone = await prisma.milestone.create({
      data: {
        companyId,
        projectId,
        name,
        description,
        status: status || 'NOT_STARTED',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return response.success(res, milestone, 'Milestone created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update milestone
 */
export async function updateMilestone(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, description, status, dueDate } = req.body;

    const milestone = await prisma.milestone.findFirst({
      where: { id, companyId },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    const updateData = {
      name,
      description,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    // If status is being changed to COMPLETED, set completedAt
    if (status === 'COMPLETED' && milestone.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return response.success(res, updatedMilestone, 'Milestone updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete milestone
 */
export async function deleteMilestone(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const milestone = await prisma.milestone.findFirst({
      where: { id, companyId },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    await prisma.milestone.delete({ where: { id } });

    return response.success(res, null, 'Milestone deleted successfully');
  } catch (error) {
    next(error);
  }
}