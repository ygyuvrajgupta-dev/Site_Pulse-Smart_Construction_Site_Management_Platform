import { Router } from "express";
import {
  createCompany,
  deleteCompany,
  suspendCompany,
  activateCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
} from "../contoller/platform.controller.js";
import {
  createPlan,
  updatePlan,
  deletePlan,
  getAllPlans,
  getPlanById,
} from "../services/plan.service.js";
import {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getAllSubscriptions,
  getSubscriptionById,
} from "../services/subscription.service.js";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllCoupons,
  getCouponById,
} from "../services/coupon.service.js";
import {
  getAnalytics,
  getPlatformStats,
} from "../services/analytics.service.js";
import {
  updatePlatformSettings,
  getPlatformSettings,
} from "../services/platform.service.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { body } from "express-validator";

const router = Router();

// All routes require authentication and platform owner role
router.use(protect, authorize('owner'));

// ============================================
// Company Management
// ============================================

/**
 * POST /api/v1/platform/companies
 * Create a new company
 */
router.post(
  "/companies",
  [
    body("name").notEmpty().trim(),
    body("slug").notEmpty().trim(),
    body("email").isEmail().normalizeEmail(),
  ],
  createCompany
);

/**
 * GET /api/v1/platform/companies
 * Get all companies with pagination
 */
router.get("/companies", getAllCompanies);

/**
 * GET /api/v1/platform/companies/:id
 * Get company by ID
 */
router.get("/companies/:id", getCompanyById);

/**
 * PUT /api/v1/platform/companies/:id
 * Update company
 */
router.put("/companies/:id", updateCompany);

/**
 * DELETE /api/v1/platform/companies/:id
 * Delete company (hard delete)
 */
router.delete("/companies/:id", deleteCompany);

/**
 * POST /api/v1/platform/companies/:id/suspend
 * Suspend company
 */
router.post("/companies/:id/suspend", suspendCompany);

/**
 * POST /api/v1/platform/companies/:id/activate
 * Activate company
 */
router.post("/companies/:id/activate", activateCompany);

// ============================================
// Plan Management
// ============================================

/**
 * POST /api/v1/platform/plans
 * Create a new plan
 */
router.post(
  "/plans",
  [
    body("name").notEmpty().trim(),
    body("slug").notEmpty().trim(),
    body("price").isDecimal(),
  ],
  createPlan
);

/**
 * GET /api/v1/platform/plans
 * Get all plans
 */
router.get("/plans", getAllPlans);

/**
 * GET /api/v1/platform/plans/:id
 * Get plan by ID
 */
router.get("/plans/:id", getPlanById);

/**
 * PUT /api/v1/platform/plans/:id
 * Update plan
 */
router.put("/plans/:id", updatePlan);

/**
 * DELETE /api/v1/platform/plans/:id
 * Delete plan
 */
router.delete("/plans/:id", deletePlan);

// ============================================
// Subscription Management
// ============================================

/**
 * GET /api/v1/platform/subscriptions
 * Get all subscriptions with filters
 */
router.get("/subscriptions", getAllSubscriptions);

/**
 * GET /api/v1/platform/subscriptions/:id
 * Get subscription by ID
 */
router.get("/subscriptions/:id", getSubscriptionById);

/**
 * POST /api/v1/platform/subscriptions/:id/cancel
 * Cancel subscription
 */
router.post("/subscriptions/:id/cancel", cancelSubscription);

// ============================================
// Coupon Management
// ============================================

/**
 * POST /api/v1/platform/coupons
 * Create a new coupon
 */
router.post(
  "/coupons",
  [
    body("code").notEmpty().trim().toUpperCase(),
    body("discountType").isIn(['PERCENTAGE', 'FIXED']),
    body("discountValue").isDecimal(),
  ],
  createCoupon
);

/**
 * GET /api/v1/platform/coupons
 * Get all coupons
 */
router.get("/coupons", getAllCoupons);

/**
 * GET /api/v1/platform/coupons/:id
 * Get coupon by ID
 */
router.get("/coupons/:id", getCouponById);

/**
 * PUT /api/v1/platform/coupons/:id
 * Update coupon
 */
router.put("/coupons/:id", updateCoupon);

/**
 * DELETE /api/v1/platform/coupons/:id
 * Delete coupon
 */
router.delete("/coupons/:id", deleteCoupon);

// ============================================
// Analytics
// ============================================

/**
 * GET /api/v1/platform/analytics
 * Get platform-wide analytics
 * Query params: startDate, endDate, groupBy
 */
router.get("/analytics", getAnalytics);

/**
 * GET /api/v1/platform/stats
 * Get platform statistics
 */
router.get("/stats", getPlatformStats);

// ============================================
// Platform Settings
// ============================================

/**
 * GET /api/v1/platform/settings
 * Get platform settings
 */
router.get("/settings", getPlatformSettings);

/**
 * PUT /api/v1/platform/settings
 * Update platform settings
 */
router.put("/settings", updatePlatformSettings);

export default router;