import { Router } from "express";
import {
  // Plans
  createPlan, getAllPlans, getPlanById, updatePlan, deletePlan,
  // Subscriptions
  createSubscription, getMySubscription, getSubscriptionById, getAllSubscriptions,
  upgradeSubscription, cancelSubscription, reactivateSubscription,
  // Invoices
  getAllInvoices, getInvoiceById,
  // Payments
  getAllPayments,
  // Coupons
  createCoupon, getAllCoupons, updateCoupon, deleteCoupon, validateCoupon,
  // Providers
  createRazorpayOrder, createStripeSession,
  // Renewals
  checkExpiringSubscriptions, autoRenewSubscriptions,
  // Events & Stats
  getSubscriptionEvents, getBillingStats,
  // Webhooks
  handlePaymentWebhook,
} from "../contoller/billing.controller.js";

const router = Router();

/**
 * Billing Routes.
 *
 * Plans:
 *   POST   /api/v1/billing/plans              - Create plan
 *   GET    /api/v1/billing/plans              - List plans
 *   GET    /api/v1/billing/plans/:id          - Get plan
 *   PATCH  /api/v1/billing/plans/:id          - Update plan
 *   DELETE /api/v1/billing/plans/:id          - Delete plan
 *
 * Subscriptions:
 *   POST   /api/v1/billing/subscriptions      - Create subscription
 *   GET    /api/v1/billing/subscriptions/me   - Get my subscription
 *   GET    /api/v1/billing/subscriptions      - List subscriptions
 *   GET    /api/v1/billing/subscriptions/:id  - Get subscription
 *   PATCH  /api/v1/billing/subscriptions/:id/upgrade   - Upgrade plan
 *   PATCH  /api/v1/billing/subscriptions/:id/cancel    - Cancel
 *   PATCH  /api/v1/billing/subscriptions/:id/reactivate - Reactivate
 *   GET    /api/v1/billing/subscriptions/:id/events    - Events
 *
 * Invoices:
 *   GET    /api/v1/billing/invoices           - List invoices
 *   GET    /api/v1/billing/invoices/:id       - Get invoice
 *
 * Payments:
 *   GET    /api/v1/billing/payments           - List payments
 *
 * Coupons:
 *   POST   /api/v1/billing/coupons            - Create coupon
 *   GET    /api/v1/billing/coupons            - List coupons
 *   PATCH  /api/v1/billing/coupons/:id        - Update coupon
 *   DELETE /api/v1/billing/coupons/:id        - Delete coupon
 *   GET    /api/v1/billing/coupons/validate/:code - Validate coupon
 *
 * Payment Providers:
 *   POST   /api/v1/billing/razorpay/order     - Create Razorpay order
 *   POST   /api/v1/billing/stripe/session     - Create Stripe session
 *
 * Renewals:
 *   POST   /api/v1/billing/renewals/check     - Check expiring subs
 *   POST   /api/v1/billing/renewals/run       - Run auto-renewal
 *
 * Stats:
 *   GET    /api/v1/billing/stats              - Billing statistics
 *
 * Webhooks (public):
 *   POST   /api/v1/billing/webhooks/:provider - Payment webhook
 */

// Plans
router.post("/plans", createPlan);
router.get("/plans", getAllPlans);
router.get("/plans/:id", getPlanById);
router.patch("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

// Subscriptions
router.post("/subscriptions", createSubscription);
router.get("/subscriptions/me", getMySubscription);
router.get("/subscriptions", getAllSubscriptions);
router.get("/subscriptions/:id", getSubscriptionById);
router.patch("/subscriptions/:id/upgrade", upgradeSubscription);
router.patch("/subscriptions/:id/cancel", cancelSubscription);
router.patch("/subscriptions/:id/reactivate", reactivateSubscription);
router.get("/subscriptions/:id/events", getSubscriptionEvents);

// Invoices
router.get("/invoices", getAllInvoices);
router.get("/invoices/:id", getInvoiceById);

// Payments
router.get("/payments", getAllPayments);

// Coupons
router.post("/coupons", createCoupon);
router.get("/coupons", getAllCoupons);
router.patch("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.get("/coupons/validate/:code", validateCoupon);

// Payment Providers
router.post("/razorpay/order", createRazorpayOrder);
router.post("/stripe/session", createStripeSession);

// Renewals
router.post("/renewals/check", checkExpiringSubscriptions);
router.post("/renewals/run", autoRenewSubscriptions);

// Stats
router.get("/stats", getBillingStats);

// Webhooks (public - no auth)
router.post("/webhooks/:provider", handlePaymentWebhook);

export default router;