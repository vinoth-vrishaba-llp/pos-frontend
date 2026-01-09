import { useEffect, useState, useRef } from "react";
import { X, MoreVertical } from "lucide-react";
import Barcode from "react-barcode";
import { fetchOrderById, markOrderCompleted, refundOrder } from "@/api/orders.api";
import { toast } from "sonner";

export default function OrderDetailsModal({ wooOrderId, onClose, onStatusUpdated, onReprint }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!wooOrderId) return;

    let mounted = true;
    fetchOrderById(wooOrderId)
      .then((res) => {
        if (mounted) setOrder(res.data);
      })
      .catch(() => toast.error("Failed to load order"));

    return () => {
      mounted = false;
    };
  }, [wooOrderId]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    }

    if (showOptionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showOptionsMenu]);

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

  if (!order) return null;

  const status = (typeof order.status === "object" && order.status !== null)
    ? order.status.value
    : order.status || "unknown";

  async function handleMarkCompleted() {
    if (status === "completed") return;

    setLoading(true);
    try {
      await markOrderCompleted(wooOrderId);
      toast.success("Order marked as completed");

      const fresh = await fetchOrderById(wooOrderId);
      setOrder(fresh.data);
      onStatusUpdated?.(fresh.data);
    } catch (err) {
      console.error("Mark completed error:", err);
      toast.error("Failed to update order");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund() {
    setLoading(true);
    setShowRefundConfirm(false);
    setShowOptionsMenu(false);
    
    try {
      await refundOrder(wooOrderId);
      toast.success("Order refunded successfully");

      const fresh = await fetchOrderById(wooOrderId);
      setOrder(fresh.data);
      onStatusUpdated?.(fresh.data);
    } catch (err) {
      console.error("Refund error:", err);
      toast.error(err.response?.data?.message || "Failed to refund order");
    } finally {
      setLoading(false);
    }
  }

  const {
    subtotal = 0,
    discount = 0,
    chargesTotal = 0,
    grandTotal = 0,
  } = order.totals || {};

  const charges = order.charges || {};

  const canRefund = status !== "refund" && status !== "cancelled";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <div>
              <div className="font-semibold text-sm">Order #{order.order_number}</div>
              <div className="text-[11px] text-gray-500 capitalize">{status}</div>
            </div>
            {/* Date Badge */}
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-medium">
              {formatDateTime(order.created_at)}
            </span>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* CUSTOMER + BARCODE */}
          <div className="flex justify-between items-center gap-3">
            <div>
              <div className="font-semibold mb-1">Customer</div>
              <div>{order.customer_name || "Walk-in Customer"}</div>
            </div>
            <div className="flex flex-col items-center">
              <Barcode value={order.order_number} height={40} width={1} displayValue={false} />
              <div className="font-mono text-[10px] mt-1 text-gray-500">{order.order_number}</div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="border-t pt-3">
            <div className="font-semibold mb-1">Items</div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Item</th>
                  <th className="text-right py-1">Qty</th>
                  <th className="text-right py-1">Price</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>

              <tbody>
                {!Array.isArray(order.items) || order.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">No billable items</td>
                  </tr>
                ) : (
                  order.items.map((it, idx) => (
                    <tr key={it.key ?? `${it.productId ?? "custom"}-${idx}`} className="border-b">
                      <td className="py-1 pr-1">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-[10px] text-gray-500">{(it.sku ? `SKU: ${it.sku} | ` : "")}Sz: {it.size}</div>
                      </td>
                      <td className="py-1 text-right">{it.quantity ?? 0}</td>
                      <td className="py-1 text-right">₹{Number(it.unit_price ?? 0).toFixed(0).toLocaleString()}</td>
                      <td className="py-1 text-right font-semibold">₹{Number(it.line_total?? 0).toFixed(0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL BREAKDOWN */}
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{Number(subtotal).toLocaleString()}</span>
            </div>

            {Number(discount) > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>- ₹{Number(discount).toLocaleString()}</span>
              </div>
            )}

            {Number(charges.alteration) > 0 && (
              <div className="flex justify-between">
                <span>Alteration Charges</span>
                <span>₹{Number(charges.alteration).toLocaleString()}</span>
              </div>
            )}

            {Number(charges.courier) > 0 && (
              <div className="flex justify-between">
                <span>Courier Charges</span>
                <span>₹{Number(charges.courier).toLocaleString()}</span>
              </div>
            )}

            {Number(charges.other) > 0 && (
              <div className="flex justify-between">
                <span>Other Charges</span>
                <span>₹{Number(charges.other).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold pt-1">
              <span>Total</span>
              <span>₹{Number(grandTotal).toFixed(0).toLocaleString()}</span>
            </div>

            <div className="text-[10px] text-gray-500 mt-1">Payment: {order.payment_method ?? "N/A"}</div>
          </div>

          {/* MEASUREMENTS */}
          {order.measurements && String(order.measurements).trim() && (
            <div className="border-t pt-3">
              <div className="font-semibold mb-1">Measurements</div>
              <div className="whitespace-pre-wrap text-[11px] font-mono bg-gray-50 border rounded p-2">{order.measurements}</div>
            </div>
          )}

          {/* NOTES */}
          {order.notes && String(order.notes).trim() && (
            <div className="border-t pt-3">
              <div className="font-semibold mb-1">Notes</div>
              <div className="whitespace-pre-wrap text-[11px] italic text-gray-700">{order.notes}</div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 flex gap-3 justify-end items-center">
          {/* Options Menu (Refund) */}
          <div className="relative mr-auto" ref={menuRef}>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              title="More options"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {showOptionsMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-10">
                <button
                  onClick={() => {
                    if (canRefund) {
                      setShowRefundConfirm(true);
                      setShowOptionsMenu(false);
                    }
                  }}
                  disabled={!canRefund || loading}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    canRefund && !loading
                      ? "hover:bg-red-50 text-red-600"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {status === "refund" ? "Already Refunded" : "Refund Order"}
                </button>
              </div>
            )}
          </div>

          {onReprint && (
            <button
              onClick={() => onReprint(wooOrderId)}
              className="px-4 py-2 rounded font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Reprint
            </button>
          )}
          
          <button
            disabled={status === "completed" || loading}
            onClick={handleMarkCompleted}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              status === "completed" 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {status === "completed" ? "Completed" : (loading ? "Updating..." : "Mark as Completed")}
          </button>
        </div>
      </div>

      {/* REFUND CONFIRMATION MODAL */}
      {showRefundConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-3 text-red-600">Confirm Refund</h3>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to refund order <strong>#{order.order_number}</strong>? 
              This action will update the order status to "Refunded" in both POS and WooCommerce.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRefundConfirm(false)}
                className="px-4 py-2 rounded font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={loading}
                className="px-4 py-2 rounded font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:bg-gray-300"
              >
                {loading ? "Processing..." : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}