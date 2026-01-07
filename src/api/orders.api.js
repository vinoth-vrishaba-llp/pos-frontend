//frontend/src/api/orders.api.js
import api from "./axios";

export function createOrder(payload) {
  return api.post("/orders", payload);
}

/**
 * Fetch paginated orders (normal list)
 */
export const fetchOrders = ({ page, limit }) =>
  api.get("/orders", { params: { page, limit } });

/**
 * 🔍 Search orders by order number
 * Note: Baserow doesn't support text search, so we filter by exact order_number
 */
export function searchOrders(query) {
  return api.get("/orders", {
    params: {
      search: query, // Backend will handle the search
      limit: 100,
    },
  });
}

export const markOrderCompleted = (wooOrderId) =>
  api.patch(`/orders/${wooOrderId}/complete`);

export const fetchOrderById = (wooOrderId) =>
  api.get(`/orders/${wooOrderId}`);

/* ==========================================
   FMS INSPECTION ENDPOINTS
========================================== */

/**
 * Get FMS component details for a specific order
 * Returns fabric components, warehouse info, and meters reserved
 */
export const fetchOrderFmsComponents = (wooOrderId) =>
  api.get(`/orders/${wooOrderId}/fms-components`);

/**
 * Check FMS status across recent orders
 * Useful for debugging and verification
 * @param {number} limit - Number of recent orders to check (default: 10)
 */
export const checkFmsStatus = (limit = 10) =>
  api.get("/orders-fms-check/status", { params: { limit } });