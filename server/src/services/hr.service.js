import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * ============================================
 * EMPLOYEES
 * ============================================
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
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          department: true,
          manager: { include: { user: { select: { name: true } } } },
          _count: { select: { leaves: true, payrolls: true, performanceReviews: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return response.success(res, { employees, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true } },
        department: true,
        manager: { include: { user: { select: { name: true } } } },
        directReports: { include: { user: { select: { name: true } } } },
        leaves: { orderBy: { createdAt: 'desc' }, take: 10 },
        payrolls: { orderBy: { createdAt: 'desc' }, take: 10 },
        performanceReviews: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!employee) throw new AppError('Employee not found', 404);
    return response.success(res, employee);
  } catch (error) { next(error); }
}

export async function createEmployee(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { userId, departmentId, employeeCode, jobTitle, employmentType, hireDate, salary, currency, reportingToId } = req.body;

    const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new AppError('User not found in this company', 404);

    const existing = await prisma.employee.findUnique({ where: { userId } });
    if (existing) throw new AppError('Employee record already exists for this user', 409);

    const employee = await prisma.employee.create({
      data: {
        userId, companyId, departmentId, employeeCode, jobTitle, employmentType,
        hireDate: hireDate ? new Date(hireDate) : null,
        salary: salary ? parseFloat(salary) : null,
        currency: currency || 'USD', reportingToId,
      },
      include: { user: { select: { name: true, email: true } }, department: true },
    });

    return response.success(res, employee, 'Employee created successfully', 201);
  } catch (error) { next(error); }
}

export async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { departmentId, employeeCode, jobTitle, employmentType, hireDate, terminationDate, salary, currency, reportingToId, isActive } = req.body;

    const employee = await prisma.employee.findFirst({ where: { id, companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        departmentId, employeeCode, jobTitle, employmentType,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        terminationDate: terminationDate ? new Date(terminationDate) : undefined,
        salary: salary !== undefined ? parseFloat(salary) : undefined,
        currency, reportingToId, isActive,
      },
      include: { user: { select: { name: true, email: true } }, department: true },
    });

    return response.success(res, updated, 'Employee updated successfully');
  } catch (error) { next(error); }
}

export async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const employee = await prisma.employee.findFirst({ where: { id, companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    await prisma.employee.delete({ where: { id } });
    return response.success(res, null, 'Employee deleted successfully');
  } catch (error) { next(error); }
}

/**
 * ============================================
 * LEAVES
 * ============================================
 */
export async function getLeaves(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const status = req.query.status;

    const where = { companyId };
    if (status) where.status = status;

    const leaves = await prisma.employeeLeave.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { employee: { include: { user: { select: { name: true } } } } },
    });

    return response.success(res, leaves);
  } catch (error) { next(error); }
}

export async function createLeave(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.employeeLeave.create({
      data: { companyId, employeeId, leaveType, startDate: start, endDate: end, days, reason },
      include: { employee: { include: { user: { select: { name: true } } } } },
    });

    return response.success(res, leave, 'Leave request submitted', 201);
  } catch (error) { next(error); }
}

export async function updateLeaveStatus(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { status, notes } = req.body;

    const leave = await prisma.employeeLeave.findFirst({ where: { id, companyId } });
    if (!leave) throw new AppError('Leave request not found', 404);

    const updated = await prisma.employeeLeave.update({
      where: { id },
      data: {
        status,
        approvedBy: req.user.id,
        approvedAt: status === 'APPROVED' || status === 'REJECTED' ? new Date() : leave.approvedAt,
        notes,
      },
      include: { employee: { include: { user: { select: { name: true } } } } },
    });

    return response.success(res, updated, `Leave ${status.toLowerCase()}`);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * PAYROLL
 * ============================================
 */
export async function getPayrolls(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const status = req.query.status;

    const where = { companyId };
    if (status) where.status = status;

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { employee: { include: { user: { select: { name: true, email: true } } } } },
    });

    return response.success(res, payrolls);
  } catch (error) { next(error); }
}

export async function createPayroll(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { employeeId, periodStart, periodEnd, basicSalary, allowances, deductions } = req.body;

    const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const base = basicSalary !== undefined ? parseFloat(basicSalary) : (employee.salary ? parseFloat(employee.salary) : 0);
    const allow = allowances ? parseFloat(allowances) : 0;
    const deduct = deductions ? parseFloat(deductions) : 0;

    const payroll = await prisma.payroll.create({
      data: {
        companyId, employeeId,
        periodStart: new Date(periodStart), periodEnd: new Date(periodEnd),
        basicSalary: base, allowances: allow, deductions: deduct,
        netSalary: base + allow - deduct,
      },
      include: { employee: { include: { user: { select: { name: true } } } } },
    });

    return response.success(res, payroll, 'Payroll created successfully', 201);
  } catch (error) { next(error); }
}

export async function updatePayrollStatus(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { status, paymentDate } = req.body;

    const payroll = await prisma.payroll.findFirst({ where: { id, companyId } });
    if (!payroll) throw new AppError('Payroll record not found', 404);

    const updated = await prisma.payroll.update({
      where: { id },
      data: { status, paymentDate: paymentDate ? new Date(paymentDate) : undefined },
      include: { employee: { include: { user: { select: { name: true } } } } },
    });

    return response.success(res, updated, 'Payroll status updated');
  } catch (error) { next(error); }
}

