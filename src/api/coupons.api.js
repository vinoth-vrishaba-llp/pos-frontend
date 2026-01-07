// src/api/coupons.api.js
import api from "./axios";

/**
 * Fetch all coupons
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.per_page - Items per page
 * @param {string} params.search - Search query
 */
export function fetchCoupons({ page = 1, per_page = 100, search } = {}) {
  return api.get("/coupons", {
    params: { page, per_page, search },
  });
}

/**
 * Fetch single coupon by ID
 * @param {number} id - Coupon ID
 */
export function fetchCouponById(id) {
  return api.get(`/coupons/${id}`);
}

/**
 * Create new coupon
 * @param {Object} payload - Coupon data
 * @param {string} payload.code - Coupon code (required)
 * @param {string} payload.discount_type - "percent", "fixed_cart", or "fixed_product"
 * @param {string|number} payload.amount - Discount amount
 * @param {string} payload.description - Coupon description
 * @param {boolean} payload.individual_use - Allow only individual use
 * @param {boolean} payload.exclude_sale_items - Exclude sale items
 * @param {string|number} payload.minimum_amount - Minimum order amount
 */
export function createCoupon(payload) {
  return api.post("/coupons", payload);
}

/**
 * Update existing coupon
 * @param {number} id - Coupon ID
 * @param {Object} payload - Updated coupon data
 */
export function updateCoupon(id, payload) {
  return api.put(`/coupons/${id}`, payload);
}

/**
 * Delete coupon
 * @param {number} id - Coupon ID
 * @param {boolean} force - Force delete (default: true)
 */
export function deleteCoupon(id, force = true) {
  return api.delete(`/coupons/${id}`, {
    params: { force },
  });
}