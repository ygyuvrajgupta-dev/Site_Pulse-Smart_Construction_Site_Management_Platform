/**
 * Standardized API response helper.
 * Ensures consistent response format across all endpoints.
 *
 * Response format:
 * Success: { success: true, message: "string", data: any, ...meta }
 * Error:   { success: false, message: "string", error: "string" }
 */

/**
 * Send a success response.
 * @param {object} res - Express response object.
 * @param {object} options - Response options.
 * @param {string} options.message - Success message.
 * @param {*} options.data - Response data.
 * @param {number} [options.statusCode=200] - HTTP status code.
 * @param {object} [options.meta] - Additional metadata (pagination, etc.).
 * @returns {object} Express response.
 */
function sendSuccess(res, { message, data, statusCode = 200, meta }) {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send an error response.
 * @param {object} res - Express response object.
 * @param {object} options - Response options.
 * @param {string} options.message - Error message.
 * @param {string} [options.error] - Error details (for debugging).
 * @param {number} [options.statusCode=500] - HTTP status code.
 * @returns {object} Express response.
 */
function sendError(res, { message, error, statusCode = 500 }) {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === "development") {
    response.error = error;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a paginated response.
 * @param {object} res - Express response object.
 * @param {object} options - Response options.
 * @param {string} options.message - Success message.
 * @param {Array} options.data - Paginated data.
 * @param {number} options.page - Current page number.
 * @param {number} options.limit - Items per page.
 * @param {number} options.total - Total number of items.
 * @param {number} [options.statusCode=200] - HTTP status code.
 * @returns {object} Express response.
 */
function sendPaginated(res, { message, data, page, limit, total, statusCode = 200 }) {
  const totalPages = Math.ceil(total / limit);

  return sendSuccess(res, {
    message,
    data,
    statusCode,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
}

export { sendSuccess, sendError, sendPaginated };
