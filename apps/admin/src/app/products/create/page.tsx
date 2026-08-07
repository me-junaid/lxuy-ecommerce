"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import Link from "next/link";
import { Button } from "@repo/ui";

interface Brand {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function CreateProductPage() {
  const { user, loading, logout } = useAuth();
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

  // Authenticate session
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

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
              className="text-xs uppercase tracking-luxury font-semibold text-neutral-500 hover:text-luxury-dark transition-colors"
            >
              Catalog Inventory
            </Link>
            <Link
              href="/products/create"
              className="text-xs uppercase tracking-luxury font-bold text-luxury-gold"
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

      {/* Main Form Area */}
      <main className="flex-1 p-8 md:p-12 text-left space-y-8 max-w-4xl">
        
        {/* Banner Section */}
        <div className="border-b border-luxury-silver/30 pb-4">
          <h1 className="font-serif text-3xl font-light text-luxury-dark leading-tight">
            Add Product Entry
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Create a new luxury product entry inside the central database.
          </p>
        </div>

        {error && (
          <div className="p-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded text-center">
            {error}
          </div>
        )}

        {loadingMetadata ? (
          <div className="py-20 text-center text-xs uppercase tracking-luxury text-neutral-400 font-semibold animate-pulse">
            Loading partner configurations...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Grid fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Classic Wool Trench Coat"
                  className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none"
                  required
                />
              </div>

              {/* Product Slug */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                  Product URL Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. classic-wool-trench-coat"
                  className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                  Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none cursor-pointer"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                  Brand *
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none cursor-pointer"
                  required
                >
                  {brands.map((br) => (
                    <option key={br._id} value={br._id}>
                      {br.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                  Base Price (INR ₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 15999"
                  className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none"
                  required
                />
              </div>

              {/* Stock */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                  Initial Stock Count *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none"
                  required
                />
              </div>

              {/* SKU Code */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                  SKU Identifier Code *
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. Ralph Lauren SKU (RL-WTC-01)"
                  className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none"
                  required
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                  Image Path URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. /images/models/modules1.jpeg"
                  className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none"
                />
              </div>

            </div>

            {/* Summary */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                Short Summary Narrative
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A brief luxury editorial sentence..."
                className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
                Description Details *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full fabric composition, lining styles, and fit description..."
                rows={4}
                className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-xs p-3 outline-none resize-none"
                required
              />
            </div>

            {/* Save Buttons */}
            <div className="pt-4 flex space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="px-6 py-2.5 text-xs uppercase font-bold tracking-luxury"
              >
                {isSubmitting ? "Creating..." : "Save Product Draft"}
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/products")}
                variant="secondary"
                className="px-6 py-2.5 text-xs uppercase font-bold tracking-luxury"
              >
                Cancel
              </Button>
            </div>

          </form>
        )}

      </main>

    </div>
  );
}
