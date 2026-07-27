import { verifyAccessToken, verifyRefreshToken } from '../utils/generateToken.js';
import { AppError } from './errorHandler.js';
import prisma from '../config/db.js';

/**
 * Protect middleware - Authenticates requests using JWT access token from:
 * 1. Authorization header (Bearer token)
 * 2. Secure HTTP-only cookie (accessToken)
 * 
 * Attaches user data to req.user
 */
export async function protect(req, res, next) {
  let token;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Check secure cookie
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError('Not authorized to access this route', 401);
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    let userData;

    // Check if platform owner
    if (decoded.isPlatformOwner) {
      const platformOwner = await prisma.platformOwner.findUnique({
        where: { id: decoded.id },
      });

      if (!platformOwner || !platformOwner.isActive) {
        throw new AppError('Platform owner not found or deactivated', 401);
      }

      userData = {
        id: platformOwner.id,
        email: platformOwner.email,
        name: platformOwner.name,
        isPlatformOwner: true,
      };
    } else {
      // Regular user
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: true,
          employee: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new AppError('User not found or inactive', 401);
      }

      userData = {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        name: user.name,
        role: user.role,
        employee: user.employee,
      };
    }

    // Attach user to request
    req.user = userData;

    next();
  } catch (error) {
    throw new AppError('Not authorized to access this route', 401);
  }
}

/**
 * Optional authentication - doesn't throw if no token, but attaches user if valid
 */
export async function optionalAuth(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }
  } catch (error) {
    // Silently ignore invalid tokens for optional auth
  }

  next();
}

/**
 * Refresh token middleware - Validates refresh token from cookie
 * Used for /auth/refresh endpoint
 */
export async function validateRefreshToken(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token not found', 401);
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, companyId: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid refresh token', 401);
    }

    req.user = { id: user.id, companyId: user.companyId };
    next();
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
}

/**
 * Role-based access control middleware.
 * Restricts access to specific roles within a company.
 * 
 * Usage: authorize(['admin', 'manager'])
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const userRole = req.user.role?.slug;

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }

    next();
  };
}

/**
 * Permission-based access control middleware.
 * Restricts access based on specific permissions.
 * 
 * Usage: requirePermission('project:create')
 */
export function requirePermission(...requiredPermissions) {
  return async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    try {
      // Get user's role with permissions
      const userWithPermissions = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!userWithPermissions?.role) {
        throw new AppError('No role assigned', 403);
      }

      const userPermissions = userWithPermissions.role.rolePermissions.map(
        (rp) => rp.permission.slug
      );

      // Check if user has all required permissions
      const hasPermission = requiredPermissions.every((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        throw new AppError('You do not have permission to perform this action', 403);
      }

      // Attach permissions to request for later use
      req.permissions = userPermissions;

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to check permissions', 500);
    }
  };
}

/**
 * Resource ownership middleware.
 * Ensures user can only access resources from their company.
 * Checks companyId matches.
 */
export function resourceOwner(req, res, next) {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Company admin or platform owner can access all resources
  // Regular users can only access their company's resources
  const isAdmin = req.user.role?.slug === 'admin' || req.user.role?.slug === 'owner';
  
  // For platform owners, allow all
  if (req.user.isPlatformOwner) {
    return next();
  }

  // For admins, allow all within their company
  if (isAdmin) {
    return next();
  }

  // For regular users, check ownership
  const resourceCompanyId = req.params.companyId || req.body.companyId;

  if (resourceCompanyId && resourceCompanyId !== req.user.companyId) {
    throw new AppError('Access denied to this resource', 403);
  }

  next();
}