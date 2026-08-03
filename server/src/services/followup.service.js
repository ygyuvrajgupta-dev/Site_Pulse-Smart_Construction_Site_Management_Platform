import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all follow-ups for a company
 */
export async function getFollowUps(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const leadId = req.query.leadId;
    const clientId = req.query.clientId;
    const assignedToId = req.query.assignedToId;
    const overdue = req.query.overdue === 'true';

    const skip = (page - 1) * limit;
    const where = { companyId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (overdue) {
      where.status = 'PENDING';
      where.dueDate = { lt: new Date() };
    }

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          lead: {
            select: { id: true, name: true, company: true },
          },
          client: {
            select: { id: true, name: true, company: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.followUp.count({ where }),
    ]);

    return response.success(res, {
      followUps,
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
 * Create a new follow-up
 */
export async function createFollowUp(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const {
      title,
      description,
      leadId,
      clientId,
      type,
      dueDate,
      assignedToId,
      reminderMinutes,
    } = req.body;

    if (!leadId && !clientId) {
      throw new AppError('Either leadId or clientId is required', 400);
    }

    const followUp = await prisma.followUp.create({
      data: {
        companyId,
        title,
        description,
        leadId,
        clientId,
        type: type || 'CALL',
        dueDate: new Date(dueDate),
        assignedToId: assignedToId || req.user.id,
        createdById: req.user.id,
        status: 'PENDING',
        reminderMinutes: reminderMinutes || 15,
      },
      include: {
        lead: {
          select: { id: true, name: true, company: true },
        },
        client: {
          select: { id: true, name: true, company: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, followUp, 'Follow-up created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update follow-up
 */
export async function updateFollowUp(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      title,
      description,
      type,
      dueDate,
      assignedToId,
      status,
      reminderMinutes,
    } = req.body;

    const followUp = await prisma.followUp.findFirst({
      where: { id, companyId },
    });

    if (!followUp) {
      throw new AppError('Follow-up not found', 404);
    }

    const updatedFollowUp = await prisma.followUp.update({
      where: { id },
      data: {
        title,
        description,
        type,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedToId,
        status,
        reminderMinutes,
      },
      include: {
        lead: {
          select: { id: true, name: true, company: true },
        },
        client: {
          select: { id: true, name: true, company: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, updatedFollowUp, 'Follow-up updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete follow-up
 */
export async function deleteFollowUp(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const followUp = await prisma.followUp.findFirst({
      where: { id, companyId },
    });

    if (!followUp) {
      throw new AppError('Follow-up not found', 404);
    }

    await prisma.followUp.delete({ where: { id } });

    return response.success(res, null, 'Follow-up deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Mark follow-up as complete
 */
export async function completeFollowUp(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { outcome, notes } = req.body;

    const followUp = await prisma.followUp.findFirst({
      where: { id, companyId },
    });

    if (!followUp) {
      throw new AppError('Follow-up not found', 404);
    }

    const updatedFollowUp = await prisma.followUp.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        outcome,
        completionNotes: notes,
      },
      include: {
        lead: {
          select: { id: true, name: true, company: true },
        },
        client: {
          select: { id: true, name: true, company: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, updatedFollowUp, 'Follow-up completed successfully');
  } catch (error) {
    next(error);
  }
}