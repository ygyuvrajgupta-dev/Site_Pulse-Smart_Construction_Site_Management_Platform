import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get platform-wide analytics
 * Query params: startDate, endDate, groupBy
 */
export async function getAnalytics(req, res, next) {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Default to last 30 days if not specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get company statistics
    const totalCompanies = await prisma.company.count();
    const activeCompanies = await prisma.company.count({
      where: { isActive: true },
    });
    const newCompanies = await prisma.company.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get user statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' },
    });
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get subscription statistics
    const totalSubscriptions = await prisma.subscription.count();
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });
    const trialingSubscriptions = await prisma.subscription.count({
      where: { status: 'TRIALING' },
    });

    // Get revenue statistics
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'INCOME',
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Get plan distribution
    const planDistribution = await prisma.plan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    // Get recent companies
    const recentCompanies = await prisma.company.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    // Get recent subscriptions
    const recentSubscriptions = await prisma.subscription.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            name: true,
            slug: true,
          },
        },
        plan: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });

    return response.success(res, {
      dateRange: {
        start,
        end,
      },
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        new: newCompanies,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trialing: trialingSubscriptions,
      },
      revenue: {
        total: totalRevenue,
        currency: 'USD',
      },
      planDistribution,
      recentCompanies,
      recentSubscriptions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get platform statistics
 */
export async function getPlatformStats(req, res, next) {
  try {
    // Quick stats for dashboard cards
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeSubscriptions,
      totalPlans,
      totalRevenue,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.plan.count(),
      prisma.transaction.aggregate({
        where: { type: 'INCOME' },
        _sum: { amount: true },
      }),
    ]);

    return response.success(res, {
      totalCompanies,
      activeCompanies,
      totalUsers,
      activeSubscriptions,
      totalPlans,
      totalRevenue: totalRevenue._sum.amount || 0,
    });
  } catch (error) {
    next(error);
  }
}