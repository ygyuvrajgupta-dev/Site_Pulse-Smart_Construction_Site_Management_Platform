import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all leads for a company
 * Supports filtering by status, pipeline stage, and search
 */
export async function getLeads(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const stageId = req.query.stageId;
    const assignedToId = req.query.assignedToId;

    const skip = (page - 1) * limit;
    const where = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (stageId) {
      where.stageId = stageId;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          stage: true,
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              notes: true,
              files: true,
              meetings: true,
              followUps: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return response.success(res, {
      leads,
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
 * Get lead by ID with full details
 */
export async function getLeadById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const lead = await prisma.lead.findFirst({
      where: { id, companyId },
      include: {
        stage: true,
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        files: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedBy: {
              select: { id: true, name: true },
            },
          },
        },
        meetings: {
          orderBy: { startTime: 'asc' },
          include: {
            attendees: {
              include: {
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        followUps: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    return response.success(res, lead);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new lead
 */
export async function createLead(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const {
      name,
      email,
      phone,
      company,
      jobTitle,
      source,
      status,
      stageId,
      assignedToId,
      estimatedValue,
      currency,
      description,
      website,
      address,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    // Get default stage if not provided
    let finalStageId = stageId;
    if (!finalStageId) {
      const defaultStage = await prisma.pipelineStage.findFirst({
        where: { companyId, isDefault: true },
      });
      if (defaultStage) {
        finalStageId = defaultStage.id;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        companyId,
        name,
        email,
        phone,
        company,
        jobTitle,
        source,
        status: status || 'NEW',
        stageId: finalStageId,
        assignedToId: assignedToId || req.user.id,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        currency: currency || 'USD',
        description,
        website,
        address,
        city,
        state,
        country,
        postalCode,
      },
      include: {
        stage: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, lead, 'Lead created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update lead
 */
export async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      name,
      email,
      phone,
      company,
      jobTitle,
      source,
      status,
      stageId,
      assignedToId,
      estimatedValue,
      currency,
      description,
      website,
      address,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id, companyId },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        company,
        jobTitle,
        source,
        status,
        stageId,
        assignedToId,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        currency,
        description,
        website,
        address,
        city,
        state,
        country,
        postalCode,
      },
      include: {
        stage: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, updatedLead, 'Lead updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete lead
 */
export async function deleteLead(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const lead = await prisma.lead.findFirst({
      where: { id, companyId },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    await prisma.lead.delete({ where: { id } });

    return response.success(res, null, 'Lead deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Convert lead to client
 */
export async function convertLeadToClient(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const lead = await prisma.lead.findFirst({
      where: { id, companyId },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (lead.status === 'CONVERTED') {
      throw new AppError('Lead is already converted', 400);
    }

    // Create client from lead data
    const client = await prisma.client.create({
      data: {
        companyId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.jobTitle,
        website: lead.website,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        postalCode: lead.postalCode,
        description: lead.description,
        status: 'ACTIVE',
        source: lead.source,
        assignedToId: lead.assignedToId,
        leadId: lead.id,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id },
      data: { status: 'CONVERTED', convertedAt: new Date() },
    });

    return response.success(res, client, 'Lead converted to client successfully', 201);
  } catch (error) {
    next(error);
  }
}