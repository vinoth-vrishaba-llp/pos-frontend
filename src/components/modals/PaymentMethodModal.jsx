// src/components/modals/PaymentMethodModal.jsx
import { X, Wallet, Smartphone } from "lucide-react";

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSelectMethod,
}) {
  if (!isOpen) return null;

  const handleSelect = (method) => {
    onSelectMethod(method); // "cash" | "upi_card"
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 modal-base active">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Mark as paid
          </h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-[11px] text-gray-500 mb-3">
          Select how the customer paid for this order.
        </p>

        <div className="space-y-2">
          <button
            className="w-full border border-gray-300 rounded-lg py-3 text-sm font-bold text-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
            onClick={() => handleSelect("cash")}
          >
            <Wallet className="w-4 h-4" />
            Paid by Cash
          </button>
          <button
            className="w-full border border-gray-300 rounded-lg py-3 text-sm font-bold text-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
            onClick={() => handleSelect("upi_card")}
          >
            <Smartphone className="w-4 h-4" />
            Paid by UPI / Card
          </button>
        </div>
      </div>
    </div>
  );
}
