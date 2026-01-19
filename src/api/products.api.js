// src/api/products.api.js
import api from "./axios";

// ✅ Configure request timeouts
const API_TIMEOUT = 5000; // 5 seconds max

/**
 * Fetch single product by ID
 * ✅ With timeout to fail fast
 */
export function fetchProductById(id) {
  return api.get(`/products/${id}`, {
    timeout: API_TIMEOUT,
  });
}

/**
 * Fetch product variations
 * ✅ With timeout to fail fast
 */
export function fetchProductVariations(id) {
  return api.get(`/products/${id}/variations`, {
    timeout: API_TIMEOUT,
  });
}

/**
 * Fetch paginated products (normal catalog)
 */
export function fetchProducts({ page = 1, limit = 20, category }) {
  return api.get("/products", {
    params: { page, limit, category },
    timeout: API_TIMEOUT,
  });
}

/**
 * 🔍 Search products across all pages
 */
export function searchProducts(query, category) {
  return api.get("/products", {
    params: {
      search: query.trim(),
      per_page: 100,
      category,
    },
    timeout: API_TIMEOUT,
  });
}

/**
 * 🔍 Lookup product by SKU / barcode
 */
export function lookupBySku(code) {
  return api.get("/products", {
    params: {
      sku: code.trim(),
      limit: 20,
    },
    timeout: API_TIMEOUT,
  });
}