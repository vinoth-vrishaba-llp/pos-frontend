// src/components/catalog/CategoryFilter.jsx
export default function CategoryFilter({
  categories = [],
  selectedCategory,
  onCategoryChange,
  loading,
}) {
  if (loading) {
    return (
      <div className="flex gap-2 py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-20 rounded-full bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
        {categories.map((c) => {
          const isActive = selectedCategory?.id === c.id;

          return (
            <button
              key={c.id}
              onClick={() => onCategoryChange(c)}
              className={`
                shrink-0 px-4 py-1.5 rounded-full text-xs font-medium
                border transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? "bg-black text-white border-black shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:border-black hover:text-black"}
              `}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
