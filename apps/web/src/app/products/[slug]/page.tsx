"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  Header,
  Footer,
  Button,
  RecommendationSlider,
} from "@repo/ui";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationProduct[]>(FALLBACK_RECOMMENDATIONS);

  // 1. Fetch Product details on mount/slug change
  useEffect(() => {
    async function fetchProductDetails() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/v1/products/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("The requested product silhouette could not be found.");
          }
          throw new Error("A server error occurred while retrieving product details.");
        }
        const data = (await response.json()) as Product;
        setProduct(data);
        
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
            defaultAttrs[attr.name] = attr.value;
          });
          setSelectedAttributes(defaultAttrs);
        }

        // Try to load category recommendations dynamically
        const catId = typeof data.category === "object" ? data.category._id : data.category;
        if (catId) {
          const recResponse = await fetch(`/api/v1/products?category=${catId}&limit=4`);
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

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) return;
    
    setCartLoading(true);
    setCartSuccess(false);

    // Simulate API request to backend Cart module
    setTimeout(() => {
      setCartLoading(false);
      setCartSuccess(true);
      setCartCount((prev) => prev + quantity);

      // Reset success banner after 4 seconds
      setTimeout(() => {
        setCartSuccess(false);
      }, 4000);
    }, 800);
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
        <Header brandName="LXUY" cartCount={cartCount} user={user} />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-2 border-luxury-silver border-t-luxury-dark rounded-full animate-spin" />
            <span className="font-sans text-[10px] uppercase tracking-luxury text-neutral-500">
              Retrieving Silhouettes...
            </span>
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
        <Header brandName="LXUY" cartCount={cartCount} user={user} />
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
        cartCount={cartCount}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => router.push("/cart")}
        onProfileClick={() => router.push(user ? "/profile" : "/login")}
        onSearchClick={() => {}}
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
                          className={`relative w-10 h-10 shrink-0 rounded-md overflow-hidden transition-all duration-300 border-2 cursor-pointer focus:outline-none ${
                            isActive 
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
                <div className="flex flex-col space-y-4 pt-1 items-center text-neutral-500">
                  <button 
                    onClick={() => alert("Added to Wishlist")} 
                    className="hover:text-luxury-gold transition-colors focus:outline-none cursor-pointer"
                    aria-label="Add to Wishlist"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => alert("Link copied to clipboard")} 
                    className="hover:text-luxury-gold transition-colors focus:outline-none cursor-pointer"
                    aria-label="Share product"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 10.742l4.636-2.318a3 3 0 10-.678-1.62l-4.637 2.318a3 3 0 10.678 1.62h.001zm6.632-6.632a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9.75 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                  </button>

                  <button 
                    onClick={() => alert("Size Chart Details:\nS: Chest 36\"\nM: Chest 38\"\nL: Chest 40\"\nXL: Chest 42\"")} 
                    className="hover:text-luxury-gold transition-colors focus:outline-none cursor-pointer"
                    aria-label="Size guide"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </button>
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
                <div className="pt-2 flex flex-wrap gap-2">
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
                {/* "Find my perfect size" Link (only for size attribute) */}
                {uniqueAttributes["Size"] && (
                  <div 
                    onClick={() => alert("Checking fit recommendations...")}
                    className="flex items-center space-x-2 text-[11px] text-luxury-dark hover:text-luxury-gold transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="underline tracking-wider uppercase text-[9px] font-semibold">Find my perfect size</span>
                  </div>
                )}

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
                          onClick={() => alert("Size Chart Details:\nS: Chest 36\"\nM: Chest 38\"\nL: Chest 40\"\nXL: Chest 42\"")} 
                          className="text-[10px] uppercase tracking-luxury text-luxury-dark hover:text-luxury-gold underline font-semibold focus:outline-none cursor-pointer"
                        >
                          Size Chart
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
                            className={`h-11 min-w-[3.5rem] px-4 text-xs font-sans transition-all duration-300 flex items-center justify-center cursor-pointer ${
                              isSelected
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
                <div className="flex items-center border border-luxury-silver/40 h-12 bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="px-4 text-neutral-500 hover:text-luxury-dark disabled:opacity-30 h-full flex items-center justify-center outline-none transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    —
                  </button>
                  <span className="w-12 text-center text-xs font-sans font-medium text-luxury-dark">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock ?? 10, q + 1))}
                    disabled={isOutOfStock || (selectedVariant && quantity >= selectedVariant.stock)}
                    className="px-4 text-neutral-500 hover:text-luxury-dark disabled:opacity-30 h-full flex items-center justify-center outline-none transition-colors cursor-pointer"
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
        <div className="w-full max-w-7xl mx-auto px-6 mt-32 pb-24">
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

      </main>

      {/* Scaffolding Footer */}
      <Footer />
    </div>
  );
}
