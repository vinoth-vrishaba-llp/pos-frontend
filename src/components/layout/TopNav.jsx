// src/components/layout/TopNav.jsx
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "@/api/auth.api";
import { clearAuth } from "@/utils/authStorage";

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeView =
    location.pathname === "/orders"
      ? "orders"
      : location.pathname === "/customers"
      ? "customers"
      : location.pathname === "/reports"
      ? "reports"
      : "pos";

  async function handleLogout() {
    try {
      await logout(); // 🔐 clears refresh cookie on backend
    } finally {
      clearAuth(); // removes access token
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-black text-white shadow-md">
      {/* Left - Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/web-logo-gold.webp"
          alt="Aanyasri POS"
          className="h-10 w-auto object-contain"
        />
        <span className="font-bold text-lg tracking-wide text-yellow-500 hidden">
          Aanyasri POS
        </span>
      </div>

      {/* Center - Navigation */}
      <div className="flex gap-4 text-xs font-medium">
        <button
          className={`px-5 py-2 rounded-full border ${
            activeView === "pos"
              ? "bg-white text-black"
              : "text-gray-300 border-gray-700"
          }`}
          onClick={() => navigate("/")}
        >
          Billing
        </button>

        <button
          className={`px-5 py-2 rounded-full border ${
            activeView === "orders"
              ? "bg-white text-black"
              : "text-gray-300 border-gray-700"
          }`}
          onClick={() => navigate("/orders")}
        >
          Orders
        </button>

        <button
          className={`px-5 py-2 rounded-full border ${
            activeView === "customers"
              ? "bg-white text-black"
              : "text-gray-300 border-gray-700"
          }`}
          onClick={() => navigate("/customers")}
        >
          Customers
        </button>

        <button
          className={`px-5 py-2 rounded-full border ${
            activeView === "reports"
              ? "bg-white text-black"
              : "text-gray-300 border-gray-700"
          }`}
          onClick={() => navigate("/reports")}
        >
          Reports
        </button>
      </div>

      {/* Right - Logout */}
      <button
        onClick={handleLogout}
        className="text-xs px-5 py-2 rounded-full border bg-gray-900 text-gray-300 hover:bg-red-900 hover:text-red-100 transition"
      >
        Logout
      </button>
    </header>
  );
}