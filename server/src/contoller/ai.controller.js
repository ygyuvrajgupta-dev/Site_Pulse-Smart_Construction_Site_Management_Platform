import { sendSuccess } from "../utils/response.js";
import * as aiChatService from "../services/ai/ai.chat.service.js";
import * as aiReportService from "../services/ai/ai.report.service.js";
import * as aiOcrService from "../services/ai/ai.ocr.service.js";
import * as aiAnalyticsService from "../services/ai/ai.analytics.service.js";
import * as aiInsightService from "../services/ai/ai.insight.service.js";
import * as aiSuggestionService from "../services/ai/ai.suggestion.service.js";
import * as aiUsageService from "../services/ai/ai.usage.service.js";
import { isAiConfigured, getConfiguredProviders } from "../services/ai/ai.provider.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * AI Controllers.
 * Handles HTTP requests for all AI features.
 */

// ============================================
// AI Status & Configuration
// ============================================

/**
 * GET /api/v1/ai/status
 * Check AI system status and configured providers.
 */
export async function getAiStatus(req, res, next) {
  try {
    const configured = isAiConfigured();
    const providers = getConfiguredProviders();

    return sendSuccess(res, {
      message: "AI status retrieved",
      data: {
        configured,
        providers,
        defaultProvider: req.app.locals?.env?.ai?.defaultProvider || "openai",
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// AI Chat
// ============================================

/**
 * POST /api/v1/ai/chat/sessions
 * Create a new chat session.
 */
export async function createChatSession(req, res, next) {
  try {
    const { title, context } = req.body;
    const session = await aiChatService.createChatSession({
      companyId: req.user.companyId,
      userId: req.user.id,
      title,
      context,
    });

    return sendSuccess(res, {
      message: "Chat session created",
      data: session,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/chat/sessions
 * List chat sessions.
 */
export async function listChatSessions(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await aiChatService.listChatSessions(
      req.user.companyId,
      req.user.id,
      { page: parseInt(page), limit: parseInt(limit) }
    );

    return sendSuccess(res, {
      message: "Chat sessions retrieved",
      data: result.sessions,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/chat/sessions/:sessionId
 * Get a chat session with messages.
 */
export async function getChatSession(req, res, next) {
  try {
    const session = await aiChatService.getChatSession(
      req.params.sessionId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "Chat session retrieved",
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/ai/chat/sessions/:sessionId/messages
 * Send a message and get AI response.
 */
export async function sendChatMessage(req, res, next) {
  try {
    const { content, options } = req.body;

    if (!content || !content.trim()) {
      throw new AppError("Message content is required", 400);
    }

    const result = await aiChatService.sendChatMessage({
      sessionId: req.params.sessionId,
      companyId: req.user.companyId,
      userId: req.user.id,
      content,
      options,
    });

    return sendSuccess(res, {
      message: "Message sent",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/ai/chat/sessions/:sessionId
 * Rename a chat session.
 */
export async function renameChatSession(req, res, next) {
  try {
    const { title } = req.body;

    if (!title) {
      throw new AppError("Title is required", 400);
    }

    const session = await aiChatService.renameChatSession(
      req.params.sessionId,
      req.user.companyId,
      title
    );

    return sendSuccess(res, {
      message: "Chat session renamed",
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/ai/chat/sessions/:sessionId
 * Delete a chat session.
 */
export async function deleteChatSession(req, res, next) {
  try {
    const session = await aiChatService.deleteChatSession(
      req.params.sessionId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "Chat session deleted",
      data: session,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// AI Reports
// ============================================

/**
 * POST /api/v1/ai/reports/generate
 * Generate an AI report.
 */
export async function generateReport(req, res, next) {
  try {
    const {
      type,
      title,
      description,
      prompt,
      data,
      entityId,
      startDate,
      endDate,
      format,
      options,
    } = req.body;

    if (!title) {
      throw new AppError("Report title is required", 400);
    }

    const report = await aiReportService.generateReport({
      companyId: req.user.companyId,
      userId: req.user.id,
      type,
      title,
      description,
      prompt,
      data,
      entityId,
      startDate,
      endDate,
      format,
      options,
    });

    return sendSuccess(res, {
      message: "Report generated",
      data: report,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/reports
 * List reports.
 */
export async function listReports(req, res, next) {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const result = await aiReportService.listReports(
      req.user.companyId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        status,
      }
    );

    return sendSuccess(res, {
      message: "Reports retrieved",
      data: result.reports,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/reports/:reportId
 * Get a report.
 */
export async function getReport(req, res, next) {
  try {
    const report = await aiReportService.getReport(
      req.params.reportId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "Report retrieved",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/ai/reports/:reportId
 * Delete a report.
 */
export async function deleteReport(req, res, next) {
  try {
    const report = await aiReportService.deleteReport(
      req.params.reportId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "Report deleted",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// AI OCR
// ============================================

/**
 * POST /api/v1/ai/ocr/process
 * Process a document with OCR.
 */
export async function processOcr(req, res, next) {
  try {
    const {
      documentId,
      fileName,
      mimeType,
      fileSize,
      fileUrl,
      base64Content,
      options,
    } = req.body;

    if (!fileName) {
      throw new AppError("File name is required", 400);
    }

    const result = await aiOcrService.processOcr({
      companyId: req.user.companyId,
      userId: req.user.id,
      documentId,
      fileName,
      mimeType,
      fileSize,
      fileUrl,
      base64Content,
      options,
    });

    return sendSuccess(res, {
      message: "OCR processing started",
      data: result,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/ocr
 * List OCR documents.
 */
export async function listOcrDocuments(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await aiOcrService.listOcrDocuments(
      req.user.companyId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
      }
    );

    return sendSuccess(res, {
      message: "OCR documents retrieved",
      data: result.documents,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/ocr/:ocrId
 * Get an OCR document.
 */
export async function getOcrDocument(req, res, next) {
  try {
    const doc = await aiOcrService.getOcrDocument(
      req.params.ocrId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "OCR document retrieved",
      data: doc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/ai/ocr/:ocrId
 * Delete an OCR document.
 */
export async function deleteOcrDocument(req, res, next) {
  try {
    const doc = await aiOcrService.deleteOcrDocument(
      req.params.ocrId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "OCR document deleted",
      data: doc,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// AI Analytics
// ============================================

/**
 * POST /api/v1/ai/analytics
 * Analyze company data with AI.
 */
export async function analyzeData(req, res, next) {
  try {
    const { query, startDate, endDate, options } = req.body;

    const result = await aiAnalyticsService.analyzeData({
      companyId: req.user.companyId,
      userId: req.user.id,
      query,
      startDate,
      endDate,
      options,
    });

    return sendSuccess(res, {
      message: "Analytics analysis completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/analytics/raw
 * Get raw analytics data without AI processing.
 */
export async function getRawAnalytics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await aiAnalyticsService.getRawAnalytics(
      req.user.companyId,
      { startDate, endDate }
    );

    return sendSuccess(res, {
      message: "Analytics data retrieved",
      data,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// AI Insights
// ============================================

/**
 * POST /api/v1/ai/insights/generate
 * Generate AI insights.
 */
export async function generateInsights(req, res, next) {
  try {
    const { options } = req.body;

    const insights = await aiInsightService.generateInsights({
      companyId: req.user.companyId,
      userId: req.user.id,
      options,
    });

    return sendSuccess(res, {
      message: "Insights generated",
      data: insights,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/insights
 * List insights.
 */
export async function listInsights(req, res, next) {
  try {
    const { page = 1, limit = 20, type, severity, includeDismissed } = req.query;
    const result = await aiInsightService.listInsights(
      req.user.companyId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        severity,
        includeDismissed: includeDismissed === "true",
      }
    );

    return sendSuccess(res, {
      message: "Insights retrieved",
      data: result.insights,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/insights/stats
 * Get insight statistics.
 */
export async function getInsightStats(req, res, next) {
  try {
    const stats = await aiInsightService.getInsightStats(req.user.companyId);

    return sendSuccess(res, {
      message: "Insight statistics retrieved",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/ai/insights/:insightId/read
 * Mark an insight as read.
 */
export async function markInsightRead(req, res, next) {
  try {
    const insight = await aiInsightService.markInsightRead(
      req.params.insightId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "Insight marked as read",
      data: insight,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/ai/insights/:insightId/dismiss
 * Dismiss an insight.
 */
export async function dismissInsight(req, res, next) {
  try {
    const insight = await aiInsightService.dismissInsight(
      req.params.insightId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "Insight dismissed",
      data: insight,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// AI Suggestions
// ============================================

/**
 * POST /api/v1/ai/suggestions/generate
 * Generate AI suggestions.
 */
export async function generateSuggestions(req, res, next) {
  try {
    const { options } = req.body;

    const suggestions = await aiSuggestionService.generateSuggestions({
      companyId: req.user.companyId,
      userId: req.user.id,
      options,
    });

    return sendSuccess(res, {
      message: "Suggestions generated",
      data: suggestions,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/suggestions
 * List suggestions.
 */
export async function listSuggestions(req, res, next) {
  try {
    const { page = 1, limit = 20, type, includeDismissed } = req.query;
    const result = await aiSuggestionService.listSuggestions(
      req.user.companyId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        includeDismissed: includeDismissed === "true",
      }
    );

    return sendSuccess(res, {
      message: "Suggestions retrieved",
      data: result.suggestions,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/suggestions/stats
 * Get suggestion statistics.
 */
export async function getSuggestionStats(req, res, next) {
  try {
    const stats = await aiSuggestionService.getSuggestionStats(req.user.companyId);

    return sendSuccess(res, {
      message: "Suggestion statistics retrieved",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/ai/suggestions/:suggestionId/apply
 * Mark a suggestion as applied.
 */
export async function markSuggestionApplied(req, res, next) {
  try {
    const suggestion = await aiSuggestionService.markSuggestionApplied(
      req.params.suggestionId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "Suggestion marked as applied",
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/ai/suggestions/:suggestionId/dismiss
 * Dismiss a suggestion.
 */
export async function dismissSuggestion(req, res, next) {
  try {
    const suggestion = await aiSuggestionService.dismissSuggestion(
      req.params.suggestionId,
      req.user.companyId
    );

    return sendSuccess(res, {
      message: "Suggestion dismissed",
      data: suggestion,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// AI Usage & Quotas
// ============================================

/**
 * GET /api/v1/ai/usage
 * Get AI usage statistics for the company.
 */
export async function getAiUsage(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const usage = await aiUsageService.getCompanyAiUsage(
      req.user.companyId,
      { startDate, endDate }
    );

    return sendSuccess(res, {
      message: "AI usage retrieved",
      data: usage,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/ai/usage/features
 * Get AI usage by feature.
 */
export async function getAiUsageByFeature(req, res, next) {
  try {
    const features = await aiUsageService.getAiUsageByFeature(req.user.companyId);

    return sendSuccess(res, {
      message: "AI feature usage retrieved",
      data: features,
    });
  } catch (error) {
    next(error);
  }
}