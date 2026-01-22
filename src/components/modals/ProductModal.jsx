// src/components/modals/ProductModal.jsx
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  fetchProductById,
  fetchProductVariations,
} from "@/api/products.api";
import ProgressiveImage from "@/components/ui/ProgressiveImage";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

export default function ProductModal({
  isOpen,
  product,
  selectedSize,
  setSelectedSize,
  cart,
  onClose,
  onAddToCart,
  isChangingSize = false,
}) {
  const [fullProduct, setFullProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const modalRef = useRef(null);
  const { startTimer } = usePerformanceMonitor();

  /* ============================
     FETCH PRODUCT DATA - OPTIMIZED
     ✅ Progressive loading: Show modal immediately with available data
     ✅ Parallel API calls with timeout handling
     ✅ Cache support for pre-loaded variations
  ============================ */
  useEffect(() => {
    if (!isOpen || !product?.id) return;

    const timer = startTimer(`Product ${product.id} load`);

    // ✅ STEP 1: Show modal immediately with grid data (no waiting!)
    setFullProduct(product); // Use product data from grid immediately
    setSelectedSize(null);

    // ✅ STEP 2: Check if variations are pre-loaded (from cache)
    if (product.variationsLoaded && product.variations) {
      setVariations(product.variations);
      timer.end(); // ✅ End timer for cached case

      // ✅ IMPORTANT: Return early - don't fetch again!
      return;
    }

    // ✅ STEP 3: For variable products WITHOUT cached data, fetch variations in background
    if (product.type === "variable") {
      setIsLoadingVariations(true);

      // Add timeout wrapper to fail fast on slow API
      const fetchWithTimeout = (promise, timeoutMs = 3000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API timeout after ' + timeoutMs + 'ms')), timeoutMs)
          )
        ]);
      };

      // Fetch variations with 3-second timeout
      fetchWithTimeout(fetchProductVariations(product.id), 3000)
        .then(vRes => {
          const loadedVariations = vRes?.data || [];
          setVariations(loadedVariations);
        })
        .catch(error => {
          // Continue with empty variations - user can still see product
          setVariations([]);
        })
        .finally(() => {
          setIsLoadingVariations(false);

          // ✅ End performance timer
          timer.end();
        });
    } else {
      // Simple product (no variations)
      timer.end(); // ✅ End timer for simple product
    }
  }, [isOpen, product?.id, product?.type, product?.variationsLoaded]); // ✅ Only depend on essential properties

  /* ============================
     ESC KEY CLOSE
  ============================ */
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  /* ============================
     OUTSIDE CLICK CLOSE
  ============================ */
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // ✅ Early return if modal not open
  if (!isOpen) return null;

  // ✅ Show loading skeleton only if no product data at all
  // This should rarely happen since we use grid data immediately
  if (!fullProduct) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onMouseDown={handleBackdropClick}
      >
        <div
          ref={modalRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-white rounded-xl w-full max-w-sm mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Loading skeleton */}
          <div className="relative h-56 bg-gray-100 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
            <button
              onClick={onClose}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ✅ All existing logic preserved
  const isVariable = fullProduct.type === "variable";

  const getTotalProductStock = () => {
    return fullProduct.stock_quantity || 0;
  };

  const getTotalInCart = () => {
    return cart
      .filter(item => item.product.id === fullProduct.id)
      .reduce((sum, item) => sum + item.qty, 0);
  };

  const totalRemaining = getTotalProductStock() - getTotalInCart();

  const canAddToCart = () => {
    if (!isVariable) return totalRemaining > 0;
    return selectedSize && totalRemaining > 0;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={handleBackdropClick}
    >
      {/* MODAL */}
      <div
        ref={modalRef}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-sm mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* IMAGE - ✅ Progressive loading */}
        <div className="relative h-56 bg-gray-100 flex items-center justify-center">
          <ProgressiveImage
            src={fullProduct.image}
            alt={fullProduct.name}
            className="w-full h-full object-contain"
          />
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold leading-tight">
              {fullProduct.name}
            </h3>
            <p className="text-lg font-bold mt-1">
              ₹{Number(fullProduct.price).toLocaleString()}
            </p>
          </div>

          {/* STOCK INFO */}
          <div className="text-sm bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Stock</span>
              <span
                className={`font-semibold ${
                  totalRemaining > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {totalRemaining} left
              </span>
            </div>
            {getTotalInCart() > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {getTotalInCart()} already in cart
              </div>
            )}
          </div>

          {/* SIZE SELECTOR */}
          {isVariable && (
            <div>
              <p className="text-xs font-semibold mb-2">Select Size</p>
              
              {/* ✅ Show loading state for variations */}
              {isLoadingVariations ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                      key={i}
                      className="h-10 bg-gray-200 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : variations.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {variations.map(v => {
                    const isOutOfStock = totalRemaining === 0;
                    const isSelected = selectedSize?.id === v.id;

                    return (
                      <button
                        key={v.id}
                        disabled={isOutOfStock}
                        onClick={() => !isOutOfStock && setSelectedSize(v)}
                        className={`border rounded px-2 py-2 text-xs font-medium transition-all
                          ${
                            isSelected
                              ? "bg-black text-white border-black"
                              : isOutOfStock
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white border-gray-300 hover:border-gray-400"
                          }
                        `}
                      >
                        {v.attributes?.Size || v.size}
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* ✅ Show message if variations failed to load */
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
                  Sizes temporarily unavailable. Please try again.
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold">
                  ℹ
                </span>
                Stock is shared across all sizes
              </p>
            </div>
          )}
        </div>

        {/* STICKY FOOTER */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            disabled={!canAddToCart() || isLoadingVariations}
            onClick={() =>
              onAddToCart({
                product: {
                  id: fullProduct.id,
                  name: fullProduct.name,
                  price: Number(fullProduct.price),
                  image: fullProduct.image,
                  type: fullProduct.type,
                  stock_quantity: fullProduct.stock_quantity,
                  fms_components: fullProduct.fms_components || [],
                },
                variation: isVariable && selectedSize
                  ? {
                      id: selectedSize.id,
                      size:
                        selectedSize.attributes?.Size ||
                        selectedSize.size,
                      attributes: selectedSize.attributes,
                      stock_quantity:
                        selectedSize.stock_quantity,
                      sku: selectedSize.sku,
                    }
                  : null,
                qty: 1,
              })
            }
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              canAddToCart() && !isLoadingVariations
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoadingVariations ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                Loading sizes...
              </span>
            ) : canAddToCart() ? (
              isChangingSize ? "Update Size" : "Add to Bag"
            ) : (
              "Out of Stock"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}