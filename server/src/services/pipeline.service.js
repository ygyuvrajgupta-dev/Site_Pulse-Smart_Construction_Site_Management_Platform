import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get pipeline overview with stages and leads
 * This is the main data for the Kanban board
 */
export async function getPipeline(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const stages = await prisma.pipelineStage.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        _count: {
          select: { leads: true },
        },
      },
    });

    // Calculate pipeline metrics
    const totalLeads = stages.reduce((sum, stage) => sum + stage._count.leads, 0);
    const totalValue = stages.reduce(
      (sum, stage) =>
        sum +
        stage.leads.reduce(
          (stageSum, lead) => stageSum + (lead.estimatedValue || 0),
          0
        ),
      0
    );

    return response.success(res, {
      stages,
      metrics: {
        totalLeads,
        totalValue,
        stageCount: stages.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all pipeline stages
 */
export async function getPipelineStages(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const stages = await prisma.pipelineStage.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    return response.success(res, stages);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new pipeline stage
 */
export async function createPipelineStage(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, color, order, isDefault } = req.body;

    // Get the max order if not provided
    let stageOrder = order;
    if (stageOrder === undefined) {
      const maxOrder = await prisma.pipelineStage.aggregate({
        where: { companyId },
        _max: { order: true },
      });
      stageOrder = (maxOrder._max.order || 0) + 1;
    }

    // If isDefault is true, unset other defaults
    if (isDefault) {
      await prisma.pipelineStage.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const stage = await prisma.pipelineStage.create({
      data: {
        companyId,
        name,
        color: color || '#3B82F6',
        order: stageOrder,
        isDefault: isDefault || false,
      },
    });

    return response.success(res, stage, 'Pipeline stage created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update pipeline stage
 */
export async function updatePipelineStage(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, color, order, isDefault } = req.body;

    const stage = await prisma.pipelineStage.findFirst({
      where: { id, companyId },
    });

    if (!stage) {
      throw new AppError('Pipeline stage not found', 404);
    }

    // If isDefault is true, unset other defaults
    if (isDefault) {
      await prisma.pipelineStage.updateMany({
        where: { companyId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updatedStage = await prisma.pipelineStage.update({
      where: { id },
      data: { name, color, order, isDefault },
    });

    return response.success(res, updatedStage, 'Pipeline stage updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete pipeline stage
 */
export async function deletePipelineStage(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const stage = await prisma.pipelineStage.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!stage) {
      throw new AppError('Pipeline stage not found', 404);
    }

    // Check if stage has leads
    if (stage._count.leads > 0) {
      throw new AppError('Cannot delete stage with leads. Move leads to another stage first.', 400);
    }

    // Check if it's the default stage
    if (stage.isDefault) {
      throw new AppError('Cannot delete the default stage. Set another stage as default first.', 400);
    }

    await prisma.pipelineStage.delete({ where: { id } });

    return response.success(res, null, 'Pipeline stage deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Move a lead to a different pipeline stage
 * This is used for drag-and-drop in the Kanban board
 */
export async function moveLeadToStage(req, res, next) {
  try {
    const { leadId, stageId } = req.params;
    const companyId = req.user.companyId;

    // Verify lead belongs to company
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    // Verify stage belongs to company
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: stageId, companyId },
    });

    if (!stage) {
      throw new AppError('Pipeline stage not found', 404);
    }

    // Update lead's stage
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { stageId },
      include: {
        stage: true,
        assignedTo: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return response.success(res, updatedLead, 'Lead moved successfully');
  } catch (error) {
    next(error);
  }
}