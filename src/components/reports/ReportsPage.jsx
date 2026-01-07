// src/components/reports/ReportsPage.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { fetchDashboardReport } from "@/api/reports.api";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  Calendar,
  DollarSign,
  Tag,
} from "lucide-react";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateFilter, setDateFilter] = useState("week");
  const [customDates, setCustomDates] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    try {
      let params = {};

      if (dateFilter === "custom") {
        if (!customDates.start || !customDates.end) {
          toast.error("Please select both start and end dates");
          setLoading(false);
          return;
        }
        params = {
          date_min: customDates.start,
          date_max: customDates.end,
        };
      } else {
        params = { period: dateFilter };
      }

      const res = await fetchDashboardReport(params);
      setReportData(res.data.data);
      toast.success("Reports loaded");
    } catch (err) {
      console.error("Failed to load reports:", err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(filter) {
    setDateFilter(filter);
  }

  function handleApplyCustomDates() {
    if (!customDates.start || !customDates.end) {
      toast.error("Please select both dates");
      return;
    }
    loadReport();
  }

  const sales = reportData?.sales?.[0] || {};
  const totals = reportData?.totals || {};

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          View sales performance and business insights
        </p>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              handleFilterChange("week");
              setTimeout(loadReport, 0);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              dateFilter === "week"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last 7 Days
          </button>

          <button
            onClick={() => {
              handleFilterChange("month");
              setTimeout(loadReport, 0);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              dateFilter === "month"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            This Month
          </button>

          <button
            onClick={() => {
              handleFilterChange("last_month");
              setTimeout(loadReport, 0);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              dateFilter === "last_month"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Last Month
          </button>

          <button
            onClick={() => handleFilterChange("custom")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              dateFilter === "custom"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Custom Range
          </button>

          {dateFilter === "custom" && (
            <>
              <input
                type="date"
                value={customDates.start}
                onChange={(e) =>
                  setCustomDates((p) => ({ ...p, start: e.target.value }))
                }
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customDates.end}
                onChange={(e) =>
                  setCustomDates((p) => ({ ...p, end: e.target.value }))
                }
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
              <button
                onClick={handleApplyCustomDates}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Apply
              </button>
            </>
          )}

          <button
            onClick={loadReport}
            disabled={loading}
            className="ml-auto px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && !reportData ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading reports...</div>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Sales Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                label="Total Sales"
                value={`₹${Number(sales.total_sales || 0).toLocaleString("en-IN")}`}
                color="blue"
              />
              <StatCard
                icon={<ShoppingCart className="w-6 h-6" />}
                label="Orders"
                value={sales.total_orders || 0}
                color="green"
              />
              <StatCard
                icon={<Package className="w-6 h-6" />}
                label="Items Sold"
                value={sales.total_items || 0}
                color="purple"
              />
              <StatCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="Avg Order Value"
                value={`₹${Number(
                  (sales.total_sales || 0) / (sales.total_orders || 1)
                ).toFixed(0)}`}
                color="orange"
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<Tag className="w-6 h-6" />}
                label="Discounts Given"
                value={`₹${Number(sales.total_discount || 0).toLocaleString("en-IN")}`}
                color="red"
                small
              />
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                label="Shipping Charged"
                value={`₹${Number(sales.total_shipping || 0).toLocaleString("en-IN")}`}
                color="indigo"
                small
              />
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                label="Net Revenue"
                value={`₹${Number(sales.net_sales || 0).toLocaleString("en-IN")}`}
                color="green"
                small
              />
            </div>

            {/* Top Sellers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Top Selling Products
                </h2>
              </div>
              <div className="p-6">
                {reportData.topSellers?.length > 0 ? (
                  <div className="space-y-3">
                    {reportData.topSellers.slice(0, 10).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold text-gray-400 w-6">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              Product ID: {item.product_id}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {item.quantity} sold
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available
                  </div>
                )}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {totals.orders && Object.entries(totals.orders).map(([status, count]) => (
                <div
                  key={status}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="text-sm text-gray-500 capitalize">
                    {status.replace(/-/g, " ")} Orders
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No data available</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, small = false }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-500">{label}</div>
          <div className={`font-bold text-gray-900 ${small ? "text-xl" : "text-2xl"} mt-1`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}