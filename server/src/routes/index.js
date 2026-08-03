import { Router } from "express";
import env from "../config/env.js";
import v1Routes from "./v1/index.js";
import platformRoutes from "./platform.routes.js";
import companyAdminRoutes from "./company-admin.routes.js";

/**
 * API route aggregator.
 * Mounts all API versions under the configured prefix.
 *
 * Structure:
 *   /api/v1/*         →  v1Routes
 *   /api/v1/platform* →  platformRoutes (platform owner only)
 *   /api/v2/*         →  (future)
 *
 * The base prefix and version are configurable via environment variables:
 *   API_PREFIX=/api  (default)
 *   API_VERSION=v1   (default)
 */
const router = Router();

// Mount v1 routes
router.use(`/${env.apiVersion}`, v1Routes);

// Mount platform routes (platform owner only)
router.use(`/${env.apiVersion}/platform`, platformRoutes);

// Mount company admin routes (company admin/owner only)
router.use(`/${env.apiVersion}/company`, companyAdminRoutes);

// Health check endpoint (no version required)
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
