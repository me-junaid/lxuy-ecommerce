"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header, Footer, ProductCard, Button } from "@repo/ui";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
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

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  brand: Brand | string;
  category: Category | string;
  images: string[];
  variants?: any[];
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items, addItemToCart, setIsCartOpen } = useCart();

  // Read URL parameters
  const query = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialSort = searchParams.get("sort") || "featured";

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Input states (local UI states to avoid immediate URL updates)
  const [searchVal, setSearchVal] = useState(query);
  const [minPriceInput, setMinPriceInput] = useState(initialMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(initialMaxPrice);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch filter metadata (categories, brands) on mount
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [resCat, resBrand] = await Promise.all([
          fetch("/api/v1/categories"),
          fetch("/api/v1/brands"),
        ]);
        if (resCat.ok) {
          const cats = await resCat.json();
          setCategories(cats);
        }
        if (resBrand.ok) {
          const brs = await resBrand.json();
          setBrands(brs);
        }
      } catch (err) {
        console.error("Error loading filter metadata:", err);
      }
    }
    fetchMetadata();
  }, []);

  // Sync local searchVal when query param changes
  useEffect(() => {
    setSearchVal(query);
  }, [query]);

  // Fetch dynamic products based on URL params
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (query) params.append("search", query);
        if (initialCategory) params.append("category", initialCategory);
        if (initialBrand) params.append("brand", initialBrand);
        if (initialMinPrice) params.append("minPrice", initialMinPrice);
        if (initialMaxPrice) params.append("maxPrice", initialMaxPrice);
        params.append("page", initialPage.toString());
        params.append("limit", "12");

        const response = await fetch(`/api/v1/products?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch products matching parameters.");
        }
        const data = await response.json();
        setProducts(data.data || []);
        setTotalProducts(data.total || 0);
        setTotalPages(data.pages || 1);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [query, initialCategory, initialBrand, initialMinPrice, initialMaxPrice, initialPage]);

  // Apply filters via URL updates (preserves routing history and back buttons!)
  const updateUrl = (updates: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });
    // Reset page on filter changes
    if (!updates.page) {
      current.set("page", "1");
    }
    router.push(`/search?${current.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchVal });
  };

  const handleClearAll = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    router.push("/search");
  };

  // Sorting
  const sortedProducts = [...products].sort((a, b) => {
    if (initialSort === "price-asc") return a.price - b.price;
    if (initialSort === "price-desc") return b.price - a.price;
    return 0; // Featured / Default
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#111111]">
      <Header
        brandName="LXUY"
        cartCount={items.reduce((sum, item) => sum + item.quantity, 0)}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => setIsCartOpen(true)}
        onProfileClick={() => router.push(user ? "/profile" : "/login")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-16">
        {/* Title / Search Term Header */}
        <div className="border-b border-luxury-silver/30 pb-4 mb-6 text-left">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-2 block">
            Catalog Search
          </span>
          <h1 className="font-serif text-3.5xl md:text-5xl font-light text-luxury-dark leading-tight">
            {query ? `Results for "${query}"` : "All Collections"}
          </h1>
          <p className="text-xs font-light text-neutral-500 mt-2">
            Showing {totalProducts} premium items
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">

          {/* Left Column: Sidebar Filters (Desktop Only) */}
          <aside className="hidden lg:block space-y-8 text-left">

            {/* Search within results */}
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                Keyword Search
              </h4>
              <div className="flex border-b border-neutral-300 focus-within:border-luxury-dark pb-1">
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Filter by name..."
                  className="bg-transparent border-none outline-none text-sm font-light w-full placeholder-neutral-300"
                />
                <button type="submit" className="text-xs font-bold text-luxury-gold uppercase ml-2">
                  Go
                </button>
              </div>
            </form>

            {/* Categories list */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                Categories
              </h4>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => updateUrl({ category: null })}
                  className={`text-xs text-left transition-colors font-medium ${!initialCategory ? "text-luxury-gold font-bold" : "text-neutral-500 hover:text-luxury-dark"
                    }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => updateUrl({ category: cat._id })}
                    className={`text-xs text-left transition-colors ${initialCategory === cat._id ? "text-luxury-gold font-bold" : "text-neutral-500 hover:text-luxury-dark"
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands list */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                Brands
              </h4>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => updateUrl({ brand: null })}
                  className={`text-xs text-left transition-colors font-medium ${!initialBrand ? "text-luxury-gold font-bold" : "text-neutral-500 hover:text-luxury-dark"
                    }`}
                >
                  All Brands
                </button>
                {brands.map((br) => (
                  <button
                    key={br._id}
                    onClick={() => updateUrl({ brand: br._id })}
                    className={`text-xs text-left transition-colors ${initialBrand === br._id ? "text-luxury-gold font-bold" : "text-neutral-500 hover:text-luxury-dark"
                      }`}
                  >
                    {br.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                Price Range
              </h4>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full bg-transparent border border-neutral-200 focus:border-luxury-dark text-xs p-2 outline-none"
                />
                <span className="text-neutral-300">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full bg-transparent border border-neutral-200 focus:border-luxury-dark text-xs p-2 outline-none"
                />
              </div>
              <div className="flex space-x-2 pt-1">
                <Button
                  onClick={() => updateUrl({ minPrice: minPriceInput, maxPrice: maxPriceInput })}
                  variant="primary"
                  className="w-full py-2 text-[10px]"
                >
                  Apply Price
                </Button>
                <Button
                  onClick={handleClearAll}
                  variant="secondary"
                  className="w-full py-2 text-[10px]"
                >
                  Reset
                </Button>
              </div>
            </div>

          </aside>

          {/* Right Column: Catalog Grid & Sorting */}
          <section className="col-span-1 lg:col-span-3 space-y-4">

            {/* Action Bar (Sorting & Mobile Filter Toggle) */}
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center text-xs uppercase tracking-luxury font-bold text-neutral-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>

              <div className="flex items-center space-x-2 ml-auto">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                  Sort By:
                </span>
                <select
                  value={initialSort}
                  onChange={(e) => updateUrl({ sort: e.target.value })}
                  className="bg-transparent border-none outline-none text-xs font-medium text-neutral-700 cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded text-center">
                {error}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse space-y-4">
                    <div className="aspect-[3/4] bg-neutral-100 rounded-sm" />
                    <div className="h-3 bg-neutral-100 rounded w-1/3" />
                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-neutral-200 rounded">
                <h3 className="font-serif text-lg font-light text-neutral-500 mb-2">
                  No products match your description
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto mb-6">
                  Try adjusting your filters, clearing price constraints, or spelling out the full keyword.
                </p>
                <Button onClick={handleClearAll} variant="secondary" className="px-6 py-2">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {sortedProducts.map((product) => {
                  const brandName = typeof product.brand === "object" && product.brand !== null ? product.brand.name : "LXUY SIGNATURE";
                  const image = product.images && product.images.length > 0 ? product.images[0] : "/images/models/modules1.jpeg";

                  return (
                    <ProductCard
                      key={product._id}
                      id={product._id}
                      name={product.name}
                      brand={brandName}
                      price={product.variants && product.variants.length > 0 ? product.variants[0].price : 0}
                      imageUrl={image}
                      onClick={() => router.push(`/products/${product.slug}`)}
                      onAddToCart={() => {
                        const baseSku = product.variants?.[0]?.sku || `BASE-SKU-${product._id}`;
                        addItemToCart(product, baseSku, 1);
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 pt-12 border-t border-neutral-200">
                <button
                  disabled={initialPage <= 1}
                  onClick={() => updateUrl({ page: (initialPage - 1).toString() })}
                  className="text-xs font-semibold tracking-luxury uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:text-luxury-gold transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-neutral-500">
                  Page {initialPage} of {totalPages}
                </span>
                <button
                  disabled={initialPage >= totalPages}
                  onClick={() => updateUrl({ page: (initialPage + 1).toString() })}
                  className="text-xs font-semibold tracking-luxury uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:text-luxury-gold transition-colors"
                >
                  Next
                </button>
              </div>
            )}

          </section>

        </div>
      </main>

      {/* Mobile Drawer (Filters Panel sliding up/in) */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            key="mobile-filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilters(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
        {showMobileFilters && (
          <motion.div
            key="mobile-filter-drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDFBF7] shadow-2xl p-6 rounded-t-2xl max-h-[85vh] overflow-y-auto space-y-6 lg:hidden text-left"
          >
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="font-serif text-lg font-medium text-luxury-dark">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-xs uppercase tracking-luxury text-neutral-400 font-bold hover:text-luxury-gold"
              >
                Close
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Categories</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { updateUrl({ category: null }); setShowMobileFilters(false); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!initialCategory ? "bg-luxury-dark text-[#FDFBF7] border-luxury-dark" : "border-neutral-200 text-neutral-600"
                    }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => { updateUrl({ category: cat._id }); setShowMobileFilters(false); }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${initialCategory === cat._id ? "bg-luxury-dark text-[#FDFBF7] border-luxury-dark" : "border-neutral-200 text-neutral-600"
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Brands</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { updateUrl({ brand: null }); setShowMobileFilters(false); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!initialBrand ? "bg-luxury-dark text-[#FDFBF7] border-luxury-dark" : "border-neutral-200 text-neutral-600"
                    }`}
                >
                  All
                </button>
                {brands.map((br) => (
                  <button
                    key={br._id}
                    onClick={() => { updateUrl({ brand: br._id }); setShowMobileFilters(false); }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${initialBrand === br._id ? "bg-luxury-dark text-[#FDFBF7] border-luxury-dark" : "border-neutral-200 text-neutral-600"
                      }`}
                  >
                    {br.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Price Range</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full bg-transparent border border-neutral-200 text-xs p-2 outline-none"
                />
                <span className="text-neutral-300">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full bg-transparent border border-neutral-200 text-xs p-2 outline-none"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => { updateUrl({ minPrice: minPriceInput, maxPrice: maxPriceInput }); setShowMobileFilters(false); }}
                  variant="primary"
                  className="w-full py-2.5"
                >
                  Apply Price Filter
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center flex-col space-y-4">
        <svg className="animate-spin h-8 w-8 text-luxury-gold" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs uppercase tracking-luxury text-neutral-400 font-semibold">
          Loading Luxury Catalog...
        </span>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}