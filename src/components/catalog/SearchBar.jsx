import { useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { lookupBySku } from "../../api/products.api";
import { useSearchFocus } from "../../hooks/useSearchFocus";

export default function SearchBar({
  searchQuery,
  onSearchChange,
  onProductFound,
}) {
  const inputRef = useSearchFocus(true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleKeyDown(e) {
    if (e.key !== "Enter") return;

    const value = searchQuery.trim();
    if (!value) return;

    console.log(`\n⌨️ ENTER pressed with query: "${value}"`);

    try {
      // 🔍 Try SKU / barcode lookup first
      console.log(`   → Attempting SKU lookup...`);
      const res = await lookupBySku(value);
      const results = res.data?.data || [];

      console.log(`   → SKU lookup returned ${results.length} results`);

      if (results.length === 1) {
        console.log(`   ✅ Single exact match found, opening product modal`);
        onProductFound(results[0]); // open modal
        onSearchChange(""); // clear after success
        return;
      } else if (results.length > 1) {
        console.log(`   ℹ️ Multiple matches found (${results.length}), showing in grid`);
        // Multiple results - let the search display them in grid
        return;
      } else {
        console.log(`   ℹ️ No exact match, continuing with text search`);
      }
    } catch (err) {
      // ignore, fallback to normal search
      console.warn("⚠️ SKU lookup failed, fallback to text search:", err.message);
    }

    // fallback: keep search text and let ProductCatalog handle it
    console.log(`   → Continuing with text search for: "${value}"`);
  }

  function handleChange(e) {
    const value = e.target.value;
    console.log(`🔤 Search input changed: "${value}"`);
    onSearchChange(value);
  }

  return (
    <div className="flex gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Scan barcode or search product"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-black
                     font-mono tracking-wide"
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>

      <button
        type="button"
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
        title="Filters (future)"
      >
        <SlidersHorizontal className="w-6 h-6" />
      </button>
    </div>
  );
}