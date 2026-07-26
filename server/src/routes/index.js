import { Router } from "express";
import env from "../config/env.js";
import v1Routes from "./v1/index.js";

/**
 * API route aggregator.
 * Mounts all API versions under the configured prefix.
 *
 * Structure:
 *   /api/v1/*  →  v1Routes
 *   /api/v2/*  →  (future)
 *
 * The base prefix and version are configurable via environment variables:
 *   API_PREFIX=/api  (default)
 *   API_VERSION=v1   (default)
 */
const router = Router();

// Mount v1 routes
router.use(`/${env.apiVersion}`, v1Routes);

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
