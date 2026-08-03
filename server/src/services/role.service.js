import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all roles for a company
 */
export async function getRoles(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const roles = await prisma.role.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            rolePermissions: true,
          },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return response.success(res, roles);
  } catch (error) {
    next(error);
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const role = await prisma.role.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    return response.success(res, role);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new role
 */
export async function createRole(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, slug, description, isSystem } = req.body;

    // Check if role with this slug already exists
    const existingRole = await prisma.role.findFirst({
      where: { companyId, slug },
    });

    if (existingRole) {
      throw new AppError('Role with this slug already exists', 409);
    }

    const role = await prisma.role.create({
      data: {
        companyId,
        name,
        slug,
        description,
        isSystem: isSystem || false,
      },
    });

    return response.success(res, role, 'Role created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update role
 */
export async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, slug, description, isSystem } = req.body;

    const role = await prisma.role.findFirst({
      where: { id, companyId },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    // Prevent editing system roles
    if (role.isSystem && role.slug === 'owner') {
      throw new AppError('Cannot modify owner role', 403);
    }

    // Check if slug is being changed and already exists
    if (slug && slug !== role.slug) {
      const slugExists = await prisma.role.findFirst({
        where: { companyId, slug },
      });

      if (slugExists) {
        throw new AppError('Role with this slug already exists', 409);
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: { name, slug, description, isSystem },
    });

    return response.success(res, updatedRole, 'Role updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete role
 */
export async function deleteRole(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const role = await prisma.role.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      throw new AppError('Cannot delete system role', 403);
    }

    // Check if role has users
    if (role._count.users > 0) {
      throw new AppError('Cannot delete role with assigned users', 400);
    }

    await prisma.role.delete({ where: { id } });

    return response.success(res, null, 'Role deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Assign permissions to a role
 */
export async function assignPermissions(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { permissionIds } = req.body;

    const role = await prisma.role.findFirst({
      where: { id, companyId },
    });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    // Delete existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Create new permissions
    if (permissionIds && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      });
    }

    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return response.success(res, updatedRole, 'Permissions assigned successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Get all available permissions
 */
export async function getAllPermissions(req, res, next) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { module: 'asc' },
    });

    // Group by module
    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});

    return response.success(res, grouped);
  } catch (error) {
    next(error);
  }
}