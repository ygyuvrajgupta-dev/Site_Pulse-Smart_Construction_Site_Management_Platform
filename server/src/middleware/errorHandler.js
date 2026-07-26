import logger from "../config/logger.js";
import { sendError } from "../utils/response.js";

/**
 * Custom Error class for operational errors.
 * Operational errors are expected errors that occur during normal operation
 * (e.g., validation errors, resource not found, unauthorized access).
 * They are distinguishable from programmer errors and can be safely exposed to clients.
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle database-specific errors and convert them to AppError instances.
 * @param {Error} error - The original error.
 * @returns {AppError} A normalized AppError.
 */
function handleDatabaseError(error) {
  // Prisma errors
  if (error.code === "P2002") {
    return new AppError("A record with this value already exists", 409);
  }
  if (error.code === "P2003") {
    return new AppError("Referenced record does not exist", 400);
  }
  if (error.code === "P2025") {
    return new AppError("Record not found", 404);
  }

  // Generic database error
  logger.error("Database error", { error: error.message, stack: error.stack });
  return new AppError("Database operation failed", 500);
}

/**
 * Handle JWT-specific errors.
 * @param {Error} error - The original error.
 * @returns {AppError} A normalized AppError.
 */
function handleJWTError(error) {
  if (error.name === "JsonWebTokenError") {
    return new AppError("Invalid token. Please log in again.", 401);
  }
  if (error.name === "TokenExpiredError") {
    return new AppError("Token has expired. Please log in again.", 401);
  }
  return error;
}

/**
 * Send error response in development mode with full error details.
 * @param {Error} error - The error object.
 * @param {object} res - Express response object.
 */
function sendErrorDev(error, res) {
  sendError(res, {
    message: error.message,
    error: {
      ...error,
      stack: error.stack,
      statusCode: error.statusCode,
      status: error.status,
    },
    statusCode: error.statusCode || 500,
  });
}

/**
 * Send error response in production mode with minimal error details.
 * @param {Error} error - The error object.
 * @param {object} res - Express response object.
 */
function sendErrorProd(error, res) {
  // Only send operational errors to the client
  if (error.isOperational) {
    sendError(res, {
      message: error.message,
      statusCode: error.statusCode,
    });
  } else {
    // Programmer error — don't leak details
    logger.error("Unexpected error", {
      error: error.message,
      stack: error.stack,
    });
    sendError(res, {
      message: "Something went wrong. Please try again later.",
      statusCode: 500,
    });
  }
}

/**
 * Global error handling middleware.
 * Must be the last middleware in the stack (after all routes).
 * Catches all unhandled errors and sends a standardized response.
 *
 * @param {Error} error - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next function.
 */
function errorHandler(error, req, res, next) {
  // Set default values
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  // Log the error
  logger.error(`${req.method} ${req.originalUrl}`, {
    error: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
  });

  let normalizedError = error;

  // Normalize database errors
  if (error.code && error.code.startsWith("P")) {
    normalizedError = handleDatabaseError(error);
  }

  // Normalize JWT errors
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    normalizedError = handleJWTError(error);
  }

  // Send response based on environment
  if (process.env.NODE_ENV === "production") {
    sendErrorProd(normalizedError, res);
  } else {
    sendErrorDev(normalizedError, res);
  }
}

export { errorHandler, AppError };
