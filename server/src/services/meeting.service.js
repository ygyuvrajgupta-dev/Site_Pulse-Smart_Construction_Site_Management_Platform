import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all meetings for a company
 */
export async function getMeetings(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const leadId = req.query.leadId;
    const clientId = req.query.clientId;

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

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: {
          lead: {
            select: { id: true, name: true, company: true },
          },
          client: {
            select: { id: true, name: true, company: true },
          },
          organizer: {
            select: { id: true, name: true, email: true },
          },
          attendees: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.meeting.count({ where }),
    ]);

    return response.success(res, {
      meetings,
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
 * Get meeting by ID
 */
export async function getMeetingById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const meeting = await prisma.meeting.findFirst({
      where: { id, companyId },
      include: {
        lead: {
          select: { id: true, name: true, company: true, email: true, phone: true },
        },
        client: {
          select: { id: true, name: true, company: true, email: true, phone: true },
        },
        organizer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    return response.success(res, meeting);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new meeting
 */
export async function createMeeting(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const {
      title,
      description,
      leadId,
      clientId,
      startTime,
      endTime,
      location,
      meetingType,
      meetingUrl,
      attendeeIds,
    } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        companyId,
        title,
        description,
        leadId,
        clientId,
        organizerId: req.user.id,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        location,
        meetingType: meetingType || 'IN_PERSON',
        meetingUrl,
        status: 'SCHEDULED',
        attendees: attendeeIds && attendeeIds.length > 0 ? {
          create: attendeeIds.map((userId) => ({
            userId,
          })),
        } : undefined,
      },
      include: {
        lead: {
          select: { id: true, name: true, company: true },
        },
        client: {
          select: { id: true, name: true, company: true },
        },
        organizer: {
          select: { id: true, name: true, email: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return response.success(res, meeting, 'Meeting created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update meeting
 */
export async function updateMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const {
      title,
      description,
      leadId,
      clientId,
      startTime,
      endTime,
      location,
      meetingType,
      meetingUrl,
      status,
      attendeeIds,
    } = req.body;

    const meeting = await prisma.meeting.findFirst({
      where: { id, companyId },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    // Update attendees if provided
    if (attendeeIds) {
      await prisma.meetingAttendee.deleteMany({
        where: { meetingId: id },
      });

      if (attendeeIds.length > 0) {
        await prisma.meetingAttendee.createMany({
          data: attendeeIds.map((userId) => ({
            meetingId: id,
            userId,
          })),
        });
      }
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        title,
        description,
        leadId,
        clientId,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        location,
        meetingType,
        meetingUrl,
        status,
      },
      include: {
        lead: {
          select: { id: true, name: true, company: true },
        },
        client: {
          select: { id: true, name: true, company: true },
        },
        organizer: {
          select: { id: true, name: true, email: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return response.success(res, updatedMeeting, 'Meeting updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete meeting
 */
export async function deleteMeeting(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const meeting = await prisma.meeting.findFirst({
      where: { id, companyId },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    await prisma.meeting.delete({ where: { id } });

    return response.success(res, null, 'Meeting deleted successfully');
  } catch (error) {
    next(error);
  }
}