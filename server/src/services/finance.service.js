import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * ============================================
 * INVOICES
 * ============================================
 */
export async function getInvoices(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const status = req.query.status;

    const where = { companyId };
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
        payments: true,
      },
    });

    return response.success(res, invoices);
  } catch (error) { next(error); }
}

export async function createInvoice(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { clientId, invoiceNo, dueDate, items, notes, currency } = req.body;

    let subtotal = 0;
    const invoiceItems = (items || []).map(item => {
      const unitPrice = item.unitPrice ? parseFloat(item.unitPrice) : 0;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      return {
        productId: item.productId,
        description: item.description,
        quantity: parseInt(item.quantity),
        unitPrice,
        totalPrice,
      };
    });

    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        clientId,
        invoiceNo: invoiceNo || `INV-${Date.now()}`,
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        tax,
        total,
        currency: currency || 'USD',
        notes,
        createdBy: req.user.id,
        items: { create: invoiceItems },
      },
      include: {
        client: { select: { name: true } },
        items: true,
      },
    });

    return response.success(res, invoice, 'Invoice created', 201);
  } catch (error) { next(error); }
}

export async function updateInvoiceStatus(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { status } = req.body;

    const invoice = await prisma.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) throw new AppError('Invoice not found', 404);

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: {
        client: { select: { name: true } },
        items: true,
        payments: true,
      },
    });

    return response.success(res, updated, 'Invoice status updated');
  } catch (error) { next(error); }
}

/**
 * ============================================
 * EXPENSES (Income/Expense via Transaction model)
 * ============================================
 */
export async function getExpenses(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const transactions = await prisma.transaction.findMany({
      where: { companyId, type: 'EXPENSE' },
      orderBy: { transactionDate: 'desc' },
      take: 50,
    });

    return response.success(res, transactions);
  } catch (error) { next(error); }
}

export async function getIncome(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const transactions = await prisma.transaction.findMany({
      where: { companyId, type: 'INCOME' },
      orderBy: { transactionDate: 'desc' },
      take: 50,
    });

    return response.success(res, transactions);
  } catch (error) { next(error); }
}

export async function createTransaction(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { type, amount, currency, description, category, referenceNo, transactionDate, notes } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        companyId,
        type: type || 'EXPENSE',
        amount: parseFloat(amount),
        currency: currency || 'USD',
        description,
        category,
        referenceNo,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        notes,
      },
    });

    return response.success(res, transaction, 'Transaction recorded', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * PAYMENTS
 * ============================================
 */
export async function getPayments(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const payments = await prisma.payment.findMany({
      where: { companyId },
      orderBy: { paymentDate: 'desc' },
      take: 50,
      include: {
        invoice: { select: { invoiceNo: true } },
        client: { select: { name: true } },
      },
    });

    return response.success(res, payments);
  } catch (error) { next(error); }
}

export async function createPayment(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { invoiceId, clientId, amount, currency, method, paymentDate, reference, notes } = req.body;

    const payment = await prisma.payment.create({
      data: {
        companyId,
        invoiceId,
        clientId,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        method: method || 'BANK_TRANSFER',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        reference,
        notes,
        receivedBy: req.user.id,
      },
      include: {
        invoice: { select: { invoiceNo: true } },
        client: { select: { name: true } },
      },
    });

    // Update invoice status if needed
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (invoice) {
        const totalPaid = await prisma.payment.aggregate({
          where: { companyId, invoiceId, status: 'COMPLETED' },
          _sum: { amount: true },
        });
        const paid = totalPaid._sum.amount || 0;
        const status = paid >= invoice.total ? 'PAID' : 'PARTIALLY_PAID';
        await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
      }
    }

    return response.success(res, payment, 'Payment recorded', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * GST
 * ============================================
 */
export async function getGstRecords(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const records = await prisma.gstRecord.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return response.success(res, records);
  } catch (error) { next(error); }
}

export async function createGstRecord(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { gstType, gstin, invoiceNo, taxableAmount, gstAmount, totalAmount, period } = req.body;

    const record = await prisma.gstRecord.create({
      data: {
        companyId,
        gstType,
        gstin,
        invoiceNo,
        taxableAmount: taxableAmount ? parseFloat(taxableAmount) : null,
        gstAmount: gstAmount ? parseFloat(gstAmount) : null,
        totalAmount: totalAmount ? parseFloat(totalAmount) : null,
        period,
      },
    });

    return response.success(res, record, 'GST record created', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * FINANCE REPORTS
 * ============================================
 */
export async function getFinanceReports(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setDate(1));
    const to = req.query.to ? new Date(req.query.to) : new Date();

    const where = { companyId, transactionDate: { gte: from, lte: to } };

    const [income, expenses, invoices, payments] = await Promise.all([
      prisma.transaction.aggregate({ where: { ...where, type: 'INCOME' }, _sum: { amount: true }, _count: { id: true } }),
      prisma.transaction.aggregate({ where: { ...where, type: 'EXPENSE' }, _sum: { amount: true }, _count: { id: true } }),
      prisma.invoice.aggregate({ where: { companyId, issueDate: { gte: from, lte: to } }, _sum: { total: true }, _count: { id: true } }),
      prisma.payment.aggregate({ where: { companyId, paymentDate: { gte: from, lte: to }, status: 'COMPLETED' }, _sum: { amount: true }, _count: { id: true } }),
    ]);

    const totalIncome = income._sum.amount || 0;
    const totalExpenses = expenses._sum.amount || 0;

    return response.success(res, {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      incomeCount: income._count.id,
      expenseCount: expenses._count.id,
      totalInvoices: invoices._count.id,
      totalInvoiceAmount: invoices._sum.total || 0,
      totalPayments: payments._count.id,
      totalPaymentAmount: payments._sum.amount || 0,
      period: { from, to },
    });
  } catch (error) { next(error); }
}