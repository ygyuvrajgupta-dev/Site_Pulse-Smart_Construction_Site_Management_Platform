import env from "./env.js";

/**
 * ANSI color codes for terminal output.
 * Used only in development mode for readable logs.
 */
const colors = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  debug: "\x1b[37m",
  reset: "\x1b[0m",
};

/**
 * Log level priorities.
 * Higher numbers = more verbose.
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Determine if a message should be logged based on the current log level.
 * @param {string} level - The log level of the message.
 * @returns {boolean} True if the message should be logged.
 */
function shouldLog(level) {
  const currentLevel = levels[env.logLevel] ?? levels.info;
  return levels[level] <= currentLevel;
}

/**
 * Format a log message with timestamp and metadata.
 * @param {string} level - The log level.
 * @param {string} message - The log message.
 * @param {object} [meta] - Additional metadata.
 * @returns {string} Formatted log string.
 */
function formatLog(level, message, meta) {
  const timestamp = new Date().toISOString();

  if (env.isProduction) {
    // Structured JSON output for production (machine-readable)
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
    };
    return JSON.stringify(logEntry);
  }

  // Colorized output for development (human-readable)
  const color = colors[level] || colors.info;
  const metaString = meta
    ? ` ${JSON.stringify(meta)}`
    : "";
  return `${color}[${timestamp}] ${level.toUpperCase()}:${colors.reset} ${message}${metaString}`;
}

/**
 * Write a log entry to the appropriate stream.
 * @param {string} level - The log level.
 * @param {string} message - The log message.
 * @param {object} [meta] - Additional metadata.
 */
function log(level, message, meta) {
  if (!shouldLog(level)) return;

  const formatted = formatLog(level, message, meta);

  if (level === "error") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

/**
 * Production-ready logger with log levels, structured output,
 * and environment-aware formatting.
 */
const logger = {
  error: (message, meta) => log("error", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  info: (message, meta) => log("info", message, meta),
  debug: (message, meta) => log("debug", message, meta),
};

export default logger;
