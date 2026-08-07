"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { Button } from "@repo/ui";
import AdminLayout from "../../../components/AdminLayout";
import { motion } from "framer-motion";

interface Brand {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function CreateProductPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Filter lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load filter categories and brands
  useEffect(() => {
    if (user) {
      async function loadMetadata() {
        try {
          const [resCats, resBrands] = await Promise.all([
            api.get("/api/v1/categories"),
            api.get("/api/v1/brands"),
          ]);
          setCategories(resCats || []);
          setBrands(resBrands || []);
          
          if (resCats.length > 0) setSelectedCategory(resCats[0]._id);
          if (resBrands.length > 0) setSelectedBrand(resBrands[0]._id);
        } catch (err) {
          console.error("Failed to load layout configurations:", err);
        } finally {
          setLoadingMetadata(false);
        }
      }
      loadMetadata();
    }
  }, [user]);

  // Generate slug dynamically from name
  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !description || !selectedCategory || !selectedBrand || !price || !stock || !sku) {
      setError("Please fill out all required fields.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        slug,
        description,
        summary: summary || undefined,
        category: selectedCategory,
        brand: selectedBrand,
        status: "draft", // Defaults to draft status so admins can review/publish separately!
        images: imageUrl ? [imageUrl] : ["/images/models/modules1.jpeg"],
        variants: [
          {
            sku,
            price: Number(price),
            stock: Number(stock),
            attributes: [],
            isActive: true,
          },
        ],
      };

      await api.post("/api/v1/products", payload);
      alert("Product created successfully! It is saved as a Draft.");
      router.push("/products");
    } catch (err: any) {
      setError(err.message || "Failed to create new product silhouette.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <main className="flex-1 p-8 md:p-12 text-left space-y-8 overflow-x-hidden selection:bg-[#B38F5F]/15 selection:text-[#B38F5F]">
        
        {/* Banner Section */}
        <div className="border-b border-neutral-200 pb-5">
          <h1 className="font-serif text-3xl font-light text-[#111111] leading-tight">
            Add Product Silhouette
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#B38F5F] mt-1.5 font-bold">
            Catalog a new premium design item. All new items start in Draft status.
          </p>
        </div>

        {error && (
          <div className="max-w-4xl p-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded">
            {error}
          </div>
        )}

        {loadingMetadata ? (
          <div className="py-24 text-center text-[10px] uppercase tracking-[0.25em] text-[#B38F5F] font-bold animate-pulse">
            Loading configuration filters...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-12">
            
            {/* Two-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-neutral-200 p-6 md:p-8 rounded-lg shadow-sm">
              
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Classic Linen Blazer"
                  className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] text-sm p-3 outline-none rounded transition-all duration-300"
                  required
                />
              </div>

              {/* Slug (Disabled/Generated) */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  URL Slug (Auto-Generated)
                </label>
                <input
                  type="text"
                  value={slug}
                  disabled
                  placeholder="auto-generated-slug-path"
                  className="w-full bg-neutral-50/50 border border-neutral-200 text-neutral-400 text-sm p-3 outline-none rounded select-none cursor-not-allowed"
                />
              </div>

              {/* Designer Brand Select */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Designer Brand *
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-white border border-neutral-200 text-[#111111] focus:border-[#B38F5F] text-sm p-3 outline-none rounded cursor-pointer transition-all duration-300"
                  required
                >
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Catalog Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-neutral-200 text-[#111111] focus:border-[#B38F5F] text-sm p-3 outline-none rounded cursor-pointer transition-all duration-300"
                  required
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SKU code */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Stock keeping unit (SKU) *
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. LX-MN-SH-01"
                  className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] text-sm p-3 outline-none rounded transition-all duration-300"
                  required
                />
              </div>

              {/* Image URL path */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Cover Image URL Path
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. /images/models/modules1.jpeg"
                  className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] text-sm p-3 outline-none rounded transition-all duration-300"
                />
              </div>

              {/* Unit Retail Price */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Retail Price (INR) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 12500"
                  className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] text-sm p-3 outline-none rounded transition-all duration-300"
                  required
                />
              </div>

              {/* Opening Stock Levels */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Opening Stock Count *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] text-sm p-3 outline-none rounded transition-all duration-300"
                  required
                />
              </div>

              {/* Product Summary */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Brief Summary
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Slim-fit linen blazer meticulously crafted in Italy."
                  className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] text-sm p-3 outline-none rounded transition-all duration-300"
                />
              </div>

              {/* Full Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500">
                  Full Editorial Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter deep editorial description detailing materials, design notes, and fits..."
                  rows={5}
                  className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] text-sm p-3 outline-none rounded resize-y transition-all duration-300"
                  required
                />
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-[#B38F5F] hover:bg-[#9c7b50] text-white border-none rounded transition-all duration-300"
              >
                {isSubmitting ? "Saving..." : "Catalog Item (Draft)"}
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/products")}
                variant="secondary"
                className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-transparent hover:bg-neutral-50 text-neutral-500 hover:text-[#111111] border border-neutral-200 hover:border-neutral-300 rounded transition-all duration-300"
              >
                Cancel
              </Button>
            </div>

          </form>
        )}

      </main>
    </AdminLayout>
  );
}
