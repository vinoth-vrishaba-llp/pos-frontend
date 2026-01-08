import { useEffect, useMemo, useRef, useState } from "react";
import { fetchOrders, searchOrders } from "@/api/orders.api";
import OrderDetailsModal from "@/components/modals/OrderDetailsModal";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { getStatusText } from "@/utils/orderStatus";

export default function OrderListPage({ onSelectOrder, onReprint }) {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const searchRef = useRef(null);
  const loadingRef = useRef(false);
  const hasNextRef = useRef(true);
  const pageRef = useRef(1);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  /* -------------------------
     FORMAT DATE: DD/MM/YYYY HH:MM
  -------------------------- */
  function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /* -------------------------
     LOAD MORE ORDERS
  -------------------------- */
  async function loadMore() {
    if (loadingRef.current || !hasNextRef.current || search) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await fetchOrders({ page: pageRef.current, limit: 20 });
      const newOrders = res.data.results || [];

      if (newOrders.length < 20) {
        setHasNext(false);
        hasNextRef.current = false;
      }

      setOrders((prev) => {
        const map = new Map();
        [...prev, ...newOrders].forEach((o) => {
          map.set(o.woo_order_id, o);
        });
        return Array.from(map.values());
      });

      pageRef.current += 1;
      setPage(pageRef.current);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
      loadingRef.current = false;
    }
  }

  /* -------------------------
     INITIAL LOAD
  -------------------------- */
  useEffect(() => {
    if (!search) {
      loadMore();
    }
  }, []);

  /* -------------------------
     INFINITE SCROLL
  -------------------------- */
  useEffect(() => {
    if (search) return;

    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMore();
      }
    };

    const scrollContainer = document.querySelector('.order-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [search]);

  /* -------------------------
     SEARCH HANDLER (DEBOUNCED)
  -------------------------- */
  useEffect(() => {
    if (!search?.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        const res = await searchOrders(search.trim());
        const results = res?.data?.results || res?.data || [];
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  /* -------------------------
     BARCODE SCANNER
  -------------------------- */
  useBarcodeScanner((code) => {
    const allOrders = search ? searchResults : orders;
    const found = allOrders.find(
      (o) => o.order_number === code || o.barcode === code
    );
    if (found) setSelectedOrderId(found.woo_order_id);
  });

  /* -------------------------
     DISPLAY ORDERS
  -------------------------- */
  const displayOrders = search ? searchResults : orders;

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Search */}
      <div className="mb-3">
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Scan or type order number"
          className="w-full border px-3 py-2 rounded text-sm font-mono"
        />
        
        {/* Search Status */}
        {search && (
          <div className="text-xs text-gray-600 mt-1">
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <span>
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar border rounded order-scroll-container">
        {/* INITIAL LOADING STATE */}
        {initialLoad && loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-3 py-2">Order No</th>
                  <th className="text-left px-3 py-2">Customer</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayOrders.map((o) => {
                  const status =
                    typeof o.status === "object" ? o.status.value : o.status;

                  return (
                    <tr
                      key={`order-${o.woo_order_id}`}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (!o.woo_order_id) {
                          alert("Order not yet synced with Woo");
                          return;
                        }
                        setSelectedOrderId(o.woo_order_id);
                      }}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">{o.order_number}</div>
                        <div className="text-xs text-gray-400">
                          {formatDateTime(o.created_at)}
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        {o.customer_name || "Walk-in"}
                      </td>

                      <td className="px-3 py-2 capitalize">
                        {o.order_type || "Sale"}
                      </td>

                      <td className="px-3 py-2 text-right font-medium">
                        ₹{Number(o.total).toLocaleString()}
                      </td>

                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === "completed"
                              ? "bg-black text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          {getStatusText(status)}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(o.woo_order_id);
                          }}
                          className="border px-3 py-1 rounded text-xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* LOADING MORE INDICATOR */}
            {loading && !initialLoad && !search && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            )}

            {/* NO MORE ORDERS */}
            {!loading && !hasNext && !search && orders.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                All orders loaded
              </div>
            )}

            {/* NO RESULTS */}
            {!loading && !initialLoad && displayOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {search ? (
                  <>
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm mt-1">Try a different order number</p>
                  </>
                ) : (
                  <p>No orders available</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {selectedOrderId && (
        <OrderDetailsModal
          wooOrderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdated={(updated) => {
            setOrders((prev) =>
              prev.map((o) =>
                o.woo_order_id === updated.woo_order_id
                  ? { ...o, status: updated.status }
                  : o
              )
            );
          }}
          onReprint={(wooOrderId) => {
            setSelectedOrderId(null);
            if (onReprint) {
              onReprint(wooOrderId);
            }
          }}
        />
      )}
    </div>
  );
}