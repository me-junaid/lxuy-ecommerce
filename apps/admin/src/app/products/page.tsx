"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Button } from "@repo/ui";
import AdminLayout from "../../components/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import ProductDrawer, { DrawerProduct, ToastPayload } from "../../components/ProductDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  summary?: string;
  brand: { _id: string; name: string } | string;
  category: { _id: string; name: string } | string;
  status: "draft" | "published" | "archived";
  images: string[];
  isCurated?: boolean;
  variants: Array<{
    sku: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    attributes: Array<{ name: string; value: string }>;
    images?: string[];
    isActive?: boolean;
  }>;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const getSizeLabel = (v: Product["variants"][0], i: number) => {
  if (!v || !v.attributes || v.attributes.length === 0) return `V${i + 1}`;
  const a = v.attributes.find((x) => x && x.name && x.name.toLowerCase() === "size");
  if (a && a.value) return a.value;
  if (v.attributes[0]?.value) return v.attributes[0].value;
  return `V${i + 1}`;
};

const pillClass = (stock: number) => {
  if (stock === 0) return "text-red-500 bg-red-50/80 border-red-200/80";
  if (stock <= 5) return "text-amber-600 bg-amber-50/80 border-amber-200/80";
  return "text-neutral-500 bg-neutral-50/80 border-neutral-200/80";
};

