"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import Link from "next/link";
import { Button } from "@repo/ui";

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
  }>;
}

export default function ProductsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Authenticate session
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Load products list
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      // Admin API fetches all products (drafts included)
      const res = await api.get("/api/v1/products/admin?limit=50");
      setProducts(res.data || []);
      
      // Initialize stock edit states
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
      // Update local state
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

      // Update first variant's stock count
      const updatedVariants = product.variants.map((v, index) => {
        if (index === 0) {
          return { ...v, stock: Number(targetStock) };
        }
        return v;
      });

      await api.patch(`/api/v1/products/${productId}`, { variants: updatedVariants });
      
      // Update local products state
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-xs uppercase tracking-luxury text-neutral-400 font-semibold">
          Authenticating access...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFBF7]">
      
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 bg-[#FDFBF7] border-b md:border-b-0 md:border-r border-luxury-silver/30 p-6 flex flex-col justify-between">
        <div className="space-y-8 text-left">
          <div className="space-y-1">
            <span className="font-serif text-2xl font-bold tracking-[0.25em] text-luxury-dark block">
              LXUY
            </span>
            <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">
              Management Portal
            </span>
          </div>

          <nav className="flex flex-col space-y-3 pt-6 border-t border-luxury-silver/25">
            <Link
              href="/"
              className="text-xs uppercase tracking-luxury font-semibold text-neutral-500 hover:text-luxury-dark transition-colors"
            >
              Overview
            </Link>
            <Link
              href="/products"
              className="text-xs uppercase tracking-luxury font-bold text-luxury-gold"
            >
              Catalog Inventory
            </Link>
            <Link
              href="/products/create"
              className="text-xs uppercase tracking-luxury font-semibold text-neutral-500 hover:text-luxury-dark transition-colors"
            >
              Add Product
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-luxury-silver/25 text-left space-y-4">
          <div>
            <span className="text-[10px] text-neutral-400 block">Logged in as:</span>
            <span className="text-xs font-semibold text-neutral-700 capitalize truncate block">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-[9px] font-bold text-luxury-gold uppercase tracking-wider block">
              {user.role.replace("_", " ")}
            </span>
          </div>
          <button
            onClick={logout}
            className="text-[10px] uppercase tracking-luxury font-bold text-red-500 hover:text-red-700 focus:outline-none"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-8 md:p-12 text-left space-y-8 overflow-x-hidden">
        
        {/* Banner Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-luxury-silver/30 pb-4 gap-4">
          <div>
            <h1 className="font-serif text-3xl font-light text-luxury-dark leading-tight">
              Catalog Inventory
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Adjust stock counts, manage product visibility statuses, or delete archives.
            </p>
          </div>
          <Button
            onClick={() => router.push("/products/create")}
            variant="primary"
            className="px-5 py-2 text-xs uppercase font-bold tracking-luxury"
          >
            New Product
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none transition-colors duration-300"
          />
        </div>

        {/* Product Inventory Table */}
        {loadingProducts ? (
          <div className="py-20 text-center text-xs uppercase tracking-luxury text-neutral-400 font-semibold animate-pulse">
            Loading products list...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-neutral-200 rounded">
            <span className="text-xs text-neutral-400 uppercase tracking-widest block">
              No matching products found
            </span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-luxury-silver/30 rounded shadow-sm bg-[#FDFBF7]">
            <table className="w-full border-collapse text-left text-xs text-neutral-700">
              <thead>
                <tr className="bg-neutral-50 border-b border-luxury-silver/30 text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  <th className="p-4">Silhouette</th>
                  <th className="p-4">Brand / Category</th>
                  <th className="p-4">Unit Price</th>
                  <th className="p-4">Stock Levels</th>
                  <th className="p-4">Visibility Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-silver/20">
                {filteredProducts.map((p) => {
                  const brandName = typeof p.brand === "object" ? p.brand.name : String(p.brand);
                  const catName = typeof p.category === "object" ? p.category.name : String(p.category);
                  const image = p.images && p.images.length > 0 ? p.images[0] : "/images/models/modules1.jpeg";
                  const basePrice = p.variants && p.variants.length > 0 ? p.variants[0].price : 0;
                  
                  const isUpdating = updatingId === p._id;

                  return (
                    <tr key={p._id} className="hover:bg-neutral-50/50 transition-colors">
                      {/* Product Name & Image */}
                      <td className="p-4 flex items-center space-x-3">
                        <div className="w-10 h-12 bg-neutral-100 flex-shrink-0 overflow-hidden relative">
                          <img src={image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="max-w-[180px] font-serif font-medium text-neutral-900 truncate">
                          {p.name}
                        </div>
                      </td>

                      {/* Brand / Category */}
                      <td className="p-4">
                        <span className="font-semibold text-neutral-800 block">{brandName}</span>
                        <span className="text-[10px] text-neutral-400">{catName}</span>
                      </td>

                      {/* Unit Price */}
                      <td className="p-4 font-semibold text-neutral-800">
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
                            className="w-16 bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-1.5 outline-none font-semibold text-center"
                          />
                          <button
                            onClick={() => handleStockSave(p._id)}
                            disabled={isUpdating}
                            className="text-[10px] uppercase font-bold text-luxury-gold hover:text-luxury-dark disabled:opacity-40 transition-colors"
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
                          className="bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-1.5 outline-none font-semibold cursor-pointer"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            disabled={isUpdating}
                            className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </main>

    </div>
  );
}
