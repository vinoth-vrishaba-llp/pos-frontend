// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { getAccessToken } from "./utils/authStorage";
import { fetchCustomers } from "./api/customers.api";
import { fetchCategories } from "./api/categories.api";
import { createOrder, fetchOrderById } from "./api/orders.api";

import { defaultMeasurements } from "./data/mockData";

import Login from "./pages/Login";
import MainLayout from "./components/layout/MainLayout";
import TopNav from "./components/layout/TopNav";
import ProductCatalog from "./components/catalog/ProductCatalog";
import CartPanel from "./components/cart/CartPanel";

import ProductModal from "./components/modals/ProductModal";
import ReportsPage from "./components/reports/ReportsPage";
import CustomerModal from "./components/modals/CustomerModal";
import ReceiptModal from "./components/modals/ReceiptModal";
import PrintOptionsModal from "./components/modals/PrintOptionsModal";
import PaymentMethodModal from "./components/modals/PaymentMethodModal";
import OrderDetailsModal from "./components/modals/OrderDetailsModal";
import FmsDebugButton from "./components/debug/FmsDebugButton";

import OrderListPage from "./components/orders/OrderListPage";
import CustomerListPage from "./components/customers/CustomerListPage";

/* =======================
   PROTECTED ROUTE
======================= */
function ProtectedRoute({ children }) {
  const token = getAccessToken();
  return token ? children : <Navigate to="/login" replace />;
}

/* =======================
   UTIL
======================= */
function getAvailableStock(product, size) {
  if (product.type !== "ready_to_wear") return Infinity;
  const entry = product.sizes?.find((s) => s.size === size);
  return entry?.stock ?? Infinity;
}

