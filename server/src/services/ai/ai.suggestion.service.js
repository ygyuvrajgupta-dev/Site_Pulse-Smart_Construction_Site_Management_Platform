import prisma from "../../config/db.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateCompletion } from "./ai.provider.js";
import { recordAiUsage, checkAiQuota, getOrCreateAiFeature } from "./ai.usage.service.js";

/**
 * AI Suggestions Service.
 * Generates actionable suggestions and recommendations for business operations.
 * Covers actions, optimizations, automations, and warnings.
 */

/**
 * Gather data for suggestion generation.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Company data snapshot.
 */
async function gatherSuggestionData(companyId) {
  const [
    projects,
    leads,
    tasks,
    transactions,
    inventoryItems,
    sites,
    clients,
  ] = await Promise.all([
    prisma.project.findMany({ where: { companyId } }),
    prisma.lead.findMany({ where: { companyId } }),
    prisma.task.findMany({ where: { companyId } }),
    prisma.transaction.findMany({ where: { companyId } }),
    prisma.inventoryItem.findMany({ where: { companyId } }),
    prisma.site.findMany({ where: { companyId } }),
    prisma.client.findMany({ where: { companyId } }),
  ]);

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < new Date() && t.status !== "DONE"
  );
  const lowStockItems = inventoryItems.filter(
    (i) => i.reorderPoint && i.quantity <= i.reorderPoint
  );
  const staleLeads = leads.filter(
    (l) =>
      l.status !== "WON" &&
      l.status !== "LOST" &&
      l.lastContactedAt &&
      l.lastContactedAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  return {
    projects: {
      total: projects.length,
      delayed: projects.filter((p) => p.status === "ON_HOLD").length,
      inProgress: projects.filter((p) => p.status === "IN_PROGRESS").length,
    },
    leads: {
      total: leads.length,
      stale: staleLeads.length,
      won: leads.filter((l) => l.status === "WON").length,
      lost: leads.filter((l) => l.status === "LOST").length,
    },
    tasks: {
      total: tasks.length,
      overdue: overdueTasks.length,
      completed: tasks.filter((t) => t.status === "DONE").length,
    },
    finance: {
      totalIncome: transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalExpenses: transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    },
    inventory: {
      totalItems: inventoryItems.length,
      lowStock: lowStockItems.length,
      lowStockItems: lowStockItems.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        reorderPoint: i.reorderPoint,
      })),
    },
    sites: {
      total: sites.length,
      active: sites.filter((s) => s.status === "ACTIVE").length,
    },
    clients: {
      total: clients.length,
      active: clients.filter((c) => c.isActive).length,
    },
  };
}

/**
 * Generate AI suggestions for a company.
 * @param {Object} params
 * @param {string} params.companyId - Company ID.
 * @param {string} [params.userId] - User ID.
 * @param {Object} [params.options] - AI options.
 * @returns {Promise<Array>} Generated suggestions.
 */
export async function generateSuggestions({ companyId, userId, options = {} }) {
  // Check quota
  const quota = await checkAiQuota(companyId, "suggestions");
  if (!quota.allowed) {
    throw new AppError("AI suggestions quota exceeded. Please upgrade your plan or contact admin.", 429);
  }

  // Gather data
  const data = await gatherSuggestionData(companyId);

  // Get or create AI feature for tracking
  const feature = await getOrCreateAiFeature(companyId, "suggestions", {
    provider: options.provider || "OPENAI",
    modelName: options.model,
  });

  try {
    const systemPrompt = `You are SitePulse AI suggestions engine. Analyze the provided business data and generate actionable suggestions. Return the suggestions as a JSON array.`;

    const userPrompt = `
Company Data:
${JSON.stringify(data, null, 2)}

Generate 5-10 actionable suggestions. Each suggestion should have:
- type: "ACTION" | "OPTIMIZATION" | "AUTOMATION" | "WARNING" | "RECOMMENDATION"
- title: Short, actionable title
- description: Detailed explanation with specific data points and recommended actions
- entityType: "PROJECT" | "LEAD" | "FINANCE" | "TASK" | "SITE" | "INVENTORY" | "CLIENT" | "GENERAL"
- entityId: null

Return as JSON array:
[
  {
    "type": "ACTION",
    "title": "Example suggestion title",
    "description": "Detailed description with recommended action",
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

    // Parse suggestions from response
    let suggestions = [];
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      suggestions = [];
    }

    // Save suggestions to database
    const savedSuggestions = [];
    for (const suggestion of suggestions.slice(0, 10)) {
      const saved = await prisma.aiSuggestion.create({
        data: {
          companyId,
          userId,
          type: suggestion.type || "RECOMMENDATION",
          title: suggestion.title || "Suggestion",
          description: suggestion.description || "",
          data: suggestion,
          entityType: suggestion.entityType || "GENERAL",
          entityId: suggestion.entityId,
        },
      });
      savedSuggestions.push(saved);
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

    return savedSuggestions;
  } catch (error) {
    // Record failed usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: options.model || "unknown",
      prompt: "generate suggestions",
      success: false,
    });
    throw error;
  }
}

/**
 * List suggestions for a company.
 * @param {string} companyId - Company ID.
 * @param {Object} [options]
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=20] - Items per page.
 * @param {string} [options.type] - Filter by type.
 * @param {boolean} [options.includeDismissed] - Include dismissed suggestions.
 * @returns {Promise<Object>} Paginated suggestions.
 */
export async function listSuggestions(companyId, { page = 1, limit = 20, type, includeDismissed = false } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    companyId,
    ...(type ? { type } : {}),
    ...(includeDismissed ? {} : { isDismissed: false }),
  };

  const [total, suggestions] = await Promise.all([
    prisma.aiSuggestion.count({ where }),
    prisma.aiSuggestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    suggestions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Mark a suggestion as applied.
 * @param {string} suggestionId - Suggestion ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Updated suggestion.
 */
export async function markSuggestionApplied(suggestionId, companyId) {
  const suggestion = await prisma.aiSuggestion.findFirst({
    where: { id: suggestionId, companyId },
  });

  if (!suggestion) {
    throw new AppError("Suggestion not found", 404);
  }

  return prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: { isApplied: true },
  });
}

/**
 * Dismiss a suggestion.
 * @param {string} suggestionId - Suggestion ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Updated suggestion.
 */
export async function dismissSuggestion(suggestionId, companyId) {
  const suggestion = await prisma.aiSuggestion.findFirst({
    where: { id: suggestionId, companyId },
  });

  if (!suggestion) {
    throw new AppError("Suggestion not found", 404);
  }

  return prisma.aiSuggestion.update({
    where: { id: suggestionId },
    data: { isDismissed: true },
  });
}

/**
 * Get suggestion statistics for a company.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Suggestion statistics.
 */
export async function getSuggestionStats(companyId) {
  const [total, pending, applied] = await Promise.all([
    prisma.aiSuggestion.count({ where: { companyId, isDismissed: false } }),
    prisma.aiSuggestion.count({ where: { companyId, isDismissed: false, isApplied: false } }),
    prisma.aiSuggestion.count({ where: { companyId, isDismissed: false, isApplied: true } }),
  ]);

  return { total, pending, applied };
}

export default {
  generateSuggestions,
  listSuggestions,
  markSuggestionApplied,
  dismissSuggestion,
  getSuggestionStats,
};