import { Router } from "express";
import authRoutes from "../auth.routes.js";
import userRoutes from "../user.routes.js";
import companyRoutes from "../company.routes.js";
import projectRoutes from "../project.routes.js";
import leadRoutes from "../lead.routes.js";
import clientRoutes from "../client.routes.js";
import employeeRoutes from "../employee.routes.js";
import notificationRoutes from "../notification.routes.js";
import siteRoutes from "../site.routes.js";
import hrRoutes from "../hr.routes.js";
import inventoryRoutes from "../inventory.routes.js";
import financeRoutes from "../finance.routes.js";
import documentRoutes from "../document.routes.js";
import exportRoutes from "../export.routes.js";
import aiRoutes from "../ai.routes.js";
import billingRoutes from "../billing.routes.js";
import uploadsRoutes from "../uploads.routes.js";
import { protect } from "../../middleware/auth.middleware.js";

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
router.use("/inventory", protect, inventoryRoutes);
router.use("/finance", protect, financeRoutes);
router.use("/documents", protect, documentRoutes);
router.use("/export", protect, exportRoutes);
router.use("/ai", protect, aiRoutes);
router.use("/uploads", protect, uploadsRoutes);
router.use("/billing", protect, billingRoutes);

export default router;