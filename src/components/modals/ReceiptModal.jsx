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

  /* =======================
     PRINT HANDLER
  ======================= */
  const handlePrint = () => {
    const el = document.getElementById("print-area");
    if (!el) return;

    const clone = el.cloneNode(true);
    const wrapper = document.createElement("div");
    wrapper.style.width = "80mm";
    wrapper.style.margin = "0 auto";
    wrapper.style.background = "white";
    wrapper.style.padding = "6mm";
    wrapper.appendChild(clone);

    document.body.appendChild(wrapper);

    const cleanup = () => {
      try {
        window.removeEventListener("afterprint", cleanup);
        document.body.removeChild(wrapper);
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
    <div className="fixed inset-0 z-[60] flex justify-center bg-black/60 overflow-y-auto py-10">
      <div className="bg-white w-full max-w-[380px] shadow-2xl relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="no-print absolute top-2 right-2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* PRINT AREA */}
        <div id="print-area" className="p-6 text-xs leading-relaxed">

          {/* HEADER */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase">Aanyasri POS</h1>
            <p>Vijayawada, Andhra Pradesh</p>
            <p>GST: 37CBTPK1800J1ZG</p>
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
          {!isAlterationSlip && (
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left">Item</th>
                  <th className="text-right">Qty</th>
                  {showFullBreakdown && <th className="text-right">Price</th>}
                  {showFullBreakdown && <th className="text-right">Amt</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.key} className="border-b border-dashed">
                    <td className="py-1">
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[10px] text-gray-500">
                        SKU: {item.sku}
                      </div>
                    </td>
                    <td className="text-right">{item.quantity}</td>
                    {showFullBreakdown && (
                      <>
                        <td className="text-right">{money(item.unit_price)}</td>
                        <td className="text-right font-bold">{money(item.line_total)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TOTALS (NO TOTALS ON ALTERATION SLIP) */}
          {!isAlterationSlip && (
            <>
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
            </>
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

          {/* FOOTER */}
          <div className="text-center mt-6 font-bold">
            *** Thank You! Visit Again ***
          </div>
        </div>

        {/* PRINT ACTION */}
        <div className="no-print p-4 border-t">
          <button
            onClick={handlePrint}
            className="w-full bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Now
          </button>
        </div>

      </div>
    </div>
  );
}
