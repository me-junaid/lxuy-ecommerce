"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";
import {
  Header,
  Footer,
  Button,
  RecommendationSlider,
} from "@repo/ui";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface VariantAttribute {
  name: string;
  value: string;
}

interface ProductVariant {
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: VariantAttribute[];
  images: string[];
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  summary?: string;
  images: string[];
  brand: Brand | string;
  category: Category | string;
  variants: ProductVariant[];
  ratings: {
    average: number;
    count: number;
  };
}

interface RecommendationProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  imageUrl: string;
}

// Statically defined recommendations as fallback
const FALLBACK_RECOMMENDATIONS = [
  {
    id: "rec-1",
    name: "Classic Beige Linen Suit",
    brand: "POLO RALPH LAUREN",
    price: 18900,
    originalPrice: 27000,
    discount: "30% off",
    imageUrl: "/images/models/modules5.jpeg",
  },
  {
    id: "rec-2",
    name: "Navy Solid Classic Fit Short Sleeve Polo",
    brand: "HACKETT LONDON",
    price: 9600,
    originalPrice: 16000,
    discount: "40% off",
    imageUrl: "/images/models/modules6.jpeg",
  },
  {
    id: "rec-3",
    name: "Sand Linen Casual Jacket",
    brand: "POLO RALPH LAUREN",
    price: 14400,
    originalPrice: 24000,
    discount: "40% off",
    imageUrl: "/images/models/modules7.jpeg",
  },
  {
    id: "rec-4",
    name: "Tan Double-Breasted Editorial Suit",
    brand: "POLO RALPH LAUREN",
    price: 23400,
    originalPrice: 39000,
    discount: "40% off",
    imageUrl: "/images/models/modules8.jpeg",
  },
];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  // Scroll Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State
  const { items, addItemToCart, setIsCartOpen } = useCart();
  const { items: wishlistItems, toggleWishlistItem, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationProduct[]>(FALLBACK_RECOMMENDATIONS);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  // Load recently viewed list on mount / slug change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("lxuy_recently_viewed");
      if (local) {
        try {
          const list = JSON.parse(local) as any[];
          setRecentlyViewed(list.filter((p) => p.slug !== slug));
        } catch {
          setRecentlyViewed([]);
        }
      }
    }
  }, [slug]);

  // 1. Fetch Product details on mount/slug change
  useEffect(() => {
    async function fetchProductDetails() {
      setLoading(true);
      setError("");
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${baseUrl}/api/v1/products/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("The requested product silhouette could not be found.");
          }
          throw new Error("A server error occurred while retrieving product details.");
        }
        const data = (await response.json()) as Product;
        setProduct(data);

        // Save to recently viewed history list
        if (typeof window !== "undefined" && data) {
          const localKey = "lxuy_recently_viewed";
          const current = localStorage.getItem(localKey);
          let list: any[] = [];
          if (current) {
            try {
              list = JSON.parse(current);
            } catch {
              list = [];
            }
          }
          list = list.filter((p: any) => p._id !== data._id);
          list.unshift({
            _id: data._id,
            name: data.name,
            slug: data.slug,
            images: data.images,
            brand: data.brand,
            price: data.variants && data.variants.length > 0 ? data.variants[0].price : 0
          });
          list = list.slice(0, 4);
          localStorage.setItem(localKey, JSON.stringify(list));
        }

        // Reset active image index and scroll position on product change
        setCurrentImageIdx(0);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = 0;
        }

        // Set default variant and attributes
        if (data.variants && data.variants.length > 0) {
          // Look for first active variant
          const activeVar = data.variants.find((v) => v.isActive) || data.variants[0];
          setSelectedVariant(activeVar);

          const defaultAttrs: Record<string, string> = {};
          activeVar.attributes.forEach((attr) => {
            if (attr.name !== "Color") {
              defaultAttrs[attr.name] = attr.value;
            }
          });
          setSelectedAttributes(defaultAttrs);
        }

        // Try to load category recommendations dynamically
        const catId = typeof data.category === "object" ? data.category._id : data.category;
        if (catId) {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const recResponse = await fetch(`${baseUrl}/api/v1/products?category=${catId}&limit=4`);
          if (recResponse.ok) {
            const recData = await recResponse.json();
            if (recData.data && recData.data.length > 0) {
              const formattedRecs = recData.data
                .filter((p: Product) => p.slug !== slug)
                .map((p: Product) => ({
                  id: p._id,
                  name: p.name,
                  brand: typeof p.brand === "object" ? p.brand.name : "LXUY SIGNATURE",
                  price: p.variants && p.variants.length > 0 ? p.variants[0].price : 0,
                  imageUrl: p.images && p.images.length > 0 ? p.images[0] : "/images/models/modules1.jpeg",
                }));
              if (formattedRecs.length > 0) {
                setRecommendations(formattedRecs);
              }
            }
          }
        }

      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProductDetails();
    }
  }, [slug]);

  // Find variant matching selected attributes
  const findMatchingVariant = (
    variants: ProductVariant[],
    attributes: Record<string, string>
  ) => {
    return variants.find((variant) => {
      return variant.attributes.every((attr) => {
        if (attr.name === "Color") return true; // Ignore Color attribute during matching
        return attributes[attr.name] === attr.value;
      });
    });
  };

  // Handle attribute selection changes
  const handleAttributeChange = (attributeName: string, value: string) => {
    if (!product) return;

    const updatedAttrs = {
      ...selectedAttributes,
      [attributeName]: value,
    };
    setSelectedAttributes(updatedAttrs);

    if (product.variants) {
      const match = findMatchingVariant(product.variants, updatedAttrs);
      if (match) {
        setSelectedVariant(match);
      } else {
        setSelectedVariant(null);
      }
    }
  };

  // Get all unique attributes and their values across all variants
  const getUniqueAttributes = (variants: ProductVariant[]) => {
    const attrs: Record<string, Set<string>> = {};
    variants.forEach((v) => {
      if (!v.isActive) return;
      v.attributes.forEach((attr) => {
        if (attr.name === "Color") return; // Skip Color attribute
        if (!attrs[attr.name]) {
          attrs[attr.name] = new Set<string>();
        }
        attrs[attr.name].add(attr.value);
      });
    });

    const result: Record<string, string[]> = {};
    Object.keys(attrs).forEach((key) => {
      result[key] = Array.from(attrs[key]);
    });
    return result;
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || selectedVariant.stock <= 0 || !product) return;

    setCartLoading(true);
    setCartSuccess(false);

    try {
      await addItemToCart(
        {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          images: product.images,
          brand: product.brand,
          variants: product.variants,
        },
        selectedVariant.sku,
        quantity
      );
      setCartSuccess(true);
      // Reset success banner after 4 seconds
      setTimeout(() => {
        setCartSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to add item to cart:', err);
    } finally {
      setCartLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    const isAdding = !isInWishlist(product._id);
    try {
      await toggleWishlistItem(product._id, {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        images: product.images,
        brand: product.brand,
        variants: product.variants,
      });
      showToast(isAdding ? "Added to wishlist" : "Removed from wishlist");
    } catch (err) {
      console.error(err);
      showToast("Failed to update wishlist", "error");
    }
  };

  // Carousel scroll helpers
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const children = container.children;

    let closestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const distance = Math.abs(child.offsetLeft - scrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    }

    if (closestIdx !== currentImageIdx) {
      setCurrentImageIdx(closestIdx);
    }
  };

  const scrollToIndex = (idx: number) => {
    const container = scrollContainerRef.current;
    if (container && container.children[idx]) {
      const child = container.children[idx] as HTMLElement;
      container.scrollTo({
        left: child.offsetLeft,
        behavior: "smooth",
      });
      setCurrentImageIdx(idx);
    }
  };

  const scrollPrev = () => {
    if (currentImageIdx > 0 && product) {
      scrollToIndex(currentImageIdx - 1);
    }
  };

  const scrollNext = () => {
    if (product && currentImageIdx < product.images.length - 1) {
      scrollToIndex(currentImageIdx + 1);
    }
  };

  const uniqueAttributes = product?.variants ? getUniqueAttributes(product.variants) : {};
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;

  // Render Loader
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
        <Header
          brandName="LXUY"
          cartCount={items.reduce((sum, item) => sum + item.quantity, 0)}
          wishlistCount={wishlistItems.length}
          user={user}
          onLogoClick={() => router.push("/")}
          onCartClick={() => setIsCartOpen(true)}
          onWishlistClick={() => router.push("/wishlist")}
          onProfileClick={() => router.push(user ? "/profile" : "/login")}
          onSearchClick={() => { }}
          onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
          onProductClick={(slug) => router.push(`/products/${slug}`)}
        />
        <main className="flex-1 w-full pt-16 md:pt-20">
          <div className="flex flex-col lg:flex-row w-full items-start">
            {/* Left Media Block Skeleton (60% width) */}
            <div className="w-full h-[60vh] lg:h-[calc(100vh-125px)] lg:w-[60%] bg-neutral-100/50 animate-pulse flex items-center justify-center relative">
              <div className="opacity-15 font-serif text-3xl font-light tracking-[0.25em] text-neutral-400 uppercase select-none">
                LXUY
              </div>
            </div>

            {/* Right Details Block Skeleton (40% width) */}
            <div className="w-full lg:w-[40%] px-6 md:px-12 lg:px-16 py-10 flex flex-col space-y-8 animate-pulse">
              {/* Brand and Title Skeleton */}
              <div className="space-y-4 border-b border-luxury-silver/10 pb-6">
                <div className="h-3 bg-neutral-200/60 rounded w-1/4 animate-pulse" />
                <div className="h-8 bg-neutral-200/60 rounded w-3/4 animate-pulse" />
                <div className="h-6 bg-neutral-200/60 rounded w-1/3 mt-4 animate-pulse" />
              </div>

              {/* Attributes Selection Skeleton */}
              <div className="space-y-4">
                <div className="h-3 bg-neutral-200/60 rounded w-1/3 animate-pulse" />
                <div className="flex space-x-2">
                  <div className="h-11 w-14 bg-neutral-200/40 animate-pulse" />
                  <div className="h-11 w-14 bg-neutral-200/40 animate-pulse" />
                  <div className="h-11 w-14 bg-neutral-200/40 animate-pulse" />
                </div>
              </div>

              {/* CTA Skeleton */}
              <div className="space-y-4 pt-4 border-t border-luxury-silver/10">
                <div className="h-12 bg-neutral-200/60 w-full animate-pulse" />
              </div>

              {/* Description Paragraph Skeleton */}
              <div className="space-y-3 pt-4">
                <div className="h-3 bg-neutral-200/40 w-full animate-pulse" />
                <div className="h-3 bg-neutral-200/40 w-5/6 animate-pulse" />
                <div className="h-3 bg-neutral-200/40 w-4/5 animate-pulse" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render Error Page
  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
        <Header
          brandName="LXUY"
          cartCount={items.reduce((sum, item) => sum + item.quantity, 0)}
          wishlistCount={wishlistItems.length}
          user={user}
          onWishlistClick={() => router.push("/wishlist")}
        />
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 text-center">
          <h2 className="font-serif text-3xl font-light text-luxury-dark mb-4">
            Editorial Check Failed
          </h2>
          <p className="text-sm font-light text-neutral-600 max-w-md leading-relaxed mb-8">
            {error || "We could not find the product details you requested. It may have been archived or is temporarily unavailable."}
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Homepage
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Loaded Content
  const brandName = typeof product.brand === "object" ? product.brand.name : "LXUY SIGNATURE";
  const displayPrice = selectedVariant ? selectedVariant.price : (product.variants?.[0]?.price ?? 0);
  const displayComparePrice = selectedVariant ? selectedVariant.compareAtPrice : product.variants?.[0]?.compareAtPrice;

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
      {/* Premium Header */}
      <Header
        brandName="LXUY"
        cartCount={items.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlistItems.length}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => router.push("/wishlist")}
        onProfileClick={() => router.push(user ? "/profile" : "/login")}
        onSearchClick={() => { }}
        onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
        onProductClick={(slug) => router.push(`/products/${slug}`)}
      />

      {/* Main content is full-bleed, zero initial vertical padding */}
      <main className="flex-1 w-full">

        {/* Success Banner */}
        <AnimatePresence>
          {cartSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-6 mt-6 bg-[#111111] text-[#FDFBF7] py-4 px-6 flex items-center justify-between shadow-sm z-30"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs uppercase tracking-wider font-light">
                  Successfully added {quantity} item(s) to your shopping cart.
                </span>
              </div>
              <button
                onClick={() => router.push("/cart")}
                className="text-[10px] uppercase tracking-luxury text-[#FDFBF7] hover:text-luxury-gold underline focus:outline-none"
              >
                View Cart
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Details Section: 60/40 full-bleed split */}
        <div className="flex flex-col lg:flex-row w-full items-start">

          {/* Left Media Block (60% width, sticky desktop viewport, zero padding, zero gap) */}
          <div className="w-full h-[60vh] lg:sticky lg:top-20 lg:h-[calc(100vh-125px)] lg:w-[60%] relative bg-luxury-silver/5 overflow-hidden flex flex-col justify-between">

            {/* Scrollable Image Stage (100% width, snap aligned, scrollbar hidden) */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {product.images.map((img, i) => (
                <div key={i} className="w-auto h-full shrink-0 snap-start relative bg-luxury-silver/10 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${product.name} shot ${i + 1}`}
                    className="h-full w-auto object-contain"
                  />
                </div>
              ))}
            </div>

            {/* "Different Angles" Navigation Control Panel (overlaid on top of bottom stage) */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-6 right-6 z-10 flex flex-col items-center space-y-2.5 bg-[#111111]/85 backdrop-blur-md p-3 border border-neutral-800 rounded-xl shadow-lg max-w-[calc(100vw-3rem)]">
                <div className="flex items-center space-x-3.5">
                  {/* Left Arrow */}
                  <button
                    onClick={scrollPrev}
                    disabled={currentImageIdx === 0}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer focus:outline-none"
                    aria-label="Previous image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Thumbnail Strip */}
                  <div
                    className="flex space-x-2 items-center overflow-x-auto max-w-[200px] md:max-w-[300px] py-0.5"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {product.images.map((img, idx) => {
                      const isActive = currentImageIdx === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => scrollToIndex(idx)}
                          className={`relative w-10 h-10 shrink-0 rounded-md overflow-hidden transition-all duration-300 border-2 cursor-pointer focus:outline-none ${isActive
                              ? "border-blue-500 scale-105"
                              : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          aria-label={`Go to image ${idx + 1}`}
                        >
                          <Image
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={scrollNext}
                    disabled={currentImageIdx === product.images.length - 1}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer focus:outline-none"
                    aria-label="Next image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Product Details Info Block (40% width, padded, scrolls normally) */}
          <div className="w-full lg:w-[40%] px-6 md:px-12 lg:px-16 py-10 flex flex-col space-y-8">

            {/* Header info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
              className="border-b border-luxury-silver/20 pb-6"
            >
              <div className="flex justify-between items-start space-x-6">
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-luxury-gold font-bold block mb-2">
                    {brandName}
                  </span>
                  <h1 className="font-serif text-2xl md:text-3.5xl font-light text-luxury-dark leading-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Right-aligned Action Icons */}
                <div className="flex flex-col space-y-4 pt-1 items-center">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={handleWishlistToggle}
                    className={`transition-colors focus:outline-none cursor-pointer ${product && isInWishlist(product._id)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-neutral-500 hover:text-[#C5A880]'
                      }`}
                    aria-label={product && isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    {product && isInWishlist(product._id) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart-fill w-5 h-5" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-heart w-5 h-5" viewBox="0 0 16 16">
                        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15" />
                      </svg>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.href);
                        showToast("Link copied to clipboard!");
                      } catch {
                        showToast("Failed to copy link.", "error");
                      }
                    }}
                    className="text-neutral-500 hover:text-[#C5A880] transition-colors focus:outline-none cursor-pointer"
                    aria-label="Share product"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-share w-5 h-5" viewBox="0 0 16 16">
                      <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Ratings */}
              {product.ratings && product.ratings.count > 0 && (
                <div className="flex items-center space-x-2 mt-2 mb-4">
                  <div className="flex text-luxury-gold text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>
                        {i < Math.round(product.ratings.average) ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-sans uppercase tracking-widest text-neutral-400">
                    ({product.ratings.count} reviews)
                  </span>
                </div>
              )}

              {/* Price Display */}
              <div className="mt-4 flex flex-col space-y-1">
                <div className="flex items-baseline space-x-3">
                  <span className="text-xl md:text-2xl font-sans font-light text-luxury-dark">
                    ${displayPrice.toLocaleString()}
                  </span>
                  {displayComparePrice && displayComparePrice > displayPrice && (
                    <span className="text-sm font-sans font-light text-neutral-400 line-through">
                      ${displayComparePrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-sans text-neutral-400">
                  (Inclusive of all Taxes)
                </span>

                {/* Badges / Warnings */}
                <div className="pt-2 flex flex-wrap gap-2 h-2">
                  {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
                    <span className="text-[9px] uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-0.5 border border-amber-200">
                      Only {selectedVariant.stock} left in stock
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="text-[9px] uppercase tracking-wider bg-red-50 text-red-600 px-2 py-0.5 border border-red-200">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Product Variants (Size / Color etc) */}
            {product.variants && product.variants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.215, 0.61, 0.355, 1] }}
                className="space-y-6"
              >
                {Object.keys(uniqueAttributes).map((attrName) => (
                  <div key={attrName} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-[10px] uppercase tracking-luxury text-neutral-500 font-semibold">
                          Select {attrName}:
                        </span>
                        <span className="text-[11px] font-sans text-luxury-dark font-medium uppercase tracking-wider">
                          {selectedAttributes[attrName] || "None"}
                        </span>
                      </div>
                      {attrName === "Size" && (
                        <button
                          onClick={() => setIsSizeChartOpen(true)}
                          className="text-[10px] uppercase tracking-luxury text-luxury-dark hover:text-luxury-gold underline font-semibold focus:outline-none cursor-pointer"
                        >
                          SIZE CHART
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {uniqueAttributes[attrName].map((val) => {
                        const isSelected = selectedAttributes[attrName] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handleAttributeChange(attrName, val)}
                            className={`h-11 min-w-[3.5rem] px-4 text-xs font-sans transition-all duration-300 flex items-center justify-center cursor-pointer ${isSelected
                                ? "bg-[#111111] text-[#FDFBF7] border border-transparent font-medium"
                                : "bg-transparent text-luxury-dark border border-luxury-silver/40 hover:border-luxury-dark"
                              }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Quantity Selector and Cart CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
              className="flex flex-col space-y-4 pt-4 border-t border-luxury-silver/20"
            >
              <div className="flex space-x-4 items-center">

                {/* Quantity Counter */}
                <div className="flex items-center border border-luxury-silver/40 h-12 bg-white rounded-md overflow-hidden select-none">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="w-12 h-full flex items-center justify-center text-neutral-500 md:hover:text-luxury-dark disabled:opacity-30 md:hover:bg-neutral-50 active:bg-neutral-100 outline-none transition-colors cursor-pointer select-none"
                    aria-label="Decrease quantity"
                  >
                    —
                  </button>
                  <span className="w-10 text-center text-xs font-sans font-medium text-luxury-dark select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock ?? 10, q + 1))}
                    disabled={isOutOfStock || (selectedVariant && quantity >= selectedVariant.stock)}
                    className="w-12 h-full flex items-center justify-center text-neutral-500 md:hover:text-luxury-dark disabled:opacity-30 md:hover:bg-neutral-50 active:bg-neutral-100 outline-none transition-colors cursor-pointer select-none"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* BUY NOW CTA */}
                <div className="flex-1">
                  <Button
                    variant={isOutOfStock ? "outline" : "primary"}
                    disabled={isOutOfStock || cartLoading}
                    onClick={() => {
                      handleAddToCart();
                      setTimeout(() => router.push("/checkout"), 1200);
                    }}
                    className="w-full h-12"
                  >
                    {cartLoading ? "Processing..." : isOutOfStock ? "Out of Stock" : "Buy Now"}
                  </Button>
                </div>
              </div>

              {/* ADD TO BAG CTA */}
              {!isOutOfStock && (
                <Button
                  variant="outline"
                  disabled={cartLoading}
                  onClick={handleAddToCart}
                  className="w-full h-12 bg-transparent text-[#111111] hover:bg-[#111111] hover:text-[#FDFBF7] border border-[#111111] cursor-pointer"
                >
                  {cartLoading ? "Adding..." : "Add to Bag"}
                </Button>
              )}
            </motion.div>

            {/* Delivery Verification Widget */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
              className="pt-6 border-t border-luxury-silver/20 space-y-4"
            >
              <h3 className="text-[10px] uppercase tracking-luxury text-neutral-500 font-semibold">
                Delivery Details
              </h3>

              <div className="relative flex items-center border border-luxury-silver/40 h-12 bg-white max-w-sm">
                <input
                  type="text"
                  placeholder="Enter Delivery Pincode"
                  className="w-full h-full px-4 text-xs font-sans font-light tracking-wide outline-none text-luxury-dark placeholder-neutral-400 bg-transparent pr-12"
                />
                <button
                  onClick={() => alert("Delivery estimate: Ships in 2-3 business days.")}
                  className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-luxury-dark hover:text-luxury-gold transition-colors focus:outline-none cursor-pointer"
                  aria-label="Check delivery pincode"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              {/* Policy notes */}
              <div className="flex items-center space-x-2 text-[10px] text-neutral-500 font-sans tracking-wide">
                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                </svg>
                <span>15 days returns / exchange available.</span>
                <button
                  onClick={() => alert("Free returns and exchanges within 15 days on all unworn items in original packaging.")}
                  className="underline hover:text-luxury-dark transition-colors focus:outline-none cursor-pointer"
                >
                  More Info
                </button>
              </div>
            </motion.div>

            {/* Description accordion / text */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.215, 0.61, 0.355, 1] }}
              className="border-t border-luxury-silver/20 pt-6 space-y-4"
            >
              <h3 className="text-[10px] uppercase tracking-luxury text-neutral-500 font-medium">
                The Editorial Narrative
              </h3>
              <p className="text-sm font-light text-neutral-600 leading-relaxed font-sans">
                {product.description}
              </p>
              {product.summary && (
                <p className="text-xs font-light text-neutral-500 leading-relaxed italic border-l-2 border-luxury-gold/50 pl-4 py-1">
                  {product.summary}
                </p>
              )}
            </motion.div>

          </div>
        </div>

        {/* Bottom Recommendation Module */}
        <div className="w-full mt-10 md:mt-20 pb-0">
          <RecommendationSlider
            products={recommendations}
            onProductClick={(id) => {
              // Find matching recommended product to switch slug
              const match = recommendations.find((r) => r.id === id);
              if (match && match.name) {
                // Generate a mock slug from name for redirect
                const targetSlug = match.name.toLowerCase().replace(/ /g, "-");
                router.push(`/products/${targetSlug}`);
              }
            }}
          />
        </div>

        {/* Recently Viewed Products */}
        {recentlyViewed.length > 0 && (
          <div className="w-full max-w-7xl mx-auto px-6 mt-4 md:mt-10 pb-16 md:pb-24 border-t border-luxury-silver/20 pt-8 md:pt-16 text-left">
            <h3 className="font-serif text-2xl font-light text-luxury-dark mb-8">
              Recently Viewed
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recentlyViewed.map((p) => {
                const brandName = typeof p.brand === 'object' && p.brand !== null ? p.brand.name : 'LXUY SIGNATURE';
                const image = p.images && p.images.length > 0 ? p.images[0] : '/images/models/modules1.jpeg';
                const formattedPrice = new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0
                }).format(p.price);

                return (
                  <Link
                    key={p._id}
                    href={`/products/${p.slug}`}
                    className="group space-y-3 block"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-luxury-silver/5 relative">
                      <img
                        src={image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-700 ease-out"
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
                        {brandName}
                      </span>
                      <h4 className="font-serif text-neutral-800 tracking-wide group-hover:text-luxury-gold transition-colors text-sm font-normal truncate">
                        {p.name}
                      </h4>
                      <p className="font-semibold text-neutral-700">
                        {formattedPrice}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* Scaffolding Footer */}
      <Footer />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-[#111111]/95 backdrop-blur-md text-[#FDFBF7] border border-[#C5A880]/20 px-5 py-3 shadow-2xl rounded-sm font-sans text-xs tracking-wider"
          >
            {toast.type === "success" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-circle-fill text-emerald-500 w-4 h-4" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
              </svg>
            ) : toast.type === "error" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-circle-fill text-rose-500 w-4 h-4" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-info-circle-fill text-sky-500 w-4 h-4" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Chart Modal */}
      <AnimatePresence>
        {isSizeChartOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeChartOpen(false)}
              className="fixed inset-0 bg-[#111111]/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-[#FDFBF7] border border-[#C5A880]/30 shadow-2xl p-8 rounded-sm font-sans z-10 overflow-hidden"
            >
              {/* Decorative corner elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C5A880]/40" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C5A880]/40" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C5A880]/40" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C5A880]/40" />

              {/* Close Button */}
              <button
                onClick={() => setIsSizeChartOpen(false)}
                className="absolute top-5 right-5 text-neutral-400 hover:text-[#111111] transition-colors focus:outline-none cursor-pointer"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x w-6 h-6" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                </svg>
              </button>

              {/* Title */}
              <div className="text-center mb-6">
                <span className="text-[10px] uppercase tracking-luxury text-[#C5A880] font-bold block mb-1">
                  Fit Guide
                </span>
                <h2 className="font-serif text-2xl font-light text-[#111111]">
                  Size Chart
                </h2>
              </div>

              {/* Table of measurements */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] text-neutral-400 font-semibold tracking-wider uppercase">
                      <th className="py-3 px-2 font-medium">Size</th>
                      <th className="py-3 px-2 font-medium">Chest (in)</th>
                      <th className="py-3 px-2 font-medium">Waist (in)</th>
                      <th className="py-3 px-2 font-medium">Sleeve (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]/60 text-neutral-700 font-light">
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-2 font-medium text-[#111111]">Small (S)</td>
                      <td className="py-3.5 px-2">36 - 38</td>
                      <td className="py-3.5 px-2">30 - 32</td>
                      <td className="py-3.5 px-2">32.5</td>
                    </tr>
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-2 font-medium text-[#111111]">Medium (M)</td>
                      <td className="py-3.5 px-2">38 - 40</td>
                      <td className="py-3.5 px-2">32 - 34</td>
                      <td className="py-3.5 px-2">33.5</td>
                    </tr>
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-2 font-medium text-[#111111]">Large (L)</td>
                      <td className="py-3.5 px-2">40 - 42</td>
                      <td className="py-3.5 px-2">34 - 36</td>
                      <td className="py-3.5 px-2">34.5</td>
                    </tr>
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3.5 px-2 font-medium text-[#111111]">X-Large (XL)</td>
                      <td className="py-3.5 px-2">42 - 44</td>
                      <td className="py-3.5 px-2">36 - 38</td>
                      <td className="py-3.5 px-2">35.5</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Measuring Tip */}
              <div className="mt-6 bg-[#E5E5E5]/20 p-4 border border-[#E5E5E5]/30">
                <p className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold mb-1">
                  How to measure:
                </p>
                <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
                  Measure around the fullest part of your chest, keeping the tape horizontal. For waist, measure around the narrowest part (typically where your body bends side to side).
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
