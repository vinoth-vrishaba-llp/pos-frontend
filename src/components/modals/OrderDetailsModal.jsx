import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Barcode from "react-barcode";
import { fetchOrderById, markOrderCompleted } from "@/api/orders.api";
import { toast } from "sonner";

export default function OrderDetailsModal({ wooOrderId, onClose, onStatusUpdated, onReprint }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

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

  if (!order) return null;

  const status = (typeof order.status === "object" && order.status !== null)
    ? order.status.value
    : order.status || "unknown";

  async function handleMarkCompleted() {
    if (status === "completed") return;

    setLoading(true);
    try {
      // mark complete on server
      await markOrderCompleted(wooOrderId);
      toast.success("Order marked as completed");

      // ALWAYS re-fetch normalized order from server so frontend state matches server normalization
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

  const {
    subtotal = 0,
    discount = 0,
    chargesTotal = 0,
    grandTotal = 0,
  } = order.totals || {};

  const charges = order.charges || {};

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <div className="font-semibold text-sm">Order #{order.order_number}</div>
            <div className="text-[11px] text-gray-500 capitalize">{status}</div>
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
        <div className="border-t p-4 flex gap-3 justify-end">
          {onReprint && (
            <button
              onClick={() => onReprint(wooOrderId)}
              className="px-4 py-2 rounded font-medium border border-gray-300 hover:bg-gray-50"
            >
              Reprint
            </button>
          )}
          <button
            disabled={status === "completed" || loading}
            onClick={handleMarkCompleted}
            className={`px-4 py-2 rounded font-medium ${status === "completed" ? "bg-gray-300 cursor-not-allowed" : "bg-black text-white"}`}
          >
            {status === "completed" ? "Completed" : (loading ? "Updating..." : "Mark as Completed")}
          </button>
        </div>
      </div>
    </div>
  );
}