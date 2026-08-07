import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * PDF Export Utility using jsPDF
 */
export async function exportToPDF(req, res, next) {
  try {
    const { type, data, title } = req.body;
    
    // In production, you would use a library like pdfkit or puppeteer
    // For now, we'll return a JSON response that can be used by frontend
    const exportData = {
      type: 'pdf',
      title: title || 'Export',
      data,
      exportedAt: new Date().toISOString(),
      exportedBy: req.user?.name || 'System'
    };

    return response.success(res, exportData, 'PDF export ready');
  } catch (error) { next(error); }
}

/**
 * Excel Export Utility
 */
export async function exportToExcel(req, res, next) {
  try {
    const { type, data, title } = req.body;
    
    // In production, you would use exceljs or xlsx library
    // For now, we'll return a JSON response that can be used by frontend
    const exportData = {
      type: 'excel',
      title: title || 'Export',
      data,
      exportedAt: new Date().toISOString(),
      exportedBy: req.user?.name || 'System'
    };

    return response.success(res, exportData, 'Excel export ready');
  } catch (error) { next(error); }
}

/**
 * ============================================
 * SALES EXPORT
 * ============================================
 */
export async function exportSales(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const format = req.query.format || 'excel';
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    // Get invoices (sales)
    const where = { companyId };
    if (from && to) {
      where.issueDate = { gte: from, lte: to };
    }

    const sales = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { name: true, email: true } },
        items: true,
      },
    });

    const exportData = sales.map(invoice => ({
      InvoiceNo: invoice.invoiceNo,
      Client: invoice.client?.name || '—',
      Email: invoice.client?.email || '—',
      IssueDate: invoice.issueDate?.toLocaleDateString(),
      DueDate: invoice.dueDate?.toLocaleDateString() || '—',
      Subtotal: invoice.subtotal || 0,
      Tax: invoice.tax || 0,
      Total: invoice.total || 0,
      Currency: invoice.currency,
      Status: invoice.status,
      Items: invoice.items?.length || 0
    }));

    return response.success(res, {
      format,
      title: 'Sales Report',
      data: exportData,
      filename: `sales_export_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    });
  } catch (error) { next(error); }
}

/**
 * ============================================
 * EMPLOYEES EXPORT
 * ============================================
 */
export async function exportEmployees(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const format = req.query.format || 'excel';

    const employees = await prisma.employee.findMany({
      where: { companyId, isActive: true },
      include: {
        user: { select: { email: true, phone: true } },
        department: { select: { name: true } },
      },
    });

    const exportData = employees.map(emp => ({
      EmployeeCode: emp.employeeCode || '—',
      Name: emp.user?.name || '—',
      Email: emp.user?.email || '—',
      Phone: emp.user?.phone || '—',
      Department: emp.department?.name || '—',
      JobTitle: emp.jobTitle || '—',
      EmploymentType: emp.employmentType || '—',
      HireDate: emp.hireDate?.toLocaleDateString() || '—',
      Salary: emp.salary || 0,
      Currency: emp.currency,
      Status: emp.isActive ? 'Active' : 'Inactive'
    }));

    return response.success(res, {
      format,
      title: 'Employees Report',
      data: exportData,
      filename: `employees_export_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    });
  } catch (error) { next(error); }
}

/**
 * ============================================
 * PROJECTS EXPORT
 * ============================================
 */
export async function exportProjects(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const format = req.query.format || 'excel';

    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        client: { select: { name: true } },
        tasks: true,
        milestones: true,
      },
    });

    const exportData = projects.map(project => ({
      ProjectName: project.name,
      Code: project.code || '—',
      Client: project.client?.name || '—',
      Status: project.status,
      Priority: project.priority,
      StartDate: project.startDate?.toLocaleDateString() || '—',
      EndDate: project.endDate?.toLocaleDateString() || '—',
      Budget: project.budget || 0,
      ActualCost: project.actualCost || 0,
      Currency: project.currency,
      Progress: `${project.progress}%`,
      Tasks: project.tasks?.length || 0,
      Milestones: project.milestones?.length || 0
    }));

    return response.success(res, {
      format,
      title: 'Projects Report',
      data: exportData,
      filename: `projects_export_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    });
  } catch (error) { next(error); }
}

/**
 * ============================================
 * FINANCE EXPORT
 * ============================================
 */
export async function exportFinance(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const format = req.query.format || 'excel';
    const type = req.query.type || 'all'; // invoices, expenses, income, payments, gst
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    let data = [];
    let title = 'Finance Report';

    if (type === 'invoices' || type === 'all') {
      const where = { companyId };
      if (from && to) where.issueDate = { gte: from, lte: to };
      
      const invoices = await prisma.invoice.findMany({
        where,
        include: { client: { select: { name: true } } }
      });

      data.push(...invoices.map(inv => ({
        Type: 'Invoice',
        Number: inv.invoiceNo,
        Client: inv.client?.name || '—',
        Date: inv.issueDate?.toLocaleDateString(),
        DueDate: inv.dueDate?.toLocaleDateString() || '—',
        Amount: inv.total || 0,
        Currency: inv.currency,
        Status: inv.status
      })));
    }

    if (type === 'expenses' || type === 'all') {
      const where = { companyId, type: 'EXPENSE' };
      if (from && to) where.transactionDate = { gte: from, lte: to };
      
      const expenses = await prisma.transaction.findMany({ where });

      data.push(...expenses.map(exp => ({
        Type: 'Expense',
        Description: exp.description || '—',
        Category: exp.category || '—',
        Date: exp.transactionDate?.toLocaleDateString(),
        Amount: exp.amount,
        Currency: exp.currency,
        Status: exp.status
      })));
    }

    if (type === 'income' || type === 'all') {
      const where = { companyId, type: 'INCOME' };
      if (from && to) where.transactionDate = { gte: from, lte: to };
      
      const income = await prisma.transaction.findMany({ where });

      data.push(...income.map(inc => ({
        Type: 'Income',
        Description: inc.description || '—',
        Category: inc.category || '—',
        Date: inc.transactionDate?.toLocaleDateString(),
        Amount: inc.amount,
        Currency: inc.currency,
        Status: inc.status
      })));
    }

    return response.success(res, {
      format,
      title: title + (type !== 'all' ? ` - ${type.charAt(0).toUpperCase() + type.slice(1)}` : ''),
      data,
      filename: `finance_${type}_export_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    });
  } catch (error) { next(error); }
}

