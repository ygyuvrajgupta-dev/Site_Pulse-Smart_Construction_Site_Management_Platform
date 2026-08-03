import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

// In-memory coupon storage (in production, use database)
const coupons = new Map();

/**
 * Create a new coupon
 */
export async function createCoupon(req, res, next) {
  try {
    const { code, discountType, discountValue, minPurchase, maxDiscount, validFrom, validUntil, usageLimit, isActive } = req.body;

    // Validate discount type
    if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
      throw new AppError('Invalid discount type. Must be PERCENTAGE or FIXED', 400);
    }

    // Validate discount value
    if (discountType === 'PERCENTAGE' && (discountValue < 0 || discountValue > 100)) {
      throw new AppError('Percentage discount must be between 0 and 100', 400);
    }

    if (discountType === 'FIXED' && discountValue < 0) {
      throw new AppError('Fixed discount cannot be negative', 400);
    }

    // Check if coupon code already exists
    const existingCoupon = coupons.get(code.toUpperCase());
    if (existingCoupon) {
      throw new AppError('Coupon with this code already exists', 409);
    }

    const coupon = {
      id: Date.now().toString(),
      code: code.toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      usageLimit: usageLimit || 0,
      usageCount: 0,
      isActive: isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    coupons.set(coupon.code, coupon);

    return response.success(res, coupon, 'Coupon created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all coupons
 */
export async function getAllCoupons(req, res, next) {
  try {
    const allCoupons = Array.from(coupons.values()).sort((a, b) => b.createdAt - a.createdAt);

    return response.success(res, allCoupons);
  } catch (error) {
    next(error);
  }
}

/**
 * Get coupon by ID
 */
export async function getCouponById(req, res, next) {
  try {
    const { id } = req.params;

    const coupon = Array.from(coupons.values()).find(c => c.id === id);

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    return response.success(res, coupon);
  } catch (error) {
    next(error);
  }
}

/**
 * Update coupon
 */
export async function updateCoupon(req, res, next) {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minPurchase, maxDiscount, validFrom, validUntil, usageLimit, isActive } = req.body;

    const couponIndex = Array.from(coupons.values()).findIndex(c => c.id === id);

    if (couponIndex === -1) {
      throw new AppError('Coupon not found', 404);
    }

    const existingCoupon = Array.from(coupons.values())[couponIndex];

    // If code is being changed, check if new code already exists
    if (code && code.toUpperCase() !== existingCoupon.code) {
      const codeExists = coupons.has(code.toUpperCase());
      if (codeExists) {
        throw new AppError('Coupon with this code already exists', 409);
      }
    }

    const updatedCoupon = {
      ...existingCoupon,
      code: code ? code.toUpperCase() : existingCoupon.code,
      discountType: discountType || existingCoupon.discountType,
      discountValue: discountValue ? parseFloat(discountValue) : existingCoupon.discountValue,
      minPurchase: minPurchase !== undefined ? parseFloat(minPurchase) : existingCoupon.minPurchase,
      maxDiscount: maxDiscount !== undefined ? parseFloat(maxDiscount) : existingCoupon.maxDiscount,
      validFrom: validFrom ? new Date(validFrom) : existingCoupon.validFrom,
      validUntil: validUntil ? new Date(validUntil) : existingCoupon.validUntil,
      usageLimit: usageLimit !== undefined ? usageLimit : existingCoupon.usageLimit,
      isActive: isActive !== undefined ? isActive : existingCoupon.isActive,
      updatedAt: new Date(),
    };

    // Update in map
    coupons.delete(existingCoupon.code);
    coupons.set(updatedCoupon.code, updatedCoupon);

    return response.success(res, updatedCoupon, 'Coupon updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete coupon
 */
export async function deleteCoupon(req, res, next) {
  try {
    const { id } = req.params;

    const coupon = Array.from(coupons.values()).find(c => c.id === id);

    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    coupons.delete(coupon.code);

    return response.success(res, null, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Validate coupon (helper function)
 */
export async function validateCoupon(code, purchaseAmount) {
  const coupon = coupons.get(code.toUpperCase());

  if (!coupon) {
    return { valid: false, message: 'Coupon not found' };
  }

  if (!coupon.isActive) {
    return { valid: false, message: 'Coupon is not active' };
  }

  const now = new Date();

  if (coupon.validFrom && now < coupon.validFrom) {
    return { valid: false, message: 'Coupon is not yet valid' };
  }

  if (coupon.validUntil && now > coupon.validUntil) {
    return { valid: false, message: 'Coupon has expired' };
  }

  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }

  if (purchaseAmount < coupon.minPurchase) {
    return { valid: false, message: `Minimum purchase amount of ${coupon.minPurchase} required` };
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = (purchaseAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  return {
    valid: true,
    discount,
    finalAmount: purchaseAmount - discount,
    coupon,
  };
}