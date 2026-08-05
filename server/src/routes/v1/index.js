import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import companyRoutes from "./company.routes.js";
import projectRoutes from "./project.routes.js";
import leadRoutes from "./lead.routes.js";
import clientRoutes from "./client.routes.js";
import employeeRoutes from "./employee.routes.js";
import notificationRoutes from "./notification.routes.js";
import siteRoutes from "./site.routes.js";
import hrRoutes from "./hr.routes.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * API v1 route aggregator.
 * Mounts all v1 API routes under a single router.
 * Each route file exports a Router with its own endpoints.
 *
 * Route structure:
 *   /api/v1/auth/*          → authRoutes (public)
 *   /api/v1/users/*         → userRoutes (protected)
 *   /api/v1/companies/*     → companyRoutes (protected)
 *   /api/v1/projects/*      → projectRoutes (protected)
 *   /api/v1/leads/*         → leadRoutes (protected)
 *   /api/v1/clients/*       → clientRoutes (protected)
 *   /api/v1/employees/*     → employeeRoutes (protected)
 *   /api/v1/notifications/* → notificationRoutes (protected)
 */
const router = Router();

// Authentication routes (no auth required)
router.use("/auth", authRoutes);

// Protected routes - require authentication
router.use("/users", protect, userRoutes);
router.use("/companies", protect, companyRoutes);
router.use("/projects", protect, projectRoutes);
router.use("/leads", protect, leadRoutes);
router.use("/clients", protect, clientRoutes);
router.use("/employees", protect, employeeRoutes);
router.use("/notifications", protect, notificationRoutes);
router.use("/sites", protect, siteRoutes);
router.use("/hr", protect, hrRoutes);

export default router;
