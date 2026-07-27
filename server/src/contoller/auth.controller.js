import { response } from '../utils/response.js';
import prisma from '../config/db.js';
import {
  login,
  loginPlatformOwner,
  register,
  refreshTokens,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
} from '../services/auth.service.js';

/**
 * POST /api/v1/auth/login
 * Authenticate user or platform owner
 */
export async function loginController(req, res, next) {
  try {
    const { email, password, rememberMe } = req.body;

    // Check if this is a platform owner email
    // Platform owners have emails starting with 'owner.' or we check the type
    let result;
    
    // Try platform owner login first (they have separate table)
    try {
      result = await loginPlatformOwner(email, password, rememberMe);
    } catch (platformOwnerError) {
      // If platform owner login fails, try regular user login
      result = await login(email, password, rememberMe);
    }

    // Set cookies
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days

    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
    });

    return response.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/register
 * Register a new company/user
 */
export async function registerController(req, res, next) {
  try {
    const { email, password, name, companyName, companySlug } = req.body;

    // Create company first
    const slug = companySlug || name.toLowerCase().replace(/\s+/g, '-');
    
    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug,
        email,
      },
    });

    // Create user with owner role
    const ownerRole = await prisma.role.create({
      data: {
        companyId: company.id,
        name: 'Owner',
        slug: 'owner',
        isSystem: true,
      },
    });

    // Create result
    const result = await register({
      email,
      password,
      name,
      companyId: company.id,
      roleId: ownerRole.id,
    });

    // Set cookies
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response.success(res, result, 'Registration successful');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 * Clear cookies and logout
 */
export async function logoutController(req, res, next) {
  try {
    await logout();

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return response.success(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token from cookie
 */
export async function refreshController(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return response.error(res, 'Refresh token not found', 401);
    }

    const tokens = await refreshTokens(refreshToken);

    // Set new access token cookie
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    // Also refresh the refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response.success(res, tokens, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/forgot-password
 * Generate password reset token and send email
 */
export async function forgotPasswordController(req, res, next) {
  try {
    const { email } = req.body;

    const result = await forgotPassword(email);

    if (!result.resetToken) {
      // Don't reveal that user doesn't exist
      return response.success(res, null, 'If an account exists, a reset email has been sent');
    }

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${result.resetToken}`;
    // await sendEmail(result.user.email, 'Password Reset', resetUrl);

    return response.success(res, null, 'If an account exists, a reset email has been sent');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/reset-password
 * Reset password using token
 */
export async function resetPasswordController(req, res, next) {
  try {
    const { token, password } = req.body;

    await resetPassword(token, password);

    return response.success(res, null, 'Password reset successful');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/change-password
 * Change password for logged-in user
 */
export async function changePasswordController(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    await changePassword(userId, currentPassword, newPassword);

    return response.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/verify-email/:token
 * Verify user email address
 */
export async function verifyEmailController(req, res, next) {
  try {
    const { token } = req.params;

    await verifyEmail(token);

    return response.success(res, null, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
export async function getMe(req, res, next) {
  try {
    return response.success(res, { user: req.user }, 'User profile');
  } catch (error) {
    next(error);
  }
}