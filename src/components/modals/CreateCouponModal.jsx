// src/components/modals/CreateCouponModal.jsx
import { useState } from "react";
import { X, Tag, Loader2 } from "lucide-react";
import { createCoupon } from "../../api/coupons.api";
import { toast } from "sonner";

export default function CreateCouponModal({ isOpen, onClose, onCouponCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percent",
    amount: "",
    description: "",
    minimum_amount: "",
    individual_use: false,
    exclude_sale_items: false,
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required";
    } else if (formData.code.length < 3) {
      newErrors.code = "Code must be at least 3 characters";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (formData.discount_type === "percent" && parseFloat(formData.amount) > 100) {
      newErrors.amount = "Percentage cannot exceed 100%";
    }

    if (formData.minimum_amount && parseFloat(formData.minimum_amount) < 0) {
      newErrors.minimum_amount = "Minimum amount cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        amount: formData.amount.toString(),
        description: formData.description.trim(),
        individual_use: formData.individual_use,
        exclude_sale_items: formData.exclude_sale_items,
      };

      if (formData.minimum_amount) {
        payload.minimum_amount = formData.minimum_amount.toString();
      }

      const res = await createCoupon(payload);
      
      // Backend returns: { success: true, message: "...", data: coupon }
      const createdCoupon = res.data?.data || res.data;
      
      toast.success(`Coupon "${createdCoupon.code}" created successfully!`);
      
      // Pass the created coupon back to parent
      if (onCouponCreated) {
        onCouponCreated(createdCoupon);
      }

      // Reset form
      setFormData({
        code: "",
        discount_type: "percent",
        amount: "",
        description: "",
        minimum_amount: "",
        individual_use: false,
        exclude_sale_items: false,
      });
      setErrors({});
      onClose();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Failed to create coupon";
      toast.error(errorMsg);
      console.error("Create coupon error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAmountPlaceholder = () => {
    switch (formData.discount_type) {
      case "percent":
        return "e.g., 10 (for 10%)";
      case "fixed_cart":
        return "e.g., 500 (₹500 off cart)";
      case "fixed_product":
        return "e.g., 100 (₹100 off product)";
      default:
        return "Enter amount";
    }
  };

  const getDiscountTypeLabel = (type) => {
    switch (type) {
      case "percent":
        return "Percentage Discount";
      case "fixed_cart":
        return "Fixed Cart Discount";
      case "fixed_product":
        return "Fixed Product Discount";
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create New Coupon</h2>
              <p className="text-sm text-gray-600">Add a discount coupon for customers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value.toUpperCase() });
                setErrors({ ...errors, code: null });
              }}
              placeholder="e.g., SAVE20, WELCOME10"
              className={`w-full px-4 py-3 border rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 transition ${
                errors.code
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
              }`}
              disabled={loading}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-600">{errors.code}</p>
            )}
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["percent", "fixed_cart", "fixed_product"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, discount_type: type })}
                  className={`px-3 py-2.5 text-xs font-semibold rounded-lg border-2 transition ${
                    formData.discount_type === type
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                  }`}
                  disabled={loading}
                >
                  {type === "percent" && "%"}
                  {type === "fixed_cart" && "₹ Cart"}
                  {type === "fixed_product" && "₹ Product"}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {getDiscountTypeLabel(formData.discount_type)}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                setErrors({ ...errors, amount: null });
              }}
              placeholder={getAmountPlaceholder()}
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                errors.amount
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
              }`}
              disabled={loading}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Minimum Order Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minimum Order Amount (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.minimum_amount}
              onChange={(e) => {
                setFormData({ ...formData, minimum_amount: e.target.value });
                setErrors({ ...errors, minimum_amount: null });
              }}
              placeholder="e.g., 1000 (₹1000 minimum)"
              className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                errors.minimum_amount
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
              }`}
              disabled={loading}
            />
            {errors.minimum_amount && (
              <p className="mt-1 text-xs text-red-600">{errors.minimum_amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., New customer welcome discount"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none transition"
              disabled={loading}
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.individual_use}
                onChange={(e) =>
                  setFormData({ ...formData, individual_use: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
              <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Individual Use Only
                </span>
                <p className="text-xs text-gray-500">
                  Cannot be combined with other coupons
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.exclude_sale_items}
                onChange={(e) =>
                  setFormData({ ...formData, exclude_sale_items: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-200"
                disabled={loading}
              />
              <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Exclude Sale Items
                </span>
                <p className="text-xs text-gray-500">
                  Coupon won't apply to products already on sale
                </p>
              </div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Tag className="w-4 h-4" />
                Create Coupon
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}