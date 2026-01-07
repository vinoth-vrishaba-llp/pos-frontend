import { UserPlus } from "lucide-react";

export default function CustomerSection({ currentCustomer, onOpenCustomerModal }) {
  const display =
    currentCustomer?.name
      ? `${currentCustomer.name}${currentCustomer.phone ? ` (${currentCustomer.phone})` : ""}`
      : "Walk-in Customer";

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Customer
        </span>
        <button
          onClick={onOpenCustomerModal}
          className="text-black hover:text-gray-700 text-sm font-bold flex items-center gap-1 underline underline-offset-2"
        >
          <UserPlus className="w-4 h-4" />
          Add / Select
        </button>
      </div>
      <div className="text-gray-900 font-medium truncate">
        {display}
      </div>
    </div>
  );
}
