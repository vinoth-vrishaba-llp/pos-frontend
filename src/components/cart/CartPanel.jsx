// src/components/cart/CartPanel.jsx
import CartItems from "./CartItems";
import CustomerSection from "./CustomerSection";
import VoucherAndNotes from "./VoucherAndNotes";
import TotalsFooter from "./TotalsFooter";
import OrderMetaControls from "./OrderMetaControls";

export default function CartPanel({
  cart,
  subtotal,
  discountValue,
  setDiscountValue,
  discountType,
  setDiscountType,
  discountAmount,
  chargesTotal,
  total,
  currentCustomer,
  onOpenCustomerModal,
  onRemoveItem,
  onChangeQty,
  onChangeSize,
  notes,
  setNotes,
  measurements,
  setMeasurements,
  couponCode,
  setCouponCode,
  appliedCoupon, // ✅ NEW: Applied coupon data
  onApplyCoupon, // ✅ NEW: Coupon apply handler
  isFetchingCoupon, // ✅ NEW: Loading state
  alterationCharge,
  setAlterationCharge,
  courierCharge,
  setCourierCharge,
  otherCharge,
  setOtherCharge,
  orderType,
  setOrderType,
  paymentMethod,
  onPrintReceipt,
  onMarkPaid,
  resetSaleToNew,
}) {
  return (
    <>
      <CustomerSection
        currentCustomer={currentCustomer}
        onOpenCustomerModal={onOpenCustomerModal}
      />

      {/* Cart items + Extras Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar" id="cart-container">
        <CartItems
          cart={cart}
          onRemoveItem={onRemoveItem}
          onChangeQty={onChangeQty}
          onChangeSize={onChangeSize}
        />

        {/* Voucher + Notes/Measurements */}
        <VoucherAndNotes
          notes={notes}
          setNotes={setNotes}
          measurements={measurements}
          setMeasurements={setMeasurements}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          appliedCoupon={appliedCoupon} // ✅ PASS COUPON DATA
          onApplyCoupon={onApplyCoupon} // ✅ PASS APPLY HANDLER
          isFetchingCoupon={isFetchingCoupon} // ✅ PASS LOADING STATE
          subtotal={subtotal} // ✅ PASS SUBTOTAL FOR VALIDATION
        />

        {/* Order type + extra charges + discount */}
        <OrderMetaControls
          alterationCharge={alterationCharge}
          setAlterationCharge={setAlterationCharge}
          courierCharge={courierCharge}
          setCourierCharge={setCourierCharge}
          otherCharge={otherCharge}
          setOtherCharge={setOtherCharge}
          orderType={orderType}
          setOrderType={setOrderType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          discountType={discountType}
          setDiscountType={setDiscountType}
          appliedCoupon={appliedCoupon} // ✅ PASS COUPON FOR DISPLAY
          discountAmount={discountAmount} // ✅ PASS CALCULATED DISCOUNT
        />
      </div>

      {/* Totals + actions */}
      <TotalsFooter
        subtotal={subtotal}
        discount={discountAmount}
        chargesTotal={chargesTotal}
        total={total}
        paymentMethod={paymentMethod}
        onPrint={onPrintReceipt}
        onMarkPaid={onMarkPaid}
        onResetSale={resetSaleToNew}
        cartLength={cart.length}
      />
    </>
  );
}