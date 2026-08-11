import prisma from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import { sendSuccess } from "../utils/response.js";

/**
 * Billing Service.
 * Handles Subscriptions, Plans, Invoices, Coupons, Payments (Razorpay/Stripe), Renewals, and Auto-Activation.
 */

// ============================================
// Plans
// ============================================

export async function createPlan({ name, slug, description, price, currency, interval, trialDays, features, isActive, sortOrder }) {
  const existing = await prisma.plan.findUnique({ where: { slug } });
  if (existing) throw new AppError("Plan with this slug already exists", 409);
  return prisma.plan.create({
    data: { name, slug, description, price: parseFloat(price), currency: currency || "USD", interval: interval || "MONTHLY", trialDays: trialDays || 14, features: features || {}, isActive: isActive ?? true, sortOrder: sortOrder || 0 },
  });
}

export async function getAllPlans(filter = {}) {
  return prisma.plan.findMany({ where: filter, orderBy: { sortOrder: "asc" } });
}

export async function getPlanById(id) {
  return prisma.plan.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true } } } });
}

export async function updatePlan(id, data) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new AppError("Plan not found", 404);
  return prisma.plan.update({ where: { id }, data });
}

export async function deletePlan(id) {
  const plan = await prisma.plan.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true } } } });
  if (!plan) throw new AppError("Plan not found", 404);
  if (plan._count.subscriptions > 0) throw new AppError("Cannot delete plan with active subscriptions", 400);
  return prisma.plan.delete({ where: { id } });
}

// ============================================
// Subscriptions
// ============================================

export async function createSubscription({ companyId, planId, userId, status = "TRIALING", couponCode }) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError("Plan not found", 404);

  let coupon;
  let discountAmount = 0;
  const amount = parseFloat(plan.price);

  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, amount);
    if (!couponResult.valid) throw new AppError(couponResult.message, 400);
    coupon = couponResult.coupon;
    discountAmount = couponResult.discount;
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
  }

  const trialEndsAt = status === "TRIALING" ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null;
  const endDate = status === "TRIALING" ? trialEndsAt : calculateEndDate(new Date(), plan.interval);

  const subscription = await prisma.subscription.create({
    data: {
      companyId,
      planId,
      userId,
      couponId: coupon?.id,
      status,
      startDate: new Date(),
      endDate,
      trialEndsAt,
      autoRenew: true,
      provider: "MANUAL",
    },
    include: { plan: true, company: true },
  });

  // Auto-activate if not trialing
  if (status === "ACTIVE") {
    await prisma.company.update({ where: { id: companyId }, data: { isActive: true } });
    await logSubscriptionEvent(subscription.id, companyId, "ACTIVATED", { plan: plan.name });
  } else {
    await logSubscriptionEvent(subscription.id, companyId, "CREATED", { plan: plan.name });
    if (trialEndsAt) await logSubscriptionEvent(subscription.id, companyId, "TRIAL_STARTED", { trialEndsAt });
  }

  // Create initial invoice
  if (status === "ACTIVE") {
    await createInvoice({ subscriptionId: subscription.id, companyId, amount, discountAmount, description: `${plan.name} plan (${plan.interval})` });
  }

  return subscription;
}

export async function getSubscriptionByCompany(companyId) {
  return prisma.subscription.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { plan: true, coupons: true, company: true, payments: true, invoices: true },
  });
}

export async function getSubscriptionById(id, companyId) {
  const sub = await prisma.subscription.findFirst({ where: { id, ...(companyId ? { companyId } : {}) }, include: { plan: true, company: true, payments: true, invoices: { include: { payments: true } }, events: true } });
  if (!sub) throw new AppError("Subscription not found", 404);
  return sub;
}

export async function getAllSubscriptions(filters = {}, pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.subscription.findMany({ where: filters, skip, take: limit, orderBy: { createdAt: "desc" }, include: { plan: true, company: { select: { id: true, name: true, slug: true } } } }),
    prisma.subscription.count({ where: filters }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function upgradeSubscription(subscriptionId, newPlanId, companyId) {
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, companyId } });
  if (!sub) throw new AppError("Subscription not found", 404);
  const newPlan = await prisma.plan.findUnique({ where: { id: newPlanId } });
  if (!newPlan) throw new AppError("New plan not found", 404);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { planId: newPlanId, endDate: calculateEndDate(new Date(), newPlan.interval) },
  });

  await logSubscriptionEvent(subscriptionId, companyId, sub.planId === newPlanId ? "RENEWED" : "UPGRADED", { fromPlan: sub.planId, toPlan: newPlanId });
  return updated;
}

