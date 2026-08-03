import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * Get all employees for a company
 */
export async function getEmployees(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const departmentId = req.query.departmentId;

    const skip = (page - 1) * limit;
    const where = { companyId };

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              status: true,
            },
          },
          department: true,
          manager: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return response.success(res, {
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            status: true,
            role: true,
          },
        },
        department: true,
        manager: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        directReports: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return response.success(res, employee);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new employee
 */
export async function createEmployee(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { userId, departmentId, employeeCode, jobTitle, employmentType, hireDate, salary, currency, reportingToId } = req.body;

    // Verify user belongs to company
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
    });

    if (!user) {
      throw new AppError('User not found in this company', 404);
    }

    // Check if employee already exists for this user
    const existingEmployee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (existingEmployee) {
      throw new AppError('Employee record already exists for this user', 409);
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        companyId,
        departmentId,
        employeeCode,
        jobTitle,
        employmentType,
        hireDate: hireDate ? new Date(hireDate) : null,
        salary: salary ? parseFloat(salary) : null,
        currency: currency || 'USD',
        reportingToId,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        department: true,
      },
    });

    return response.success(res, employee, 'Employee created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Update employee
 */
export async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { departmentId, employeeCode, jobTitle, employmentType, hireDate, terminationDate, salary, currency, reportingToId, isActive } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        departmentId,
        employeeCode,
        jobTitle,
        employmentType,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        terminationDate: terminationDate ? new Date(terminationDate) : undefined,
        salary: salary ? parseFloat(salary) : undefined,
        currency,
        reportingToId,
        isActive,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        department: true,
      },
    });

    return response.success(res, updatedEmployee, 'Employee updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete employee
 */
export async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    await prisma.employee.delete({ where: { id } });

    return response.success(res, null, 'Employee deleted successfully');
  } catch (error) {
    next(error);
  }
}