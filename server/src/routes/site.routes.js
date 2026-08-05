import { Router } from "express";
import {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  getSiteStats,
} from "../services/site.service.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * Site routes.
 * Endpoints:
 *   GET    /api/v1/sites
 *   POST   /api/v1/sites
 *   GET    /api/v1/sites/:id
 *   PUT    /api/v1/sites/:id
 *   DELETE /api/v1/sites/:id
 *   GET    /api/v1/sites/:id/stats
 */
const router = Router();

// All routes require authentication
router.use(protect);

// Site CRUD
router.get("/", getSites);
router.post("/", createSite);
router.get("/:id", getSiteById);
router.put("/:id", updateSite);
router.delete("/:id", deleteSite);

// Site statistics
router.get("/:id/stats", getSiteStats);

export default router;