"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Header, Footer, Button } from "@repo/ui";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist, WishlistItem } from "../../context/WishlistContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items: cartItems, addItemToCart, setIsCartOpen } = useCart();
  const { items: wishlistItems, loading, removeFromWishlist } = useWishlist();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProductPriceDisplay = (product: WishlistItem) => {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map((v) => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice === maxPrice) {
        return formatPrice(minPrice);
      }
      return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
    return formatPrice(0);
  };

  const handleAddToCart = async (product: WishlistItem) => {
    const defaultVariant = product.variants?.[0];
    const sku = defaultVariant ? defaultVariant.sku : "";
    await addItemToCart(
      {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        images: product.images,
        brand: product.brand || "",
      },
      sku,
      1
    );
    setIsCartOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#111111]">
      <Header
        brandName="LXUY"
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        wishlistCount={wishlistItems.length}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => {}} // Already on Wishlist page
        onProfileClick={() => router.push(user ? "/profile" : "/login")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-4 pb-16 md:pt-8 md:pb-24">
        {/* Title */}
        <div className="border-b border-luxury-silver/30 pb-6 mb-8 text-left">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2 block">
            Saved Items
          </span>
          <h1 className="font-serif text-3.5xl md:text-5xl font-light text-luxury-dark leading-tight">
            Your Wishlist
          </h1>
        </div>

        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
            <svg className="animate-spin h-8 w-8 text-luxury-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs uppercase tracking-luxury text-neutral-400 font-semibold">
              Loading your wishlist...
            </span>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-6">
            <h2 className="font-serif text-2xl font-light text-neutral-500">Your wishlist is empty.</h2>
            <p className="text-sm text-neutral-400 font-light leading-relaxed">
              Browse our collection of products and click the heart icon to save items that inspire you.
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push("/search")} variant="primary" className="px-8 py-3">
                Explore Catalog
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
            <AnimatePresence>
              {wishlistItems.map((product) => {
                const brandName =
                  typeof product.brand === "object" && product.brand !== null
                    ? product.brand.name
                    : "LXUY SIGNATURE";
                const image = product.images?.[0] || "/images/models/modules1.jpeg";

                return (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col group relative"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden mb-4">
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      
                      {/* Delete button (cross) */}
                      <button
                        onClick={() => removeFromWishlist(product._id)}
                        className="absolute top-3 right-3 bg-[#FDFBF7]/80 backdrop-blur-sm p-1.5 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors text-neutral-500 cursor-pointer shadow-sm focus:outline-none"
                        aria-label="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 flex flex-col space-y-2 text-left">
                      <div>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-luxury-gold font-bold block mb-1">
                          {brandName}
                        </span>
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-serif text-sm sm:text-lg font-light text-luxury-dark hover:text-luxury-gold transition-colors duration-300 line-clamp-1 leading-tight">
                            {product.name}
                          </h3>
                        </Link>
                      </div>

                      <p className="text-xs font-semibold text-neutral-700">
                        {getProductPriceDisplay(product)}
                      </p>

                      <div className="pt-2 mt-auto">
                        <Button
                          onClick={() => handleAddToCart(product)}
                          variant="secondary"
                          className="w-full text-xs uppercase py-2 tracking-widest text-[#111111] hover:bg-neutral-950 hover:text-white border-neutral-900"
                        >
                          Add to Bag
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
