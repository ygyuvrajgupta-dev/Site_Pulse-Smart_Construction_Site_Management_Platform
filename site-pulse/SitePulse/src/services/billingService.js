import apiClient from './axios';

/**
 * Billing Service.
 * Provides methods to interact with all subscription/billing features.
 */

// ============================================
// Plans
// ============================================

export const createPlan = async (data) => {
  const response = await apiClient.post('/billing/plans', data);
  return response.data;
};

export const getAllPlans = async (params) => {
  const response = await apiClient.get('/billing/plans', { params });
  return response.data;
};

export const getPlanById = async (id) => {
  const response = await apiClient.get(`/billing/plans/${id}`);
  return response.data;
};

export const updatePlan = async (id, data) => {
  const response = await apiClient.patch(`/billing/plans/${id}`, data);
  return response.data;
};

export const deletePlan = async (id) => {
  const response = await apiClient.delete(`/billing/plans/${id}`);
  return response.data;
};

// ============================================
// Subscriptions
// ============================================

export const createSubscription = async (data) => {
  const response = await apiClient.post('/billing/subscriptions', data);
  return response.data;
};

export const getMySubscription = async () => {
  const response = await apiClient.get('/billing/subscriptions/me');
  return response.data;
};

export const getAllSubscriptions = async (params) => {
  const response = await apiClient.get('/billing/subscriptions', { params });
  return response.data;
};

export const getSubscriptionById = async (id) => {
  const response = await apiClient.get(`/billing/subscriptions/${id}`);
  return response.data;
};

export const upgradeSubscription = async (id, newPlanId) => {
  const response = await apiClient.patch(`/billing/subscriptions/${id}/upgrade`, { newPlanId });
  return response.data;
};

export const cancelSubscription = async (id, reason) => {
  const response = await apiClient.patch(`/billing/subscriptions/${id}/cancel`, { reason });
  return response.data;
};

export const reactivateSubscription = async (id) => {
  const response = await apiClient.patch(`/billing/subscriptions/${id}/reactivate`);
  return response.data;
};

export const getSubscriptionEvents = async (id) => {
  const response = await apiClient.get(`/billing/subscriptions/${id}/events`);
  return response.data;
};

// ============================================
// Invoices
// ============================================

export const getAllInvoices = async (params) => {
  const response = await apiClient.get('/billing/invoices', { params });
  return response.data;
};

export const getInvoiceById = async (id) => {
  const response = await apiClient.get(`/billing/invoices/${id}`);
  return response.data;
};

// ============================================
// Payments
// ============================================

export const getAllPayments = async (params) => {
  const response = await apiClient.get('/billing/payments', { params });
  return response.data;
};

// ============================================
// Coupons
// ============================================

export const createCoupon = async (data) => {
  const response = await apiClient.post('/billing/coupons', data);
  return response.data;
};

export const getAllCoupons = async () => {
  const response = await apiClient.get('/billing/coupons');
  return response.data;
};

export const updateCoupon = async (id, data) => {
  const response = await apiClient.patch(`/billing/coupons/${id}`, data);
  return response.data;
};

export const deleteCoupon = async (id) => {
  const response = await apiClient.delete(`/billing/coupons/${id}`);
  return response.data;
};

export const validateCoupon = async (code, amount) => {
  const response = await apiClient.get(`/billing/coupons/validate/${code}`, { params: { amount } });
  return response.data;
};

// ============================================
// Payment Providers
// ============================================

export const createRazorpayOrder = async (data) => {
  const response = await apiClient.post('/billing/razorpay/order', data);
  return response.data;
};

export const createStripeSession = async (data) => {
  const response = await apiClient.post('/billing/stripe/session', data);
  return response.data;
};

// ============================================
// Renewals & Stats
// ============================================

export const checkExpiringSubscriptions = async () => {
  const response = await apiClient.post('/billing/renewals/check');
  return response.data;
};

export const runAutoRenewal = async () => {
  const response = await apiClient.post('/billing/renewals/run');
  return response.data;
};

export const getBillingStats = async () => {
  const response = await apiClient.get('/billing/stats');
  return response.data;
};

export default {
  createPlan, getAllPlans, getPlanById, updatePlan, deletePlan,
  createSubscription, getMySubscription, getAllSubscriptions, getSubscriptionById,
  upgradeSubscription, cancelSubscription, reactivateSubscription, getSubscriptionEvents,
  getAllInvoices, getInvoiceById,
  getAllPayments,
  createCoupon, getAllCoupons, updateCoupon, deleteCoupon, validateCoupon,
  createRazorpayOrder, createStripeSession,
  checkExpiringSubscriptions, runAutoRenewal, getBillingStats,
};