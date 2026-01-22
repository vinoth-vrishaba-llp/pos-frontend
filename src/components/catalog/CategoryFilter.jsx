// src/components/catalog/CategoryFilter.jsx

// Decode HTML entities (e.g., &amp; -> &)
function decodeHtmlEntities(text) {
  if (!text) return text;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

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
      <style>{`
        .category-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .category-scrollbar::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .category-scrollbar::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 4px;
        }
        .category-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
      <div 
        className="category-scrollbar flex gap-2 overflow-x-auto py-2 pb-3" 
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#9ca3af #e5e7eb'
        }}
        onWheel={(e) => {
          e.currentTarget.scrollLeft += e.deltaY;
        }}
      >
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
              {decodeHtmlEntities(c.name)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
