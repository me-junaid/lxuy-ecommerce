"use client";

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

export const CartDrawer: React.FC = () => {
  const { items, loading, isCartOpen, setIsCartOpen, updateCartItemQuantity, removeItemFromCart } = useCart();
  const router = useRouter();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 15000; // ₹15,000
  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(subtotal);

  const formattedThreshold = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(remainingForFreeShipping);

  // Close drawer helper
  const handleClose = () => setIsCartOpen(false);

  // Track previous items length to only auto-close when items are removed
  const prevItemsLength = useRef(items.length);

  // Auto close drawer when cart becomes empty via item removal
  useEffect(() => {
    if (isCartOpen && items.length === 0 && prevItemsLength.current > 0) {
      const timer = setTimeout(() => {
        setIsCartOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    prevItemsLength.current = items.length;
  }, [items.length, isCartOpen, setIsCartOpen]);

  // Update ref when drawer closes or opens
  useEffect(() => {
    if (!isCartOpen) {
      prevItemsLength.current = items.length;
    }
  }, [isCartOpen, items.length]);

  // Navigate to checkout/cart
  const handleCheckout = () => {
    handleClose();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-[4px] cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-[#FDFBF7] shadow-2xl border-l border-luxury-silver/20 flex flex-col h-full text-left z-10"
          >
            {/* Header */}
            <div className="px-6 py-6 border-b border-luxury-silver/30 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-light tracking-wide text-luxury-dark">Shopping Bag</h3>
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mt-0.5">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-[10px] uppercase tracking-luxury text-neutral-500 hover:text-luxury-dark font-semibold transition-colors bg-transparent border-none cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Free Shipping Progress */}
            {items.length > 0 && (
              <div className="px-6 py-4 bg-[#F8F6F1] border-b border-luxury-silver/10 space-y-2">
                <p className="text-xs font-light text-neutral-600">
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <span className="font-medium text-luxury-gold">You have unlocked free standard shipping!</span>
                  ) : (
                    <>
                      Add <span className="font-bold text-luxury-dark">{formattedThreshold}</span> more for free shipping.
                    </>
                  )}
                </p>
                <div className="w-full h-1 bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-luxury-gold transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar divide-y divide-luxury-silver/10">
              {loading ? (
                <div className="h-full flex items-center justify-center flex-col space-y-3">
                  <div className="animate-spin h-6 w-6 text-luxury-gold border-2 border-t-transparent rounded-full" />
                  <span className="text-[10px] uppercase tracking-luxury text-neutral-400">Updating bag...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <h4 className="font-serif text-base font-light text-neutral-500">Your bag is empty</h4>
                  <p className="text-xs text-neutral-400 font-light max-w-xs leading-relaxed">
                    Explore our seasonal lookbooks and collections to discover tailored comfort silhouettes.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-luxury-dark text-luxury-cream text-xs uppercase tracking-luxury hover:opacity-90 transition-opacity"
                  >
                    Continue Browsing
                  </button>
                </div>
              ) : (
                <div className="space-y-6 pt-2 pb-6">
                  {items.map((item) => {
                    const brandName = typeof item.product.brand === 'object' && item.product.brand !== null ? item.product.brand.name : 'LXUY SIGNATURE';
                    const image = item.product.images?.[0] || '/images/models/modules1.jpeg';
                    const formattedItemPrice = new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(item.price);

                    return (
                      <div
                        key={`${item.product._id}-${item.sku}`}
                        className="flex items-start space-x-4 pt-4 first:pt-0"
                      >
                        {/* Image */}
                        <div className="w-20 aspect-[3/4] bg-neutral-100 overflow-hidden relative flex-shrink-0">
                          <img src={image} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col text-left space-y-1">
                          <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold">
                            {brandName}
                          </span>
                          <h4 className="font-serif text-sm text-luxury-dark leading-snug">
                            {item.product.name}
                          </h4>

                          {/* Attributes / Size tags */}
                          {item.attributes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {item.attributes.map((attr) => (
                                <span
                                  key={attr.name}
                                  className="text-[9px] px-2 py-0.5 border border-luxury-silver/30 bg-[#FDFBF7] text-neutral-500 font-medium"
                                >
                                  {attr.name}: {attr.value}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Price */}
                          <p className="text-xs font-semibold text-luxury-gold pt-1">
                            {formattedItemPrice}
                          </p>

                          {/* Quantity control & Remove */}
                          <div className="flex items-center justify-between pt-3">
                            <div className="flex items-center border border-neutral-200 bg-white rounded-md overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateCartItemQuantity(item.product._id, item.sku, item.quantity - 1)}
                                className="w-10 h-10 flex items-center justify-center text-sm font-light hover:bg-neutral-50 active:bg-neutral-100 transition-colors bg-transparent border-none cursor-pointer focus:outline-none"
                                aria-label="Decrease quantity"
                              >
                                —
                              </button>
                              <span className="w-8 text-center text-xs font-semibold text-neutral-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartItemQuantity(item.product._id, item.sku, item.quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center text-sm font-light hover:bg-neutral-50 active:bg-neutral-100 transition-colors bg-transparent border-none cursor-pointer focus:outline-none"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItemFromCart(item.product._id, item.sku)}
                              className="text-[9px] uppercase tracking-luxury text-neutral-400 hover:text-red-500 font-semibold transition-colors bg-transparent border-none cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Summary (Sticky at bottom) */}
            {items.length > 0 && (
              <div className="px-6 py-6 border-t border-luxury-silver/30 bg-[#FDFBF7] space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-light text-neutral-500 uppercase tracking-widest">Subtotal</span>
                  <span className="font-serif text-xl font-light text-luxury-dark">{formattedSubtotal}</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-light leading-normal">
                  Shipping, taxes, and coupons calculated at checkout.
                </p>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => {
                      handleClose();
                      router.push('/cart');
                    }}
                    className="w-full py-3.5 border border-luxury-dark text-luxury-dark hover:bg-luxury-dark hover:text-luxury-cream text-xs font-semibold tracking-luxury uppercase transition-all duration-300 bg-transparent cursor-pointer"
                  >
                    View Bag
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-[#111111] text-luxury-cream hover:bg-luxury-gold text-xs font-semibold tracking-luxury uppercase transition-all duration-300 border-none cursor-pointer"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
