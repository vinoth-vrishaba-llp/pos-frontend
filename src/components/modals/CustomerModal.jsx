// src/components/cart/CustomerModal.jsx
import { X, Search as SearchIcon, Loader2, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchCustomers, createCustomer } from "@/api/customers.api";

const CUSTOMER_TYPES = [
  "Walk-in customer",
  "WhatsApp customer", 
  "Social media customer"
];

export default function CustomerModal({ isOpen, onClose, onSave, currentCustomer }) {
  // Form state for new customer - EXPANDED
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "IN",
    customer_type: "Walk-in customer", // ✅ NEW: Default customer type
  });
  
  // Search & list state
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load customers on open
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchCustomers({ page: 1, limit: 100 });
      setCustomers(response.results || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter customers by search query
  const filteredCustomers = searchQuery.trim()
    ? customers.filter((c) => {
        const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return (
          fullName.includes(query) ||
          (c.phone || "").includes(query) ||
          (c.email || "").toLowerCase().includes(query)
        );
      })
    : [];

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle selecting existing customer
  const handleSelectExisting = (customer) => {
    const transformedCustomer = {
      id: customer.id,
      woo_customer_id: customer.woo_customer_id,
      name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email,
      address_1: customer.address,
      address_2: customer.address_line_2,
      city: customer.city,
      state: customer.state,
      postcode: customer.postcode,
      country: customer.country || "IN",
      customer_type: customer.customer_type || "Walk-in customer", // ✅ Include type
    };
    onSave(transformedCustomer);
    resetForm();
  };

  // Handle creating new customer
  const handleCreateNew = async () => {
    // Validate required fields
    if (!formData.first_name.trim()) {
      alert("First name is required!");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Phone is required!");
      return;
    }

    // Validate email if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        alert("Invalid email format!");
        return;
      }
    }

    setIsCreating(true);

    try {
      // Build complete customer payload
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || "",
        email: formData.email.trim() || "",
        phone: formData.phone.trim(),
        username: `customer_${formData.phone.trim()}_${Date.now()}`, // Unique username
        customer_type: formData.customer_type, // ✅ Send at root level for backend
        billing: {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim() || "",
          email: formData.email.trim() || "",
          phone: formData.phone.trim(),
          address_1: formData.address_1.trim() || "",
          address_2: formData.address_2.trim() || "",
          city: formData.city.trim() || "",
          state: formData.state.trim() || "",
          postcode: formData.postcode.trim() || "",
          country: formData.country || "IN",
          company: "",
        },
        shipping: {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim() || "",
          address_1: formData.address_1.trim() || "",
          address_2: formData.address_2.trim() || "",
          city: formData.city.trim() || "",
          state: formData.state.trim() || "",
          postcode: formData.postcode.trim() || "",
          country: formData.country || "IN",
          company: "",
        },
        // ✅ Also add to meta_data for WooCommerce
        meta_data: [
          {
            key: "customer_type",
            value: formData.customer_type
          }
        ]
      };

      console.log("📤 Creating customer with payload:", payload);

      const created = await createCustomer(payload);

      console.log("✅ Customer created:", created);

      // Transform and return
      const transformedCustomer = {
        id: created.id,
        woo_customer_id: created.id,
        name: `${created.first_name} ${created.last_name}`.trim(),
        first_name: created.first_name,
        last_name: created.last_name,
        phone: created.billing?.phone || formData.phone.trim(),
        email: created.email,
        address_1: created.billing?.address_1 || formData.address_1.trim(),
        address_2: created.billing?.address_2 || formData.address_2.trim(),
        city: created.billing?.city || formData.city.trim(),
        state: created.billing?.state || formData.state.trim(),
        postcode: created.billing?.postcode || formData.postcode.trim(),
        country: created.billing?.country || formData.country,
        customer_type: formData.customer_type, // ✅ Include type
      };

      onSave(transformedCustomer);
      resetForm();
    } catch (error) {
      console.error("Failed to create customer:", error);
      const errorMsg = error.response?.data?.message || "Failed to create customer. Please try again.";
      alert(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle walk-in customer
  const handleWalkIn = () => {
    onSave(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      address_1: "",
      address_2: "",
      city: "",
      state: "",
      postcode: "",
      country: "IN",
      customer_type: "Walk-in customer",
    });
    setSearchQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-base active">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">Select Customer</h3>
          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Walk-in button */}
          <button
            onClick={handleWalkIn}
            className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-black hover:bg-gray-50 transition-colors font-medium"
          >
            👤 Walk-in Customer (No Selection)
          </button>

          {/* Search */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setSearchQuery(e.target.value)}
              value={searchQuery}
            />
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="text-center py-4 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              <p className="text-sm mt-2">Loading customers...</p>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && searchQuery && filteredCustomers.length > 0 && (
            <div className="mb-4 max-h-64 overflow-y-auto border rounded divide-y bg-white shadow-sm">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id || c.woo_customer_id}
                  className="p-3 hover:bg-gray-50 flex justify-between items-center cursor-pointer transition-colors"
                  onClick={() => handleSelectExisting(c)}
                >
                  <div>
                    <div className="font-bold text-sm text-gray-800">
                      {c.first_name} {c.last_name}
                    </div>
                    <div className="text-xs text-gray-600">{c.phone}</div>
                    {c.email && (
                      <div className="text-xs text-gray-500">{c.email}</div>
                    )}
                    {/* ✅ Show customer type */}
                    {c.customer_type && (
                      <div className="flex items-center gap-1 mt-1">
                        <Tag className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">{c.customer_type}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-black font-medium border border-gray-300 px-3 py-1 rounded hover:bg-black hover:text-white transition-colors">
                    Select
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && searchQuery && filteredCustomers.length === 0 && (
            <div className="mb-4 text-sm text-gray-500 text-center py-3 border rounded border-dashed bg-gray-50">
              No customer found. Create new below.
            </div>
          )}

          {/* Add new customer form - EXPANDED */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase">
              Add New Customer
            </h4>
            
            {/* ✅ Customer Type - First Field */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Customer Type
              </label>
              <select
                name="customer_type"
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.customer_type}
                onChange={handleInputChange}
              >
                {CUSTOMER_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  placeholder="John"
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.first_name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  placeholder="Doe"
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="9876543210"
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Address Line 1 & 2 */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Address Line 1</label>
              <input
                type="text"
                name="address_1"
                placeholder="Street address"
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.address_1}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Address Line 2</label>
              <input
                type="text"
                name="address_2"
                placeholder="Apartment, suite, etc. (optional)"
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.address_2}
                onChange={handleInputChange}
              />
            </div>

            {/* City, State, Postcode */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Mumbai"
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  placeholder="MH"
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Postcode</label>
                <input
                  type="text"
                  name="postcode"
                  placeholder="400001"
                  className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.postcode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Country */}
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Country</label>
              <select
                name="country"
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.country}
                onChange={handleInputChange}
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="CA">Canada</option>
              </select>
            </div>

            <button
              onClick={handleCreateNew}
              disabled={isCreating}
              className="w-full bg-black text-white py-2.5 rounded font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Save & Select Customer"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}