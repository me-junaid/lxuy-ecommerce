"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import AdminLayout from "../../../components/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BrandObj {
  _id: string;
  name: string;
}

interface CategoryObj {
  _id: string;
  name: string;
}

interface ProductVariant {
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: BrandObj | string;
  category: CategoryObj | string;
  status: "draft" | "published" | "archived";
  images: string[];
  variants?: ProductVariant[];
  isCurated?: boolean;
  curatedPosition?: number | null;
}

// ─── Fallback Image Placeholder ────────────────────────────────────────────────

function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`bg-neutral-100 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}>
        <span className="font-serif text-xl font-bold tracking-[0.25em] text-neutral-300">
          LXUY
        </span>
        <span className="text-[7px] uppercase tracking-[0.2em] text-neutral-400 mt-1 font-semibold">
          No Image
        </span>
      </div>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={className}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CurateReleasesPage() {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [searchVal, setSearchVal] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");

  // Selected curated IDs IN EXACT POSITION ORDER (index 0 = pos 1, index 1 = pos 2, etc.)
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [initialOrder, setInitialOrder] = useState<string[]>([]);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Load products list
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/products/admin?limit=150");
      const loadedProducts: Product[] = Array.isArray(res) ? res : (res.data || []);
      setProducts(loadedProducts);

      // Sort existing curated products by curatedPosition or default
      const curatedItems = loadedProducts
        .filter((p) => p.isCurated)
        .sort((a, b) => (a.curatedPosition ?? 99) - (b.curatedPosition ?? 99))
        .map((p) => p._id)
        .slice(0, 4);

      setSelectedOrder(curatedItems);
      setInitialOrder(curatedItems);
    } catch (err) {
      console.error("Failed to load products for curation:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => { void loadProducts(); }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, loadProducts]);

  // Compute if changes exist
  const hasUnsavedChanges = useMemo(() => {
    if (selectedOrder.length !== initialOrder.length) return true;
    return selectedOrder.some((id, idx) => id !== initialOrder[idx]);
  }, [selectedOrder, initialOrder]);

  // Extract unique brands and categories for dropdown filters
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const name = typeof p.brand === "object" ? p.brand?.name : String(p.brand || "");
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [products]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const name = typeof p.category === "object" ? p.category?.name : String(p.category || "");
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [products]);

  // Map for quick product lookup
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p._id, p));
    return map;
  }, [products]);

  // Toggle selection
  const handleToggleProduct = (productId: string) => {
    const isSelected = selectedOrder.includes(productId);
    if (isSelected) {
      // Remove from selection
      setSelectedOrder((prev) => prev.filter((id) => id !== productId));
    } else {
      if (selectedOrder.length >= 4) {
        showToast("You can feature a maximum of 4 products. Deselect an item first.");
        return;
      }
      setSelectedOrder((prev) => [...prev, productId]);
    }
  };

  // Reorder controls
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setSelectedOrder((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= selectedOrder.length - 1) return;
    setSelectedOrder((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRemoveFromCuration = (productId: string) => {
    setSelectedOrder((prev) => prev.filter((id) => id !== productId));
  };

  // Save Curation handler
  const handleSaveCurated = async () => {
    if (selectedOrder.length !== 4) {
      showToast("You must select exactly 4 products before saving.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/v1/products/curate", { productIds: selectedOrder });
      setInitialOrder(selectedOrder);
      setProducts((prev) =>
        prev.map((p) => {
          const idx = selectedOrder.indexOf(p._id);
          return {
            ...p,
            isCurated: idx !== -1,
            curatedPosition: idx !== -1 ? idx + 1 : null,
          };
        })
      );
      showToast("Curation updated successfully");
    } catch (err) {
      console.error("Failed to save curated releases:", err);
      showToast("Failed to save curation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setSelectedOrder(initialOrder);
  };

  // Filter products for catalog grid
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const query = searchVal.trim().toLowerCase();
      if (query) {
        const nameMatch = p.name.toLowerCase().includes(query);
        const brandName = (typeof p.brand === "object" ? p.brand?.name : String(p.brand || "")).toLowerCase();
        const skuMatch = p.variants?.some((v) => v.sku.toLowerCase().includes(query)) ?? false;
        if (!nameMatch && !brandName.includes(query) && !skuMatch) return false;
      }

      // Brand
      if (selectedBrand) {
        const brandName = typeof p.brand === "object" ? p.brand?.name : String(p.brand || "");
        if (brandName !== selectedBrand) return false;
      }

      // Category
      if (selectedCategory) {
        const catName = typeof p.category === "object" ? p.category?.name : String(p.category || "");
        if (catName !== selectedCategory) return false;
      }

      // Stock
      if (stockFilter !== "all") {
        const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
        if (stockFilter === "in_stock" && totalStock <= 0) return false;
        if (stockFilter === "out_of_stock" && totalStock > 0) return false;
      }

      return true;
    });
  }, [products, searchVal, selectedBrand, selectedCategory, stockFilter]);

  const hasActiveFilters = searchVal || selectedBrand || selectedCategory || stockFilter !== "all";

  const clearFilters = () => {
    setSearchVal("");
    setSelectedBrand("");
    setSelectedCategory("");
    setStockFilter("all");
  };

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#111111] selection:bg-[#B38F5F]/15 selection:text-[#B38F5F] relative">

        {/* ─── Notification Toast ────────────────────────────────────── */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 bg-[#111111] text-white px-5 py-3 rounded shadow-xl text-xs uppercase tracking-widest font-semibold flex items-center gap-3 border border-neutral-700"
            >
              <span className="w-2 h-2 rounded-full bg-[#B38F5F]" />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Sticky Header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-[#FDFBF7] border-b border-neutral-200/70 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#B38F5F] font-bold block mb-1">
              Storefront Merchandising
            </span>
            <h1 className="font-serif text-2xl md:text-3xl font-light tracking-wide text-[#111111]">
              Curated Releases
            </h1>
            <p className="text-[11px] text-neutral-500 mt-1 tracking-wide">
              Select exactly 4 products to feature on the storefront.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveCurated}
              disabled={saving || !hasUnsavedChanges || selectedOrder.length !== 4}
              className="px-6 py-2.5 text-[10px] uppercase tracking-[0.25em] font-bold bg-[#B38F5F] hover:bg-[#9c7b50] text-white rounded transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {saving ? "SAVING..." : "SAVE CURATION"}
            </button>
          </div>
        </header>

        <main className="flex-1 px-8 py-8 space-y-8 max-w-7xl w-full mx-auto">

          {/* ─── Curation Progress Bar ───────────────────────────────── */}
          <div className="bg-white p-5 border border-neutral-200/80 rounded shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-bold block">
                  CURATION PROGRESS
                </span>
                <span className="text-xs font-semibold text-[#111111] mt-0.5 block">
                  {selectedOrder.length} of 4 products selected
                </span>
              </div>
              {selectedOrder.length === 4 ? (
                <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 self-start sm:self-auto">
                  Ready to Publish
                </span>
              ) : (
                <span className="text-[9px] uppercase tracking-widest font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded border border-amber-200 self-start sm:self-auto">
                  Need {4 - selectedOrder.length} More Product{4 - selectedOrder.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Slot Position Indicators */}
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((idx) => {
                const productId = selectedOrder[idx];
                const product = productId ? productMap.get(productId) : null;
                const posStr = `0${idx + 1}`;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded border transition-all duration-300 flex items-center justify-between ${
                      product
                        ? "bg-[#FDFBF7] border-[#B38F5F]/60 text-[#111111] shadow-2xs"
                        : "bg-neutral-50/70 border-dashed border-neutral-200 text-neutral-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          product
                            ? "bg-[#B38F5F] text-white"
                            : "bg-neutral-200 text-neutral-500"
                        }`}
                      >
                        {posStr}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium truncate block">
                          {product ? product.name : `Slot ${posStr} Empty`}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-neutral-400 block truncate">
                          {product
                            ? typeof product.brand === "object"
                              ? product.brand?.name
                              : String(product.brand || "")
                            : "Unassigned"}
                        </span>
                      </div>
                    </div>
                    {product ? (
                      <span className="text-[#B38F5F] font-bold text-xs shrink-0 ml-1">✓</span>
                    ) : (
                      <span className="text-neutral-300 text-xs shrink-0 ml-1">○</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Selected For Release Reorder Section ─────────────────── */}
          {selectedOrder.length > 0 && (
            <div className="bg-white p-5 border border-neutral-200/80 rounded shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.25em] font-bold text-neutral-400">
                    SELECTED FOR RELEASE — FEATURED DISPLAY ORDER
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Order 01 to 04 defines how products appear on the storefront homepage.
                  </p>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold hidden sm:inline">
                  Reorder Positions
                </span>
              </div>

              <div className="space-y-2">
                {selectedOrder.map((id, idx) => {
                  const p = productMap.get(id);
                  if (!p) return null;
                  const posStr = `0${idx + 1}`;
                  const brandName = typeof p.brand === "object" ? p.brand?.name : String(p.brand || "");
                  const image = p.images?.[0];
                  const minPrice = p.variants?.length
                    ? Math.min(...p.variants.map((v) => v.price))
                    : null;

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-4 p-3 bg-[#FDFBF7] border border-neutral-200/90 rounded hover:border-[#B38F5F]/60 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className="text-[10px] font-mono font-bold text-white bg-[#B38F5F] px-2 py-1 rounded shrink-0">
                          {posStr}
                        </span>

                        <div className="w-10 h-12 rounded overflow-hidden shrink-0 border border-neutral-200">
                          <ImageWithFallback
                            src={image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">
                            {brandName}
                          </span>
                          <h4 className="font-serif text-sm text-[#111111] font-medium truncate">
                            {p.name}
                          </h4>
                          {minPrice !== null && (
                            <span className="text-[10px] text-neutral-500 block">
                              ₹{minPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reorder & Remove Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="w-7 h-7 flex items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:text-[#111] hover:border-neutral-400 disabled:opacity-25 disabled:hover:border-neutral-200 transition-colors text-xs"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === selectedOrder.length - 1}
                          className="w-7 h-7 flex items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:text-[#111] hover:border-neutral-400 disabled:opacity-25 disabled:hover:border-neutral-200 transition-colors text-xs"
                          title="Move Down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleRemoveFromCuration(id)}
                          className="w-7 h-7 flex items-center justify-center rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors text-xs ml-1"
                          title="Remove from curation"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Search & Filter Controls ─────────────────────────────── */}
          <div className="bg-white p-4 border border-neutral-200/80 rounded shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400 text-sm">
                ⌕
              </span>
              <input
                type="text"
                placeholder="Search products by name, brand, or SKU..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-white border border-neutral-200 focus:border-[#B38F5F] text-xs pl-9 pr-4 py-2.5 outline-none rounded text-[#111111] placeholder-neutral-400 transition-colors"
              />
            </div>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="text-xs px-3 py-2.5 border border-neutral-200 bg-white rounded text-[#111111] focus:outline-none focus:border-[#B38F5F]"
            >
              <option value="">All Brands</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-2.5 border border-neutral-200 bg-white rounded text-[#111111] focus:outline-none focus:border-[#B38F5F]"
            >
              <option value="">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) =>
                setStockFilter(e.target.value as "all" | "in_stock" | "out_of_stock")
              }
              className="text-xs px-3 py-2.5 border border-neutral-200 bg-white rounded text-[#111111] focus:outline-none focus:border-[#B38F5F]"
            >
              <option value="all">All Availability</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {/* Clear Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 hover:text-[#111111] transition-colors px-2 shrink-0 self-center"
              >
                Clear Filters ✕
              </button>
            )}
          </div>

          {/* ─── Product Cards Catalog Grid ────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-neutral-200 rounded overflow-hidden space-y-3 p-3 animate-pulse"
                >
                  <div className="aspect-[4/5] bg-neutral-100 rounded" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-neutral-300 rounded bg-neutral-50/50 space-y-3">
              <p className="font-serif text-lg text-neutral-400 tracking-wider">
                No products found
              </p>
              <p className="text-[11px] text-neutral-400">
                Try adjusting your search query or filter selection.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-block mt-2 text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 bg-[#111111] text-white rounded hover:bg-neutral-800 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((p) => {
                const selectedIndex = selectedOrder.indexOf(p._id);
                const isSelected = selectedIndex !== -1;
                const positionNum = isSelected ? `0${selectedIndex + 1}` : null;
                const image = p.images?.[0];
                const brandName =
                  typeof p.brand === "object" ? p.brand?.name : String(p.brand || "LXUY");
                const minPrice = p.variants?.length
                  ? Math.min(...p.variants.map((v) => v.price))
                  : null;
                const totalStock =
                  p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;

                return (
                  <div
                    key={p._id}
                    onClick={() => handleToggleProduct(p._id)}
                    className={`flex flex-col bg-white border rounded overflow-hidden cursor-pointer transition-all duration-300 relative group ${
                      isSelected
                        ? "border-[#B38F5F] ring-1 ring-[#B38F5F]/40 bg-[#FDFBF7] shadow-md"
                        : "border-neutral-200/90 hover:border-neutral-400 hover:shadow-sm"
                    }`}
                  >
                    {/* Fixed 4:5 Image Container */}
                    <div className="aspect-[4/5] bg-neutral-50 relative overflow-hidden">
                      <ImageWithFallback
                        src={image}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                      />

                      {/* Position Badge top-right */}
                      <div className="absolute top-3 right-3 z-10">
                        {isSelected ? (
                          <div className="flex items-center gap-1 bg-[#B38F5F] text-white font-mono text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                            <span>{positionNum}</span>
                            <span>✓</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-white/70 bg-black/25 backdrop-blur-xs flex items-center justify-center text-transparent group-hover:border-white transition-all">
                            <span className="text-[10px] text-white opacity-0 group-hover:opacity-100">
                              +
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stock overlay badge if out of stock */}
                      {totalStock <= 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-neutral-900/80 text-white text-[7px] uppercase tracking-widest font-bold px-2 py-0.5 rounded">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between text-left space-y-2">
                      <div>
                        <span className="text-[8px] uppercase tracking-[0.2em] text-neutral-400 font-bold block">
                          {brandName}
                        </span>
                        <h4 className="font-serif text-sm text-[#111111] font-medium leading-snug truncate mt-0.5">
                          {p.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                        <span className="text-xs font-bold text-[#111111]">
                          {minPrice !== null ? `₹${minPrice.toLocaleString("en-IN")}` : "—"}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-neutral-400 font-semibold">
                          {typeof p.category === "object" ? p.category?.name : String(p.category || "")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>

        {/* ─── Sticky Bottom Action Bar (Unsaved Changes) ─────────────── */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="sticky bottom-0 z-40 bg-[#111111] text-white border-t border-neutral-800 px-8 py-4 flex items-center justify-between shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#B38F5F] animate-pulse" />
                <span className="text-xs uppercase tracking-widest font-semibold">
                  You have unsaved curation changes
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDiscardChanges}
                  className="text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 rounded transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveCurated}
                  disabled={saving || selectedOrder.length !== 4}
                  className="text-[9px] uppercase tracking-[0.2em] font-bold px-5 py-2 bg-[#B38F5F] hover:bg-[#9c7b50] text-white rounded transition-colors disabled:opacity-40"
                >
                  {saving ? "SAVING..." : "SAVE CURATION"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
