import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all clients for a company
 */
export async function getClients(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;

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

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              notes: true,
              files: true,
              meetings: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return response.success(res, {
      clients,
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
 * Get client by ID with full details
 */
export async function getClientById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const client = await prisma.client.findFirst({
      where: { id, companyId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        lead: {
          select: { id: true, name: true, source: true },
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
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    return response.success(res, client);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new client
 */
export async function createClient(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const {
      name,
      email,
      phone,
      company,
      jobTitle,
      website,
      address,
      city,
      state,
      country,
      postalCode,
      description,
      status,
      source,
      assignedToId,
    } = req.body;

    const client = await prisma.client.create({
      data: {
        companyId,
        name,
        email,
        phone,
        company,
        jobTitle,
        website,
        address,
        city,
        state,
        country,
        postalCode,
        description,
        status: status || 'ACTIVE',
        source,
        assignedToId: assignedToId || req.user.id,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, client, 'Client created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update client
 */
export async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      name,
      email,
      phone,
      company,
      jobTitle,
      website,
      address,
      city,
      state,
      country,
      postalCode,
      description,
      status,
      source,
      assignedToId,
    } = req.body;

    const client = await prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        company,
        jobTitle,
        website,
        address,
        city,
        state,
        country,
        postalCode,
        description,
        status,
        source,
        assignedToId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return response.success(res, updatedClient, 'Client updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete client
 */
export async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const client = await prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    await prisma.client.delete({ where: { id } });

    return response.success(res, null, 'Client deleted successfully');
  } catch (error) {
    next(error);
  }
}