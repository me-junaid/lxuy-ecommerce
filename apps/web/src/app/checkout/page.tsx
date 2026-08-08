"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer, Button, Input } from "@repo/ui";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "../../lib/api";

interface AddressForm {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface CardForm {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items: cartItems, loading: cartLoading, clearCart, setIsCartOpen } = useCart();
  const { items: wishlistItems } = useWishlist();

  // State to track if order is placed
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Redirect if cart is empty after initial load
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0 && !orderPlaced) {
      router.push("/cart");
    }
  }, [cartItems, cartLoading, router, orderPlaced]);

  // Form State
  const [addressForm, setAddressForm] = useState<AddressForm>({
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  const [cardForm, setCardForm] = useState<CardForm>({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "cod">("card");
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Order Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mockOrderId, setMockOrderId] = useState("");

  // Update prefilled info when user changes
  useEffect(() => {
    if (user) {
      setAddressForm((prev) => ({
        ...prev,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phoneNumber || "",
      }));
    }
  }, [user]);

  // Calculate pricing
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = activeCoupon ? (subtotal * activeCoupon.discountPercent) / 100 : 0;
  const shippingFee = shippingMethod === "express" ? 500 : 0;
  const taxableAmount = subtotal - discountAmount + shippingFee;
  const tax = taxableAmount * 0.18; // 18% GST
  const orderTotal = taxableAmount + tax;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleInputChange = (field: keyof AddressForm, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCardInputChange = (field: keyof CardForm, value: string) => {
    let formattedValue = value;
    if (field === "number") {
      formattedValue = value.replace(/\s?/g, "").replace(/(\d{4})/g, "$1 ").trim().substring(0, 19);
    } else if (field === "expiry") {
      formattedValue = value.replace(/\//g, "").replace(/(\d{2})/g, "$1/").trim().substring(0, 5);
      if (formattedValue.endsWith("/")) {
        formattedValue = formattedValue.slice(0, -1);
      }
    } else if (field === "cvv") {
      formattedValue = value.replace(/\D/g, "").substring(0, 3);
    }
    
    setCardForm((prev) => ({ ...prev, [field]: formattedValue }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Coupon application
  const applyCoupon = () => {
    setCouponError("");
    setCouponSuccess("");
    
    const code = couponCode.toUpperCase().trim();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    if (code === "LUXURY20") {
      setActiveCoupon({ code: "LUXURY20", discountPercent: 20 });
      setCouponSuccess("Promo code LUXURY20 applied (20% Off).");
      setCouponCode("");
    } else if (code === "WELCOME10") {
      setActiveCoupon({ code: "WELCOME10", discountPercent: 10 });
      setCouponSuccess("Promo code WELCOME10 applied (10% Off).");
      setCouponCode("");
    } else {
      setCouponError("Invalid promo code. Try LUXURY20 or WELCOME10.");
    }
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    setCouponSuccess("");
  };

  // Validate form details
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!addressForm.email) errors.email = "Email address is required.";
    else if (!addressForm.email.includes("@")) errors.email = "Please enter a valid email.";
    
    if (!addressForm.phone) errors.phone = "Phone number is required.";
    if (!addressForm.firstName) errors.firstName = "First name is required.";
    if (!addressForm.lastName) errors.lastName = "Last name is required.";
    if (!addressForm.street) errors.street = "Street address is required.";
    if (!addressForm.city) errors.city = "City is required.";
    if (!addressForm.state) errors.state = "State is required.";
    if (!addressForm.zip) errors.zip = "PIN code is required.";

    if (paymentMethod === "card") {
      if (!cardForm.number || cardForm.number.length < 19) errors.number = "Enter a valid 16-digit card number.";
      if (!cardForm.expiry || !cardForm.expiry.includes("/")) errors.expiry = "Enter expiration date (MM/YY).";
      if (!cardForm.cvv || cardForm.cvv.length < 3) errors.cvv = "Enter 3-digit CVV.";
      if (!cardForm.name) errors.name = "Enter cardholder name.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.submit;
      return next;
    });

    try {
      const response = await api.post("/api/v1/orders", {
        shippingAddress: {
          email: addressForm.email,
          phone: addressForm.phone,
          firstName: addressForm.firstName,
          lastName: addressForm.lastName,
          street: addressForm.street,
          apartment: addressForm.apartment,
          city: addressForm.city,
          state: addressForm.state,
          zip: addressForm.zip,
          country: addressForm.country,
        },
        paymentMethod: paymentMethod,
        shippingMethod: shippingMethod,
        couponCode: activeCoupon ? activeCoupon.code : undefined,
      });

      setMockOrderId(response._id || response.id);
      setIsSubmitting(false);
      setOrderPlaced(true);
      await clearCart();
    } catch (err: any) {
      console.error("Failed to place order:", err);
      setFormErrors((prev) => ({
        ...prev,
        submit: err.message || "Failed to place order. Please try again.",
      }));
      setIsSubmitting(false);
    }
  };

  const checkmarkPathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.3, type: "spring", duration: 1.2, bounce: 0 },
        opacity: { delay: 0.3, duration: 0.01 }
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#111111]">
      <Header
        brandName="LXUY"
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlistItems.length}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => router.push("/wishlist")}
        onProfileClick={() => router.push(user ? "/profile" : "/login")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-4 pb-16 md:pt-8 md:pb-24">
        <AnimatePresence mode="wait">
          {!orderPlaced ? (
            <motion.div
              key="checkout-content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              {/* Page Title */}
              <div className="border-b border-luxury-silver/30 pb-6 text-left">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2 block">
                  Secure Checkout
                </span>
                <h1 className="font-serif text-3.5xl md:text-5xl font-light text-luxury-dark leading-tight">
                  Checkout
                </h1>
              </div>

              {cartItems.length === 0 && cartLoading ? (
                <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
                  <svg className="animate-spin h-8 w-8 text-luxury-gold" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs uppercase tracking-luxury text-neutral-400 font-semibold">
                    Preparing checkout...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                  
                  {/* Left Column: Form Info */}
                  <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-12">
                    
                    {/* Section 1: Contact Details */}
                    <div className="space-y-6 text-left">
                      <h2 className="font-serif text-xl md:text-2xl font-light text-luxury-dark border-b border-neutral-100 pb-2">
                        01. Contact Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <Input
                          label="Email Address"
                          type="email"
                          value={addressForm.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          error={formErrors.email}
                        />
                        <Input
                          label="Phone Number"
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          error={formErrors.phone}
                        />
                      </div>
                    </div>

                    {/* Section 2: Shipping Address */}
                    <div className="space-y-6 text-left">
                      <h2 className="font-serif text-xl md:text-2xl font-light text-luxury-dark border-b border-neutral-100 pb-2">
                        02. Shipping Address
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <Input
                          label="First Name"
                          value={addressForm.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          error={formErrors.firstName}
                        />
                        <Input
                          label="Last Name"
                          value={addressForm.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          error={formErrors.lastName}
                        />
                      </div>
                      <Input
                        label="Street Address"
                        value={addressForm.street}
                        onChange={(e) => handleInputChange("street", e.target.value)}
                        error={formErrors.street}
                      />
                      <Input
                        label="Apartment, suite, etc. (Optional)"
                        value={addressForm.apartment}
                        onChange={(e) => handleInputChange("apartment", e.target.value)}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                        <Input
                          label="City"
                          value={addressForm.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          error={formErrors.city}
                        />
                        <Input
                          label="State"
                          value={addressForm.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                          error={formErrors.state}
                        />
                        <Input
                          label="ZIP / PIN Code"
                          value={addressForm.zip}
                          onChange={(e) => handleInputChange("zip", e.target.value)}
                          error={formErrors.zip}
                        />
                      </div>
                    </div>

                    {/* Section 3: Shipping Method */}
                    <div className="space-y-6 text-left">
                      <h2 className="font-serif text-xl md:text-2xl font-light text-luxury-dark border-b border-neutral-100 pb-2">
                        03. Delivery Method
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Standard */}
                        <div
                          onClick={() => setShippingMethod("standard")}
                          className={`border p-5 cursor-pointer flex flex-col justify-between h-28 transition-all duration-300 ${
                            shippingMethod === "standard"
                              ? "border-luxury-gold bg-[#FDFBF7]"
                              : "border-neutral-200 hover:border-luxury-dark"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs uppercase tracking-luxury font-bold text-neutral-800">
                              Standard Shipping
                            </span>
                            <span className="text-xs font-semibold text-luxury-gold">Free</span>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-light">
                            Takes 3–5 business days. Delivery via reliable local carriers.
                          </span>
                        </div>

                        {/* Express */}
                        <div
                          onClick={() => setShippingMethod("express")}
                          className={`border p-5 cursor-pointer flex flex-col justify-between h-28 transition-all duration-300 ${
                            shippingMethod === "express"
                              ? "border-luxury-gold bg-[#FDFBF7]"
                              : "border-neutral-200 hover:border-luxury-dark"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs uppercase tracking-luxury font-bold text-neutral-800">
                              Express Delivery
                            </span>
                            <span className="text-xs font-semibold text-luxury-gold">₹500</span>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-light">
                            Takes 1–2 business days. Premium tracking and secure packaging.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Payment Method */}
                    <div className="space-y-6 text-left">
                      <h2 className="font-serif text-xl md:text-2xl font-light text-luxury-dark border-b border-neutral-100 pb-2">
                        04. Payment Method
                      </h2>
                      
                      {/* Method selector tabs */}
                      <div className="flex border-b border-neutral-200 text-xs uppercase tracking-luxury font-bold">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("card")}
                          className={`pb-3 pr-6 hover:text-luxury-gold focus:outline-none transition-colors border-b-2 bg-transparent cursor-pointer ${
                            paymentMethod === "card" ? "border-luxury-gold text-luxury-gold" : "border-transparent text-neutral-400"
                          }`}
                        >
                          Credit / Debit Card
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("upi")}
                          className={`pb-3 px-6 hover:text-luxury-gold focus:outline-none transition-colors border-b-2 bg-transparent cursor-pointer ${
                            paymentMethod === "upi" ? "border-luxury-gold text-luxury-gold" : "border-transparent text-neutral-400"
                          }`}
                        >
                          UPI (Simulated)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cod")}
                          className={`pb-3 px-6 hover:text-luxury-gold focus:outline-none transition-colors border-b-2 bg-transparent cursor-pointer ${
                            paymentMethod === "cod" ? "border-luxury-gold text-luxury-gold" : "border-transparent text-neutral-400"
                          }`}
                        >
                          Cash on Delivery
                        </button>
                      </div>

                      <div className="pt-4">
                        {paymentMethod === "card" && (
                          <div className="space-y-6 animate-fade-in">
                            <Input
                              label="Card Number"
                              placeholder="1234 5678 1234 5678"
                              value={cardForm.number}
                              onChange={(e) => handleCardInputChange("number", e.target.value)}
                              error={formErrors.number}
                            />
                            <div className="grid grid-cols-2 gap-x-6">
                              <Input
                                label="Expiry Date (MM/YY)"
                                placeholder="MM/YY"
                                value={cardForm.expiry}
                                onChange={(e) => handleCardInputChange("expiry", e.target.value)}
                                error={formErrors.expiry}
                              />
                              <Input
                                label="CVV"
                                type="password"
                                placeholder="123"
                                value={cardForm.cvv}
                                onChange={(e) => handleCardInputChange("cvv", e.target.value)}
                                error={formErrors.cvv}
                              />
                            </div>
                            <Input
                              label="Cardholder Name"
                              value={cardForm.name}
                              onChange={(e) => handleCardInputChange("name", e.target.value)}
                              error={formErrors.name}
                            />
                          </div>
                        )}

                        {paymentMethod === "upi" && (
                          <div className="p-6 border border-dashed border-neutral-300 rounded bg-[#F8F6F1] text-center space-y-3">
                            <p className="text-xs text-neutral-600 font-light leading-relaxed">
                              You will simulate paying via Google Pay, PhonePe, or Paytm UPI scan.
                            </p>
                            <span className="inline-block text-[10px] uppercase font-bold tracking-widest text-luxury-gold bg-[#FDFBF7] border border-luxury-gold/30 px-4 py-1.5 rounded-full shadow-sm">
                              UPI Mock Inset Active
                            </span>
                          </div>
                        )}

                        {paymentMethod === "cod" && (
                          <div className="p-6 border border-dashed border-neutral-300 rounded bg-[#F8F6F1] text-center space-y-3">
                            <p className="text-xs text-neutral-600 font-light leading-relaxed">
                              Pay in cash upon delivery. A standard delivery surcharge of ₹100 may apply for cash handling (waived for current launch edit).
                            </p>
                            <span className="inline-block text-[10px] uppercase font-bold tracking-widest text-neutral-400 bg-[#FDFBF7] border border-neutral-200 px-4 py-1.5 rounded-full shadow-sm">
                              No COD fees applied
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                  </form>

                  {/* Right Column: Order Summary & Promo */}
                  <div className="lg:col-span-5 space-y-8">
                    
                    {/* Summary Block */}
                    <div className="bg-[#F8F6F1] border border-luxury-silver/30 p-8 space-y-6 text-left">
                      <h3 className="font-serif text-lg font-light text-luxury-dark pb-3 border-b border-luxury-silver/30">
                        Order Summary
                      </h3>

                      {/* Item details */}
                      <div className="max-h-60 overflow-y-auto divide-y divide-luxury-silver/10 pr-2 no-scrollbar">
                        {cartItems.map((item) => (
                          <div key={`${item.product._id}-${item.sku}`} className="flex items-center space-x-4 py-3 first:pt-0 last:pb-0">
                            <div className="w-12 aspect-[3/4] bg-neutral-100 overflow-hidden relative flex-shrink-0">
                              <img src={item.product.images?.[0] || "/images/models/modules1.jpeg"} alt={item.product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif text-xs text-luxury-dark truncate">{item.product.name}</h4>
                              <p className="text-[10px] text-neutral-400 font-light mt-0.5">
                                Qty: {item.quantity} | Size: {item.attributes?.find(a => a.name.toLowerCase() === "size")?.value || "Standard"}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-neutral-700">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Promo Code Fields */}
                      <div className="border-t border-b border-luxury-silver/30 py-4 space-y-3">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="PROMO CODE"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="w-full bg-transparent border border-neutral-200 focus:border-luxury-dark text-xs p-2.5 outline-none uppercase font-bold tracking-widest"
                          />
                          <button
                            type="button"
                            onClick={applyCoupon}
                            className="px-4 py-2 border border-luxury-dark text-luxury-dark hover:bg-luxury-dark hover:text-luxury-cream text-[10px] font-semibold tracking-luxury uppercase transition-colors duration-300 bg-transparent cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>

                        {couponError && (
                          <p className="text-[10px] text-red-500 font-medium tracking-wide">
                            {couponError}
                          </p>
                        )}
                        {couponSuccess && (
                          <p className="text-[10px] text-green-600 font-medium tracking-wide">
                            {couponSuccess}
                          </p>
                        )}

                        {activeCoupon && (
                          <div className="flex justify-between items-center bg-[#FDFBF7] border border-luxury-gold/20 px-3 py-1.5 mt-2">
                            <span className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest">
                              {activeCoupon.code} Active
                            </span>
                            <button
                              type="button"
                              onClick={removeCoupon}
                              className="text-[9px] uppercase font-bold text-red-400 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Prices breakdown */}
                      <div className="space-y-4 text-xs font-light text-neutral-600">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-semibold text-luxury-dark">{formatPrice(subtotal)}</span>
                        </div>
                        {activeCoupon && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Discount ({activeCoupon.discountPercent}%)</span>
                            <span>-{formatPrice(discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Shipping Fee</span>
                          <span className="font-semibold text-luxury-dark">
                            {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated GST (18%)</span>
                          <span className="font-semibold text-neutral-700">{formatPrice(tax)}</span>
                        </div>
                      </div>

                      {/* Estimated Total */}
                      <div className="border-t border-luxury-silver/30 pt-4 flex justify-between items-baseline">
                        <span className="text-xs uppercase tracking-widest font-bold text-luxury-dark">
                          Order Total
                        </span>
                        <span className="font-serif text-2xl font-light text-luxury-gold">
                          {formatPrice(orderTotal)}
                        </span>
                      </div>

                      <div className="pt-4 space-y-3">
                        {formErrors.submit && (
                          <p className="text-[11px] text-red-500 font-medium tracking-wide text-center leading-relaxed">
                            {formErrors.submit}
                          </p>
                        )}
                        <Button
                          type="button"
                          onClick={handlePlaceOrder}
                          variant="primary"
                          className="w-full py-4 text-xs font-semibold tracking-luxury uppercase bg-[#111111] hover:bg-[#C5A880] text-luxury-cream transition-all duration-300 border-none flex items-center justify-center space-x-3"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-luxury-cream" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Authorizing...</span>
                            </>
                          ) : (
                            <span>Place Secure Order</span>
                          )}
                        </Button>
                      </div>

                    </div>

                  </div>

                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="checkout-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="max-w-xl mx-auto py-16 text-center space-y-8"
            >
              {/* Checkmark drawing animation */}
              <div className="flex justify-center">
                <svg className="w-20 h-20 text-luxury-gold" viewBox="0 0 100 100" fill="none">
                  {/* Outer circle */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                  />
                  {/* Checked symbol */}
                  <motion.path
                    d="M30 52 L44 66 L70 36"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={checkmarkPathVariants}
                    initial="hidden"
                    animate="visible"
                  />
                </svg>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold bg-[#F8F6F1] px-4 py-1.5 border border-luxury-gold/20 rounded-full">
                  Order Completed
                </span>
                <h2 className="font-serif text-3xl md:text-4xl font-light text-luxury-dark">
                  Thank You for Your Order
                </h2>
                <p className="text-xs text-neutral-400 font-light uppercase tracking-widest">
                  Order ID: <span className="font-semibold text-neutral-700">{mockOrderId}</span>
                </p>
                <p className="text-sm text-neutral-500 font-light max-w-sm mx-auto leading-relaxed pt-2">
                  We have received your payment details. A confirmation email with summary details and tracking link has been dispatched to <span className="font-semibold text-neutral-700">{addressForm.email}</span>.
                </p>
              </div>

              {/* Delivery Estimation */}
              <div className="bg-[#F8F6F1] border border-luxury-silver/30 p-6 rounded text-left max-w-md mx-auto space-y-2">
                <h4 className="font-serif text-sm font-medium text-luxury-dark">Delivery Estimate</h4>
                <p className="text-xs text-neutral-600 font-light leading-relaxed">
                  Your package is scheduled to arrive between {" "}
                  <span className="font-semibold text-neutral-700">
                    {shippingMethod === "express"
                      ? "tomorrow or the day after"
                      : "3 to 5 business days from now"}
                  </span>
                  .
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={() => router.push("/")} variant="primary" className="px-10 py-3.5">
                  Return to Storefront
                </Button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
