import prisma from "../../config/db.js";
import { AppError } from "../../middleware/errorHandler.js";
import { generateCompletion } from "./ai.provider.js";
import { recordAiUsage, checkAiQuota, getOrCreateAiFeature } from "./ai.usage.service.js";

/**
 * AI Report Generation Service.
 * Generates structured reports from company data using AI.
 * Supports project, site, finance, HR, inventory, sales, and custom report types.
 */

/**
 * Build a data context for a report based on type.
 * @param {string} companyId - Company ID.
 * @param {string} type - Report type.
 * @param {Object} [params] - Report parameters (entityId, dateRange).
 * @returns {Promise<Object>} Data context for the AI.
 */
async function buildReportContext(companyId, type, params = {}) {
  const { entityId, startDate, endDate } = params;

  switch (type) {
        case "PROJECT": {
      // When a specific entity is requested, look it up (404 if it really doesn't exist).
      if (entityId) {
        const project = await prisma.project.findFirst({
          where: { id: entityId, companyId },
          include: {
            client: true,
            tasks: true,
            milestones: true,
            sites: true,
          },
        });
        if (!project) throw new AppError("Project not found", 404);
        return {
          type: "PROJECT",
          project: {
            name: project.name,
            code: project.code,
            status: project.status,
            priority: project.priority,
            progress: project.progress,
            budget: project.budget?.toString(),
            actualCost: project.actualCost?.toString(),
            startDate: project.startDate,
            endDate: project.endDate,
            client: project.client?.name,
            taskCount: project.tasks.length,
            completedTasks: project.tasks.filter((t) => t.status === "DONE").length,
            milestones: project.milestones,
          },
        };
      }

      // No specific entity requested — build a company-wide project summary
      // (consistent with FINANCE/HR/INVENTORY/SALES) so a report can always be
      // generated, even for companies with no projects yet.
      const projects = await prisma.project.findMany({
        where: { companyId },
        include: { client: true, tasks: true, milestones: true, sites: true },
      });

      const totalBudget = projects.reduce((sum, p) => sum + (p.budget ? parseFloat(p.budget) : 0), 0);
      const totalActualCost = projects.reduce(
        (sum, p) => sum + (p.actualCost ? parseFloat(p.actualCost) : 0),
        0
      );
      const activeProjects = projects.filter(
        (p) => p.status === "ACTIVE" || p.status === "IN_PROGRESS"
      ).length;

      return {
        type: "PROJECT",
        context: "company-wide project summary (no specific project selected)",
        summary: {
          totalProjects: projects.length,
          activeProjects,
          completedProjects: projects.filter((p) => p.status === "DONE").length,
          totalBudget: totalBudget.toString(),
          totalActualCost: totalActualCost.toString(),
          overallProgress:
            projects.length > 0
              ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
              : 0,
        },
        projects: projects.map((p) => ({
          name: p.name,
          code: p.code,
          status: p.status,
          priority: p.priority,
          progress: p.progress,
          budget: p.budget?.toString(),
          actualCost: p.actualCost?.toString(),
          startDate: p.startDate,
          endDate: p.endDate,
          client: p.client?.name,
          taskCount: p.tasks.length,
          completedTasks: p.tasks.filter((t) => t.status === "DONE").length,
          milestones: p.milestones,
        })),
      };
    }

        case "SITE": {
      // When a specific entity is requested, look it up (404 if it really doesn't exist).
      if (entityId) {
        const site = await prisma.site.findFirst({
          where: { id: entityId, companyId },
          include: {
            progressEntries: true,
            materials: true,
            attendance: true,
            expenses: true,
            issues: true,
            reports: true,
          },
        });
        if (!site) throw new AppError("Site not found", 404);
        return {
          type: "SITE",
          site: {
            name: site.name,
            code: site.code,
            status: site.status,
            progress: site.progressEntries[site.progressEntries.length - 1]?.progress || 0,
            totalExpenses: site.expenses.reduce((sum, e) => sum + e.amount, 0),
            openIssues:
              site.issues.filter(
                (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
              ).length,
            materials: site.materials,
            attendance: site.attendance,
            reports: site.reports,
          },
        };
      }

      // No specific entity requested — build a company-wide site summary.
      const sites = await prisma.site.findMany({
        where: { companyId },
        include: {
          progressEntries: true,
          materials: true,
          attendance: true,
          expenses: true,
          issues: true,
          reports: true,
        },
      });

      return {
        type: "SITE",
        context: "company-wide site summary (no specific site selected)",
        summary: {
          totalSites: sites.length,
          activeSites: sites.filter(
            (s) => s.status === "ACTIVE" || s.status === "IN_PROGRESS"
          ).length,
          totalExpenses: sites.reduce(
            (sum, s) => sum + s.expenses.reduce((e2, e) => e2 + e.amount, 0),
            0
          ),
          totalIssues: sites.reduce((sum, s) => sum + s.issues.length, 0),
          openIssues: sites.reduce(
            (sum, s) =>
              sum +
              s.issues.filter(
                (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
              ).length,
            0
          ),
        },
        sites: sites.map((s) => ({
          name: s.name,
          code: s.code,
          status: s.status,
          progress: s.progressEntries[s.progressEntries.length - 1]?.progress || 0,
          totalExpenses: s.expenses.reduce((sum, e) => sum + e.amount, 0),
          openIssues: s.issues.filter(
            (i) => i.status === "OPEN" || i.status === "IN_PROGRESS"
          ).length,
          materialCount: s.materials.length,
          attendanceCount: s.attendance.length,
          issueCount: s.issues.length,
        })),
      };
    }

    case "FINANCE": {
      const transactions = await prisma.transaction.findMany({
        where: {
          companyId,
          ...(startDate || endDate
            ? {
                transactionDate: {
                  ...(startDate ? { gte: new Date(startDate) } : {}),
                  ...(endDate ? { lte: new Date(endDate) } : {}),
                },
              }
            : {}),
        },
        orderBy: { transactionDate: "desc" },
      });

      const income = transactions.filter((t) => t.type === "INCOME");
      const expenses = transactions.filter((t) => t.type === "EXPENSE");

      return {
        type: "FINANCE",
        finance: {
          totalIncome: income.reduce((sum, t) => sum + parseFloat(t.amount), 0),
          totalExpenses: expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0),
          netBalance:
            income.reduce((sum, t) => sum + parseFloat(t.amount), 0) -
            expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0),
          transactionCount: transactions.length,
          incomeCount: income.length,
          expenseCount: expenses.length,
          recentTransactions: transactions.slice(0, 10).map((t) => ({
            type: t.type,
            amount: t.amount.toString(),
            category: t.category,
            description: t.description,
            date: t.transactionDate,
          })),
        },
      };
    }

    case "HR": {
      const [employees, departments, leaves, payrolls] = await Promise.all([
        prisma.employee.findMany({ where: { companyId } }),
        prisma.department.findMany({ where: { companyId } }),
        prisma.employeeLeave.findMany({ where: { companyId } }),
        prisma.payroll.findMany({ where: { companyId } }),
      ]);

      return {
        type: "HR",
        hr: {
          totalEmployees: employees.length,
          departments: departments.map((d) => d.name),
          pendingLeaves: leaves.filter((l) => l.status === "PENDING").length,
          approvedLeaves: leaves.filter((l) => l.status === "APPROVED").length,
          totalPayroll: payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
        },
      };
    }

    case "INVENTORY": {
      const [items, orders] = await Promise.all([
        prisma.inventoryItem.findMany({ where: { companyId } }),
        prisma.purchaseOrder.findMany({ where: { companyId } }),
      ]);

      return {
        type: "INVENTORY",
        inventory: {
          totalItems: items.length,
          lowStockItems: items.filter(
            (i) => i.reorderPoint && i.quantity <= i.reorderPoint
          ).length,
          totalValue: items.reduce((sum, i) => sum + parseFloat(i.unitPrice || 0) * i.quantity, 0),
          pendingOrders: orders.filter((o) => o.status === "PENDING" || o.status === "DRAFT").length,
        },
      };
    }

    case "SALES": {
      const leads = await prisma.lead.findMany({ where: { companyId } });
      const clients = await prisma.client.findMany({ where: { companyId } });

      return {
        type: "SALES",
        sales: {
          totalLeads: leads.length,
          wonLeads: leads.filter((l) => l.status === "WON").length,
          lostLeads: leads.filter((l) => l.status === "LOST").length,
          conversionRate: leads.length > 0
            ? (leads.filter((l) => l.status === "WON").length / leads.length) * 100
            : 0,
          totalClients: clients.length,
        },
      };
    }

    default:
      return { type: "CUSTOM", customData: params.data || {} };
  }
}

