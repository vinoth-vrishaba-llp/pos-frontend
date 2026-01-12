// src/components/cart/TotalsFooter.jsx
import { Printer, BadgeCheck } from "lucide-react";

export default function TotalsFooter({
  subtotal = 0,
  discount = 0,
  chargesTotal = 0,
  total = 0,
  paymentMethod,
  onPrint,
  onMarkPaid,
  onResetSale,
  cartLength,
}) {
  const paymentLabel =
    paymentMethod === "cash"
      ? "Paid: Cash"
      : paymentMethod === "upi_card"
        ? "Paid: UPI / Card"
        : "Not marked as paid";

  return (
    <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] space-y-3">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Subtotal</span>
        <span className="font-medium">₹{(subtotal || 0).toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Discount</span>
        <span className="font-medium text-green-600">
          -₹{(discount || 0).toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Additional charges</span>
        <span className="font-medium">₹{(chargesTotal || 0).toLocaleString()}</span>
      </div>

      <div className="flex justify-between text-lg font-bold text-gray-900">
        <span>Total</span>
        <span>₹{(total || 0).toLocaleString()}</span>
      </div>

      <div className="text-[11px] text-gray-500 flex items-center justify-between">
        <span>{paymentLabel}</span>
      </div>

      {/* Primary actions */}
      <div className="flex gap-2">
        <button
          onClick={onPrint}
          className="flex-1 bg-black hover:bg-gray-800 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-md border border-black"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={onMarkPaid}
          className="flex-1 bg-white hover:bg-gray-50 text-black py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-md border border-gray-300"
        >
          <BadgeCheck className="w-4 h-4" />
          Create an Order
        </button>
      </div>

       {/* Start New Sale – full-width, below actions */}
      <button
        onClick={onResetSale}
        disabled={cartLength === 0}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 py-2.5 rounded-lg font-semibold transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start New Sale
      </button>
    </div>
  );
}