/**
 * ============================================
 * RECRUITMENT
 * ============================================
 */
export async function getJobPostings(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const status = req.query.status;

    const where = { companyId };
    if (status) where.status = status;

    const postings = await prisma.jobPosting.findMany({
      where,
      orderBy: { postedAt: 'desc' },
      include: { applications: true },
    });

    return response.success(res, postings);
  } catch (error) { next(error); }
}

export async function createJobPosting(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { title, department, description, requirements, salaryRange, location, employmentType, closingDate } = req.body;

    const posting = await prisma.jobPosting.create({
      data: {
        companyId, title, department, description, requirements, salaryRange, location, employmentType,
        postedBy: req.user.id,
        closingDate: closingDate ? new Date(closingDate) : null,
      },
    });

    return response.success(res, posting, 'Job posting created', 201);
  } catch (error) { next(error); }
}

export async function getJobApplications(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { jobPostingId } = req.query;

    const where = { companyId };
    if (jobPostingId) where.jobPostingId = jobPostingId;

    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      include: { jobPosting: { select: { title: true } } },
    });

    return response.success(res, applications);
  } catch (error) { next(error); }
}

export async function createJobApplication(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { jobPostingId, applicantName, applicantEmail, phone, resumeUrl, coverLetter } = req.body;

    const application = await prisma.jobApplication.create({
      data: { companyId, jobPostingId, applicantName, applicantEmail, phone, resumeUrl, coverLetter },
      include: { jobPosting: { select: { title: true } } },
    });

    return response.success(res, application, 'Application submitted', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * DEPARTMENTS
 * ============================================
 */
export async function getDepartments(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const departments = await prisma.department.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: {
        head: { select: { name: true, email: true } },
        _count: { select: { employees: true } },
      },
    });

    return response.success(res, departments);
  } catch (error) { next(error); }
}

export async function createDepartment(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, code, description, headId } = req.body;

    const department = await prisma.department.create({
      data: { companyId, name, code, description, headId },
      include: { head: { select: { name: true } } },
    });

    return response.success(res, department, 'Department created', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * PERFORMANCE
 * ============================================
 */
export async function getPerformanceReviews(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { employeeId } = req.query;

    const where = { companyId };
    if (employeeId) where.employeeId = employeeId;

    const reviews = await prisma.performanceReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { employee: { include: { user: { select: { name: true } } } } },
    });

    return response.success(res, reviews);
  } catch (error) { next(error); }
}

export async function createPerformanceReview(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { employeeId, period, rating, score, strengths, improvements, goals, reviewerNotes } = req.body;

    const review = await prisma.performanceReview.create({
      data: {
        companyId, employeeId, period, rating, score: score ? parseInt(score) : 0,
        strengths, improvements, goals, reviewerNotes,
        reviewerId: req.user.id,
        reviewedAt: new Date(),
      },
      include: { employee: { include: { user: { select: { name: true } } } } },
    });

    return response.success(res, review, 'Performance review created', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * ATTENDANCE (Company-wide)
 * ============================================
 */
export async function getAttendance(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { employeeId, from, to } = req.query;

    const where = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (from && to) {
      where.date = { gte: new Date(from), lte: new Date(to) };
    }

    const attendance = await prisma.siteAttendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 50,
    });

    return response.success(res, attendance);
  } catch (error) { next(error); }
}

export async function createAttendance(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { siteId, employeeId, employeeName, date, status, checkIn, checkOut, hoursWorked, notes } = req.body;

    const attendance = await prisma.siteAttendance.create({
      data: {
        companyId, siteId, employeeId, employeeName,
        date: new Date(date), status: status || 'PRESENT',
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
        notes,
      },
    });

    return response.success(res, attendance, 'Attendance recorded', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * DOCUMENTS
 * ============================================
 */
export async function getEmployeeDocuments(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const documents = await prisma.document.findMany({
      where: { companyId, category: 'HR' },
      orderBy: { createdAt: 'desc' },
    });

    return response.success(res, documents);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * HR STATS
 * ============================================
 */
export async function getHrStats(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const [
      employeeCount,
      activeEmployees,
      pendingLeaves,
      approvedLeaves,
      totalPayroll,
      openJobs,
      departments,
      reviews,
    ] = await Promise.all([
      prisma.employee.count({ where: { companyId } }),
      prisma.employee.count({ where: { companyId, isActive: true } }),
      prisma.employeeLeave.count({ where: { companyId, status: 'PENDING' } }),
      prisma.employeeLeave.count({ where: { companyId, status: 'APPROVED' } }),
      prisma.payroll.aggregate({ where: { companyId, status: 'PAID' }, _sum: { netSalary: true } }),
      prisma.jobPosting.count({ where: { companyId, status: 'OPEN' } }),
      prisma.department.count({ where: { companyId } }),
      prisma.performanceReview.count({ where: { companyId } }),
    ]);

    return response.success(res, {
      totalEmployees: employeeCount,
      activeEmployees,
      pendingLeaves,
      approvedLeaves,
      totalPayroll: totalPayroll._sum.netSalary || 0,
      openJobs,
      totalDepartments: departments,
      totalReviews: reviews,
    });
  } catch (error) { next(error); }
}