// src/hooks/useVariationsCache.js
import { useRef, useCallback } from "react";
import { fetchProductVariations } from "@/api/products.api";

/**
 * Hook to cache product variations in memory
 * Prevents redundant API calls when opening same product multiple times
 * 
 * Usage:
 * const { getVariations, preload, invalidate } = useVariationsCache();
 * 
 * // Get variations (from cache or API)
 * const variations = await getVariations(productId);
 * 
 * // Preload in background (on hover)
 * preload(productId);
 * 
 * // Clear cache
 * invalidate(productId);
 */
export function useVariationsCache() {
  // Cache structure: Map<productId, { variations: [...], timestamp: number }>
  const cacheRef = useRef(new Map());
  
  // Cache TTL: 5 minutes (300000ms)
  const CACHE_TTL = 5 * 60 * 1000;

  /**
   * Get variations for a product (from cache or API)
   * @param {number} productId - Product ID
   * @returns {Promise<Array>} - Array of variations
   */
  const getVariations = useCallback(async (productId) => {
    if (!productId) return [];

    const now = Date.now();
    const cached = cacheRef.current.get(productId);

    // Check if cache is valid
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log(`✅ Cache HIT for product ${productId} (${cached.variations.length} variations)`);
      return cached.variations;
    }

    // Cache miss or expired - fetch from API
    console.log(`📡 Cache MISS for product ${productId}, fetching...`);
    
    try {
      const res = await fetchProductVariations(productId);
      const variations = res?.data || [];

      // Store in cache
      cacheRef.current.set(productId, {
        variations,
        timestamp: now,
      });

      console.log(`✅ Cached ${variations.length} variations for product ${productId}`);
      return variations;
    } catch (error) {
      console.error(`❌ Failed to fetch variations for product ${productId}:`, error);
      return [];
    }
  }, []);

  /**
   * Invalidate cache for a specific product or all products
   * @param {number|null} productId - Product ID to invalidate, or null for all
   */
  const invalidate = useCallback((productId = null) => {
    if (productId) {
      cacheRef.current.delete(productId);
      console.log(`🗑️ Cache invalidated for product ${productId}`);
    } else {
      cacheRef.current.clear();
      console.log(`🗑️ Cache cleared (all products)`);
    }
  }, []);

  /**
   * Preload variations for a product (background fetch)
   * Used for hover preloading - doesn't block UI
   * @param {number} productId - Product ID to preload
   */
  const preload = useCallback(async (productId) => {
    if (!productId) return;
    
    // Check if already cached and fresh
    const now = Date.now();
    const cached = cacheRef.current.get(productId);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return; // Already cached and fresh, skip
    }

    // Preload in background
    console.log(`🔄 Preloading variations for product ${productId}...`);
    await getVariations(productId);
  }, [getVariations]);

  return {
    getVariations,
    invalidate,
    preload,
  };
}