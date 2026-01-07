// src/components/cart/VoucherAndNotes.jsx
import { useState, useEffect, useRef } from "react";
import { Tag, Plus, ChevronDown, Loader2, X } from "lucide-react";
import { fetchCoupons } from "../../api/coupons.api";
import CreateCouponModal from "../modals/CreateCouponModal";

export default function VoucherAndNotes({
  notes,
  setNotes,
  measurements,
  setMeasurements,
  couponCode,
  setCouponCode,
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  
  // Coupon dropdown state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const dropdownRef = useRef(null);

  // Load coupons on mount
  useEffect(() => {
    loadCoupons();
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetchCoupons({ per_page: 100 });
      
      // Backend returns: { success: true, data: [...coupons], count: X }
      const couponList = Array.isArray(res?.data?.data) 
        ? res.data.data 
        : Array.isArray(res?.data) 
        ? res.data 
        : [];
      
      console.log("✅ Loaded coupons:", couponList.length);
      setCoupons(couponList);
    } catch (err) {
      console.error("❌ Failed to load coupons:", err);
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCouponCreated = (newCoupon) => {
    console.log("✅ New coupon created:", newCoupon);
    // Add to list
    setCoupons((prev) => [newCoupon, ...prev]);
    // Auto-apply the newly created coupon
    setCouponCode(newCoupon.code);
    setShowDropdown(false);
  };

  const handleSelectCoupon = (coupon) => {
    setCouponCode(coupon.code);
    setShowDropdown(false);
  };

  const handleClearCoupon = () => {
    setCouponCode("");
    setShowDropdown(false);
  };

  const getDiscountDisplay = (coupon) => {
    const amount = Math.round(parseFloat(coupon.amount) || 0);
    
    if (coupon.discount_type === "percent") {
      return `${amount}% off`;
    } else if (coupon.discount_type === "fixed_cart") {
      return `₹${amount} off cart`;
    } else if (coupon.discount_type === "fixed_product") {
      return `₹${amount} off product`;
    }
    return `${amount} discount`;
  };

  const selectedCoupon = coupons.find((c) => c.code === couponCode);

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
      {/* Coupon Selector with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-2">
          {/* Dropdown Button */}
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex-1 flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:border-blue-400 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {loadingCoupons ? (
                <span className="text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading coupons...
                </span>
              ) : selectedCoupon ? (
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-semibold text-blue-600 truncate">
                    {selectedCoupon.code}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {getDiscountDisplay(selectedCoupon)}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Select a coupon</span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Create Button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-1.5 text-sm font-semibold"
            title="Create new coupon"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {/* Clear Option */}
            {couponCode && (
              <>
                <button
                  type="button"
                  onClick={handleClearCoupon}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                >
                  <X className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 font-medium">Clear coupon</span>
                </button>
              </>
            )}

            {/* Coupon List */}
            {coupons.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                No coupons available
              </div>
            ) : (
              coupons.map((coupon) => (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() => handleSelectCoupon(coupon)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0 ${
                    coupon.code === couponCode ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {coupon.code}
                      </div>
                      {coupon.description && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {coupon.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-green-600 font-semibold">
                          {getDiscountDisplay(coupon)}
                        </span>
                        {coupon.minimum_amount && (
                          <span className="text-gray-400">
                            • Min: ₹{coupon.minimum_amount}
                          </span>
                        )}
                      </div>
                    </div>
                    {coupon.code === couponCode && (
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Coupon Details */}
      {selectedCoupon && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-blue-900 mb-1">
                Applied: {selectedCoupon.code}
              </div>
              {selectedCoupon.description && (
                <div className="text-xs text-blue-700 mb-1">
                  {selectedCoupon.description}
                </div>
              )}
              <div className="text-xs text-blue-600">
                {getDiscountDisplay(selectedCoupon)}
                {selectedCoupon.minimum_amount && (
                  <span className="ml-2">
                    (Min order: ₹{selectedCoupon.minimum_amount})
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearCoupon}
              className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition"
              title="Remove coupon"
            >
              <X className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      )}

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          className={`text-xs font-semibold border rounded px-2 py-1 transition ${
            showNotes
              ? "bg-black text-white border-black"
              : "text-gray-600 hover:bg-white bg-gray-100"
          }`}
        >
          {showNotes ? "- Hide Notes" : "+ Add Notes"}
        </button>
        <button
          type="button"
          onClick={() => setShowMeasurements((v) => !v)}
          className={`text-xs font-semibold border rounded px-2 py-1 transition ${
            showMeasurements
              ? "bg-black text-white border-black"
              : "text-gray-600 hover:bg-white bg-gray-100"
          }`}
        >
          {showMeasurements ? "- Hide Measurements" : "+ Measurements"}
        </button>
      </div>

      {showNotes && (
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">
            Order Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions, customer requests, etc..."
            className="w-full p-2 text-sm border rounded h-20 resize-none focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {showMeasurements && (
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">
            Customer Measurements
          </label>
          <textarea
            value={measurements}
            onChange={(e) => setMeasurements(e.target.value)}
            placeholder="Enter measurements (e.g., Chest: 38, Waist: 32, Length: 40)"
            className="w-full p-2 border rounded h-32 font-mono text-xs resize-none focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Create Coupon Modal */}
      <CreateCouponModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCouponCreated={handleCouponCreated}
      />
    </div>
  );
}