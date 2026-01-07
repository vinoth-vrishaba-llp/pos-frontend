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
}) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs to prevent stale closures
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  /* -------------------------
     RESET ON CATEGORY CHANGE
  -------------------------- */
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setSearchResults([]);
    setInitialLoad(true);
    pageRef.current = 1;
    hasMoreRef.current = true;
  }, [selectedCategory?.id]);

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
    if (!searchQuery?.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        const query = searchQuery.trim();
        
        // First try SKU/barcode lookup (exact match, fast)
        const skuResults = await lookupBySku(query);
        const skuProducts = skuResults?.data?.data || skuResults?.data || [];
        
        if (skuProducts.length > 0) {
          // Found by SKU/barcode - return immediately
          setSearchResults(skuProducts);
          setIsSearching(false);
          return;
        }
        
        // If not found by SKU, do text search
        const res = await searchProducts(query, categoryParam);
        const results = res?.data?.data || res?.data || [];
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, categoryParam]);

  /* -------------------------
     FETCH PRODUCTS (PAGINATION)
  -------------------------- */
  const loadMore = async () => {
    if (loadingRef.current || !hasMoreRef.current || searchQuery) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await fetchProducts({
        page: pageRef.current,
        limit: 20,
        category: categoryParam,
      });

      const incoming = res?.data?.data || [];

      if (incoming.length < 20) {
        setHasMore(false);
        hasMoreRef.current = false;
      }

      setProducts((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        incoming.forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      });

      pageRef.current += 1;
      setPage(pageRef.current);
    } catch (err) {
      console.error("Failed to load products:", err);
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
    if (!searchQuery) {
      loadMore();
    }
  }, [categoryParam]);

  /* -------------------------
     INFINITE SCROLL
  -------------------------- */
  useEffect(() => {
    if (searchQuery) return;

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
  }, [searchQuery]);

  /* -------------------------
     DISPLAY PRODUCTS
  -------------------------- */
  const displayProducts = searchQuery ? searchResults : products;
  const showClearCategory = selectedCategory && selectedCategory.id !== "all";

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
        {searchQuery && (
          <div className="text-xs text-gray-600">
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <span>
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                {searchResults.length === 1 && searchResults[0].sku && (
                  <span className="ml-1 text-green-600">
                    (SKU: {searchResults[0].sku})
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 no-scrollbar product-scroll-container">
        {/* INITIAL LOADING STATE */}
        {initialLoad && loading ? (
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
            />

            {/* LOADING MORE INDICATOR */}
            {loading && !initialLoad && !searchQuery && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            )}

            {/* NO MORE PRODUCTS */}
            {!loading && !hasMore && !searchQuery && products.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                All products loaded
              </div>
            )}

            {/* NO RESULTS */}
            {!loading && !initialLoad && displayProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? (
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