/* =======================
   APP
======================= */
export default function App() {
  const location = useLocation();
  const token = getAccessToken();
  const isAuthPage = location.pathname === "/login";

  /* =======================
     CATEGORIES
  ======================= */
  const ALL_CATEGORY = { id: "all", name: "All", slug: undefined };
  const [categories, setCategories] = useState([ALL_CATEGORY]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  useEffect(() => {
    if (!token) return;

    setCategoriesLoading(true);
    fetchCategories()
      .then((res) => {
        const list = Array.isArray(res?.data?.data ?? res?.data)
          ? res.data.data ?? res.data
          : [];
        setCategories([ALL_CATEGORY, ...list.filter((c) => c.id !== "all")]);
        setSelectedCategory(ALL_CATEGORY);
      })
      .catch(() => {
        setCategories([ALL_CATEGORY]);
        setSelectedCategory(ALL_CATEGORY);
      })
      .finally(() => setCategoriesLoading(false));
  }, [token]);

  /* =======================
     CUSTOMERS
  ======================= */
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (!token) return;

    fetchCustomers({ page: 1, limit: 100 })
      .then((res) => {
        const data = res?.data?.results || [];
        setCustomers(data);
        localStorage.setItem("pos_customers", JSON.stringify(data));
      })
      .catch(() => {
        const cached = localStorage.getItem("pos_customers");
        setCustomers(cached ? JSON.parse(cached) : []);
      });
  }, [token]);

  function addCustomer(c) {
    setCustomers((p) => [...p, c]);
    return c;
  }

  /* =======================
     POS STATE
  ======================= */
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [notes, setNotes] = useState("");
  const [measurements, setMeasurements] = useState(defaultMeasurements);
  const [couponCode, setCouponCode] = useState("");

  const [alterationCharge, setAlterationCharge] = useState(0);
  const [courierCharge, setCourierCharge] = useState(0);
  const [otherCharge, setOtherCharge] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState("flat");

  const [orderType, setOrderType] = useState("Normal Sale");
  const [paymentMethod, setPaymentMethod] = useState(null);

  /* =======================
     MODALS
  ======================= */
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [receiptVariant, setReceiptVariant] = useState("customer");

  /* =======================
     SERVER ORDER (SOURCE OF TRUTH)
  ======================= */
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [isReprintFlow, setIsReprintFlow] = useState(false);

  /* =======================
     TOTALS (PREVIEW ONLY)
  ======================= */
  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + Number(i.product.price) * i.qty, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    if (discountType === "percent") {
      return Math.min(subtotal, (subtotal * discountValue) / 100);
    }
    return Math.min(subtotal, discountValue);
  }, [subtotal, discountValue, discountType]);

  const chargesTotal =
    (alterationCharge || 0) + (courierCharge || 0) + (otherCharge || 0);

  const grandTotal = subtotal - discountAmount + chargesTotal;

  /* =======================
     CART ACTIONS
  ======================= */
  function handleAddToCart(product, size) {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && i.size === size
      );
      const available = getAvailableStock(product, size);

      if (idx > -1) {
        if (prev[idx].qty + 1 > available) {
          alert(`Only ${available} available`);
          return prev;
        }
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }

      if (available < 1) {
        alert("Out of stock");
        return prev;
      }

      return [...prev, { product, size, qty: 1 }];
    });
  }

  async function handleReprintOrder(wooOrderId) {
    try {
      setIsReprintFlow(true);
      const res = await fetchOrderById(wooOrderId);
      setReceiptOrder(res.data);
      setPrintOptionsOpen(true);
    } catch {
      toast.error("Failed to load order for reprint");
      setIsReprintFlow(false);
    }
  }

  function handleChangeQty(index, delta) {
    setCart((prev) => {
      const item = prev[index];
      if (!item) return prev;

      const nextQty = item.qty + delta;
      if (delta > 0 && nextQty > getAvailableStock(item.product, item.size)) {
        alert("Stock limit reached");
        return prev;
      }

      if (nextQty <= 0) return prev.filter((_, i) => i !== index);

      const copy = [...prev];
      copy[index] = { ...item, qty: nextQty };
      return copy;
    });
  }

  /* =======================
     RESET SALE
  ======================= */
  function resetSaleToNew() {
    setCart([]);
    setCurrentCustomer(null);
    setNotes("");
    setMeasurements(defaultMeasurements);
    setCouponCode("");
    setAlterationCharge(0);
    setCourierCharge(0);
    setOtherCharge(0);
    setDiscountValue(0);
    setDiscountType("flat");
    setOrderType("Normal Sale");
    setPaymentMethod(null);
    setReceiptVariant("customer");
    setReceiptOrder(null);
  }

