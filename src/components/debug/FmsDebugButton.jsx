// src/components/debug/FmsDebugButton.jsx
import { useState } from "react";
import { toast } from "sonner";
import { checkFmsStatus } from "@/api/orders.api";

export default function FmsDebugButton() {
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    setLoading(true);
    try {
      const { data } = await checkFmsStatus(10);
      
      console.log("\n" + "=".repeat(70));
      console.log("🔍 FMS STATUS CHECK");
      console.log("=".repeat(70));
      console.log(`Orders checked: ${data.checked}`);
      console.log(`Orders with FMS: ${data.orders_with_fms}`);
      console.log("\nDetails:");
      
      data.orders.forEach((order) => {
        const icon = order.has_fms ? "✅" : "❌";
        console.log(
          `${icon} Order #${order.order_number}: ${order.fms_items}/${order.total_items} items have FMS (${order.total_components} components)`
        );
      });
      
      console.log("=".repeat(70) + "\n");

      if (data.orders_with_fms > 0) {
        toast.success(
          `Found ${data.orders_with_fms} order(s) with FMS components. Check console for details.`,
          { duration: 5000 }
        );
      } else {
        toast.info("No orders with FMS components found in last 10 orders");
      }
    } catch (err) {
      console.error("FMS check failed:", err);
      toast.error("Failed to check FMS status");
    } finally {
      setLoading(false);
    }
  }

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <button
      onClick={handleCheck}
      disabled={loading}
      className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium disabled:opacity-50 z-50"
      title="Check FMS status in recent orders (Dev only)"
    >
      {loading ? "Checking..." : "🔍 Check FMS"}
    </button>
  );
}