import prisma from "../../config/db.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateCompletion } from "./ai.provider.js";
import { recordAiUsage, checkAiQuota, getOrCreateAiFeature } from "./ai.usage.service.js";

/**
 * AI Chat Service.
 * Manages chat sessions, message history, and generates AI responses.
 * Each company has its own isolated chat sessions.
 */

/**
 * Create a new chat session.
 * @param {Object} params
 * @param {string} params.companyId - Company ID.
 * @param {string} params.userId - User ID.
 * @param {string} [params.title] - Session title.
 * @param {Object} [params.context] - Session context (e.g., project/site info).
 * @returns {Promise<Object>} The created session.
 */
export async function createChatSession({ companyId, userId, title, context }) {
  return prisma.aiChatSession.create({
    data: {
      companyId,
      userId,
      title: title || "New Chat",
      context,
    },
  });
}

/**
 * List chat sessions for a user/company.
 * @param {string} companyId - Company ID.
 * @param {string} userId - User ID.
 * @param {Object} [options]
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=20] - Items per page.
 * @returns {Promise<Object>} Paginated sessions.
 */
export async function listChatSessions(companyId, userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [total, sessions] = await Promise.all([
    prisma.aiChatSession.count({
      where: { companyId, userId, isArchived: false },
    }),
    prisma.aiChatSession.findMany({
      where: { companyId, userId, isArchived: false },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { messages: true } },
      },
    }),
  ]);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a chat session with its messages.
 * @param {string} sessionId - Session ID.
 * @param {string} companyId - Company ID (for ownership check).
 * @returns {Promise<Object>} Session with messages.
 */
export async function getChatSession(sessionId, companyId) {
  const session = await prisma.aiChatSession.findFirst({
    where: { id: sessionId, companyId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    throw new AppError("Chat session not found", 404);
  }

  return session;
}

/**
 * Send a message in a chat session and get an AI response.
 * @param {Object} params
 * @param {string} params.sessionId - Session ID.
 * @param {string} params.companyId - Company ID.
 * @param {string} params.userId - User ID.
 * @param {string} params.content - User message.
 * @param {Object} [params.options] - AI options (provider, model, etc).
 * @returns {Promise<{userMessage: Object, aiMessage: Object}>}
 */
export async function sendChatMessage({ sessionId, companyId, userId, content, options = {} }) {
  // Verify session ownership
  const session = await prisma.aiChatSession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!session) {
    throw new AppError("Chat session not found", 404);
  }

  // Check quota
  const quota = await checkAiQuota(companyId, "chat");
  if (!quota.allowed) {
    throw new AppError("AI chat quota exceeded. Please upgrade your plan or contact admin.", 429);
  }

  // Save user message
  const userMessage = await prisma.aiChatMessage.create({
    data: {
      sessionId,
      role: "USER",
      content,
    },
  });

  // Get chat history for context
  const history = await prisma.aiChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 20, // Last 20 messages for context
    select: {
      role: true,
      content: true,
    },
  });

  // Build messages array for the AI
  const messages = history.map((msg) => ({
    role: msg.role === "ASSISTANT" ? "assistant" : "user",
    content: msg.content,
  }));

  // Get or create AI feature for tracking
  const feature = await getOrCreateAiFeature(companyId, "chat", {
    provider: options.provider || "OPENAI",
    modelName: options.model,
  });

  try {
    // Generate AI response
    const result = await generateCompletion({
      messages,
      provider: options.provider,
      model: options.model,
      system: options.systemPrompt || "You are SitePulse AI, a helpful assistant for business management. You help with projects, leads, clients, employees, finance, and general business questions.",
    });

    // Save AI response
    const aiMessage = await prisma.aiChatMessage.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: result.text,
        metadata: {
          model: result.model,
          provider: result.provider,
        },
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
      },
    });

    // Update session title if it's still default
    if (session.title === "New Chat") {
      await prisma.aiChatSession.update({
        where: { id: sessionId },
        data: {
          title: content.slice(0, 50),
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.aiChatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    // Record usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: result.model,
      prompt: content,
      response: result.text,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      duration: result.durationMs,
      success: true,
    });

    return { userMessage, aiMessage };
  } catch (error) {
    // Record failed usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: options.model || "unknown",
      prompt: content,
      tokensIn: 0,
      tokensOut: 0,
      success: false,
    });
    throw error;
  }
}

/**
 * Delete a chat session.
 * @param {string} sessionId - Session ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Deleted session.
 */
export async function deleteChatSession(sessionId, companyId) {
  const session = await prisma.aiChatSession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!session) {
    throw new AppError("Chat session not found", 404);
  }

  return prisma.aiChatSession.update({
    where: { id: sessionId },
    data: { isArchived: true },
  });
}

/**
 * Rename a chat session.
 * @param {string} sessionId - Session ID.
 * @param {string} companyId - Company ID.
 * @param {string} title - New title.
 * @returns {Promise<Object>} Updated session.
 */
export async function renameChatSession(sessionId, companyId, title) {
  const session = await prisma.aiChatSession.findFirst({
    where: { id: sessionId, companyId },
  });

  if (!session) {
    throw new AppError("Chat session not found", 404);
  }

  return prisma.aiChatSession.update({
    where: { id: sessionId },
    data: { title },
  });
}

export default {
  createChatSession,
  listChatSessions,
  getChatSession,
  sendChatMessage,
  deleteChatSession,
  renameChatSession,
};