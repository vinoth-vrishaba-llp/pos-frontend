// src/components/catalog/ProductGrid.jsx
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, onProductClick }) {
  // No internal loading/empty states - parent handles these
  
  return (
    <div
      id="product-grid"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          onClick={() => onProductClick(p)}
        />
      ))}
    </div>
  );
}