// src/components/modals/PrintOptionsModal.jsx
import { X } from "lucide-react";

export default function PrintOptionsModal({
  isOpen,
  onClose,
  onSelectVariant,
}) {
  if (!isOpen) return null;

  const handleSelect = (variant) => {
    onSelectVariant(variant); // "customer" | "store" | "alteration_slip"
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 modal-base active">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs mx-4 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Choose copy to print
          </h3>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            className="w-full border border-gray-300 rounded-lg py-2.5 text-sm font-bold text-black hover:bg-black hover:text-white transition-colors"
            onClick={() => handleSelect("customer")}
          >
            Customer Copy
          </button>
          <button
            className="w-full border border-gray-300 rounded-lg py-2.5 text-sm font-bold text-black hover:bg-black hover:text-white transition-colors"
            onClick={() => handleSelect("store")}
          >
            Store Copy
          </button>
          <button
            className="w-full border border-gray-300 rounded-lg py-2.5 text-sm font-bold text-black hover:bg-black hover:text-white transition-colors"
            onClick={() => handleSelect("alteration_slip")}
          >
            Alteration Slip
          </button>
        </div>
      </div>
    </div>
  );
}
