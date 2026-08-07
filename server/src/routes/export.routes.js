import { Router } from "express";
import {
  exportToPDF,
  exportToExcel,
  exportSales,
  exportEmployees,
  exportProjects,
  exportFinance,
  exportInventory,
  exportAttendance,
  exportSites,
} from "../services/export.service.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

// Generic export endpoints
router.get("/pdf", exportToPDF);
router.get("/excel", exportToExcel);

// Specific exports
router.get("/sales", exportSales);
router.get("/employees", exportEmployees);
router.get("/projects", exportProjects);
router.get("/finance", exportFinance);
router.get("/inventory", exportInventory);
router.get("/attendance", exportAttendance);
router.get("/sites", exportSites);

export default router;