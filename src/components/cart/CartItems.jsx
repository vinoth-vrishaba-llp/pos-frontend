// src/components/cart/CartItems.jsx
import { ShoppingBag } from "lucide-react";
import CartItem from "./CartItem";

export default function CartItems({ cart, onRemoveItem, onChangeQty, onChangeSize }) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <ShoppingBag className="w-12 h-12 mb-2 opacity-50" />
        <p>Bag is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cart.map((item, idx) => {
        // ✅ Calculate max quantity at PRODUCT level (not variation level)
        // For fabric orders, stock is shared across ALL sizes
        const productStock = item.product.stock_quantity != null 
          ? item.product.stock_quantity 
          : null;
        
        // Calculate total already in cart for this product (all sizes combined)
        const totalInCart = cart
          .filter(ci => ci.product.id === item.product.id)
          .reduce((sum, ci) => sum + ci.qty, 0);

        // Max quantity is the product stock (not variation stock)
        const maxQty = productStock;

        return (
          <CartItem
            key={`${item.product.id}-${item.variation?.id || "default"}-${idx}`}
            item={item}
            index={idx}
            maxQty={maxQty}
            totalInCart={totalInCart}
            onRemove={onRemoveItem}
            onChangeQty={onChangeQty}
            onChangeSize={onChangeSize}
          />
        );
      })}
    </div>
  );
}