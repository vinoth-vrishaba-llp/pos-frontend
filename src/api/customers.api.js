import api from "./axios";

/**
 * Fetch customers with pagination
 */
export const fetchCustomers = ({ page = 1, limit = 100 }) =>
  api.get("/customers", { params: { page, limit } }).then((res) => res.data);

/**
 * Fetch single customer by WooCommerce ID
 */
export const fetchCustomerById = (wooCustomerId) =>
  api.get(`/customers/${wooCustomerId}`).then((res) => res.data);

/**
 * Create new customer
 */
export const createCustomer = (customerData) =>
  api.post("/customers", customerData).then((res) => res.data);

/**
 * Update existing customer
 */
export const updateCustomer = (wooCustomerId, customerData) =>
  api.patch(`/customers/${wooCustomerId}`, customerData).then((res) => res.data);

/**
 * Fetch orders for a specific customer
 */
export const fetchCustomerOrders = (wooCustomerId) =>
  api.get(`/customers/${wooCustomerId}/orders`).then((res) => res.data);