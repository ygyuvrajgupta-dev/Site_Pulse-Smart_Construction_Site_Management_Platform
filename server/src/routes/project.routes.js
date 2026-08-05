import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
} from "../services/project.service.js";
import {
  getMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "../services/milestone.service.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * Project routes.
 * Endpoints:
 *   GET    /api/v1/projects
 *   POST   /api/v1/projects
 *   GET    /api/v1/projects/:id
 *   PUT    /api/v1/projects/:id
 *   DELETE /api/v1/projects/:id
 *   GET    /api/v1/projects/:id/stats
 *   GET    /api/v1/projects/:id/milestones
 *   POST   /api/v1/projects/:id/milestones
 *   PUT    /api/v1/projects/:id/milestones/:milestoneId
 *   DELETE /api/v1/projects/:id/milestones/:milestoneId
 */
const router = Router();

// All routes require authentication
router.use(protect);

// Project CRUD
router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Project statistics
router.get("/:id/stats", getProjectStats);

// Milestone routes
router.get("/:projectId/milestones", getMilestones);
router.post("/:projectId/milestones", createMilestone);
router.get("/:projectId/milestones/:id", getMilestoneById);
router.put("/:projectId/milestones/:id", updateMilestone);
router.delete("/:projectId/milestones/:id", deleteMilestone);

export default router;