// src/components/catalog/ProductCard.jsx
export default function ProductCard({ product, onClick }) {
  const outOfStock =
    product.stock_status === "outofstock" || product.purchasable === false;

  return (
    <div
      onClick={!outOfStock ? onClick : undefined}
      className={`
        relative bg-white rounded-lg border border-gray-200 overflow-hidden
        transition-all duration-300
        ${outOfStock
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-black hover:shadow-lg group"}
      `}
    >
      {/* IMAGE */}
      <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className={`
            w-full h-full object-contain transition duration-500
            ${!outOfStock && "group-hover:scale-105"}
          `}
        />

        {/* OUT OF STOCK OVERLAY */}
        {outOfStock && (
          <>
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-3 py-1 text-xs font-bold tracking-widest text-white uppercase border border-white line-through">
                Out of Stock
              </span>
            </div>
          </>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 text-sm truncate">
          {product.name}
        </h4>
        <p className="text-[11px] text-gray-500 mt-0.5">
          SKU: {product.sku}
        </p>
        <p className="text-black font-bold mt-1 text-base">
          ₹{Number(product.price).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
