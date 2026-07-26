import { sendError } from "../utils/response.js";

/**
 * 404 Not Found middleware.
 * Catches all requests that don't match any defined route.
 * Must be registered AFTER all route definitions but BEFORE the error handler.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next function.
 */
function notFound(req, res, next) {
  sendError(res, {
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
  });
}

export default notFound;