/**
 * ============================================
 * INVENTORY EXPORT
 * ============================================
 */
export async function exportInventory(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const format = req.query.format || 'excel';
    const type = req.query.type || 'products'; // products, stock, purchaseOrders

    let data = [];
    let title = 'Inventory Report';

    if (type === 'products' || type === 'all') {
      const products = await prisma.product.findMany({
        where: { companyId },
        include: { category: { select: { name: true } } }
      });

      data.push(...products.map(prod => ({
        Type: 'Product',
        SKU: prod.sku || '—',
        Name: prod.name,
        Category: prod.category?.name || '—',
        Type: prod.type,
        Unit: prod.unit || '—',
        UnitPrice: prod.unitPrice || 0,
        CostPrice: prod.costPrice || 0,
        Currency: prod.currency,
        ReorderPoint: prod.reorderPoint || '—',
        Status: prod.isActive ? 'Active' : 'Inactive'
      })));
    }

    if (type === 'stock' || type === 'all') {
      const stockMovements = await prisma.stockMovement.findMany({
        where: { companyId },
        include: { product: { select: { name: true, sku: true } }, warehouse: { select: { name: true } } }
      });

      data.push(...stockMovements.map(stock => ({
        Type: 'Stock Movement',
        Product: stock.product?.name || '—',
        SKU: stock.product?.sku || '—',
        Warehouse: stock.warehouse?.name || '—',
        MovementType: stock.type,
        Quantity: stock.quantity,
        Reference: stock.reference || '—',
        Date: stock.movedAt?.toLocaleDateString(),
        MovedBy: stock.movedBy || '—'
      })));
    }

    if (type === 'purchaseOrders' || type === 'all') {
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: { companyId },
        include: { supplier: { select: { name: true } } }
      });

      data.push(...purchaseOrders.map(po => ({
        Type: 'Purchase Order',
        OrderNo: po.orderNo,
        Supplier: po.supplier?.name || '—',
        Date: po.orderDate?.toLocaleDateString(),
        ExpectedDate: po.expectedDate?.toLocaleDateString() || '—',
        Status: po.status,
        Subtotal: po.subtotal || 0,
        Tax: po.tax || 0,
        Total: po.total || 0,
        Currency: po.currency
      })));
    }

    return response.success(res, {
      format,
      title: title + (type !== 'all' ? ` - ${type.charAt(0).toUpperCase() + type.slice(1)}` : ''),
      data,
      filename: `inventory_${type}_export_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    });
  } catch (error) { next(error); }
}

/**
 * ============================================
 * ATTENDANCE EXPORT
 * ============================================
 */
export async function exportAttendance(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const format = req.query.format || 'excel';
    const employeeId = req.query.employeeId;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const where = { companyId };
    if (employeeId) where.employeeId = employeeId;
    if (from && to) where.date = { gte: from, lte: to };

    const attendance = await prisma.siteAttendance.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        site: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const exportData = attendance.map(att => ({
      Employee: att.employeeName || att.employee?.user?.name || '—',
      Email: att.employee?.user?.email || '—',
      Site: att.site?.name || '—',
      Date: att.date?.toLocaleDateString(),
      Status: att.status,
      CheckIn: att.checkIn?.toLocaleTimeString() || '—',
      CheckOut: att.checkOut?.toLocaleTimeString() || '—',
      HoursWorked: att.hoursWorked || '—',
      Notes: att.notes || '—'
    }));

    return response.success(res, {
      format,
      title: 'Attendance Report',
      data: exportData,
      filename: `attendance_export_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    });
  } catch (error) { next(error); }
}

/**
 * ============================================
 * SITES EXPORT
 * ============================================
 */
export async function exportSites(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const format = req.query.format || 'excel';

    const sites = await prisma.site.findMany({
      where: { companyId },
      include: {
        client: { select: { name: true } },
        reports: true,
        progressEntries: true,
      },
    });

    const exportData = sites.map(site => ({
      SiteName: site.name,
      Code: site.code || '—',
      Client: site.client?.name || '—',
      Type: site.type || '—',
      Status: site.status,
      City: site.city || '—',
      State: site.state || '—',
      Country: site.country || '—',
      Reports: site.reports?.length || 0,
      ProgressEntries: site.progressEntries?.length || 0,
      Description: site.description || '—'
    }));

    return response.success(res, {
      format,
      title: 'Sites Report',
      data: exportData,
      filename: `sites_export_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    });
  } catch (error) { next(error); }
}