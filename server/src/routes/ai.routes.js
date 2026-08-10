import { Router } from "express";
import {
  getAiStatus,
  // Chat
  createChatSession,
  listChatSessions,
  getChatSession,
  sendChatMessage,
  renameChatSession,
  deleteChatSession,
  // Reports
  generateReport,
  listReports,
  getReport,
  deleteReport,
  // OCR
  processOcr,
  listOcrDocuments,
  getOcrDocument,
  deleteOcrDocument,
  // Analytics
  analyzeData,
  getRawAnalytics,
  // Insights
  generateInsights,
  listInsights,
  getInsightStats,
  markInsightRead,
  dismissInsight,
  // Suggestions
  generateSuggestions,
  listSuggestions,
  getSuggestionStats,
  markSuggestionApplied,
  dismissSuggestion,
  // Usage
  getAiUsage,
  getAiUsageByFeature,
} from "../contoller/ai.controller.js";

const router = Router();

/**
 * AI Routes.
 * All routes are protected (require authentication).
 *
 * Endpoints:
 *   GET    /api/v1/ai/status                     - Check AI status
 *
 *   POST   /api/v1/ai/chat/sessions              - Create chat session
 *   GET    /api/v1/ai/chat/sessions              - List chat sessions
 *   GET    /api/v1/ai/chat/sessions/:id          - Get chat session with messages
 *   POST   /api/v1/ai/chat/sessions/:id/messages - Send message & get AI response
 *   PATCH  /api/v1/ai/chat/sessions/:id          - Rename chat session
 *   DELETE /api/v1/ai/chat/sessions/:id          - Delete chat session
 *
 *   POST   /api/v1/ai/reports/generate           - Generate AI report
 *   GET    /api/v1/ai/reports                    - List reports
 *   GET    /api/v1/ai/reports/:id                - Get report
 *   DELETE /api/v1/ai/reports/:id                - Delete report
 *
 *   POST   /api/v1/ai/ocr/process                - Process document with OCR
 *   GET    /api/v1/ai/ocr                        - List OCR documents
 *   GET    /api/v1/ai/ocr/:id                    - Get OCR document
 *   DELETE /api/v1/ai/ocr/:id                    - Delete OCR document
 *
 *   POST   /api/v1/ai/analytics                  - Analyze data with AI
 *   GET    /api/v1/ai/analytics/raw              - Get raw analytics data
 *
 *   POST   /api/v1/ai/insights/generate          - Generate AI insights
 *   GET    /api/v1/ai/insights                   - List insights
 *   GET    /api/v1/ai/insights/stats             - Get insight statistics
 *   PATCH  /api/v1/ai/insights/:id/read          - Mark insight as read
 *   PATCH  /api/v1/ai/insights/:id/dismiss       - Dismiss insight
 *
 *   POST   /api/v1/ai/suggestions/generate       - Generate AI suggestions
 *   GET    /api/v1/ai/suggestions                - List suggestions
 *   GET    /api/v1/ai/suggestions/stats          - Get suggestion statistics
 *   PATCH  /api/v1/ai/suggestions/:id/apply      - Mark suggestion as applied
 *   PATCH  /api/v1/ai/suggestions/:id/dismiss    - Dismiss suggestion
 *
 *   GET    /api/v1/ai/usage                      - Get AI usage statistics
 *   GET    /api/v1/ai/usage/features             - Get AI usage by feature
 */

// AI Status
router.get("/status", getAiStatus);

// AI Chat
router.post("/chat/sessions", createChatSession);
router.get("/chat/sessions", listChatSessions);
router.get("/chat/sessions/:sessionId", getChatSession);
router.post("/chat/sessions/:sessionId/messages", sendChatMessage);
router.patch("/chat/sessions/:sessionId", renameChatSession);
router.delete("/chat/sessions/:sessionId", deleteChatSession);

// AI Reports
router.post("/reports/generate", generateReport);
router.get("/reports", listReports);
router.get("/reports/:reportId", getReport);
router.delete("/reports/:reportId", deleteReport);

// AI OCR
router.post("/ocr/process", processOcr);
router.get("/ocr", listOcrDocuments);
router.get("/ocr/:ocrId", getOcrDocument);
router.delete("/ocr/:ocrId", deleteOcrDocument);

// AI Analytics
router.post("/analytics", analyzeData);
router.get("/analytics/raw", getRawAnalytics);

// AI Insights
router.post("/insights/generate", generateInsights);
router.get("/insights", listInsights);
router.get("/insights/stats", getInsightStats);
router.patch("/insights/:insightId/read", markInsightRead);
router.patch("/insights/:insightId/dismiss", dismissInsight);

// AI Suggestions
router.post("/suggestions/generate", generateSuggestions);
router.get("/suggestions", listSuggestions);
router.get("/suggestions/stats", getSuggestionStats);
router.patch("/suggestions/:suggestionId/apply", markSuggestionApplied);
router.patch("/suggestions/:suggestionId/dismiss", dismissSuggestion);

// AI Usage & Quotas
router.get("/usage", getAiUsage);
router.get("/usage/features", getAiUsageByFeature);

export default router;