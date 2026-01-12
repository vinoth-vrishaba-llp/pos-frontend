import { useEffect, useState, useMemo } from "react";
import { fetchCustomers, updateCustomer } from "@/api/customers.api";
import { Search, Loader, Tag } from "lucide-react";
import { useSearchFocus } from "../../hooks/useSearchFocus";
import CustomerDetailsModal from "../modals/CustomerDetailsModal";

/* ---------- Sort Icon ---------- */
function SortIcon({ active, direction }) {
  if (!active) return <span className="ml-1 text-xs text-gray-400">↕</span>;
  return (
    <span className="ml-1 text-xs text-black">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

/* ---------- Customer Type Badge ---------- */
function CustomerTypeBadge({ type }) {
  const colors = {
    "Walk-in customer": "bg-gray-100 text-gray-700",
    "WhatsApp customer": "bg-green-100 text-green-700",
    "Social media customer": "bg-blue-100 text-blue-700",
  };
  
  const color = colors[type] || "bg-gray-100 text-gray-700";
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Tag className="w-3 h-3" />
      {type || "Walk-in customer"}
    </span>
  );
}

export default function CustomerListPage({ customers: propsCustomers = [] }) {
  const searchRef = useSearchFocus(true);

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  /* ---------- SORT STATE ---------- */
  const [sortConfig, setSortConfig] = useState({
    key: null, // name | phone | email | customer_type | created_at
    direction: "asc",
  });

  useEffect(() => {
    if (propsCustomers.length > 0) {
      setCustomers(propsCustomers);
      setHasMore(false);
    } else {
      loadCustomers(1);
    }
  }, [propsCustomers]);

  const loadCustomers = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await fetchCustomers({ page: pageNum, limit: 20 });
      const data = res?.results || res?.data?.results || [];

      setCustomers((prev) =>
        pageNum === 1 ? data : [...prev, ...data]
      );

      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SEARCH ---------- */
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.phone} ${c.email} ${c.customer_type || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  /* ---------- SORT ---------- */
  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return filteredCustomers;

    const sorted = [...filteredCustomers].sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case "name":
          aVal = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
          bVal = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
          break;

        case "phone":
          aVal = a.phone || "";
          bVal = b.phone || "";
          break;

        case "email":
          aVal = a.email || "";
          bVal = b.email || "";
          break;

        case "customer_type":
          aVal = a.customer_type || "Walk-in customer";
          bVal = b.customer_type || "Walk-in customer";
          break;

        case "created_at":
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;

        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredCustomers, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

 async function handleUpdateCustomer(customerId, updatedData) {
  const [firstName, ...lastNameParts] = updatedData.name.split(" ");
  
  // ✅ NEW: Validate at least one contact method
  if (!updatedData.phone?.trim() && !updatedData.email?.trim()) {
    alert("At least one contact method (phone or email) is required!");
    return;
  }
  
  try {
    await updateCustomer(customerId, {
      first_name: firstName,
      last_name: lastNameParts.join(" "),
      email: updatedData.email,
      phone: updatedData.phone,
      billing: { 
        address_1: updatedData.address_1,
        address_2: updatedData.address_2,
        city: updatedData.city,
        state: updatedData.state,
        postcode: updatedData.postcode,
        country: updatedData.country,
      },
      meta_data: [
        {
          key: "customer_type",
          value: updatedData.customer_type
        }
      ]
    });

    setCustomers((prev) =>
      prev.map((c) =>
        (c.woo_customer_id || c.id) === customerId
          ? {
              ...c,
              first_name: firstName,
              last_name: lastNameParts.join(" "),
              email: updatedData.email,
              phone: updatedData.phone,
              address_1: updatedData.address_1,
              address_2: updatedData.address_2,
              city: updatedData.city,
              state: updatedData.state,
              postcode: updatedData.postcode,
              country: updatedData.country,
              customer_type: updatedData.customer_type,
            }
          : c
      )
    );

    setSelectedCustomer(null);
  } catch (error) {
    console.error("Failed to update customer:", error);
    alert(error.response?.data?.message || "Failed to update customer");
  }
}

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-3">Customers</h1>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, email, type…"
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto bg-white rounded-lg border">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th
                className="px-6 py-3 font-medium cursor-pointer select-none"
                onClick={() => toggleSort("name")}
              >
                Customer
                <SortIcon
                  active={sortConfig.key === "name"}
                  direction={sortConfig.direction}
                />
              </th>

              <th
                className="px-6 py-3 font-medium cursor-pointer select-none"
                onClick={() => toggleSort("customer_type")}
              >
                Type
                <SortIcon
                  active={sortConfig.key === "customer_type"}
                  direction={sortConfig.direction}
                />
              </th>

              <th
                className="px-6 py-3 font-medium cursor-pointer select-none"
                onClick={() => toggleSort("phone")}
              >
                Phone
                <SortIcon
                  active={sortConfig.key === "phone"}
                  direction={sortConfig.direction}
                />
              </th>

              <th
                className="px-6 py-3 font-medium cursor-pointer select-none"
                onClick={() => toggleSort("email")}
              >
                Email
                <SortIcon
                  active={sortConfig.key === "email"}
                  direction={sortConfig.direction}
                />
              </th>

              <th
                className="px-6 py-3 font-medium cursor-pointer select-none"
                onClick={() => toggleSort("created_at")}
              >
                Joined
                <SortIcon
                  active={sortConfig.key === "created_at"}
                  direction={sortConfig.direction}
                />
              </th>

              <th className="px-6 py-3 text-right font-medium">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedCustomers.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                  No customers found
                </td>
              </tr>
            )}

            {sortedCustomers.map((c) => (
              <tr
                key={c.woo_customer_id || c.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium">
                  {c.first_name} {c.last_name}
                </td>
                <td className="px-6 py-4">
                  <CustomerTypeBadge type={c.customer_type} />
                </td>
                <td className="px-6 py-4">{c.phone || "-"}</td>
                <td className="px-6 py-4">{c.email || "-"}</td>
                <td className="px-6 py-4">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="font-medium text-black hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center">
                  <Loader className="inline w-4 h-4 animate-spin text-gray-400" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {!loading && hasMore && (
        <button
          onClick={() => loadCustomers(page + 1)}
          className="mt-4 self-center px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2"
        >
          Load more
        </button>
      )}

      {selectedCustomer && (
        <CustomerDetailsModal
          customer={{
            id: selectedCustomer.woo_customer_id || selectedCustomer.id,
            name: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
            phone: selectedCustomer.phone,
            email: selectedCustomer.email,
            address_1: selectedCustomer.address || "",
            address_2: selectedCustomer.address_line_2 || selectedCustomer.address_2 || "",
            city: selectedCustomer.city || "",
            state: selectedCustomer.state || "",
            postcode: selectedCustomer.postcode || "",
            country: selectedCustomer.country || "IN",
            customer_type: selectedCustomer.customer_type || "Walk-in customer",
            joinedAt: selectedCustomer.created_at,
          }}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={(data) =>
            handleUpdateCustomer(
              selectedCustomer.woo_customer_id || selectedCustomer.id,
              data
            )
          }
        />
      )}
    </div>
  );
}