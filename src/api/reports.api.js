import api from "./axios";

/**
 * Fetch comprehensive dashboard report
 * @param {Object} params
 * @param {string} params.period - "week" | "month" | "last_month" | "year"
 * @param {string} params.date_min - Start date (YYYY-MM-DD)
 * @param {string} params.date_max - End date (YYYY-MM-DD)
 */
export const fetchDashboardReport = ({ period, date_min, date_max } = {}) => {
  const params = {};
  if (period) params.period = period;
  if (date_min) params.date_min = date_min;
  if (date_max) params.date_max = date_max;

  return api.get("/reports/dashboard", { params }).then((res) => res.data);
};

/**
 * Fetch sales report
 * @param {Object} params
 * @param {string} params.period - "week" | "month" | "last_month" | "year"
 * @param {string} params.date_min - Start date (YYYY-MM-DD)
 * @param {string} params.date_max - End date (YYYY-MM-DD)
 */
export const fetchSalesReport = ({ period, date_min, date_max } = {}) => {
  const params = {};
  if (period) params.period = period;
  if (date_min) params.date_min = date_min;
  if (date_max) params.date_max = date_max;

  return api.get("/reports/sales", { params }).then((res) => res.data);
};

/**
 * Fetch top sellers
 * @param {Object} params
 * @param {string} params.period - "week" | "month" | "last_month" | "year"
 * @param {string} params.date_min - Start date (YYYY-MM-DD)
 * @param {string} params.date_max - End date (YYYY-MM-DD)
 */
export const fetchTopSellers = ({ period, date_min, date_max } = {}) => {
  const params = {};
  if (period) params.period = period;
  if (date_min) params.date_min = date_min;
  if (date_max) params.date_max = date_max;

  return api.get("/reports/top-sellers", { params }).then((res) => res.data);
};

/**
 * Fetch all totals/summary metrics
 */
export const fetchTotals = () =>
  api.get("/reports/totals").then((res) => res.data);