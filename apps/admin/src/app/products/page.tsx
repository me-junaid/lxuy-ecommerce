"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Button } from "@repo/ui";
import AdminLayout from "../../components/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  _id: string;
  name: string;
  brand: { _id: string; name: string } | string;
  category: { _id: string; name: string } | string;
  status: "draft" | "published" | "archived";
  images: string[];
  variants: Array<{
    sku: string;
    price: number;
    stock: number;
    attributes: Array<{ name: string; value: string }>;
    images?: string[];
    isActive?: boolean;
  }>;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load products list
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get("/api/v1/products/admin?limit=50");
      setProducts(res.data || []);
      
      const stockMap: Record<string, number> = {};
      (res.data || []).forEach((p: Product) => {
        if (p.variants && p.variants.length > 0) {
          stockMap[p._id] = p.variants[0].stock;
        }
      });
      setEditingStock(stockMap);
    } catch (err) {
      console.error("Failed to load admin products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  // Update product status
  const handleStatusChange = async (productId: string, newStatus: string) => {
    setUpdatingId(productId);
    try {
      await api.patch(`/api/v1/products/${productId}`, { status: newStatus });
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, status: newStatus as any } : p))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating product status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Update stock level
  const handleStockSave = async (productId: string) => {
    const targetStock = editingStock[productId];
    if (targetStock === undefined || targetStock < 0) return;

    setUpdatingId(productId);
    try {
      const product = products.find((p) => p._id === productId);
      if (!product || !product.variants || product.variants.length === 0) return;

      const updatedVariants = product.variants.map((v, index) => {
        return {
          sku: v.sku,
          price: v.price,
          stock: index === 0 ? Number(targetStock) : v.stock,
          attributes: v.attributes,
          images: v.images,
          isActive: v.isActive,
        };
      });

      await api.patch(`/api/v1/products/${productId}`, { variants: updatedVariants });
      
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? {
                ...p,
                variants: p.variants.map((v, idx) =>
                  idx === 0 ? { ...v, stock: Number(targetStock) } : v
                ),
              }
            : p
        )
      );
      alert("Stock count updated successfully.");
    } catch (err) {
      console.error("Failed to update stock:", err);
      alert("Error updating stock levels.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this product silhouette?")) return;

    setUpdatingId(productId);
    try {
      await api.delete(`/api/v1/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Error deleting product.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter products by search text
  const filteredProducts = products.filter((p) => {
    const query = searchVal.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(query);
    const brandName = typeof p.brand === "object" ? p.brand.name : String(p.brand);
    const brandMatch = brandName.toLowerCase().includes(query);
    return nameMatch || brandMatch;
  });

  return (
    <AdminLayout>
      <main className="flex-1 p-8 md:p-12 text-left space-y-8 overflow-x-hidden selection:bg-[#B38F5F]/15 selection:text-[#B38F5F]">
        
        {/* Banner Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-neutral-200/80 pb-5 gap-4">
          <div>
            <h1 className="font-serif text-3xl font-light text-[#111111] leading-tight">
              Catalog Inventory
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-[#B38F5F] mt-1.5 font-bold">
              Adjust stock counts, manage product visibility statuses, or delete archives.
            </p>
          </div>
          <Button
            onClick={() => router.push("/products/create")}
            variant="primary"
            className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-[#B38F5F] hover:bg-[#9c7b50] text-white border-none rounded transition-all duration-300"
          >
            New Product
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="max-w-md relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-white border border-neutral-200 focus:border-[#B38F5F] text-xs pl-10 pr-4 py-3 outline-none rounded-lg text-[#111111] placeholder-neutral-400 transition-all duration-300 shadow-sm"
          />
        </div>

        {/* Product Inventory Table */}
        {loadingProducts ? (
          <div className="py-24 text-center text-[10px] uppercase tracking-[0.25em] text-[#B38F5F] font-bold animate-pulse">
            Loading catalog inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50">
            <span className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] block font-bold">
              No matching products found
            </span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-neutral-200 rounded-lg shadow-sm bg-white">
            <table className="w-full border-collapse text-left text-xs text-neutral-700">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
                  <th className="p-4 pl-6">Silhouette</th>
                  <th className="p-4">Brand / Category</th>
                  <th className="p-4">Unit Price</th>
                  <th className="p-4">Stock Levels</th>
                  <th className="p-4">Visibility Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <AnimatePresence>
                  {filteredProducts.map((p) => {
                    const brandName = typeof p.brand === "object" ? p.brand.name : String(p.brand);
                    const catName = typeof p.category === "object" ? p.category.name : String(p.category);
                    const image = p.images && p.images.length > 0 ? p.images[0] : "/images/models/modules1.jpeg";
                    const basePrice = p.variants && p.variants.length > 0 ? p.variants[0].price : 0;
                    
                    const isUpdating = updatingId === p._id;

                    return (
                      <motion.tr 
                        key={p._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-neutral-50/30 transition-colors"
                      >
                        {/* Product Name & Image */}
                        <td className="p-4 pl-6 flex items-center space-x-4">
                          <div className="w-10 h-12 bg-neutral-50 rounded overflow-hidden relative border border-neutral-200 shrink-0">
                            <img src={image} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="max-w-[200px] font-serif font-light text-[#111111] truncate text-sm">
                            {p.name}
                          </div>
                        </td>

                        {/* Brand / Category */}
                        <td className="p-4">
                          <span className="font-semibold text-neutral-800 block">{brandName}</span>
                          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block mt-0.5">{catName}</span>
                        </td>

                        {/* Unit Price */}
                        <td className="p-4 font-serif font-light text-neutral-800">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(basePrice)}
                        </td>

                        {/* Stock Inline Edit */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={editingStock[p._id] ?? 0}
                              onChange={(e) =>
                                setEditingStock((prev) => ({
                                  ...prev,
                                  [p._id]: Number(e.target.value),
                                }))
                              }
                              disabled={isUpdating}
                              className="w-16 bg-white border border-neutral-200 text-neutral-800 rounded text-xs p-1.5 outline-none font-semibold text-center focus:border-[#B38F5F] transition-colors"
                            />
                            <button
                              onClick={() => handleStockSave(p._id)}
                              disabled={isUpdating}
                              className="text-[10px] uppercase font-bold text-[#B38F5F] hover:text-[#9c7b50] disabled:opacity-40 transition-colors py-1 px-2 rounded hover:bg-[#B38F5F]/5"
                            >
                              Save
                            </button>
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="p-4">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p._id, e.target.value)}
                            disabled={isUpdating}
                            className={`border text-[10px] uppercase tracking-wider p-1.5 outline-none font-bold rounded cursor-pointer transition-colors bg-white ${
                              p.status === "published"
                                ? "border-emerald-200 text-emerald-700 bg-emerald-50 focus:border-emerald-400"
                                : p.status === "draft"
                                ? "border-amber-200 text-amber-700 bg-amber-50 focus:border-amber-400"
                                : "border-neutral-200 text-neutral-600 bg-neutral-50 focus:border-neutral-400"
                            }`}
                          >
                            <option value="draft" className="text-amber-750">Draft</option>
                            <option value="published" className="text-emerald-750">Published</option>
                            <option value="archived" className="text-neutral-700">Archived</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            disabled={isUpdating}
                            className="text-[10px] uppercase font-bold text-red-600 hover:text-red-700 hover:bg-red-50 py-1 px-3 rounded transition-colors disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </td>

                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

      </main>
    </AdminLayout>
  );
}