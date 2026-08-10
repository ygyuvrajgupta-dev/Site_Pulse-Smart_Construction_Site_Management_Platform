import prisma from "../../config/db.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateCompletion } from "./ai.provider.js";
import { recordAiUsage, checkAiQuota, getOrCreateAiFeature } from "./ai.usage.service.js";

/**
 * AI Insights Service.
 * Automatically generates business insights from company data.
 * Detects trends, anomalies, risks, and opportunities.
 */

/**
 * Gather data for insight generation.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Company data snapshot.
 */
async function gatherInsightData(companyId) {
  const [
    projects,
    leads,
    clients,
    transactions,
    tasks,
    sites,
    inventoryItems,
  ] = await Promise.all([
    prisma.project.findMany({ where: { companyId } }),
    prisma.lead.findMany({ where: { companyId } }),
    prisma.client.findMany({ where: { companyId } }),
    prisma.transaction.findMany({ where: { companyId } }),
    prisma.task.findMany({ where: { companyId } }),
    prisma.site.findMany({ where: { companyId } }),
    prisma.inventoryItem.findMany({ where: { companyId } }),
  ]);

  const income = transactions.filter((t) => t.type === "INCOME");
  const expenses = transactions.filter((t) => t.type === "EXPENSE");

  return {
    projects: {
      total: projects.length,
      statuses: projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
      averageProgress: projects.length
        ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
        : 0,
    },
    leads: {
      total: leads.length,
      statuses: leads.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
      }, {}),
      conversionRate: leads.length
        ? (leads.filter((l) => l.status === "WON").length / leads.length) * 100
        : 0,
    },
    clients: {
      total: clients.length,
      active: clients.filter((c) => c.isActive).length,
    },
    finance: {
      totalIncome: income.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalExpenses: expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      netBalance:
        income.reduce((sum, t) => sum + parseFloat(t.amount), 0) -
        expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      incomeCount: income.length,
      expenseCount: expenses.length,
    },
    tasks: {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "DONE").length,
      overdue: tasks.filter(
        (t) => t.dueDate && t.dueDate < new Date() && t.status !== "DONE"
      ).length,
      completionRate: tasks.length
        ? (tasks.filter((t) => t.status === "DONE").length / tasks.length) * 100
        : 0,
    },
    sites: {
      total: sites.length,
      active: sites.filter((s) => s.status === "ACTIVE").length,
    },
    inventory: {
      totalItems: inventoryItems.length,
      lowStock: inventoryItems.filter(
        (i) => i.reorderPoint && i.quantity <= i.reorderPoint
      ).length,
    },
  };
}

/**
 * Generate AI insights for a company.
 * @param {Object} params
 * @param {string} params.companyId - Company ID.
 * @param {string} [params.userId] - User ID.
 * @param {Object} [params.options] - AI options.
 * @returns {Promise<Array>} Generated insights.
 */
