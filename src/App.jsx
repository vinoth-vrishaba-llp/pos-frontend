// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { getAccessToken } from "./utils/authStorage";
import { fetchCustomers } from "./api/customers.api";
import { fetchCategories } from "./api/categories.api";
import { createOrder, fetchOrderById } from "./api/orders.api";
import { defaultMeasurements } from "./data/mockData";
import { fetchCouponById } from "./api/coupons.api";
import { useTokenRefresh } from "./hooks/useTokenRefresh";
import { useVariationsCache } from "./hooks/useVariationsCache";

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
   UTIL - PRODUCT-LEVEL STOCK FOR FABRIC ORDERS
======================= */
// For fabric orders: stock is at PRODUCT level (shared across all sizes)
function getProductTotalStock(product) {
  // Check if product has product-level stock
  if (product.stock_quantity != null) {
    return product.stock_quantity;
  }
  return Infinity;
}

// Calculate total quantity of a product in cart (across ALL sizes/variations)
function getProductCartQuantity(cart, productId) {
  return cart
    .filter(item => item.product.id === productId)
    .reduce((sum, item) => sum + item.qty, 0);
}

// Calculate remaining stock for entire product
function getRemainingProductStock(cart, product) {
  const totalStock = getProductTotalStock(product);
  const inCart = getProductCartQuantity(cart, product.id);
  return Math.max(0, totalStock - inCart);
}

