// src/components/cart/OrderMetaControls.jsx

const formatNumberInputValue = (value) => {
  return Number.isFinite(value) && value !== 0 ? String(value) : "";
};

export default function OrderMetaControls({
  alterationCharge,
  setAlterationCharge,
  courierCharge,
  setCourierCharge,
  otherCharge,
  setOtherCharge,
  orderType,
  setOrderType,
  discountValue,
  setDiscountValue,
  discountType,
  setDiscountType,
}) {
  const handleNumberChange = (setter) => (e) => {
    const raw = e.target.value;
    const parsed = parseFloat(raw);
    setter(Number.isFinite(parsed) ? parsed : 0);
  };

  // ✅ FIX: Use correct order type values that match backend
  const handleOrderTypeChange = (type) => {
    setOrderType(type);
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4 text-xs">
      {/* Order type */}
      <div>
        <p className="font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Order Type
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleOrderTypeChange("Normal Sale")}
            className={[
              "px-3 py-1 rounded-full border text-xs font-medium transition-colors",
              orderType === "Normal Sale"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:border-black hover:text-black",
            ].join(" ")}
          >
            Normal Sale
          </button>
          <button
            type="button"
            onClick={() => handleOrderTypeChange("Advanced Booking")}
            className={[
              "px-3 py-1 rounded-full border text-xs font-medium",
              orderType === "Advanced Booking"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:border-black",
            ].join(" ")}
          >
            Advanced Booking
          </button>
          <button
            type="button"
            onClick={() => handleOrderTypeChange("Alteration")}
            className={[
              "px-3 py-1 rounded-full border text-xs font-medium",
              orderType === "Alteration"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300 hover:border-black",
            ].join(" ")}
          >
            Alteration
          </button>
        </div>
      </div>

      {/* Additional charges */}
      <div>
        <p className="font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Additional Charges
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block mb-1 text-[11px] text-gray-500">
              Alteration
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded px-2 py-1 text-xs"
              placeholder="0"
              value={formatNumberInputValue(alterationCharge)}
              onChange={handleNumberChange(setAlterationCharge)}
            />
          </div>
          <div>
            <label className="block mb-1 text-[11px] text-gray-500">
              Courier
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded px-2 py-1 text-xs"
              placeholder="0"
              value={formatNumberInputValue(courierCharge)}
              onChange={handleNumberChange(setCourierCharge)}
            />
          </div>
          <div>
            <label className="block mb-1 text-[11px] text-gray-500">
              Other
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border rounded px-2 py-1 text-xs"
              placeholder="0"
              value={formatNumberInputValue(otherCharge)}
              onChange={handleNumberChange(setOtherCharge)}
            />
          </div>
        </div>
      </div>

      {/* Discount */}
      <div>
        <p className="font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Discount
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step={discountType === "percent" ? "1" : "0.01"}
            className="flex-1 border rounded px-2 py-1 text-xs"
            placeholder="0"
            value={formatNumberInputValue(discountValue)}
            onChange={handleNumberChange(setDiscountValue)}
          />
          <select
            className="border rounded px-2 py-1 text-xs"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
          >
            <option value="flat">₹</option>
            <option value="percent">%</option>
          </select>
        </div>
      </div>
    </div>
  );
}