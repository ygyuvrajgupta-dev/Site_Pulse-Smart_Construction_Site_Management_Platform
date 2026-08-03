import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { body } from "express-validator";

// Import controllers
import {
  getCompanyProfile,
  updateCompanyProfile,
  getCompanySettings,
  updateCompanySettings,
} from "../contoller/company-admin.controller.js";

// Import services
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  inviteUser,
} from "../services/user.service.js";

import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employee.service.js";

import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
} from "../services/role.service.js";

import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/department.service.js";

import {
  getModules,
  updateModuleSettings,
} from "../services/module.service.js";

import {
  getBranding,
  updateBranding,
} from "../services/branding.service.js";

const router = Router();

// All routes require authentication
router.use(protect);

// ============================================
// Dashboard & Profile
// ============================================

router.get("/dashboard", (req, res) => {
  res.json({ success: true, message: "Company Admin Dashboard" });
});

router.get("/profile", getCompanyProfile);
router.put("/profile", updateCompanyProfile);

// ============================================
// Settings
// ============================================

router.get("/settings", getCompanySettings);
router.put("/settings", updateCompanySettings);

// ============================================
// User Management
// ============================================

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/invite", inviteUser);

// ============================================
// Employee Management
// ============================================

router.get("/employees", getEmployees);
router.get("/employees/:id", getEmployeeById);
router.post("/employees", createEmployee);
router.put("/employees/:id", updateEmployee);
router.delete("/employees/:id", deleteEmployee);

// ============================================
// Role Management
// ============================================

router.get("/roles", getRoles);
router.get("/roles/:id", getRoleById);
router.post("/roles", createRole);
router.put("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);
router.post("/roles/:id/permissions", assignPermissions);

// ============================================
// Department Management
// ============================================

router.get("/departments", getDepartments);
router.get("/departments/:id", getDepartmentById);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

// ============================================
// Module Management
// ============================================

router.get("/modules", getModules);
router.put("/modules/:id", updateModuleSettings);

// ============================================
// Branding Management
// ============================================

router.get("/branding", getBranding);
router.put("/branding", updateBranding);

export default router;