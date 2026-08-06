import { Router } from "express";
import {
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
  getExpenses,
  getIncome,
  createTransaction,
  getPayments,
  createPayment,
  getGstRecords,
  createGstRecord,
  getFinanceReports,
} from "../services/finance.service.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * Finance Module routes.
 * Covers: Invoices, Expenses, Income, Payments, GST, Reports
 */
const router = Router();

router.use(protect);

// Reports
router.get("/reports", getFinanceReports);

// Invoices
router.get("/invoices", getInvoices);
router.post("/invoices", createInvoice);
router.put("/invoices/:id/status", updateInvoiceStatus);

// Expenses & Income
router.get("/expenses", getExpenses);
router.get("/income", getIncome);
router.post("/transactions", createTransaction);

// Payments
router.get("/payments", getPayments);
router.post("/payments", createPayment);

// GST
router.get("/gst", getGstRecords);
router.post("/gst", createGstRecord);

export default router;