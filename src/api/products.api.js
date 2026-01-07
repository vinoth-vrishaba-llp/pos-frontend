import api from "./axios";

/**
 * Fetch paginated products (normal catalog)
 */
export function fetchProducts({ page = 1, limit = 20, category }) {
  return api.get("/products", {
    params: { page, limit, category },
  });
}

/**
 * 🔍 NEW: Search products across all pages
 * This will search the entire catalog, not just loaded products
 */
export function searchProducts(query, category) {
  return api.get("/products", {
    params: {
      search: query,
      per_page: 100, // Get more results for search
      category,
    },
  });
}

/**
 * 🔍 Lookup product by SKU / barcode
 * Used by POS scanner
 */
export function lookupBySku(code) {
  return api.get("/products", {
    params: {
      sku: code,
      limit: 5,
    },
  });
}

/**
 * Fetch single product by ID
 */
export function fetchProductById(id) {
  return api.get(`/products/${id}`);
}

export function fetchProductVariations(id) {
  return api.get(`/products/${id}/variations`);
}