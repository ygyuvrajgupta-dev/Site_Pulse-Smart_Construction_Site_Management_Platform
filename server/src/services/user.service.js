import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';
import { hashPassword } from '../utils/hashPassword.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * Get all users for a company
 */
export async function getUsers(req, res, next) {
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
      ];
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          role: true,
          employee: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return response.success(res, {
      users,
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
 * Get user by ID
 */
export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const user = await prisma.user.findFirst({
      where: { id, companyId },
      include: {
        role: true,
        employee: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return response.success(res, user);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new user
 */
export async function createUser(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { email, password, name, phone, roleId, status } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        companyId,
        roleId,
        status: status || 'ACTIVE',
      },
      include: { role: true },
    });

    return response.success(res, user, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update user
 */
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, phone, roleId, status, avatar } = req.body;

    const user = await prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, phone, roleId, status, avatar },
      include: { role: true },
    });

    return response.success(res, updatedUser, 'User updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user
 */
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const user = await prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.user.delete({ where: { id } });

    return response.success(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Invite user via email
 */
export async function inviteUser(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { email, name, roleId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Create user with pending status
    const user = await prisma.user.create({
      data: {
        email,
        name,
        companyId,
        roleId,
        password: await hashPassword(Math.random().toString(36).slice(-8)),
        status: 'PENDING_VERIFICATION',
      },
    });

    // Send invitation email
    try {
      await sendEmail.sendEmail(
        email,
        'Invitation to join Site Pulse',
        `<p>You have been invited to join ${req.user.companyId}. Please complete your registration.</p>`
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
    }

    return response.success(res, user, 'Invitation sent successfully', 201);
  } catch (error) {
    next(error);
  }
}