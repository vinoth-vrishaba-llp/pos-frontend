//frontend/src/components/layout/MainLayout.jsx
export default function MainLayout({ children }) {
  return (
    <div className="flex h-full flex-col md:flex-row text-gray-800">
      {/* Product Catalog - 60% width */}
      <div className="w-full md:w-[60%] flex flex-col h-full bg-white border-r border-gray-200">
        {children[0]}
      </div>
      {/* Cart Panel - 40% width */}
      <div className="w-full md:w-[40%] flex flex-col h-full bg-white relative">
        {children[1]}
      </div>
    </div>
  );
}