export async function cancelSubscription(subscriptionId, companyId, reason) {
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, companyId } });
  if (!sub) throw new AppError("Subscription not found", 404);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "CANCELED", canceledAt: new Date(), autoRenew: false },
  });

  await logSubscriptionEvent(subscriptionId, companyId, "CANCELED", { reason });
  return updated;
}

export async function reactivateSubscription(subscriptionId, companyId) {
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, companyId, status: "CANCELED" } });
  if (!sub) throw new AppError("Subscription not found or not canceled", 404);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "ACTIVE", autoRenew: true, canceledAt: null },
  });

  await prisma.company.update({ where: { id: companyId }, data: { isActive: true } });
  await logSubscriptionEvent(subscriptionId, companyId, "ACTIVATED", {});
  return updated;
}

// ============================================
// Invoices
// ============================================

export async function createInvoice({ subscriptionId, companyId, amount, discountAmount = 0, taxAmount = 0, description, status = "PENDING" }) {
  const totalAmount = parseFloat(amount) - parseFloat(discountAmount) + parseFloat(taxAmount);
  const count = await prisma.invoice.count() + 1;
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(count).padStart(5, "0")}`;

  return prisma.invoice.create({
    data: {
      subscriptionId,
      companyId,
      invoiceNo,
      status,
      amount: parseFloat(amount),
      taxAmount: parseFloat(taxAmount),
      discountAmount: parseFloat(discountAmount),
      totalAmount,
      description,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function getAllInvoices(companyId, filters = {}, pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  const where = { ...(companyId ? { companyId } : {}), ...filters };
  const [data, total] = await Promise.all([
    prisma.invoice.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { company: { select: { id: true, name: true } }, payments: true } }),
    prisma.invoice.count({ where }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getInvoiceById(invoiceId, companyId) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, ...(companyId ? { companyId } : {}) }, include: { subscription: { include: { plan: true } }, payments: true, company: true } });
  if (!invoice) throw new AppError("Invoice not found", 404);
  return invoice;
}

export async function markInvoicePaid(invoiceId, paymentId) {
  return prisma.invoice.update({ where: { id: invoiceId }, data: { status: "PAID", paidAt: new Date() } });
}

export async function updateInvoiceStatus(id, status) {
  return prisma.invoice.update({ where: { id }, data: { status } });
}

// ============================================
// Payments
// ============================================

export async function recordPayment({ subscriptionId, invoiceId, companyId, provider = "MANUAL", providerPaymentId, amount, currency, status = "COMPLETED", paymentMethod, transactionId, metadata }) {
  const payment = await prisma.payment.create({
    data: { subscriptionId, invoiceId, companyId, provider, providerPaymentId, amount: parseFloat(amount), currency: currency || "USD", status, paymentMethod, transactionId, metadata, paidAt: status === "COMPLETED" ? new Date() : null },
  });

  if (status === "COMPLETED") {
    if (invoiceId) await markInvoicePaid(invoiceId, payment.id);
    // Auto-activate subscription
    await prisma.subscription.update({ where: { id: subscriptionId }, data: { status: "ACTIVE", provider } });
    await prisma.company.update({ where: { id: companyId }, data: { isActive: true } });
    await logSubscriptionEvent(subscriptionId, companyId, "PAYMENT_SUCCESS", { provider, amount });
  } else if (status === "FAILED") {
    await logSubscriptionEvent(subscriptionId, companyId, "PAYMENT_FAILED", { provider, amount });
  }

  return payment;
}

export async function getAllPayments(companyId, filters = {}, pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  const where = { ...(companyId ? { companyId } : {}), ...filters };
  const [data, total] = await Promise.all([
    prisma.payment.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { subscription: { include: { plan: true } }, invoice: true, company: { select: { id: true, name: true } } } }),
    prisma.payment.count({ where }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// ============================================
// Coupons
// ============================================

export async function createCoupon({ code, type, value, minPurchase, maxDiscount, validFrom, validUntil, usageLimit, isActive = true, description }) {
  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) throw new AppError("Coupon with this code already exists", 409);

  if (type === "PERCENTAGE" && (value < 0 || value > 100)) throw new AppError("Percentage must be between 0 and 100", 400);

  return prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type,
      value: parseFloat(value),
      minPurchase: minPurchase ? parseFloat(minPurchase) : null,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      usageLimit: usageLimit || null,
      status: isActive ? "ACTIVE" : "INACTIVE",
      description,
    },
  });
}

export async function getAllCoupons(filters = {}) {
  return prisma.coupon.findMany({ where: filters, orderBy: { createdAt: "desc" } });
}

export async function updateCoupon(id, data) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new AppError("Coupon not found", 404);
  return prisma.coupon.update({ where: { id }, data });
}

export async function deleteCoupon(id) {
  const coupon = await prisma.coupon.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true } } } });
  if (!coupon) throw new AppError("Coupon not found", 404);
  if (coupon._count.subscriptions > 0) throw new AppError("Cannot delete coupon already used in subscriptions", 400);
  return prisma.coupon.delete({ where: { id } });
}

export async function validateCoupon(code, amount) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) return { valid: false, message: "Coupon not found" };
  if (coupon.status !== "ACTIVE") return { valid: false, message: "Coupon is not active" };
  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) return { valid: false, message: "Coupon is not yet valid" };
  if (coupon.validUntil && now > coupon.validUntil) return { valid: false, message: "Coupon has expired" };
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { valid: false, message: "Coupon usage limit reached" };
  if (coupon.minPurchase && amount < coupon.minPurchase) return { valid: false, message: `Minimum purchase of ${coupon.minPurchase} required` };

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = (amount * parseFloat(coupon.value)) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = parseFloat(coupon.maxDiscount);
  } else {
    discount = parseFloat(coupon.value);
  }

  return { valid: true, discount, finalAmount: amount - discount, coupon };
}

// ============================================
// Payment Providers
// ============================================

export async function createRazorpayOrder({ subscriptionId, companyId, amount, currency = "INR" }) {
  // Placeholder - integrate with Razorpay SDK
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, companyId } });
  if (!sub) throw new AppError("Subscription not found", 404);
  const orderId = `rzp_${Date.now()}`;
  return { orderId, amount, currency, subscriptionId };
}

export async function createStripeSession({ subscriptionId, companyId, amount, currency = "USD" }) {
  // Placeholder - integrate with Stripe SDK
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, companyId } });
  if (!sub) throw new AppError("Subscription not found", 404);
  const sessionId = `cs_${Date.now()}`;
  return { sessionId, amount, currency, subscriptionId };
}

export async function handlePaymentWebhook({ provider, payload }) {
  // Simplified webhook handling. Extend with actual provider verification.
  const { subscriptionId, paymentId, status, amount } = payload || {};
  if (status === "completed" || status === "succeeded") {
    const payment = await recordPayment({
      subscriptionId,
      companyId: (await prisma.subscription.findUnique({ where: { id: subscriptionId } }))?.companyId,
      provider,
      providerPaymentId: paymentId,
      amount,
      status: "COMPLETED",
    });
    return payment;
  }
  return null;
}

// ============================================
// Renewals & Auto-Activation
// ============================================

export async function checkExpiringSubscriptions() {
  const now = new Date();
  const expiring = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      autoRenew: true,
      endDate: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }, // Expiring within 24h
    },
    include: { plan: true, company: true },
  });

  const results = [];
  for (const sub of expiring) {
    if (sub.endDate <= now) {
      // Expired - attempt renewal
      const renewed = await autoRenewSubscription(sub);
      results.push({ subscriptionId: sub.id, renewed });
    }
  }
  return results;
}

export async function autoRenewSubscription(subscription) {
  const plan = subscription.plan || (await prisma.plan.findUnique({ where: { id: subscription.planId } }));
  const amount = parseFloat(plan.price);

  // If subscription has a payment provider configured, try to charge
  if (subscription.provider !== "MANUAL") {
    try {
      const payment = await recordPayment({
        subscriptionId: subscription.id,
        companyId: subscription.companyId,
        provider: subscription.provider,
        amount,
      });

      const newEndDate = calculateEndDate(new Date(), plan.interval);
      await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", endDate: newEndDate } });
      await logSubscriptionEvent(subscription.id, subscription.companyId, "RENEWED", { amount });

      // Auto-activate company
      await prisma.company.update({ where: { id: subscription.companyId }, data: { isActive: true } });
      return { success: true, subscriptionId: subscription.id, newEndDate };
    } catch (error) {
      await logSubscriptionEvent(subscription.id, subscription.companyId, "PAYMENT_FAILED", { error: error.message });
      await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "PAST_DUE" } });
      return { success: false, subscriptionId: subscription.id, error: error.message };
    }
  }

  // Manual management - mark for review or extend if autoRenew enabled
  const newEndDate = calculateEndDate(new Date(), plan.interval);
  await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", endDate: newEndDate } });
  await prisma.company.update({ where: { id: subscription.companyId }, data: { isActive: true } });
  await logSubscriptionEvent(subscription.id, subscription.companyId, "RENEWED", { amount });
  return { success: true, subscriptionId: subscription.id, newEndDate };
}

export async function expireSubscriptions() {
  const now = new Date();
  const expired = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PAST_DUE", "TRIALING"] },
      endDate: { lte: now },
    },
  });

  const results = [];
  for (const sub of expired) {
    if (sub.autoRenew) {
      const renewed = await autoRenewSubscription(sub);
      results.push({ subscriptionId: sub.id, action: "RENEWED", ...renewed });
    } else {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } });
      await prisma.company.update({ where: { id: sub.companyId }, data: { isActive: false } });
      await logSubscriptionEvent(sub.id, sub.companyId, "EXPIRED", {});
      results.push({ subscriptionId: sub.id, action: "EXPIRED" });
    }
  }
  return results;
}

// ============================================
// Subscription Events
// ============================================

async function logSubscriptionEvent(subscriptionId, companyId, type, data = {}) {
  return prisma.subscriptionEvent.create({ data: { subscriptionId, companyId, type, data } });
}

export async function getSubscriptionEvents(subscriptionId, companyId) {
  return prisma.subscriptionEvent.findMany({ where: { subscriptionId, ...(companyId ? { companyId } : {}) }, orderBy: { createdAt: "desc" } });
}

// ============================================
// Helpers
// ============================================

export function calculateEndDate(startDate, interval) {
  const date = new Date(startDate);
  switch (interval) {
    case "MONTHLY": date.setMonth(date.getMonth() + 1); break;
    case "QUARTERLY": date.setMonth(date.getMonth() + 3); break;
    case "SEMI_ANNUAL": date.setMonth(date.getMonth() + 6); break;
    case "ANNUAL": date.setFullYear(date.getFullYear() + 1); break;
    default: date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export async function getBillingStats() {
  const [totalCompanies, activeSubscriptions, trialSubscriptions, canceledSubscriptions, totalRevenue, pendingInvoices] = await Promise.all([
    prisma.company.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.subscription.count({ where: { status: "CANCELED" } }),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.invoice.count({ where: { status: { in: ["SENT", "OVERDUE"] } } }),
  ]);

  return {
    totalCompanies,
    activeSubscriptions,
    trialSubscriptions,
    canceledSubscriptions,
    totalRevenue: totalRevenue._sum.amount || 0,
    pendingInvoices,
  };
}

export default {
  // Plans
  createPlan, getAllPlans, getPlanById, updatePlan, deletePlan,
  // Subscriptions
  createSubscription, getSubscriptionByCompany, getSubscriptionById, getAllSubscriptions,
  upgradeSubscription, cancelSubscription, reactivateSubscription,
  // Invoices
  createInvoice, getAllInvoices, getInvoiceById, markInvoicePaid, updateInvoiceStatus,
  // Payments
  recordPayment, getAllPayments,
  // Coupons
  createCoupon, getAllCoupons, updateCoupon, deleteCoupon, validateCoupon,
  // Providers
  createRazorpayOrder, createStripeSession, handlePaymentWebhook,
  // Renewals & Stats
  checkExpiringSubscriptions, autoRenewSubscription, expireSubscriptions, getSubscriptionEvents, getBillingStats,
  // Helpers
  calculateEndDate,
};