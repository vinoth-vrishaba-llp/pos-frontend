// src/components/debug/SearchTestComponent.jsx
// Temporary component for testing search functionality
// Add this to your ProductCatalog component temporarily to debug

import { useState } from "react";
import { searchProducts, lookupBySku } from "../../api/products.api";

export default function SearchTestComponent() {
  const [testQuery, setTestQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function testSearch() {
    if (!testQuery.trim()) return;
    
    setLoading(true);
    console.log("\n🧪 === SEARCH TEST ===");
    console.log("Query:", testQuery);
    
    try {
      // Test searchProducts
      console.log("\n1️⃣ Testing searchProducts()...");
      const searchRes = await searchProducts(testQuery);
      console.log("searchProducts result:", searchRes.data);
      
      // Test lookupBySku
      console.log("\n2️⃣ Testing lookupBySku()...");
      const skuRes = await lookupBySku(testQuery);
      console.log("lookupBySku result:", skuRes.data);
      
      setResults({
        search: searchRes.data?.data || [],
        sku: skuRes.data?.data || [],
      });
      
      console.log("🧪 === TEST COMPLETE ===\n");
    } catch (err) {
      console.error("❌ Test failed:", err);
      setResults({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Search Test Tool</h3>
      
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={testQuery}
          onChange={(e) => setTestQuery(e.target.value)}
          placeholder="Enter SKU or name (e.g., LF157)"
          className="flex-1 px-2 py-1 border rounded text-sm"
          onKeyDown={(e) => e.key === "Enter" && testSearch()}
        />
        <button
          onClick={testSearch}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-400"
        >
          {loading ? "..." : "Test"}
        </button>
      </div>

      {results && (
        <div className="text-xs space-y-2 max-h-60 overflow-y-auto">
          {results.error ? (
            <div className="text-red-600">Error: {results.error}</div>
          ) : (
            <>
              <div className="border-t pt-2">
                <strong>searchProducts():</strong> {results.search.length} results
                {results.search.slice(0, 3).map(p => (
                  <div key={p.id} className="ml-2 text-gray-600">
                    • {p.name} ({p.sku})
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-2">
                <strong>lookupBySku():</strong> {results.sku.length} results
                {results.sku.slice(0, 3).map(p => (
                  <div key={p.id} className="ml-2 text-gray-600">
                    • {p.name} ({p.sku})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        Check browser console for detailed logs
      </div>
    </div>
  );
}

// Usage: Add to ProductCatalog.jsx temporarily:
// import SearchTestComponent from "../debug/SearchTestComponent";
// 
// Then in the return statement, add:
// <SearchTestComponent />