import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Home,
} from "lucide-react";
import { useState } from "react";

const CUSTOMER_TYPES = [
  "Walk-in customer",
  "WhatsApp customer",
  "Social media customer"
];

/* ---------------- Toast ---------------- */
function Toast({ message, type = "success", onClose }) {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 z-[80]`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ---------------- Modal ---------------- */
export default function CustomerDetailsModal({
  customer,
  onClose,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address_1: customer?.address_1 || "",
    address_2: customer?.address_2 || "",
    city: customer?.city || "",
    state: customer?.state || "",
    postcode: customer?.postcode || "",
    country: customer?.country || "IN",
    customer_type: customer?.customer_type || "Walk-in customer",
  });

  if (!customer) return null;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast("Name is required", "error");
      return;
    }

    if (!formData.phone.trim()) {
      showToast("Phone number is required", "error");
      return;
    }

    if (
      formData.email &&
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
    ) {
      showToast("Invalid email address", "error");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
      showToast("Customer updated successfully");
    } catch (err) {
      showToast(err?.response?.data?.message || "Update failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address_1: customer.address_1,
      address_2: customer.address_2,
      city: customer.city,
      state: customer.state,
      postcode: customer.postcode,
      country: customer.country,
      customer_type: customer.customer_type,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="bg-white w-full max-w-2xl mx-4 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b sticky top-0 bg-white z-10">
          <div className="flex-1">
            {isEditing ? (
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="text-2xl font-bold w-full border-b-2 border-black outline-none"
                placeholder="Customer name"
              />
            ) : (
              <>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                {customer.joinedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(customer.joinedAt).toLocaleDateString()}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-2 rounded-full text-green-600 hover:bg-green-100 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full text-blue-600 hover:bg-blue-100"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Customer Type */}
          <div className="space-y-1">
            <label className="text-sm text-gray-500 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Customer Type
            </label>
            {isEditing ? (
              <select
                name="customer_type"
                value={formData.customer_type}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              >
                {CUSTOMER_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            ) : (
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                <Tag className="w-3 h-3" />
                {customer.customer_type || "Walk-in customer"}
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-sm text-gray-500 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phone
            </label>
            {isEditing ? (
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
            ) : (
              <div className="text-gray-800 font-medium">{customer.phone || "-"}</div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm text-gray-500 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </label>
            {isEditing ? (
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
              />
            ) : (
              <div className="text-gray-800">
                {customer.email || "No email provided"}
              </div>
            )}
          </div>

          {/* Address Section */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 flex items-center gap-2">
              <Home className="w-4 h-4" />
              Address Details
            </h3>

            {/* Address Line 1 */}
            <div className="space-y-1 mb-4">
              <label className="text-sm text-gray-500">Address Line 1</label>
              {isEditing ? (
                <input
                  name="address_1"
                  value={formData.address_1}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              ) : (
                <div className="text-gray-800">
                  {customer.address_1 || "-"}
                </div>
              )}
            </div>

            {/* Address Line 2 */}
            <div className="space-y-1 mb-4">
              <label className="text-sm text-gray-500">Address Line 2</label>
              {isEditing ? (
                <input
                  name="address_2"
                  value={formData.address_2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, etc."
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                />
              ) : (
                <div className="text-gray-800">
                  {customer.address_2 || "-"}
                </div>
              )}
            </div>

            {/* City, State, Postcode */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-500">City</label>
                {isEditing ? (
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  />
                ) : (
                  <div className="text-gray-800">{customer.city || "-"}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-500">State</label>
                {isEditing ? (
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  />
                ) : (
                  <div className="text-gray-800">{customer.state || "-"}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-500">Postcode</label>
                {isEditing ? (
                  <input
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    placeholder="Postcode"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  />
                ) : (
                  <div className="text-gray-800">{customer.postcode || "-"}</div>
                )}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1">
              <label className="text-sm text-gray-500">Country</label>
              {isEditing ? (
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="CA">Canada</option>
                </select>
              ) : (
                <div className="text-gray-800">
                  {customer.country === "IN" ? "India" : 
                   customer.country === "US" ? "United States" :
                   customer.country === "GB" ? "United Kingdom" :
                   customer.country === "AU" ? "Australia" :
                   customer.country === "CA" ? "Canada" :
                   customer.country || "-"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}