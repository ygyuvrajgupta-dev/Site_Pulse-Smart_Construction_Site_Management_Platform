import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all subscriptions with filters
 */
export async function getAllSubscriptions(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const planId = req.query.planId;
    const companyId = req.query.companyId;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (planId) {
      where.planId = planId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              email: true,
            },
          },
          plan: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return response.success(res, {
      subscriptions,
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
 * Get subscription by ID
 */
export async function getSubscriptionById(req, res, next) {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        company: true,
        plan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    return response.success(res, subscription);
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        autoRenew: false,
      },
    });

    // TODO: Log activity
    // TODO: Send notification to company

    return response.success(res, updatedSubscription, 'Subscription canceled successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(req, res, next) {
  try {
    const { id } = req.params;
    const { planId, status, endDate, trialEndsAt, autoRenew } = req.body;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        planId,
        status,
        endDate,
        trialEndsAt,
        autoRenew,
      },
    });

    return response.success(res, updatedSubscription, 'Subscription updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Create subscription (for testing/manual creation)
 */
export async function createSubscription(req, res, next) {
  try {
    const { companyId, planId, userId, status, startDate, endDate, trialEndsAt } = req.body;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Verify plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    const subscription = await prisma.subscription.create({
      data: {
        companyId,
        planId,
        userId,
        status: status || 'TRIALING',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
      },
      include: {
        company: true,
        plan: true,
      },
    });

    return response.success(res, subscription, 'Subscription created successfully', 201);
  } catch (error) {
    next(error);
  }
}