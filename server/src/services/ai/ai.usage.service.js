import prisma from "../../config/db.js";
import env from "../../config/env.js";
import logger from "../../config/logger.js";

/**
 * AI Usage Tracking Service.
 * Records every AI request/response for billing, monitoring, and quota management.
 * Uses the existing AiUsageLog and AiFeature models from the schema.
 */

/**
 * Record an AI usage log entry.
 * @param {Object} params
 * @param {string} params.companyId - Company ID.
 * @param {string} [params.userId] - User ID.
 * @param {string} [params.featureId] - AI feature ID.
 * @param {string} params.modelName - Model used.
 * @param {string} [params.prompt] - Input prompt.
 * @param {string} [params.response] - Generated response.
 * @param {number} [params.tokensIn=0] - Input tokens.
 * @param {number} [params.tokensOut=0] - Output tokens.
 * @param {number} [params.duration] - Duration in ms.
 * @param {number} [params.cost] - Cost in USD.
 * @param {boolean} [params.success=true] - Whether the call succeeded.
 * @returns {Promise<Object>} The created usage log.
 */
export async function recordAiUsage({
  companyId,
  userId,
  featureId,
  modelName,
  prompt,
  response,
  tokensIn = 0,
  tokensOut = 0,
  duration,
  cost,
  success = true,
}) {
  if (!env.ai.enableUsageTracking) {
    return null;
  }

  try {
    const usageLog = await prisma.aiUsageLog.create({
      data: {
        companyId,
        userId,
        featureId,
        modelName,
        prompt: prompt?.slice(0, 10000), // Truncate long prompts
        response: response?.slice(0, 10000), // Truncate long responses
        tokensIn,
        tokensOut,
        duration,
        cost,
        success,
      },
    });

    // Increment monthly usage counter on the feature
    if (featureId) {
      await prisma.aiFeature.update({
        where: { id: featureId },
        data: {
          usedThisMonth: { increment: 1 },
        },
      });
    }

    return usageLog;
  } catch (error) {
    // Usage tracking should never break the main flow
    logger.error("Failed to record AI usage", { error: error.message });
    return null;
  }
}

/**
 * Get AI usage statistics for a company.
 * @param {string} companyId - Company ID.
 * @param {Object} [options]
 * @param {Date} [options.startDate] - Start date filter.
 * @param {Date} [options.endDate] - End date filter.
 * @returns {Promise<Object>} Usage statistics.
 */
export async function getCompanyAiUsage(companyId, { startDate, endDate } = {}) {
  const where = {
    companyId,
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  };

  const [totalCalls, successfulCalls, failedCalls, totalTokensIn, totalTokensOut, totalCost, recentLogs] =
    await Promise.all([
      prisma.aiUsageLog.count({ where }),
      prisma.aiUsageLog.count({ where: { ...where, success: true } }),
      prisma.aiUsageLog.count({ where: { ...where, success: false } }),
      prisma.aiUsageLog.aggregate({ where, _sum: { tokensIn: true } }),
      prisma.aiUsageLog.aggregate({ where, _sum: { tokensOut: true } }),
      prisma.aiUsageLog.aggregate({ where, _sum: { cost: true } }),
      prisma.aiUsageLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          modelName: true,
          prompt: true,
          tokensIn: true,
          tokensOut: true,
          duration: true,
          cost: true,
          success: true,
          createdAt: true,
        },
      }),
    ]);

  return {
    totalCalls,
    successfulCalls,
    failedCalls,
    successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
    totalTokensIn: totalTokensIn._sum.tokensIn || 0,
    totalTokensOut: totalTokensOut._sum.tokensOut || 0,
    totalTokens: (totalTokensIn._sum.tokensIn || 0) + (totalTokensOut._sum.tokensOut || 0),
    totalCost: totalCost._sum.cost || 0,
    recentLogs,
  };
}

/**
 * Get AI usage by feature for a company.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Array>} Usage breakdown by feature.
 */
export async function getAiUsageByFeature(companyId) {
  const features = await prisma.aiFeature.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      provider: true,
      modelName: true,
      status: true,
      monthlyLimit: true,
      usedThisMonth: true,
      _count: {
        select: { usageLogs: true },
      },
    },
  });

  return features;
}

/**
 * Check if a company has exceeded its AI usage limit.
 * @param {string} companyId - Company ID.
 * @param {string} featureName - Feature name (e.g., "chat", "reports").
 * @returns {Promise<{allowed: boolean, remaining: number|null}>}
 */
export async function checkAiQuota(companyId, featureName) {
  const feature = await prisma.aiFeature.findUnique({
    where: {
      companyId_name: {
        companyId,
        name: featureName,
      },
    },
  });

  if (!feature) {
    return { allowed: true, remaining: null };
  }

  if (feature.status === "DISABLED") {
    return { allowed: false, remaining: 0 };
  }

  if (feature.monthlyLimit && feature.usedThisMonth >= feature.monthlyLimit) {
    return { allowed: false, remaining: 0 };
  }

  const remaining = feature.monthlyLimit
    ? feature.monthlyLimit - feature.usedThisMonth
    : null;

  return { allowed: true, remaining };
}

/**
 * Get or create an AI feature configuration for a company.
 * @param {string} companyId - Company ID.
 * @param {string} name - Feature name.
 * @param {Object} [config] - Feature configuration.
 * @returns {Promise<Object>} The AI feature record.
 */
export async function getOrCreateAiFeature(companyId, name, config = {}) {
  const existing = await prisma.aiFeature.findUnique({
    where: {
      companyId_name: {
        companyId,
        name,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.aiFeature.create({
    data: {
      companyId,
      name,
      provider: config.provider || "OPENAI",
      modelName: config.modelName,
      apiKey: config.apiKey,
      status: config.status || "ACTIVE",
      monthlyLimit: config.monthlyLimit,
      settings: config.settings,
    },
  });
}

export default {
  recordAiUsage,
  getCompanyAiUsage,
  getAiUsageByFeature,
  checkAiQuota,
  getOrCreateAiFeature,
};