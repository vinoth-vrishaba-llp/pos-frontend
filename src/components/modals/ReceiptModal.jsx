// src/components/modals/ReceiptModal.jsx
import { X, Printer } from "lucide-react";
import Barcode from "react-barcode";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function ReceiptModal({
  isOpen,
  onClose,
  order,
  variant = "customer", // "customer" | "store" | "alteration_slip"
}) {
  // ❌ FAIL HARD — POS SHOULD NEVER PRINT PARTIAL DATA
  if (
    !isOpen ||
    !order ||
    !order.totals ||
    !Array.isArray(order.items)
  ) {
    return null;
  }

  /* =======================
     DESTRUCTURE (SAFE)
  ======================= */
  const {
    order_number,
    payment_method,
    items,
    totals,
    charges,
    discount_details,
    order_type,
    notes,
    measurements,
    created_at,
  } = order;

  const discountAmount = Number(discount_details?.amount || 0);

  const date = new Date(created_at);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isStoreCopy = variant === "store";
  const isCustomerCopy = variant === "customer";
  const isAlterationSlip = variant === "alteration_slip";

  const headingTitle = isAlterationSlip
    ? "Alteration Slip"
    : `Sales Bill${isStoreCopy ? " (Store Copy)" : " (Customer Copy)"}`;

  const paymentLabel =
    payment_method === "cash"
      ? "Cash"
      : payment_method === "upi_card"
      ? "UPI / Card"
      : "Not Recorded";

  const showMeasurements =
    !!measurements && measurements !== "-" && !isCustomerCopy;

  const showNotes = !!notes?.trim();
  const showFullBreakdown = isStoreCopy && !isAlterationSlip;

  // ✅ Show price column for customer copy and alteration slip
  const showPriceColumn = isCustomerCopy || isAlterationSlip;

  // ✅ Check if alteration charge exists (for alteration pickup message)
  const hasAlterationCharge = charges?.alteration > 0;

  /* =======================
     PRINT HANDLER
  ======================= */
  const handlePrint = () => {
    const el = document.getElementById("print-area");
    if (!el) return;

    const clone = el.cloneNode(true);
    clone.id = "print-area-clone"; // Match CSS targeting
    
    // Remove any existing clone
    const existingClone = document.getElementById("print-area-clone");
    if (existingClone) {
      document.body.removeChild(existingClone);
    }

    document.body.appendChild(clone);

    const cleanup = () => {
      try {
        window.removeEventListener("afterprint", cleanup);
        const cloneToRemove = document.getElementById("print-area-clone");
        if (cloneToRemove) {
          document.body.removeChild(cloneToRemove);
        }
      } catch {}
    };

    window.addEventListener("afterprint", cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1000);
    }, 150);
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-start bg-black/70 overflow-y-auto py-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="bg-white w-full max-w-[380px] shadow-2xl relative" style={{ backgroundColor: '#ffffff' }}>

        {/* Close */}
        <button
          onClick={onClose}
          className="no-print absolute top-2 right-2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* PRINT AREA */}
        <div id="print-area" className="p-6 text-xs leading-relaxed">

          {/* HEADER */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase">Aanyasri POS</h1>
            <p className="text-[10px] leading-tight mt-1">
              Plot No 68, Municipal Employees Colony,
              <br />
              Vijayawada, Andhra Pradesh
            </p>
            <p className="text-[10px] mt-1">Phone: +91 8977945675</p>
            <p className="text-[10px]">GST: 37CBTPK1800J1ZG</p>
          </div>

          {/* TITLE */}
          <div className="text-center font-bold uppercase mb-2">
            {headingTitle}
          </div>

          {/* BARCODE */}
          <div className="flex justify-center mb-3">
            <Barcode
              value={order_number}
              height={40}
              width={1}
              displayValue={false}
            />
          </div>

          <div className="border-b-2 border-dashed my-2" />

          {/* META */}
          <div className="flex justify-between"><span>Invoice:</span><span>{order_number}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>Time:</span><span>{timeStr}</span></div>
          <div className="flex justify-between"><span>Payment:</span><span>{paymentLabel}</span></div>

          <div className="border-b-2 border-dashed my-2" />

          {/* ITEMS */}
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b">
                <th className="text-left">Item</th>
                <th className="text-right">Qty</th>
                {(showFullBreakdown || showPriceColumn) && <th className="text-right">Price</th>}
                {showFullBreakdown && <th className="text-right">Amt</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key} className="border-b border-dashed">
                  <td className="py-1">
                    <div className="font-bold">{item.name}</div>
                  </td>
                  <td className="text-right">{item.quantity}</td>
                  {(showFullBreakdown || showPriceColumn) && (
                    <td className="text-right">{money(item.unit_price)}</td>
                  )}
                  {showFullBreakdown && (
                    <td className="text-right font-bold">{money(item.line_total)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="border-b-2 border-dashed my-2" />

          {showFullBreakdown && (
            <>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{money(totals.subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>- {money(discountAmount)}</span>
                </div>
              )}
            </>
          )}

          {charges?.alteration > 0 && (
            <div className="flex justify-between">
              <span>Alteration:</span>
              <span>{money(charges.alteration)}</span>
            </div>
          )}

          {charges?.courier > 0 && (
            <div className="flex justify-between">
              <span>Courier:</span>
              <span>{money(charges.courier)}</span>
            </div>
          )}

          {charges?.other > 0 && (
            <div className="flex justify-between">
              <span>Other:</span>
              <span>{money(charges.other)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-sm mt-2">
            <span>TOTAL:</span>
            <span>{money(totals.grandTotal)}</span>
          </div>

          {/* ✅ ALTERATION PICKUP MESSAGE - Show if alteration charge exists (customer copy or alteration slip) */}
          {(isCustomerCopy || isAlterationSlip) && hasAlterationCharge && (
            <div className="mt-4 p-3 bg-gray-100 border-2 border-gray-300 rounded">
              <p className="text-center font-bold text-sm">
                ⏰ Pickup after 3 days of payment
              </p>
            </div>
          )}


          {/* NOTES */}
          {showNotes && (
            <div className="mt-3">
              <span className="font-bold underline">Notes:</span>
              <p className="italic mt-1">{notes}</p>
            </div>
          )}

          {/* MEASUREMENTS */}
          {showMeasurements && (
            <div className="mt-3">
              <span className="font-bold underline">Measurements:</span>
              <pre className="mt-1 p-2 border text-[10px] whitespace-pre-wrap">
                {measurements}
              </pre>
            </div>
          )}

          {/* ✅ TERMS & CONDITIONS - Show on all copies */}
          <div className="border-b-2 border-dashed my-3" />
          
          <div className="mt-3">
            <p className="font-bold text-center mb-2">Terms & Conditions</p>
            <div className="text-[10px] leading-relaxed space-y-1">
              <p>• No Exchange, No Returns / Refunds</p>
              <p>• Damages are to be checked while billing</p>
              <p>• Physical bill must be carried for alteration or advance booking pickup</p>
              <p>• Fixed prices, No bargaining</p>
              <p>• First wash, Dry wash only</p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="text-center mt-6 font-bold">
            *** Thank You! Visit Again ***
          </div>
        </div>

        {/* PRINT ACTION */}
        <div className="no-print p-4 border-t">
          <button
            onClick={handlePrint}
            className="w-full bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Now
          </button>
        </div>
      </div>
    </div>
  );
}