/* =======================
     CREATE ORDER (SERVER FIRST)
     ✅ UPDATED: Detects FMS components and shows verification message
  ======================= */
  async function createOrderFromCurrentState(method) {
    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }

    try {
      const payload = {
        items: cart.map((i) => ({
          product_id: i.product.id,
          variation_id: i.variation?.id || 0,
          qty: i.qty,
          fms_components: i.product.fms_components || [],
        })),
        customer: currentCustomer || null,
        couponCode,
        notes,
        measurements,
        orderType,
        charges: {
          alteration: alterationCharge,
          courier: courierCharge,
          other: otherCharge,
        },
        paymentMethod: method,
      };

      const res = await createOrder(payload);
      const wooOrderId = res.data.woo.order_id;

      // ✅ Check if order has FMS components
      const hasFmsComponents = res.data.woo.fms_items > 0;

      const orderRes = await fetchOrderById(wooOrderId);
      setReceiptOrder(orderRes.data);

      // ✅ Show appropriate success message
      if (hasFmsComponents) {
        toast.success(
          `Order #${orderRes.data.order_number} created with ${res.data.woo.fms_items} FMS item(s)`,
          { duration: 5000 }
        );
        console.log("🧵 FMS Components:", {
          order_id: wooOrderId,
          fms_items: res.data.woo.fms_items,
          message: "Verify fabric reservation in WooCommerce admin",
        });
      } else {
        toast.success(`Order #${orderRes.data.order_number} created`);
      }
      
      // Open PrintOptionsModal
      setPrintOptionsOpen(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Order failed");
    }
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {!isAuthPage && token && <TopNav />}

      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProductCatalog
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onProductClick={(p) => {
                      setActiveProduct(p);
                      setProductModalOpen(true);
                    }}
                  />

                  <CartPanel
                    cart={cart}
                    subtotal={subtotal}
                    discountValue={discountValue}
                    setDiscountValue={setDiscountValue}
                    discountType={discountType}
                    setDiscountType={setDiscountType}
                    discountAmount={discountAmount}
                    chargesTotal={chargesTotal}
                    total={grandTotal}
                    currentCustomer={currentCustomer}
                    onOpenCustomerModal={() => setCustomerModalOpen(true)}
                    customers={customers}
                    addCustomer={addCustomer}
                    onRemoveItem={(i) =>
                      setCart((p) => p.filter((_, x) => x !== i))
                    }
                    onChangeQty={handleChangeQty}
                    notes={notes}
                    setNotes={setNotes}
                    measurements={measurements}
                    setMeasurements={setMeasurements}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    alterationCharge={alterationCharge}
                    setAlterationCharge={setAlterationCharge}
                    courierCharge={courierCharge}
                    setCourierCharge={setCourierCharge}
                    otherCharge={otherCharge}
                    setOtherCharge={setOtherCharge}
                    orderType={orderType}
                    setOrderType={setOrderType}
                    paymentMethod={paymentMethod}
                    onPrintReceipt={() => setPrintOptionsOpen(true)}
                    onMarkPaid={() => setPaymentModalOpen(true)}
                    resetSaleToNew={resetSaleToNew}
                  />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderListPage 
                  onSelectOrder={setSelectedOrderForDetails}
                  onReprint={handleReprintOrder}
                />
              </ProtectedRoute>
            }
          />

          <Route
     path="/reports"
     element={
       <ProtectedRoute>
         <ReportsPage />
       </ProtectedRoute>
     }
   />

          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomerListPage customers={customers} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* MODALS */}
      <ProductModal
        isOpen={productModalOpen}
        product={activeProduct}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        onClose={() => setProductModalOpen(false)}
        onAddToCart={(size) => {
          handleAddToCart(activeProduct, size);
          setProductModalOpen(false);
        }}
      />

      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        currentCustomer={currentCustomer}
        onSave={(c) => {
          setCurrentCustomer(c.id ? c : addCustomer(c));
          setCustomerModalOpen(false);
        }}
      />

      <PrintOptionsModal
        isOpen={printOptionsOpen}
        onClose={() => {
          setPrintOptionsOpen(false);
          // If we were in reprint flow, close details modal and reset
          if (isReprintFlow) {
            setSelectedOrderForDetails(null);
            setIsReprintFlow(false);
          }
        }}
        onSelectVariant={(v) => {
          setReceiptVariant(v);
          setPrintOptionsOpen(false);
          setReceiptModalOpen(true);
        }}
      />

      <PaymentMethodModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSelectMethod={(m) => {
          setPaymentMethod(m);
          setPaymentModalOpen(false);
          createOrderFromCurrentState(m);
        }}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          resetSaleToNew();
          // If we were in reprint flow, close details modal and reset
          if (isReprintFlow) {
            setSelectedOrderForDetails(null);
            setIsReprintFlow(false);
          }
        }}
        order={receiptOrder}
        variant={receiptVariant}
      />

      {/* Order Details Modal - only show when not in reprint flow */}
      {selectedOrderForDetails && !isReprintFlow && (
        <OrderDetailsModal
          wooOrderId={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
          onStatusUpdated={() => {
            // Optionally refresh order list here if needed
          }}
          onReprint={(wooOrderId) => {
            handleReprintOrder(wooOrderId);
          }}
        />
      )}
      {/* FMS Debug Button - only visible in development */}
    {/* <FmsDebugButton /> */}
    </div>
  );
}