import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Create a new plan
 */
export async function createPlan(req, res, next) {
  try {
    const { name, slug, description, price, currency, interval, trialDays, features, isActive, sortOrder } = req.body;

    // Check if slug already exists
    const existingPlan = await prisma.plan.findUnique({
      where: { slug },
    });

    if (existingPlan) {
      throw new AppError('Plan with this slug already exists', 409);
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        currency: currency || 'USD',
        interval: interval || 'MONTHLY',
        trialDays: trialDays || 14,
        features: features || {},
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
      },
    });

    return response.success(res, plan, 'Plan created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all plans
 */
export async function getAllPlans(req, res, next) {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    return response.success(res, plans);
  } catch (error) {
    next(error);
  }
}

/**
 * Get plan by ID
 */
export async function getPlanById(req, res, next) {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            company: true,
            user: true,
          },
        },
      },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    return response.success(res, plan);
  } catch (error) {
    next(error);
  }
}

/**
 * Update plan
 */
export async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, description, price, currency, interval, trialDays, features, isActive, sortOrder } = req.body;

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      throw new AppError('Plan not found', 404);
    }

    // Check if slug is being changed and already exists
    if (slug && slug !== existingPlan.slug) {
      const slugExists = await prisma.plan.findUnique({
        where: { slug },
      });

      if (slugExists) {
        throw new AppError('Plan with this slug already exists', 409);
      }
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        price: price ? parseFloat(price) : undefined,
        currency,
        interval,
        trialDays,
        features,
        isActive,
        sortOrder,
      },
    });

    return response.success(res, plan, 'Plan updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete plan
 */
export async function deletePlan(req, res, next) {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    if (plan._count.subscriptions > 0) {
      throw new AppError('Cannot delete plan with active subscriptions', 400);
    }

    await prisma.plan.delete({
      where: { id },
    });

    return response.success(res, null, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
}