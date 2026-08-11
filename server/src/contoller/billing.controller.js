import * as billingService from "../services/billing.service.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Billing Controllers.
 * Handles HTTP requests for subscription/billing features.
 */

// ============================================
// Plans
// ============================================

export async function createPlan(req, res, next) {
  try {
    const plan = await billingService.createPlan(req.body);
    sendSuccess(res, { message: "Plan created successfully", data: plan, statusCode: 201 });
  } catch (err) { next(err); }
}

export async function getAllPlans(req, res, next) {
  try {
    const { isActive } = req.query;
    const plans = await billingService.getAllPlans(isActive !== undefined ? { isActive: isActive === "true" } : {});
    sendSuccess(res, { message: "Plans retrieved", data: plans });
  } catch (err) { next(err); }
}

export async function getPlanById(req, res, next) {
  try {
    const plan = await billingService.getPlanById(req.params.id);
    if (!plan) throw new AppError("Plan not found", 404);
    sendSuccess(res, { message: "Plan retrieved", data: plan });
  } catch (err) { next(err); }
}

export async function updatePlan(req, res, next) {
  try {
    const plan = await billingService.updatePlan(req.params.id, req.body);
    sendSuccess(res, { message: "Plan updated successfully", data: plan });
  } catch (err) { next(err); }
}

export async function deletePlan(req, res, next) {
  try {
    await billingService.deletePlan(req.params.id);
    sendSuccess(res, { message: "Plan deleted successfully" });
  } catch (err) { next(err); }
}

// ============================================
// Subscriptions
// ============================================

export async function createSubscription(req, res, next) {
  try {
    const subscription = await billingService.createSubscription({
      companyId: req.user.companyId,
      userId: req.user.id,
      ...req.body,
    });
    sendSuccess(res, { message: "Subscription created successfully", data: subscription, statusCode: 201 });
  } catch (err) { next(err); }
}

export async function getMySubscription(req, res, next) {
  try {
    const subscription = await billingService.getSubscriptionByCompany(req.user.companyId);
    sendSuccess(res, { message: "Subscription retrieved", data: subscription });
  } catch (err) { next(err); }
}

export async function getSubscriptionById(req, res, next) {
  try {
    const subscription = await billingService.getSubscriptionById(req.params.id, req.user.companyId);
    sendSuccess(res, { message: "Subscription retrieved", data: subscription });
  } catch (err) { next(err); }
}

export async function getAllSubscriptions(req, res, next) {
  try {
    const { status, planId, page = 1, limit = 20 } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (planId) filters.planId = planId;
    const result = await billingService.getAllSubscriptions(filters, { page: parseInt(page), limit: parseInt(limit) });
    sendSuccess(res, { message: "Subscriptions retrieved", ...result });
  } catch (err) { next(err); }
}

export async function upgradeSubscription(req, res, next) {
  try {
    const { newPlanId } = req.body;
    if (!newPlanId) throw new AppError("newPlanId is required", 400);
    const subscription = await billingService.upgradeSubscription(req.params.id, newPlanId, req.user.companyId);
    sendSuccess(res, { message: "Subscription upgraded successfully", data: subscription });
  } catch (err) { next(err); }
}

export async function cancelSubscription(req, res, next) {
  try {
    const subscription = await billingService.cancelSubscription(req.params.id, req.user.companyId, req.body.reason);
    sendSuccess(res, { message: "Subscription canceled successfully", data: subscription });
  } catch (err) { next(err); }
}

export async function reactivateSubscription(req, res, next) {
  try {
    const subscription = await billingService.reactivateSubscription(req.params.id, req.user.companyId);
    sendSuccess(res, { message: "Subscription reactivated successfully", data: subscription });
  } catch (err) { next(err); }
}

// ============================================
// Invoices
// ============================================

export async function getAllInvoices(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await billingService.getAllInvoices(req.user.companyId, status ? { status } : {}, { page: parseInt(page), limit: parseInt(limit) });
    sendSuccess(res, { message: "Invoices retrieved", ...result });
  } catch (err) { next(err); }
}