const statusBadge = (s: string) => {
  if (s === "published") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (s === "draft") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-neutral-500 bg-neutral-100 border-neutral-200";
};

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded border shadow-lg min-w-[240px] max-w-sm ${
              t.type === "success"
                ? "bg-[#FDFBF7] border-neutral-200 text-[#111111]"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {t.type === "success" ? (
              <svg className="w-4 h-4 text-[#B38F5F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            )}
            <span className="text-xs font-semibold flex-1">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Three-dot Menu ───────────────────────────────────────────────────────────

function RowMenu({
  productId,
  status,
  isOpen,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
}: {
  productId: string;
  status: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle("");
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onToggle(isOpen ? "" : productId)}
        className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none"
        aria-label="Row actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-8 w-44 bg-[#FDFBF7] border border-neutral-200 rounded shadow-lg z-20 py-1 overflow-hidden"
          >
            {[
              { label: "Edit Product", action: onEdit, cls: "text-neutral-700 hover:bg-neutral-50" },
              { label: "Archive", action: onArchive, cls: `${status === "archived" ? "opacity-40 cursor-not-allowed" : "text-amber-700 hover:bg-amber-50"}` },
              { label: "Delete", action: onDelete, cls: "text-red-600 hover:bg-red-50" },
            ].map(({ label, action, cls }) => (
              <button
                key={label}
                onClick={() => { action(); onToggle(""); }}
                disabled={label === "Archive" && status === "archived"}
                className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${cls}`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [drawerProduct, setDrawerProduct] = useState<DrawerProduct | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Load products
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get("/api/v1/products/admin?limit=100");
      setProducts(res.data || []);
    } catch (err) {
      console.error("Failed to load admin products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (user) setTimeout(() => loadProducts(), 0);
  }, [user]);

  // ── Toast system
  const showToast = useCallback((payload: ToastPayload) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...payload }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Drawer handlers
  const openDrawer = (p: Product) => {
    setDrawerProduct(p as DrawerProduct);
    setOpenMenuId(null);
  };

  const handleDrawerSaved = (updated: DrawerProduct) => {
    setProducts((prev) => prev.map((p) => (p._id === updated._id ? (updated as Product) : p)));
    loadProducts();
  };

  const handleDrawerDeleted = (id: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  // ── Archive
  const handleArchive = async (productId: string) => {
    setUpdatingId(productId);
    try {
      await api.patch(`/api/v1/products/${productId}`, { status: "archived" });
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, status: "archived" } : p)));
      showToast({ message: "Product archived.", type: "success" });
    } catch {
      showToast({ message: "Failed to archive product.", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Delete (from menu)
  const handleDelete = async (productId: string, productName: string) => {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    setUpdatingId(productId);
    try {
      await api.delete(`/api/v1/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      showToast({ message: "Product deleted.", type: "success" });
    } catch {
      showToast({ message: "Failed to delete product.", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Filter
  const filteredProducts = products.filter((p) => {
    const q = searchVal.toLowerCase();
    const n = p.name.toLowerCase().includes(q);
    const b = (typeof p.brand === "object" ? p.brand.name : String(p.brand)).toLowerCase().includes(q);
    return n || b;
  });

  const toggleMenu = useCallback((id: string) => setOpenMenuId(id || null), []);

  return (
    <AdminLayout>
      <main className="flex-1 px-8 md:px-12 pb-8 md:pb-12 text-left overflow-x-hidden selection:bg-[#B38F5F]/15 selection:text-[#B38F5F]">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 bg-[#FDFBF7] z-30 -mx-8 px-8 md:-mx-12 md:px-12 pt-8 md:pt-12 pb-6 space-y-5 border-b border-neutral-200/60">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <h1 className="font-serif text-3xl font-light text-[#111111] leading-tight">
                Catalog Inventory
              </h1>
              <p className="text-[11px] uppercase tracking-widest text-[#B38F5F] mt-1.5 font-bold">
                {loadingProducts ? "Loading…" : `${products.length} product${products.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Button
              onClick={() => router.push("/products/create")}
              variant="primary"
              className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-[#B38F5F] hover:bg-[#9c7b50] text-white border-none rounded transition-all duration-300 shrink-0"
            >
              New Product
            </Button>
          </div>

          {/* Search */}
          <div className="max-w-md relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by name or brand…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-white border border-neutral-200 focus:border-[#B38F5F] text-xs pl-10 pr-4 py-3 outline-none rounded text-[#111111] placeholder-neutral-400 transition-all duration-300"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="mt-6">
          {loadingProducts ? (
            <div className="py-32 text-center text-[10px] uppercase tracking-[0.25em] text-[#B38F5F] font-bold animate-pulse">
              Loading catalog inventory…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-32 text-center border border-dashed border-neutral-200 rounded-lg">
              <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-bold">
                {searchVal ? "No matching products found" : "No products yet"}
              </p>
              {!searchVal && (
                <button
                  onClick={() => router.push("/products/create")}
                  className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#B38F5F] hover:text-[#9c7b50] transition-colors"
                >
                  Add your first product →
                </button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto border border-neutral-200/80 rounded-lg shadow-sm bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold bg-neutral-50/60">
                    <th className="p-4 pl-5">Product</th>
                    <th className="p-4">Brand / Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Inventory</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <AnimatePresence>
                    {filteredProducts.map((p) => {
                      const brandName = typeof p.brand === "object" ? p.brand.name : String(p.brand);
                      const catName = typeof p.category === "object" ? p.category.name : String(p.category);
                      const image = p.images && p.images.length > 0 ? p.images[0] : "/images/models/modules1.jpeg";
                      const basePrice = p.variants && p.variants.length > 0 ? p.variants[0].price : 0;
                      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                      const isUpdating = updatingId === p._id;

                      return (
                        <motion.tr
                          key={p._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`cursor-pointer hover:bg-neutral-50/70 transition-colors group ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
                          onClick={() => openDrawer(p)}
                        >
                          {/* Product */}
                          <td className="p-4 pl-5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-9 h-11 rounded overflow-hidden border border-neutral-200/80 shrink-0 bg-neutral-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-serif font-light text-[#111111] text-sm leading-snug max-w-[200px] truncate group-hover:text-[#B38F5F] transition-colors">
                                  {p.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {p.isCurated && (
                                    <span className="text-[7px] font-bold uppercase tracking-widest text-[#B38F5F] bg-[#B38F5F]/10 border border-[#B38F5F]/20 px-1.5 py-0.5 rounded">
                                      Curated
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Brand / Category */}
                          <td className="p-4">
                            <span className="text-xs font-semibold text-neutral-800 block">{brandName}</span>
                            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mt-0.5">{catName}</span>
                          </td>

                          {/* Price */}
                          <td className="p-4 font-serif font-light text-neutral-800 text-sm whitespace-nowrap">
                            {inr(basePrice)}
                          </td>

                          {/* Inventory (read-only) */}
                          <td className="p-4">
                            {p.variants && p.variants.length > 0 ? (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-1">
                                  {p.variants.map((v, idx) => {
                                    const size = getSizeLabel(v, idx);
                                    return (
                                      <span
                                        key={v.sku}
                                        className={`inline-flex items-center gap-1 text-[8px] font-bold border rounded px-1.5 py-0.5 ${pillClass(v.stock)}`}
                                      >
                                        <span className="uppercase tracking-wider">{size}</span>
                                        <span className="font-semibold opacity-80">{v.stock}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                                <span className="text-[9px] text-neutral-400 font-semibold">
                                  {totalStock} unit{totalStock !== 1 ? "s" : ""}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-semibold">No variants</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <span className={`text-[8px] font-bold uppercase tracking-widest border rounded px-2 py-1 ${statusBadge(p.status)}`}>
                              {p.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4 pr-5 text-right">
                            <RowMenu
                              productId={p._id}
                              status={p.status}
                              isOpen={openMenuId === p._id}
                              onToggle={toggleMenu}
                              onEdit={() => openDrawer(p)}
                              onArchive={() => handleArchive(p._id)}
                              onDelete={() => handleDelete(p._id, p.name)}
                            />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Product Drawer ── */}
      <AnimatePresence>
        {drawerProduct && (
          <ProductDrawer
            product={drawerProduct}
            onClose={() => setDrawerProduct(null)}
            onSaved={handleDrawerSaved}
            onDeleted={handleDrawerDeleted}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminLayout>
  );
}