"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Header, Footer, Button } from "@repo/ui";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, loading, updateCartItemQuantity, removeItemFromCart } = useCart();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 15000 || subtotal === 0 ? 0 : 500; // ₹500 standard shipping below ₹15,000
  const total = subtotal + shipping;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#111111]">
      <Header
        brandName="LXUY"
        cartCount={items.reduce((sum, i) => sum + i.quantity, 0)}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => {}} // Already on cart page
        onProfileClick={() => router.push(user ? "/profile" : "/login")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-24 pb-16 md:pt-28 md:pb-24">
        {/* Title */}
        <div className="border-b border-luxury-silver/30 pb-6 mb-10 text-left">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2 block">
            Shopping Bag
          </span>
          <h1 className="font-serif text-3.5xl md:text-5xl font-light text-luxury-dark leading-tight">
            Your Cart
          </h1>
        </div>

        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
            <svg className="animate-spin h-8 w-8 text-luxury-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs uppercase tracking-luxury text-neutral-400 font-semibold">
              Loading your bag...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-6">
            <h2 className="font-serif text-2xl font-light text-neutral-500">Your shopping bag is empty.</h2>
            <p className="text-sm text-neutral-400 font-light leading-relaxed">
              Explore our curation of tailored outerwear, fluid silk blouses, and structured silhouettes designed for modern versatility.
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push("/")} variant="primary" className="px-8 py-3">
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
            {/* Left side: Items List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="hidden md:grid grid-cols-12 pb-4 border-b border-luxury-silver/30 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                <div className="col-span-6">Product Details</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Total Price</div>
              </div>

              <div className="divide-y divide-luxury-silver/20">
                {items.map((item) => {
                  const brandName =
                    typeof item.product.brand === "object" && item.product.brand !== null
                      ? item.product.brand.name
                      : "LXUY SIGNATURE";
                  const image = item.product.images?.[0] || "/images/models/modules1.jpeg";

                  return (
                    <motion.div
                      key={`${item.product._id}-${item.sku}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-0 py-6 items-center"
                    >
                      {/* Product details */}
                      <div className="col-span-12 md:col-span-6 flex items-center space-x-4">
                        <div className="w-20 aspect-[3/4] bg-neutral-100 overflow-hidden relative flex-shrink-0">
                          <img src={image} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left space-y-1">
                          <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
                            {brandName}
                          </span>
                          <h3 className="font-serif text-base text-luxury-dark leading-tight hover:text-luxury-gold transition-colors">
                            <Link href={`/products/${item.product.slug}`}>{item.product.name}</Link>
                          </h3>
                          {item.attributes.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {item.attributes.map((attr) => (
                                <span
                                  key={attr.name}
                                  className="text-[9px] border border-luxury-silver/30 bg-[#FDFBF7] px-2 py-0.5 text-neutral-500 font-medium"
                                >
                                  {attr.name}: {attr.value}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => removeItemFromCart(item.product._id, item.sku)}
                            className="text-[9px] uppercase tracking-luxury text-neutral-400 hover:text-red-500 font-bold transition-colors pt-2 block bg-transparent border-none cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Quantity selector */}
                      <div className="col-span-12 md:col-span-3 flex justify-start md:justify-center">
                        <div className="flex items-center border border-neutral-200 bg-transparent">
                          <button
                            onClick={() => updateCartItemQuantity(item.product._id, item.sku, item.quantity - 1)}
                            className="px-3 py-1.5 text-xs hover:text-luxury-gold transition-colors bg-transparent border-none cursor-pointer"
                          >
                            —
                          </button>
                          <span className="px-3 text-xs font-semibold text-neutral-700 min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQuantity(item.product._id, item.sku, item.quantity + 1)}
                            className="px-3 py-1.5 text-xs hover:text-luxury-gold transition-colors bg-transparent border-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total price */}
                      <div className="col-span-12 md:col-span-3 text-left md:text-right">
                        <span className="md:hidden text-[10px] uppercase tracking-widest text-neutral-400 font-bold block mb-1">
                          Total Price
                        </span>
                        <p className="text-sm font-semibold text-luxury-gold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-light mt-0.5">
                          ({formatPrice(item.price)} each)
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Summary Block */}
            <div className="col-span-1 bg-[#F8F6F1] border border-luxury-silver/30 p-8 space-y-6 text-left">
              <h3 className="font-serif text-lg font-light text-luxury-dark pb-3 border-b border-luxury-silver/30">
                Order Summary
              </h3>

              <div className="space-y-4 text-xs font-light text-neutral-600">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-luxury-dark">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Shipping</span>
                  <span className="font-semibold text-luxury-dark">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="text-[9px] text-neutral-400 leading-normal italic">
                    Tip: Free shipping applies on orders of ₹15,000 or more.
                  </p>
                )}
              </div>

              <div className="border-t border-luxury-silver/30 pt-4 flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-widest font-semibold text-luxury-dark">
                  Estimated Total
                </span>
                <span className="font-serif text-2xl font-light text-luxury-gold">
                  {formatPrice(total)}
                </span>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={() => router.push("/checkout")}
                  variant="primary"
                  className="w-full py-4 text-xs font-semibold tracking-luxury uppercase bg-[#111111] hover:bg-[#C5A880] text-luxury-cream transition-all duration-300 border-none"
                >
                  Proceed to Checkout
                </Button>
                <Link
                  href="/"
                  className="block text-center text-[10px] uppercase tracking-luxury text-neutral-500 hover:text-luxury-dark font-semibold pt-2"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
