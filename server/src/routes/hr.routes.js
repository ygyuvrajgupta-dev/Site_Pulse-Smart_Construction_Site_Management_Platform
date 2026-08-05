import { Router } from "express";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getLeaves,
  createLeave,
  updateLeaveStatus,
  getPayrolls,
  createPayroll,
  updatePayrollStatus,
  getJobPostings,
  createJobPosting,
  getJobApplications,
  createJobApplication,
  getDepartments,
  createDepartment,
  getPerformanceReviews,
  createPerformanceReview,
  getAttendance,
  createAttendance,
  getEmployeeDocuments,
  getHrStats,
} from "../services/hr.service.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * HR Module routes.
 * Covers: Employees, Leaves, Payroll, Recruitment, Departments, Performance, Attendance, Documents
 */
const router = Router();

// All routes require authentication
router.use(protect);

// HR Statistics
router.get("/stats", getHrStats);

// Employees
router.get("/employees", getEmployees);
router.post("/employees", createEmployee);
router.get("/employees/:id", getEmployeeById);
router.put("/employees/:id", updateEmployee);
router.delete("/employees/:id", deleteEmployee);

// Leaves
router.get("/leaves", getLeaves);
router.post("/leaves", createLeave);
router.put("/leaves/:id/status", updateLeaveStatus);

// Payroll
router.get("/payrolls", getPayrolls);
router.post("/payrolls", createPayroll);
router.put("/payrolls/:id/status", updatePayrollStatus);

// Recruitment
router.get("/recruitment/jobs", getJobPostings);
router.post("/recruitment/jobs", createJobPosting);
router.get("/recruitment/applications", getJobApplications);
router.post("/recruitment/applications", createJobApplication);

// Departments
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);

// Performance
router.get("/performance", getPerformanceReviews);
router.post("/performance", createPerformanceReview);

// Attendance
router.get("/attendance", getAttendance);
router.post("/attendance", createAttendance);

// Documents
router.get("/documents", getEmployeeDocuments);

export default router;