export async function getInvoiceById(req, res, next) {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id, req.user.companyId);
    sendSuccess(res, { message: "Invoice retrieved", data: invoice });
  } catch (err) { next(err); }
}

// ============================================
// Payments
// ============================================

export async function getAllPayments(req, res, next) {
  try {
    const { status, provider, page = 1, limit = 20 } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (provider) filters.provider = provider;
    const result = await billingService.getAllPayments(req.user.companyId, filters, { page: parseInt(page), limit: parseInt(limit) });
    sendSuccess(res, { message: "Payments retrieved", ...result });
  } catch (err) { next(err); }
}

// ============================================
// Coupons
// ============================================

export async function createCoupon(req, res, next) {
  try {
    const coupon = await billingService.createCoupon(req.body);
    sendSuccess(res, { message: "Coupon created successfully", data: coupon, statusCode: 201 });
  } catch (err) { next(err); }
}

export async function getAllCoupons(req, res, next) {
  try {
    const coupons = await billingService.getAllCoupons();
    sendSuccess(res, { message: "Coupons retrieved", data: coupons });
  } catch (err) { next(err); }
}

export async function updateCoupon(req, res, next) {
  try {
    const coupon = await billingService.updateCoupon(req.params.id, req.body);
    sendSuccess(res, { message: "Coupon updated successfully", data: coupon });
  } catch (err) { next(err); }
}

export async function deleteCoupon(req, res, next) {
  try {
    await billingService.deleteCoupon(req.params.id);
    sendSuccess(res, { message: "Coupon deleted successfully" });
  } catch (err) { next(err); }
}

export async function validateCoupon(req, res, next) {
  try {
    const { code } = req.params;
    const { amount } = req.query;
    if (!amount) throw new AppError("amount query param is required", 400);
    const result = await billingService.validateCoupon(code, parseFloat(amount));
    sendSuccess(res, { message: result.valid ? "Coupon is valid" : "Coupon is invalid", data: result });
  } catch (err) { next(err); }
}

// ============================================
// Payment Providers
// ============================================

export async function createRazorpayOrder(req, res, next) {
  try {
    const { subscriptionId, amount, currency } = req.body;
    const order = await billingService.createRazorpayOrder({ subscriptionId, companyId: req.user.companyId, amount, currency });
    sendSuccess(res, { message: "Razorpay order created", data: order });
  } catch (err) { next(err); }
}

export async function createStripeSession(req, res, next) {
  try {
    const { subscriptionId, amount, currency } = req.body;
    const session = await billingService.createStripeSession({ subscriptionId, companyId: req.user.companyId, amount, currency });
    sendSuccess(res, { message: "Stripe session created", data: session });
  } catch (err) { next(err); }
}

// ============================================
// Renewals & Auto-Activation
// ============================================

export async function checkExpiringSubscriptions(req, res, next) {
  try {
    const results = await billingService.checkExpiringSubscriptions();
    sendSuccess(res, { message: "Expiring subscriptions checked", data: results });
  } catch (err) { next(err); }
}

export async function autoRenewSubscriptions(req, res, next) {
  try {
    const results = await billingService.expireSubscriptions();
    sendSuccess(res, { message: "Auto-renewal process completed", data: results });
  } catch (err) { next(err); }
}

// ============================================
// Subscription Events & Stats
// ============================================

export async function getSubscriptionEvents(req, res, next) {
  try {
    const events = await billingService.getSubscriptionEvents(req.params.id, req.user.companyId);
    sendSuccess(res, { message: "Subscription events retrieved", data: events });
  } catch (err) { next(err); }
}

export async function getBillingStats(req, res, next) {
  try {
    const stats = await billingService.getBillingStats();
    sendSuccess(res, { message: "Billing statistics retrieved", data: stats });
  } catch (err) { next(err); }
}

// ============================================
// Webhooks
// ============================================

export async function handlePaymentWebhook(req, res, next) {
  try {
    const { provider } = req.params;
    const payment = await billingService.handlePaymentWebhook({ provider, payload: req.body });
    sendSuccess(res, { message: "Webhook processed", data: payment });
  } catch (err) { next(err); }
}