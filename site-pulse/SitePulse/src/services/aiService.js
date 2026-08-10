import apiClient from './axios';

/**
 * AI Service.
 * Provides methods to interact with all AI features.
 */

// ============================================
// AI Status
// ============================================

export const getAiStatus = async () => {
  const response = await apiClient.get('/ai/status');
  return response.data;
};

// ============================================
// AI Chat
// ============================================

export const createChatSession = async (data) => {
  const response = await apiClient.post('/ai/chat/sessions', data);
  return response.data;
};

export const listChatSessions = async (params) => {
  const response = await apiClient.get('/ai/chat/sessions', { params });
  return response.data;
};

export const getChatSession = async (sessionId) => {
  const response = await apiClient.get(`/ai/chat/sessions/${sessionId}`);
  return response.data;
};

export const sendChatMessage = async (sessionId, data) => {
  const response = await apiClient.post(`/ai/chat/sessions/${sessionId}/messages`, data);
  return response.data;
};

export const renameChatSession = async (sessionId, title) => {
  const response = await apiClient.patch(`/ai/chat/sessions/${sessionId}`, { title });
  return response.data;
};

export const deleteChatSession = async (sessionId) => {
  const response = await apiClient.delete(`/ai/chat/sessions/${sessionId}`);
  return response.data;
};

// ============================================
// AI Reports
// ============================================

export const generateReport = async (data) => {
  const response = await apiClient.post('/ai/reports/generate', data);
  return response.data;
};

export const listReports = async (params) => {
  const response = await apiClient.get('/ai/reports', { params });
  return response.data;
};

export const getReport = async (reportId) => {
  const response = await apiClient.get(`/ai/reports/${reportId}`);
  return response.data;
};

export const deleteReport = async (reportId) => {
  const response = await apiClient.delete(`/ai/reports/${reportId}`);
  return response.data;
};

// ============================================
// AI OCR
// ============================================

export const processOcr = async (data) => {
  const response = await apiClient.post('/ai/ocr/process', data);
  return response.data;
};

export const listOcrDocuments = async (params) => {
  const response = await apiClient.get('/ai/ocr', { params });
  return response.data;
};

export const getOcrDocument = async (ocrId) => {
  const response = await apiClient.get(`/ai/ocr/${ocrId}`);
  return response.data;
};

export const deleteOcrDocument = async (ocrId) => {
  const response = await apiClient.delete(`/ai/ocr/${ocrId}`);
  return response.data;
};

// ============================================
// AI Analytics
// ============================================

export const analyzeData = async (data) => {
  const response = await apiClient.post('/ai/analytics', data);
  return response.data;
};

export const getRawAnalytics = async (params) => {
  const response = await apiClient.get('/ai/analytics/raw', { params });
  return response.data;
};

// ============================================
// AI Insights
// ============================================

export const generateInsights = async (data = {}) => {
  const response = await apiClient.post('/ai/insights/generate', data);
  return response.data;
};

export const listInsights = async (params) => {
  const response = await apiClient.get('/ai/insights', { params });
  return response.data;
};

export const getInsightStats = async () => {
  const response = await apiClient.get('/ai/insights/stats');
  return response.data;
};

export const markInsightRead = async (insightId) => {
  const response = await apiClient.patch(`/ai/insights/${insightId}/read`);
  return response.data;
};

export const dismissInsight = async (insightId) => {
  const response = await apiClient.patch(`/ai/insights/${insightId}/dismiss`);
  return response.data;
};

// ============================================
// AI Suggestions
// ============================================

export const generateSuggestions = async (data = {}) => {
  const response = await apiClient.post('/ai/suggestions/generate', data);
  return response.data;
};

export const listSuggestions = async (params) => {
  const response = await apiClient.get('/ai/suggestions', { params });
  return response.data;
};

export const getSuggestionStats = async () => {
  const response = await apiClient.get('/ai/suggestions/stats');
  return response.data;
};

export const markSuggestionApplied = async (suggestionId) => {
  const response = await apiClient.patch(`/ai/suggestions/${suggestionId}/apply`);
  return response.data;
};

export const dismissSuggestion = async (suggestionId) => {
  const response = await apiClient.patch(`/ai/suggestions/${suggestionId}/dismiss`);
  return response.data;
};

// ============================================
// AI Usage
// ============================================

export const getAiUsage = async (params) => {
  const response = await apiClient.get('/ai/usage', { params });
  return response.data;
};

export const getAiUsageByFeature = async () => {
  const response = await apiClient.get('/ai/usage/features');
  return response.data;
};

export default {
  getAiStatus,
  createChatSession,
  listChatSessions,
  getChatSession,
  sendChatMessage,
  renameChatSession,
  deleteChatSession,
  generateReport,
  listReports,
  getReport,
  deleteReport,
  processOcr,
  listOcrDocuments,
  getOcrDocument,
  deleteOcrDocument,
  analyzeData,
  getRawAnalytics,
  generateInsights,
  listInsights,
  getInsightStats,
  markInsightRead,
  dismissInsight,
  generateSuggestions,
  listSuggestions,
  getSuggestionStats,
  markSuggestionApplied,
  dismissSuggestion,
  getAiUsage,
  getAiUsageByFeature,
};