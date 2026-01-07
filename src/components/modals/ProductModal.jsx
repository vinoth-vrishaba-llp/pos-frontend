import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  fetchProductById,
  fetchProductVariations,
} from "@/api/products.api";

export default function ProductModal({
  isOpen,
  product,
  selectedSize,
  setSelectedSize,
  onClose,
  onAddToCart,
}) {
  const [fullProduct, setFullProduct] = useState(null);
  const [variations, setVariations] = useState([]);

  useEffect(() => {
    if (!isOpen || !product?.id) return;

    Promise.all([
      fetchProductById(product.id),
      fetchProductVariations(product.id),
    ]).then(([pRes, vRes]) => {
      setFullProduct(pRes.data);
      setVariations(vRes.data);
      setSelectedSize(null);
    });
  }, [isOpen, product]);

  if (!isOpen || !fullProduct) return null;

  const isVariable = fullProduct.type === "variable";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* IMAGE */}
        <div className="relative aspect-[3/4] bg-gray-100 flex items-center justify-center">
          <img
            src={fullProduct.image}
            alt={fullProduct.name}
            className="w-full h-full object-contain"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-5 space-y-4">
          <h3 className="text-lg font-bold">{fullProduct.name}</h3>

          {/* SIZE SELECTOR */}
          {isVariable && (
            <div>
              <p className="text-xs font-semibold mb-2">Select Size</p>
              <div className="grid grid-cols-4 gap-2">
                {variations.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.stock_quantity <= 0}
                    onClick={() => setSelectedSize(v)}
                    className={`border rounded px-2 py-1 text-xs
                      ${
                        selectedSize?.id === v.id
                          ? "bg-black text-white"
                          : "bg-white"
                      }
                      ${v.stock_quantity <= 0 && "opacity-40 cursor-not-allowed"}
                    `}
                  >
                    {v.size}
                    <div className="text-[10px]">
                      {v.stock_quantity > 0
                        ? `${v.stock_quantity} left`
                        : "Out"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ADD TO CART */}
          <button
            disabled={isVariable && !selectedSize}
            onClick={() =>
              onAddToCart({
                product: {
                  id: fullProduct.id,
                  name: fullProduct.name,
                  price: Number(fullProduct.price),
                  image: fullProduct.image,
                  type: fullProduct.type,
                  fms_components: fullProduct.fms_components || [],
                },
                variation: isVariable
                  ? {
                      id: selectedSize.id,
                      size: selectedSize.size,
                      stock_quantity: selectedSize.stock_quantity,
                      sku: selectedSize.sku,
                    }
                  : null,
                qty: 1,
              })
            }
            className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50"
          >
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}
