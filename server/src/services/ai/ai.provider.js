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
 * Provider dispatch map.
 */
const providers = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  google: callGoogle,
  mistral: callMistral,
};

/**
 * Main entry point — generate a completion using the configured provider.
 * @param {AiCompletionRequest} request
 * @returns {Promise<AiCompletionResponse>}
 */
export async function generateCompletion(request) {
    const provider = String(request.provider || env.ai.defaultProvider).toLowerCase();

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
 * @returns {boolean}
 */
export function isAiConfigured() {
  return Boolean(
    env.ai.openaiApiKey ||
    env.ai.anthropicApiKey ||
    env.ai.googleApiKey ||
    env.ai.mistralApiKey
  );
}

/**
 * Get the list of configured providers.
 * @returns {string[]}
 */
export function getConfiguredProviders() {
  const configured = [];
  if (env.ai.openaiApiKey) configured.push("openai");
  if (env.ai.anthropicApiKey) configured.push("anthropic");
  if (env.ai.googleApiKey) configured.push("google");
  if (env.ai.mistralApiKey) configured.push("mistral");
  return configured;
}

export default {
  generateCompletion,
  isAiConfigured,
  getConfiguredProviders,
};