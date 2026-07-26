import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import companyRoutes from "./company.routes.js";
import projectRoutes from "./project.routes.js";
import leadRoutes from "./lead.routes.js";
import clientRoutes from "./client.routes.js";
import employeeRoutes from "./employee.routes.js";
import notificationRoutes from "./notification.routes.js";

/**
 * API v1 route aggregator.
 * Mounts all v1 API routes under a single router.
 * Each route file exports a Router with its own endpoints.
 *
 * Route structure:
 *   /api/v1/auth/*          → authRoutes
 *   /api/v1/users/*         → userRoutes
 *   /api/v1/companies/*     → companyRoutes
 *   /api/v1/projects/*      → projectRoutes
 *   /api/v1/leads/*         → leadRoutes
 *   /api/v1/clients/*       → clientRoutes
 *   /api/v1/employees/*     → employeeRoutes
 *   /api/v1/notifications/* → notificationRoutes
 */
const router = Router();

// Authentication routes (no auth required)
router.use("/auth", authRoutes);

// Protected routes (auth middleware will be added later)
router.use("/users", userRoutes);
router.use("/companies", companyRoutes);
router.use("/projects", projectRoutes);
router.use("/leads", leadRoutes);
router.use("/clients", clientRoutes);
router.use("/employees", employeeRoutes);
router.use("/notifications", notificationRoutes);

export default router;
