import { useEffect, useState, useRef } from "react";
import { fetchProducts, searchProducts, lookupBySku } from "@/api/products.api";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";
import ProductGrid from "./ProductGrid";

export default function ProductCatalog({
  categories,
  categoriesLoading,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onProductClick,
  onProductHover,  // ✅ NEW: Add this prop
}) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // ✅ NEW: Track if user is typing
  
  // Refs to prevent stale closures
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);
  const searchTimerRef = useRef(null);
  const lastSearchQueryRef = useRef(""); // Track last search to prevent clearing

  /* -------------------------
     RESET ON CATEGORY CHANGE
  -------------------------- */
  useEffect(() => {
    console.log("🔄 Category changed to:", selectedCategory?.name);
    
    // ✅ ONLY reset products if NOT searching
    if (!searchQuery?.trim()) {
      console.log("   → Resetting products (no active search)");
      setProducts([]);
      setPage(1);
      setHasMore(true);
      setInitialLoad(true);
      pageRef.current = 1;
      hasMoreRef.current = true;
    } else {
      console.log("   → Keeping search active, will re-search with new category");
      // Search will re-execute automatically due to categoryParam dependency
    }
  }, [selectedCategory?.id]); // ✅ Only depend on ID, not searchQuery

  /* -------------------------
     CATEGORY PARAM (ID NOT SLUG!)
  -------------------------- */
  const categoryParam =
    selectedCategory && selectedCategory.id !== "all"
      ? selectedCategory.id
      : undefined;

  /* -------------------------
     SEARCH HANDLER (DEBOUNCED)
     Supports: product name, SKU, barcode
  -------------------------- */
  useEffect(() => {
    // Clear any existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const currentQuery = searchQuery?.trim();
    
    // ✅ FIX: Only clear if query is actually empty AND it was previously not empty
    if (!currentQuery) {
      if (lastSearchQueryRef.current) {
        console.log("🔍 Search cleared, resetting results");
        setSearchResults([]);
        setIsSearching(false);
        lastSearchQueryRef.current = "";
      }
      return;
    }

    // ✅ Track current query
    lastSearchQueryRef.current = currentQuery;
    
    console.log(`🔍 Search triggered for: "${currentQuery}" in category:`, categoryParam || "all");
    
    // ✅ Set typing indicator immediately
    setIsTyping(true);
    
    // ✅ DON'T set isSearching immediately - only set it in the timeout
    // This prevents the UI from flickering "Searching..." on every keystroke

    searchTimerRef.current = setTimeout(async () => {
      try {
        console.log(`   → Executing search for: "${currentQuery}"`);
        
        // ✅ NOW set isSearching (only after debounce completes)
        setIsTyping(false); // Stop typing indicator
        setIsSearching(true); // Start searching indicator
        
        let finalResults = [];
        
        // ✅ STRATEGY 1: Try SKU lookup first (most reliable for exact/partial SKU)
        try {
          console.log(`   → Strategy 1: Trying lookupBySku...`);
          const skuRes = await lookupBySku(currentQuery);
          const skuResults = skuRes?.data?.data || skuRes?.data || [];
          
          console.log(`   → lookupBySku returned ${skuResults.length} results`);
          
          if (skuResults.length > 0) {
            console.log(`   ✅ Found by SKU/name lookup`);
            finalResults = skuResults;
            
            // Log what we found
            skuResults.forEach(p => {
              console.log(`      • ${p.name} (SKU: ${p.sku})`);
            });
          }
        } catch (skuErr) {
          console.log(`   ⚠️ lookupBySku failed:`, skuErr.message);
        }
        
        // ✅ STRATEGY 2: If no results, try broader search
        if (finalResults.length === 0) {
          console.log(`   → Strategy 2: Trying searchProducts (broader search)...`);
          const searchRes = await searchProducts(currentQuery, categoryParam);
          const searchResults = searchRes?.data?.data || searchRes?.data || [];
          
          console.log(`   → searchProducts returned ${searchResults.length} results`);
          
          if (searchResults.length > 0) {
            console.log(`   ✅ Found by text search`);
            finalResults = searchResults;
            
            // Log what we found
            searchResults.forEach(p => {
              console.log(`      • ${p.name} (SKU: ${p.sku || 'no sku'})`);
            });
          }
        }
        
        console.log(`   ✅ Final: ${finalResults.length} results total`);
        setSearchResults(finalResults);
        
      } catch (err) {
        console.error("❌ Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 800); // ✅ Increased debounce to 800ms - gives more time to finish typing

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, categoryParam]);

  /* -------------------------
     FETCH PRODUCTS (PAGINATION)
  -------------------------- */
  const loadMore = async () => {
    if (loadingRef.current || !hasMoreRef.current || searchQuery?.trim()) {
      console.log("⏭️ Skipping loadMore:", {
        loading: loadingRef.current,
        hasMore: hasMoreRef.current,
        searching: !!searchQuery?.trim()
      });
      return;
    }

    console.log(`📦 Loading page ${pageRef.current}...`);
    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await fetchProducts({
        page: pageRef.current,
        limit: 20,
        category: categoryParam,
      });

      const incoming = res?.data?.data || [];
      console.log(`   → Received ${incoming.length} products`);

      if (incoming.length < 20) {
        console.log(`   → No more products available`);
        setHasMore(false);
        hasMoreRef.current = false;
      }

      setProducts((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        incoming.forEach((p) => map.set(p.id, p));
        const newProducts = Array.from(map.values());
        console.log(`   → Total products: ${newProducts.length}`);
        return newProducts;
      });

      pageRef.current += 1;
      setPage(pageRef.current);
    } catch (err) {
      console.error("❌ Failed to load products:", err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
      loadingRef.current = false;
    }
  };

  /* -------------------------
     INITIAL LOAD
  -------------------------- */
  useEffect(() => {
    if (!searchQuery?.trim()) {
      console.log("🎬 Initial load triggered for category:", categoryParam || "all");
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam]);

  /* -------------------------
     INFINITE SCROLL
  -------------------------- */
  useEffect(() => {
    if (searchQuery?.trim()) return;

    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMore();
      }
    };

    const scrollContainer = document.querySelector('.product-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  /* -------------------------
     DISPLAY PRODUCTS
  -------------------------- */
  const displayProducts = searchQuery?.trim() ? searchResults : products;
  const showClearCategory = selectedCategory && selectedCategory.id !== "all";

  // ✅ DEBUG: Log whenever displayProducts changes
  useEffect(() => {
    console.log("📊 Display Update:", {
      searchQuery: searchQuery || "(empty)",
      isSearching,
      searchResultsCount: searchResults.length,
      productsCount: products.length,
      displayCount: displayProducts.length,
      displayProducts: displayProducts.slice(0, 3).map(p => ({ name: p.name, sku: p.sku }))
    });
  }, [displayProducts, searchQuery, isSearching, searchResults.length, products.length]);

  /* =========================
     RENDER
  ========================== */
  return (
    <>
      {/* HEADER */}
      <div className="p-4 bg-white border-b space-y-2">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onProductFound={onProductClick}
        />

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          loading={categoriesLoading}
        />

        {/* ACTIVE CATEGORY CHIP */}
        {showClearCategory && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">
              Filtered by:
            </span>

            <span className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 border rounded-full">
              {selectedCategory.name}
              <button
                onClick={() =>
                  onCategoryChange({
                    id: "all",
                    name: "All",
                    slug: undefined,
                  })
                }
                className="text-gray-500 hover:text-black font-bold"
                title="Clear category"
              >
                ×
              </button>
            </span>
          </div>
        )}

        {/* SEARCH STATUS */}
        {searchQuery?.trim() && (
          <div className="text-xs space-y-1">
            {/* Typing Indicator */}
            {isTyping && !isSearching && (
              <div className="text-blue-600 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Typing... (search will start in 0.8s)
              </div>
            )}
            
            {/* Searching Indicator */}
            {isSearching && (
              <div className="text-blue-600 flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span>
                Searching...
              </div>
            )}
            
            {/* Results */}
            {!isTyping && !isSearching && (
              <div className="text-gray-600">
                Found <span className="font-semibold">{searchResults.length}</span> result{searchResults.length !== 1 ? 's' : ''}
                {searchResults.length === 1 && searchResults[0].sku && (
                  <span className="ml-1 text-green-600 font-medium">
                    • {searchResults[0].name} (SKU: {searchResults[0].sku})
                  </span>
                )}
                
              </div>
            )}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 no-scrollbar product-scroll-container">
        {/* INITIAL LOADING STATE */}
        {initialLoad && loading && !searchQuery?.trim() ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* PRODUCT GRID */}
            <ProductGrid
  products={displayProducts}
  loading={false}
  onProductClick={onProductClick}
  onProductHover={onProductHover}  // ✅ NEW
/>

            {/* LOADING MORE INDICATOR */}
            {loading && !initialLoad && !searchQuery?.trim() && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            )}

            {/* SEARCHING INDICATOR */}
            {isSearching && searchQuery?.trim() && (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            )}

            {/* NO MORE PRODUCTS */}
            {!loading && !hasMore && !searchQuery?.trim() && products.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                All products loaded
              </div>
            )}

            {/* NO RESULTS */}
            {!loading && !isSearching && displayProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery?.trim() ? (
                  <>
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm mt-1">
                      Try searching by name, SKU, or barcode
                    </p>
                  </>
                ) : (
                  <p>No products in this category</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}