/* =======================
   APP
======================= */
export default function App() {
  const location = useLocation();
  const token = getAccessToken();
  const isAuthPage = location.pathname === "/login";
  useTokenRefresh();

  const { getVariations, preload } = useVariationsCache();

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

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isFetchingCoupon, setIsFetchingCoupon] = useState(false);

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
    let discount = 0;

    // Coupon discount (highest priority)
    if (appliedCoupon) {
      const couponAmount = parseFloat(appliedCoupon.amount) || 0;
      
      if (appliedCoupon.discount_type === "percent") {
        discount = (subtotal * couponAmount) / 100;
      } else if (appliedCoupon.discount_type === "fixed_cart") {
        discount = couponAmount;
      } else if (appliedCoupon.discount_type === "fixed_product") {
        discount = cart.length * couponAmount;
      }
    } 
    // Manual discount (only if no coupon)
    else if (discountType === "percent") {
      discount = (subtotal * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    return Math.min(subtotal, discount);
  }, [subtotal, appliedCoupon, discountValue, discountType, cart.length]);

  const chargesTotal =
    (alterationCharge || 0) + (courierCharge || 0) + (otherCharge || 0);

  const grandTotal = subtotal - discountAmount + chargesTotal;

  /* =======================
     CART ACTIONS
  ======================= */
  function handleAddToCart(product, variation) {
    const remaining = getRemainingProductStock(cart, product);
    
    if (remaining < 1) {
      toast.error("Out of stock - product limit reached");
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && 
               (i.variation?.id || null) === (variation?.id || null)
      );

      if (idx > -1) {
        // Item exists, increment quantity
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }

      // New item (different size)
      return [...prev, { product, variation, qty: 1 }];
    });
    
    toast.success(`Added to cart`);
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
      
      // Handle removal
      if (nextQty <= 0) return prev.filter((_, i) => i !== index);

      // Check PRODUCT-LEVEL stock limit when increasing
      if (delta > 0) {
        const totalStock = getProductTotalStock(item.product);
        const totalInCart = getProductCartQuantity(prev, item.product.id);
        
        if (totalInCart >= totalStock) {
          toast.error("Product stock limit reached");
          return prev;
        }
      }

      const copy = [...prev];
      copy[index] = { ...item, qty: nextQty };
      return copy;
    });
  }

  /* =======================
     PRODUCT SELECTION WITH CACHING
     ✅ NEW OPTIMIZED HANDLERS
  ======================= */
  
  /**
   * Preload variations on hover
   * This makes product opening feel instant
   */
  function handleProductHover(product) {
    // Only preload if variable product (has sizes)
    if (product.type === "variable") {
      preload(product.id);
    }
  }

  /**
   * Open product modal with cached variations
   * Modal opens immediately, variations load in background
   */
  async function handleProductClick(product) {
    console.log(`🖱️ Product clicked: ${product.name} (ID: ${product.id})`);
    
    // ✅ STEP 1: Open modal immediately (optimistic UI)
    setActiveProduct(product);
    setProductModalOpen(true);

    // ✅ STEP 2: If variable product, fetch/use cached variations
    if (product.type === "variable") {
      const variations = await getVariations(product.id);
      
      // ✅ STEP 3: Update product with variations and flag
      setActiveProduct(prev => ({
        ...prev,
        variations,
        variationsLoaded: true,
      }));
    }
  }

  async function handleApplyCoupon(couponId) {
    if (!couponId) {
      setAppliedCoupon(null);
      return;
    }

    try {
      setIsFetchingCoupon(true);
      const response = await fetchCouponById(couponId);
      
      // ✅ FIX: Handle different response structures
      const couponData = response.data?.data || response.data;
      
      console.log("📋 Coupon data received:", couponData); // Debug log

      // Validate usage limit
      if (couponData.usage_limit && couponData.usage_count >= couponData.usage_limit) {
        toast.error("Coupon usage limit reached");
        setAppliedCoupon(null);
        return;
      }

      // Validate expiry
      if (couponData.date_expires) {
        const expiryDate = new Date(couponData.date_expires);
        if (expiryDate < new Date()) {
          toast.error("Coupon has expired");
          setAppliedCoupon(null);
          return;
        }
      }

      // Validate minimum amount
      if (couponData.minimum_amount && subtotal < parseFloat(couponData.minimum_amount)) {
        toast.error(`Minimum order amount ₹${couponData.minimum_amount} required`);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(couponData);
      
      // ✅ FIX: Better success message handling
      const couponCode = couponData.code || "Coupon";
      toast.success(`${couponCode} applied successfully`);
    } catch (err) {
      console.error("❌ Coupon error:", err); // Debug log
      toast.error(err?.response?.data?.message || "Invalid coupon");
      setAppliedCoupon(null);
    } finally {
      setIsFetchingCoupon(false);
    }
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
    setAppliedCoupon(null);
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
        couponCode: appliedCoupon?.code || couponCode,
        notes,
        measurements,
        orderType,
        charges: {
          alteration: alterationCharge,
          courier: courierCharge,
          other: otherCharge,
        },
        discount: {
          value: discountAmount,
          type: appliedCoupon?.discount_type || discountType,
          coupon_id: appliedCoupon?.id || null,
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
      
      // ✅ Open PrintOptionsModal (stays open for multiple prints)
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
                    onProductClick={handleProductClick} 
                    onProductHover={handleProductHover} 
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
                    appliedCoupon={appliedCoupon}
                    onApplyCoupon={handleApplyCoupon}
                    isFetchingCoupon={isFetchingCoupon}
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
        cart={cart}
        onClose={() => {
          setProductModalOpen(false);
          setSelectedSize(null);
        }}
        onAddToCart={(item) => {
          handleAddToCart(item.product, item.variation);
          setProductModalOpen(false);
          setSelectedSize(null);
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

      {/* ✅ UPDATED: Print Options Modal - stays open for multiple prints */}
      <PrintOptionsModal
        isOpen={printOptionsOpen}
        onClose={() => {
          setPrintOptionsOpen(false);
          // ✅ Clear cart when print options modal closes
          resetSaleToNew();
          // If we were in reprint flow, close details modal and reset
          if (isReprintFlow) {
            setSelectedOrderForDetails(null);
            setIsReprintFlow(false);
          }
        }}
        onSelectVariant={(v) => {
          setReceiptVariant(v);
          // ✅ Don't close PrintOptionsModal - just open receipt
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

      {/* ✅ UPDATED: Receipt Modal - returns to print options instead of clearing */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          // ✅ Don't reset sale - user can print more copies
          // Just return to print options modal
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