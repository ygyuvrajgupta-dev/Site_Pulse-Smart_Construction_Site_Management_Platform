import { Router } from "express";
import {
  loginController,
  registerController,
  logoutController,
  refreshController,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  verifyEmailController,
  getMe,
} from "../contoller/auth.controller.js";
import { protect, validateRefreshToken } from "../middleware/auth.middleware.js";
import { body } from "express-validator";

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new company and owner user
 */
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("name").notEmpty().trim(),
    body("companyName").notEmpty().trim(),
  ],
  registerController
);

/**
 * POST /api/v1/auth/login
 * Authenticate user or platform owner
 */
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
    body("rememberMe").optional().isBoolean(),
  ],
  loginController
);

/**
 * POST /api/v1/auth/logout
 * Clear cookies and logout
 */
router.post("/logout", protect, logoutController);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post("/refresh", validateRefreshToken, refreshController);

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset
 */
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  forgotPasswordController
);

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
router.post(
  "/reset-password",
  [
    body("token").notEmpty(),
    body("password").isLength({ min: 8 }),
  ],
  resetPasswordController
);

/**
 * POST /api/v1/auth/change-password
 * Change password for authenticated user
 */
router.post(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ],
  changePasswordController
);

/**
 * GET /api/v1/auth/verify-email/:token
 * Verify user email
 */
router.get("/verify-email/:token", verifyEmailController);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get("/me", protect, getMe);

export default router;