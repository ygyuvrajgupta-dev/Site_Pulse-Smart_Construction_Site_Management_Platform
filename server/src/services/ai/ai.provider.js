import env from "../../config/env.js";
import logger from "../../config/logger.js";
import { AppError } from "../../middleware/errorHandler.js";

/**
 * AI Provider Abstraction Layer.
 * Provides a unified interface for interacting with multiple AI providers
 * (OpenAI, Anthropic, Google, Mistral) without coupling business logic
 * to any specific vendor SDK.
 *
 * Architecture:
 *   ai.provider.js  →  Provider factory + unified completion interface
 *   ai.chat.service.js  →  Chat sessions & messages
 *   ai.report.service.js →  Report generation
 *   ai.ocr.service.js    →  Document OCR
 *   ai.analytics.service.js →  Data analytics
 *   ai.insight.service.js  →  Business insights
 *   ai.suggestion.service.js →  Actionable suggestions
 */

/**
 * Unified completion request shape.
 * @typedef {Object} AiCompletionRequest
 * @property {string} prompt - The main prompt text.
 * @property {string} [system] - Optional system prompt.
 * @property {Array<{role: string, content: string}>} [messages] - Chat history.
 * @property {number} [maxTokens] - Max tokens to generate.
 * @property {number} [temperature] - Sampling temperature (0-1).
 * @property {string} [model] - Override model name.
 * @property {string} [provider] - Override provider name.
 */

/**
 * Unified completion response shape.
 * @typedef {Object} AiCompletionResponse
 * @property {string} text - Generated text.
 * @property {string} model - Model used.
 * @property {string} provider - Provider used.
 * @property {number} tokensIn - Input tokens.
 * @property {number} tokensOut - Output tokens.
 * @property {number} durationMs - Request duration in ms.
 */

/**
 * Resolve the API key and model for a given provider.
 * @param {string} provider - Provider name.
 * @param {string} [model] - Optional model override.
 * @returns {{ apiKey: string, model: string }}
 */
function resolveProviderConfig(provider, model) {
  // Normalize provider name (case-insensitive) so "OPENAI", "Openai", etc. all work
  const normalizedProvider = String(provider || "").toLowerCase();
  const configs = {
    openai: {
      apiKey: env.ai.openaiApiKey,
      model: env.ai.openaiModel,
    },
    anthropic: {
      apiKey: env.ai.anthropicApiKey,
      model: env.ai.anthropicModel,
    },
    google: {
      apiKey: env.ai.googleApiKey,
      model: env.ai.googleModel,
    },
    mistral: {
      apiKey: env.ai.mistralApiKey,
      model: env.ai.mistralModel,
    },
  };

  // The mock provider never requires an API key (used for local dev/demo).
  if (normalizedProvider === "mock") {
    return {
      apiKey: "",
      model: model || "mock-simulated-1",
    };
  }

  const config = configs[normalizedProvider];
  if (!config) {
    throw new AppError(`Unsupported AI provider: ${provider}`, 400);
  }

  if (!config.apiKey) {
    throw new AppError(
      `No API key configured for provider: ${provider}. Check your environment variables.`,
      500
    );
  }

  return {
    apiKey: config.apiKey,
    model: model || config.model,
  };
}

/**
 * Call OpenAI-compatible chat completions API.
 * @param {AiCompletionRequest} request
 * @returns {Promise<AiCompletionResponse>}
 */
