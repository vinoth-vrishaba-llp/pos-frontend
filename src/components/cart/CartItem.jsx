// src/components/cart/CartItem.jsx
import { Trash2, RefreshCw } from "lucide-react";

export default function CartItem({ item, index, maxQty, onRemove, onChangeQty, onChangeSize }) {
  const atMax = maxQty != null && item.qty >= maxQty;
  const showMaxHint = maxQty != null;
  const isVariable = item.product.type === "variable";

  return (
    <div className="flex items-start gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
      <img
        src={item.product.image}
        className="w-12 h-12 rounded object-cover bg-gray-100"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h5
            className={`text-sm font-medium text-gray-900 truncate pr-2 ${
              isVariable ? "cursor-pointer hover:text-blue-600 hover:underline" : ""
            }`}
            onClick={() => isVariable && onChangeSize?.(index)}
            title={isVariable ? "Click to change size" : ""}
          >
            {item.product.name}
          </h5>
          <button
            onClick={() => onRemove(index)}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          <span>Size: {item.variation?.attributes?.Size || item.variation?.size || "Default"}</span>
          {isVariable && (
            <button
              onClick={() => onChangeSize?.(index)}
              className="text-blue-500 hover:text-blue-700"
              title="Change size"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
          {showMaxHint && (
            <span className="ml-1 text-[10px] text-gray-400">
              (Max {maxQty} total)
            </span>
          )}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center border rounded">
            <button
              onClick={() => onChangeQty(index, -1)}
              className="px-2 py-0.5 text-gray-600 hover:bg-gray-100"
            >
              -
            </button>
            <span className="px-2 text-xs font-semibold">{item.qty}</span>
            <button
              onClick={() => !atMax && onChangeQty(index, 1)}
              disabled={atMax}
              className={`px-2 py-0.5 text-gray-600 ${
                atMax
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              +
            </button>
          </div>
          <span className="font-semibold text-sm">
            ₹{(Number(item.product.price) * item.qty).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