export async function generateInsights({ companyId, userId, options = {} }) {
  // Check quota
  const quota = await checkAiQuota(companyId, "insights");
  if (!quota.allowed) {
    throw new AppError("AI insights quota exceeded. Please upgrade your plan or contact admin.", 429);
  }

  // Gather data
  const data = await gatherInsightData(companyId);

  // Get or create AI feature for tracking
  const feature = await getOrCreateAiFeature(companyId, "insights", {
    provider: options.provider || "OPENAI",
    modelName: options.model,
  });

  try {
    const systemPrompt = `You are SitePulse AI insights engine. Analyze the provided business data and generate actionable insights. Return the insights as a JSON array.`;

    const userPrompt = `
Company Data:
${JSON.stringify(data, null, 2)}

Generate 5-10 business insights. Each insight should have:
- type: "TREND" | "ANOMALY" | "FORECAST" | "CORRELATION" | "PERFORMANCE" | "RISK" | "OPPORTUNITY"
- severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- title: Short, descriptive title
- description: Detailed explanation with specific data points
- entityType: "PROJECT" | "LEAD" | "FINANCE" | "TASK" | "SITE" | "INVENTORY" | "CLIENT" | "GENERAL"
- entityId: null

Return as JSON array:
[
  {
    "type": "TREND",
    "severity": "MEDIUM",
    "title": "Example insight title",
    "description": "Detailed description with data",
    "entityType": "GENERAL",
    "entityId": null
  }
]
`;

    const result = await generateCompletion({
      prompt: userPrompt,
      system: systemPrompt,
      provider: options.provider,
      model: options.model,
      maxTokens: options.maxTokens || 3000,
      temperature: 0.3,
    });

    // Parse insights from response
    let insights = [];
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      insights = [];
    }

    // Save insights to database
    const savedInsights = [];
    for (const insight of insights.slice(0, 10)) {
      const saved = await prisma.aiInsight.create({
        data: {
          companyId,
          userId,
          type: insight.type || "TREND",
          severity: insight.severity || "INFO",
          title: insight.title || "Insight",
          description: insight.description || "",
          data: insight,
          entityType: insight.entityType || "GENERAL",
          entityId: insight.entityId,
        },
      });
      savedInsights.push(saved);
    }

    // Record usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: result.model,
      prompt: userPrompt,
      response: result.text,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      duration: result.durationMs,
      success: true,
    });

    return savedInsights;
  } catch (error) {
    // Record failed usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: options.model || "unknown",
      prompt: "generate insights",
      success: false,
    });
    throw error;
  }
}

/**
 * List insights for a company.
 * @param {string} companyId - Company ID.
 * @param {Object} [options]
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=20] - Items per page.
 * @param {string} [options.type] - Filter by type.
 * @param {string} [options.severity] - Filter by severity.
 * @param {boolean} [options.includeDismissed] - Include dismissed insights.
 * @returns {Promise<Object>} Paginated insights.
 */
export async function listInsights(companyId, { page = 1, limit = 20, type, severity, includeDismissed = false } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    companyId,
    ...(type ? { type } : {}),
    ...(severity ? { severity } : {}),
    ...(includeDismissed ? {} : { isDismissed: false }),
  };

  const [total, insights] = await Promise.all([
    prisma.aiInsight.count({ where }),
    prisma.aiInsight.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    insights,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Mark an insight as read.
 * @param {string} insightId - Insight ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Updated insight.
 */
export async function markInsightRead(insightId, companyId) {
  const insight = await prisma.aiInsight.findFirst({
    where: { id: insightId, companyId },
  });

  if (!insight) {
    throw new AppError("Insight not found", 404);
  }

  return prisma.aiInsight.update({
    where: { id: insightId },
    data: { isRead: true },
  });
}

/**
 * Dismiss an insight.
 * @param {string} insightId - Insight ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Updated insight.
 */
export async function dismissInsight(insightId, companyId) {
  const insight = await prisma.aiInsight.findFirst({
    where: { id: insightId, companyId },
  });

  if (!insight) {
    throw new AppError("Insight not found", 404);
  }

  return prisma.aiInsight.update({
    where: { id: insightId },
    data: { isDismissed: true },
  });
}

/**
 * Get insight statistics for a company.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Insight statistics.
 */
export async function getInsightStats(companyId) {
  const [total, unread, critical, high] = await Promise.all([
    prisma.aiInsight.count({ where: { companyId, isDismissed: false } }),
    prisma.aiInsight.count({ where: { companyId, isDismissed: false, isRead: false } }),
    prisma.aiInsight.count({ where: { companyId, isDismissed: false, severity: "CRITICAL" } }),
    prisma.aiInsight.count({ where: { companyId, isDismissed: false, severity: "HIGH" } }),
  ]);

  return { total, unread, critical, high };
}

export default {
  generateInsights,
  listInsights,
  markInsightRead,
  dismissInsight,
  getInsightStats,
};