/**
 * Generate a report.
 * @param {Object} params
 * @param {string} params.companyId - Company ID.
 * @param {string} [params.userId] - User ID.
 * @param {string} params.type - Report type.
 * @param {string} params.title - Report title.
 * @param {string} [params.description] - Report description.
 * @param {string} [params.prompt] - Custom instructions for the AI.
 * @param {Object} [params.data] - Custom data for custom reports.
 * @param {string} [params.entityId] - Entity ID (project/site).
 * @param {string} [params.startDate] - Start date filter.
 * @param {string} [params.endDate] - End date filter.
 * @param {string} [params.format] - Output format.
 * @param {Object} [params.options] - AI options.
 * @returns {Promise<Object>} The generated report.
 */
export async function generateReport({
  companyId,
  userId,
  type = "CUSTOM",
  title,
  description,
  prompt,
  data,
  entityId,
  startDate,
  endDate,
  format = "MARKDOWN",
  options = {},
}) {
  // Check quota
  const quota = await checkAiQuota(companyId, "reports");
  if (!quota.allowed) {
    throw new AppError("AI report quota exceeded. Please upgrade your plan or contact admin.", 429);
  }

  // Build context from company data
  const context = await buildReportContext(companyId, type, { entityId, startDate, endDate, data });

  // Create report record (initial state)
  const report = await prisma.aiReport.create({
    data: {
      companyId,
      userId,
      type,
      title,
      description,
      prompt,
      format,
      status: "GENERATING",
    },
  });

  // Get or create AI feature for tracking
  const feature = await getOrCreateAiFeature(companyId, "reports", {
    provider: options.provider || "OPENAI",
    modelName: options.model,
  });

  try {
    const systemPrompt = `You are SitePulse AI report generator. Generate a professional, detailed report based on the provided business data. Format the report as ${format}. Use clear headings, bullet points, and tables where appropriate. Focus on key metrics, trends, and actionable insights.`;

    const userPrompt = `
Report Title: ${title}
Report Type: ${type}
${description ? `Description: ${description}\n` : ""}
${prompt ? `Special Instructions: ${prompt}\n` : ""}

Business Data:
${JSON.stringify(context, null, 2)}

Generate a comprehensive ${type.toLowerCase()} report based on this data.
`;

    const result = await generateCompletion({
      prompt: userPrompt,
      system: systemPrompt,
      provider: options.provider,
      model: options.model,
      maxTokens: options.maxTokens || 4000,
      temperature: 0.3,
    });

    // Update report with generated content
    const updatedReport = await prisma.aiReport.update({
      where: { id: report.id },
      data: {
        content: result.text,
        data: context,
        status: "COMPLETED",
      },
    });

    // Record usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: result.model,
      prompt: userPrompt,
      response: result.text,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      duration: result.durationMs,
      success: true,
    });

    return updatedReport;
  } catch (error) {
    // Mark report as failed
    await prisma.aiReport.update({
      where: { id: report.id },
      data: {
        status: "FAILED",
        error: error.message,
      },
    });

    // Record failed usage
    await recordAiUsage({
      companyId,
      userId,
      featureId: feature?.id,
      modelName: options.model || "unknown",
      prompt: prompt || title,
      success: false,
    });

    throw error;
  }
}

/**
 * List reports for a company.
 * @param {string} companyId - Company ID.
 * @param {Object} [options]
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=20] - Items per page.
 * @param {string} [options.type] - Filter by report type.
 * @param {string} [options.status] - Filter by status.
 * @returns {Promise<Object>} Paginated reports.
 */
export async function listReports(companyId, { page = 1, limit = 20, type, status } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    companyId,
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
  };

  const [total, reports] = await Promise.all([
    prisma.aiReport.count({ where }),
    prisma.aiReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        format: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single report.
 * @param {string} reportId - Report ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} The report.
 */
export async function getReport(reportId, companyId) {
  const report = await prisma.aiReport.findFirst({
    where: { id: reportId, companyId },
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  return report;
}

/**
 * Delete a report.
 * @param {string} reportId - Report ID.
 * @param {string} companyId - Company ID.
 * @returns {Promise<Object>} Deleted report.
 */
export async function deleteReport(reportId, companyId) {
  const report = await prisma.aiReport.findFirst({
    where: { id: reportId, companyId },
  });

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  return prisma.aiReport.delete({ where: { id: reportId } });
}

export default {
  generateReport,
  listReports,
  getReport,
  deleteReport,
};