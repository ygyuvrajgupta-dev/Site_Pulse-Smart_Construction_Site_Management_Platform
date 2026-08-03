import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all departments for a company
 */
export async function getDepartments(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const search = req.query.search || '';

    const where = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const departments = await prisma.department.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return response.success(res, departments);
  } catch (error) {
    next(error);
  }
}

/**
 * Get department by ID
 */
export async function getDepartmentById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const department = await prisma.department.findFirst({
      where: { id, companyId },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        employees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    return response.success(res, department);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new department
 */
export async function createDepartment(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, code, description, headId, isActive } = req.body;

    // Check if department with this name already exists
    const existingDept = await prisma.department.findFirst({
      where: { companyId, name },
    });

    if (existingDept) {
      throw new AppError('Department with this name already exists', 409);
    }

    // Verify head belongs to company if provided
    if (headId) {
      const head = await prisma.user.findFirst({
        where: { id: headId, companyId },
      });

      if (!head) {
        throw new AppError('Department head not found in this company', 404);
      }
    }

    const department = await prisma.department.create({
      data: {
        companyId,
        name,
        code,
        description,
        headId,
        isActive: isActive ?? true,
      },
      include: {
        head: {
          select: { name: true, email: true },
        },
      },
    });

    return response.success(res, department, 'Department created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update department
 */
export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, code, description, headId, isActive } = req.body;

    const department = await prisma.department.findFirst({
      where: { id, companyId },
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    // Check if name is being changed and already exists
    if (name && name !== department.name) {
      const nameExists = await prisma.department.findFirst({
        where: { companyId, name },
      });

      if (nameExists) {
        throw new AppError('Department with this name already exists', 409);
      }
    }

    // Verify head belongs to company if provided
    if (headId) {
      const head = await prisma.user.findFirst({
        where: { id: headId, companyId },
      });

      if (!head) {
        throw new AppError('Department head not found in this company', 404);
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: { name, code, description, headId, isActive },
      include: {
        head: {
          select: { name: true, email: true },
        },
      },
    });

    return response.success(res, updatedDepartment, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete department
 */
export async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const department = await prisma.department.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    // Check if department has employees
    if (department._count.employees > 0) {
      throw new AppError('Cannot delete department with employees. Please reassign them first.', 400);
    }

    await prisma.department.delete({ where: { id } });

    return response.success(res, null, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
}