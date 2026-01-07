//frontend/src/components/layout/MainLayout.jsx
export default function MainLayout({ children }) {
  return (
    <div className="flex h-full flex-col md:flex-row text-gray-800">
      <div className="w-full md:w-2/3 flex flex-col h-full bg-white border-r border-gray-200">
        {children[0]}
      </div>
      <div className="w-full md:w-1/3 flex flex-col h-full bg-white relative">
        {children[1]}
      </div>
    </div>
  );
}