async function callOpenAI(request) {
  const { apiKey, model } = resolveProviderConfig("openai", request.model);
  const startTime = Date.now();

  const messages = [];
  if (request.system) {
    messages.push({ role: "system", content: request.system });
  }
  if (request.messages?.length) {
    messages.push(...request.messages);
  } else {
    messages.push({ role: "user", content: request.prompt });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ai.timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens || env.ai.maxTokens,
        temperature: request.temperature ?? env.ai.temperature,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(`OpenAI API error: ${errorBody}`, response.status);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      text: choice?.message?.content || "",
      model: data.model || model,
      provider: "openai",
      tokensIn: data.usage?.prompt_tokens || 0,
      tokensOut: data.usage?.completion_tokens || 0,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError("AI request timed out", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call Anthropic Messages API.
 * @param {AiCompletionRequest} request
 * @returns {Promise<AiCompletionResponse>}
 */
async function callAnthropic(request) {
  const { apiKey, model } = resolveProviderConfig("anthropic", request.model);
  const startTime = Date.now();

  const messages = [];
  if (request.messages?.length) {
    messages.push(...request.messages);
  } else {
    messages.push({ role: "user", content: request.prompt });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ai.timeoutMs);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens || env.ai.maxTokens,
        temperature: request.temperature ?? env.ai.temperature,
        system: request.system,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(`Anthropic API error: ${errorBody}`, response.status);
    }

    const data = await response.json();
    const text = data.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("") || "";

    return {
      text,
      model: data.model || model,
      provider: "anthropic",
      tokensIn: data.usage?.input_tokens || 0,
      tokensOut: data.usage?.output_tokens || 0,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError("AI request timed out", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call Google Gemini API.
 * @param {AiCompletionRequest} request
 * @returns {Promise<AiCompletionResponse>}
 */
async function callGoogle(request) {
  const { apiKey, model } = resolveProviderConfig("google", request.model);
  const startTime = Date.now();

  const contents = [];
  if (request.messages?.length) {
    contents.push(...request.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })));
  } else {
    contents.push({ role: "user", parts: [{ text: request.prompt }] });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ai.timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: request.system
            ? { parts: [{ text: request.system }] }
            : undefined,
          generationConfig: {
            maxOutputTokens: request.maxTokens || env.ai.maxTokens,
            temperature: request.temperature ?? env.ai.temperature,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(`Google API error: ${errorBody}`, response.status);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .join("") || "";

    return {
      text,
      model: data.modelVersion || model,
      provider: "google",
      tokensIn: data.usageMetadata?.promptTokenCount || 0,
      tokensOut: data.usageMetadata?.candidatesTokenCount || 0,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError("AI request timed out", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call Mistral API.
 * @param {AiCompletionRequest} request
 * @returns {Promise<AiCompletionResponse>}
 */
async function callMistral(request) {
  const { apiKey, model } = resolveProviderConfig("mistral", request.model);
  const startTime = Date.now();

  const messages = [];
  if (request.system) {
    messages.push({ role: "system", content: request.system });
  }
  if (request.messages?.length) {
    messages.push(...request.messages);
  } else {
    messages.push({ role: "user", content: request.prompt });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.ai.timeoutMs);

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens || env.ai.maxTokens,
        temperature: request.temperature ?? env.ai.temperature,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AppError(`Mistral API error: ${errorBody}`, response.status);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      text: choice?.message?.content || "",
      model: data.model || model,
      provider: "mistral",
      tokensIn: data.usage?.prompt_tokens || 0,
      tokensOut: data.usage?.completion_tokens || 0,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError("AI request timed out", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call the local mock provider.
 * Returns realistic simulated responses so all AI features can be
 * tested end-to-end without external API keys (dev/demo mode).
 * @param {AiCompletionRequest} request
 * @returns {Promise<AiCompletionResponse>}
 */
async function callMock(request) {
  const { model } = resolveProviderConfig("mock", request.model);
  const startTime = Date.now();

  // Build a context-aware simulated response.
  const prompt = (request.prompt || "").toLowerCase();
  const lastUserMsg =
    request.messages?.filter((m) => m.role === "user").pop()?.content || prompt;

  let text = "";

  // Chat
  if (request.system && /chat|assistant|business questions/i.test(request.system)) {
    text =
      `Here is a helpful response to: "${lastUserMsg}".\n\n` +
      `This is a simulated reply from the demo AI provider. To enable ` +
      `real AI responses, set an OpenAI, Anthropic, Google, or Mistral API ` +
      `key in the server .env file.`;
  }
  // OCR → JSON object
  else if (request.system && /ocr|optical character/i.test(request.system)) {
    text =
      `{\n` +
      `  "extractedText": "Simulated OCR text extracted from the uploaded document. Configure a real AI provider for actual text extraction.",\n` +
      `  "documentType": "REPORT",\n` +
      `  "structuredData": { "vendor": "Demo Vendor", "amount": 1240.0, "currency": "USD", "date": "2026-08-01" },\n` +
      `  "confidence": 0.87,\n` +
      `  "language": "en"\n` +
      `}`;
  }
  // Reports
  else if (request.system && /report/i.test(request.system)) {
    const type = /finance|cost|expense/i.test(prompt) ? "Finance" : /inventory|stock/i.test(prompt) ? "Inventory" : /hr|employee|staff/i.test(prompt) ? "HR" : /sales|lead|revenue/i.test(prompt) ? "Sales" : /project|site/i.test(prompt) ? "Project" : "Business";
    text =
      `# ${type} Report (Simulated)\n\n` +
      `## Executive Summary\n` +
      `This simulated report provides a high-level overview of the ${type.toLowerCase()} ` +
      `activity for the current period. Figures are placeholder data generated in demo mode.\n\n` +
      `## Key Metrics\n` +
      `- Total volume: 124 units\n` +
      `- Total value: $58,400.00\n` +
      `- Active records: 18\n` +
      `- Pending items: 4\n\n` +
      `## Highlights\n` +
      `1. Consistent activity across the period with a moderate upward trend.\n` +
      `2. Two items require attention and follow-up.\n` +
      `3. Overall health remains stable.\n\n` +
      `## Recommendations\n` +
      `- Review pending items and schedule follow-ups.\n` +
      `- Consider consolidating duplicate records.\n` +
      `- Run a full analysis once a real AI provider is configured.`;
  }
  // Suggestions → JSON array
  else if (request.system && /suggestion/i.test(request.system)) {
    text =
      `[\n` +
      `  { "type": "OPTIMIZATION", "title": "Follow up with high-value leads", "description": "Contact the most engaged leads within 48 hours to improve conversion. This is a simulated suggestion.", "entityType": "LEAD", "entityId": null },\n` +
      `  { "type": "WARNING", "title": "Review at-risk project timelines", "description": "Several projects are close to their deadline. Schedule a status review and reallocate resources if needed. This is a simulated suggestion.", "entityType": "PROJECT", "entityId": null },\n` +
      `  { "type": "ACTION", "title": "Reconcile inventory stock levels", "description": "Compare on-hand quantities with recent purchase orders and flag discrepancies. This is a simulated suggestion.", "entityType": "INVENTORY", "entityId": null },\n` +
      `  { "type": "RECOMMENDATION", "title": "Schedule a quarterly performance review", "description": "Bring key stakeholders together to review progress and align on next quarter goals. This is a simulated suggestion.", "entityType": "GENERAL", "entityId": null }\n` +
      `]`;
  }
  // Insights → JSON array
  else if (request.system && /insight/i.test(request.system)) {
    text =
      `[\n` +
      `  { "type": "TREND", "severity": "MEDIUM", "title": "Revenue trending upward", "description": "Overall business activity shows a moderate upward trend over the current period. This is a simulated insight.", "entityType": "FINANCE", "entityId": null },\n` +
      `  { "type": "OPPORTUNITY", "severity": "LOW", "title": "Automation opportunity in documents", "description": "Document processing can be automated to reduce manual effort. This is a simulated insight.", "entityType": "GENERAL", "entityId": null },\n` +
      `  { "type": "ANOMALY", "severity": "HIGH", "title": "A few items require attention", "description": "Two pending items may need follow-up to avoid delays. This is a simulated insight.", "entityType": "TASK", "entityId": null },\n` +
      `  { "type": "PERFORMANCE", "severity": "LOW", "title": "Overall health is stable", "description": "Key business metrics remain within expected ranges. This is a simulated insight.", "entityType": "GENERAL", "entityId": null }\n` +
      `]`;
  }
  // Analytics → text analysis
  else if (request.system && /analytics/i.test(request.system)) {
    text =
      `Analysis for: "${lastUserMsg}"\n\n` +
      `Based on the available company data (simulated):\n` +
      `- Revenue is trending upward by roughly 8% over the last 30 days.\n` +
      `- Operating expenses remain within budget.\n` +
      `- Two high-value opportunities are currently in the pipeline.\n\n` +
      `Next step: configure a real AI provider for deeper, live analysis.`;
  }
  // OCR fallback / generic
  else {
    text =
      `SIMULATED_RESPONSE: ${lastUserMsg}\n\n` +
      `This response was generated by the built-in mock provider for local testing. ` +
      `Set OPENAI_API_KEY (or another provider key) in server/.env to enable live AI.`;
  }

  // Simulate a short processing delay.
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    text,
    model,
    provider: "mock",
    tokensIn: Math.ceil((lastUserMsg || "").length / 4) || 1,
    tokensOut: Math.ceil(text.length / 4),
    durationMs: Date.now() - startTime,
  };
}

/**
 * Provider dispatch map.
 */
const providers = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  google: callGoogle,
  mistral: callMistral,
  mock: callMock,
};

/**
 * Main entry point — generate a completion using the configured provider.
 * Automatically falls back to the local mock provider when a real provider
 * is requested but its API key is not configured (dev/demo mode).
 * @param {AiCompletionRequest} request
 * @returns {Promise<AiCompletionResponse>}
 */
export async function generateCompletion(request) {
  const requestedProvider = String(request.provider || env.ai.defaultProvider).toLowerCase();
  let provider = requestedProvider;

  // If the requested real provider has no API key configured, fall back to mock.
  const configs = {
    openai: env.ai.openaiApiKey,
    anthropic: env.ai.anthropicApiKey,
    google: env.ai.googleApiKey,
    mistral: env.ai.mistralApiKey,
  };
  if (providers[requestedProvider] && requestedProvider !== "mock" && !configs[requestedProvider]) {
    provider = "mock";
    logger.info(
      `AI provider "${requestedProvider}" has no API key. Falling back to mock provider (demo mode).`
    );
  }

  if (!providers[provider]) {
    throw new AppError(`Unsupported AI provider: ${provider}`, 400);
  }

  logger.debug(`AI completion request`, {
    provider,
    model: request.model || "default",
    promptLength: request.prompt?.length || 0,
  });

  try {
    const result = await providers[provider](request);
    logger.debug(`AI completion response`, {
      provider: result.provider,
      model: result.model,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      durationMs: result.durationMs,
    });
    return result;
  } catch (error) {
    logger.error(`AI completion failed`, {
      provider,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Check if any AI provider is configured.
 * The mock provider is always available for local dev/demo, so this returns true
 * even without external API keys.
 * @returns {boolean}
 */
export function isAiConfigured() {
  return Boolean(
    env.ai.openaiApiKey ||
    env.ai.anthropicApiKey ||
    env.ai.googleApiKey ||
    env.ai.mistralApiKey ||
    env.ai.mockEnabled !== false
  );
}

/**
 * Get the list of configured providers.
 * Includes the always-available "mock" provider when no real key is set.
 * @returns {string[]}
 */
export function getConfiguredProviders() {
  const configured = [];
  if (env.ai.openaiApiKey) configured.push("openai");
  if (env.ai.anthropicApiKey) configured.push("anthropic");
  if (env.ai.googleApiKey) configured.push("google");
  if (env.ai.mistralApiKey) configured.push("mistral");
  if (configured.length === 0 && env.ai.mockEnabled !== false) {
    configured.push("mock");
  }
  return configured;
}

export default {
  generateCompletion,
  isAiConfigured,
  getConfiguredProviders,
};