import prisma from "../../config/db.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateCompletion } from "./ai.provider.js";
import { recordAiUsage, checkAiQuota, getOrCreateAiFeature } from "./ai.usage.service.js";

/**
 * AI Analytics Service.
 * Performs intelligent data analysis across company data.
 * Provides natural language querying, trend analysis, and data summaries.
 */

/**
 * Gather company data for analysis.
 * @param {string} companyId - Company ID.
 * @param {Object} [options]
 * @param {string} [options.startDate] - Start date filter.
 * @param {string} [options.endDate] - End date filter.
 * @returns {Promise<Object>} Aggregated company data.
 */
async function gatherCompanyData(companyId, { startDate, endDate } = {}) {
  const dateFilter = startDate || endDate
    ? {
        createdAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {}),
        },
      }
    : {};

  const [
    projects,
    sites,
    leads,
    clients,
    employees,
    transactions,
    inventoryItems,
    tasks,
  ] = await Promise.all([
    prisma.project.findMany({ where: { companyId } }),
    prisma.site.findMany({ where: { companyId } }),
    prisma.lead.findMany({ where: { companyId } }),
    prisma.client.findMany({ where: { companyId } }),
    prisma.employee.findMany({ where: { companyId } }),
    prisma.transaction.findMany({ where: { companyId } }),
    prisma.inventoryItem.findMany({ where: { companyId } }),
    prisma.task.findMany({ where: { companyId } }),
  ]);

  const income = transactions.filter((t) => t.type === "INCOME");
  const expenses = transactions.filter((t) => t.type === "EXPENSE");

  return {
    projects: {
      total: projects.length,
      inProgress: projects.filter((p) => p.status === "IN_PROGRESS").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      onHold: projects.filter((p) => p.status === "ON_HOLD").length,
      averageProgress: projects.length
        ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
        : 0,
    },
    sites: {
      total: sites.length,
      active: sites.filter((s) => s.status === "ACTIVE").length,
      maintenance: sites.filter((s) => s.status === "MAINTENANCE").length,
    },
    leads: {
      total: leads.length,
      won: leads.filter((l) => l.status === "WON").length,
      lost: leads.filter((l) => l.status === "LOST").length,
      qualified: leads.filter((l) => l.status === "QUALIFIED").length,
      conversionRate: leads.length
        ? (leads.filter((l) => l.status === "WON").length / leads.length) * 100
        : 0,
    },
    clients: {
      total: clients.length,
      active: clients.filter((c) => c.isActive).length,
    },
    employees: {
      total: employees.length,
      active: employees.filter((e) => e.isActive).length,
    },
    finance: {
      totalIncome: income.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalExpenses: expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      netBalance:
        income.reduce((sum, t) => sum + parseFloat(t.amount), 0) -
        expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0),
      transactionCount: transactions.length,
    },
    inventory: {
      totalItems: inventoryItems.length,
      lowStock: inventoryItems.filter(
        (i) => i.reorderPoint && i.quantity <= i.reorderPoint
      ).length,
      totalValue: inventoryItems.reduce(
        (sum, i) => sum + parseFloat(i.unitPrice || 0) * i.quantity,
        0
      ),
    },
    tasks: {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "DONE").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      overdue: tasks.filter(
        (t) => t.dueDate && t.dueDate < new Date() && t.status !== "DONE"
      ).length,
    },
  };
}

/**
 * Perform AI-powered analytics on company data.
 * @param {Object} params
 * @param {string} params.companyId - Company ID.
 * @param {string} [params.userId] - User ID.
 * @param {string} [params.query] - Natural language query.
 * @param {string} [params.startDate] - Start date filter.
 * @param {string} [params.endDate] - End date filter.
 * @param {Object} [params.options] - AI options.
 * @returns {Promise<Object>} Analytics result.
 */
export async function analyzeData({
  companyId,
  userId,
  query,
  startDate,
  endDate,
  options = {},
}) {
  // Check quota
  const quota = await checkAiQuota(companyId, "analytics");
  if (!quota.allowed) {
    throw new AppError("AI analytics quota exceeded. Please upgrade your plan or contact admin.", 429);
  }

  // Gather data
  const data = await gatherCompanyData(companyId, { startDate, endDate });

  // Get or create AI feature for tracking
  const feature = await getOrCreateAiFeature(companyId, "analytics", {
    provider: options.provider || "OPENAI",
    modelName: options.model,
  });

  try {
    const systemPrompt = `You are SitePulse AI analytics engine. Analyze the provided business data and provide insights. Be specific, data-driven, and actionable.`;

    const userPrompt = `
Business Analytics Query: ${query || "Provide a comprehensive business analysis"}

Company Data:
${JSON.stringify(data, null, 2)}

Please provide:
1. Key metrics summary
2. Trends and patterns
3. Areas of concern
4. Opportunities
5. Recommendations

Format the response as structured markdown.
`;

    const result = await generateCompletion({
      prompt: userPrompt,
      system: systemPrompt,
      provider: options.provider,
      model: options.model,
      maxTokens: options.maxTokens || 3000,
      temperature: 0.3,
    });

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

    return {
      analysis: result.text,
      data,
      model: result.model,
      provider: result.provider,
    };
  } catch (error) {
    // Record failed usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: options.model || "unknown",
      prompt: query || "analytics",
      success: false,
    });
    throw error;
  }
}

/**
 * Get raw analytics data without AI processing.
 * @param {string} companyId - Company ID.
 * @param {Object} [options]
 * @param {string} [options.startDate] - Start date filter.
 * @param {string} [options.endDate] - End date filter.
 * @returns {Promise<Object>} Raw analytics data.
 */
export async function getRawAnalytics(companyId, { startDate, endDate } = {}) {
  return gatherCompanyData(companyId, { startDate, endDate });
}

export default {
  analyzeData,
  getRawAnalytics,
};