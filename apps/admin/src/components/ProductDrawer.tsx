"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  images?: string[];
  isActive?: boolean;
}

export interface DrawerProduct {
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
  variants: ProductVariant[];
}

interface Brand {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

export interface ToastPayload {
  message: string;
  type: "success" | "error";
}

interface ProductDrawerProps {
  product: DrawerProduct;
  onClose: () => void;
  onSaved: (updated: DrawerProduct) => void;
  onDeleted: (id: string) => void;
  showToast: (toast: ToastPayload) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const stockStatus = (stock: number): { label: string; className: string } => {
  if (stock === 0)
    return { label: "Out of Stock", className: "text-red-600 bg-red-50 border-red-200" };
  if (stock <= 5)
    return { label: "Low Stock", className: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: "In Stock", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
};

const getSizeLabel = (v: ProductVariant, i: number) => {
  if (!v || !v.attributes || v.attributes.length === 0) return `V${i + 1}`;
  const a = v.attributes.find((x) => x && x.name && x.name.toLowerCase() === "size");
  if (a && a.value) return a.value;
  if (v.attributes[0]?.value) return v.attributes[0].value;
  return `V${i + 1}`;
};

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left group focus:outline-none"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500 group-hover:text-neutral-700 transition-colors">
          {title}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-5 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white border border-neutral-200 text-[#111111] text-xs p-2.5 outline-none rounded focus:border-[#B38F5F] transition-colors placeholder-neutral-300";
const prefixInputCls = "flex-1 bg-transparent text-[#111111] text-xs outline-none border-none p-0 focus:ring-0 placeholder-neutral-300";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductDrawer({ product, onClose, onSaved, onDeleted, showToast }: ProductDrawerProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [summary, setSummary] = useState(product.summary ?? "");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(product.status);
  const [isCurated, setIsCurated] = useState(product.isCurated ?? false);
  const [images, setImages] = useState<string[]>(product.images ?? []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>(() =>
    product.variants ? JSON.parse(JSON.stringify(product.variants)) : []
  );
  const [brandId, setBrandId] = useState(typeof product.brand === "object" && product.brand !== null ? product.brand._id : product.brand);
  const [categoryId, setCategoryId] = useState(typeof product.category === "object" && product.category !== null ? product.category._id : product.category);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardBanner, setShowDiscardBanner] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [rb, rc] = await Promise.all([api.get("/api/v1/brands"), api.get("/api/v1/categories")]);
        setBrands(Array.isArray(rb) ? rb : rb?.data || []);
        setCategories(Array.isArray(rc) ? rc : rc?.data || []);
      } catch { /* silent */ }
    }
    loadMeta();
  }, []);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const requestClose = useCallback(() => {
    if (isDirty) { setShowDiscardBanner(true); } else { onClose(); }
  }, [isDirty, onClose]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) { requestClose(); }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [requestClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") requestClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [requestClose]);

  const updateVariantStock = (idx: number, val: number) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, stock: val } : v)));
    markDirty();
  };

  const updateVariantSku = (idx: number, val: string) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, sku: val } : v)));
    markDirty();
  };

  const updateVariantPrice = (idx: number, val: number) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, price: val } : v)));
    markDirty();
  };

  const updateVariantSize = (idx: number, val: string) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== idx) return v;
        const attrs = v.attributes ? [...v.attributes] : [];
        const sizeIdx = attrs.findIndex((a) => a && a.name && a.name.toLowerCase() === "size");
        if (sizeIdx !== -1) {
          attrs[sizeIdx] = { ...attrs[sizeIdx], value: val };
        } else if (attrs.length > 0) {
          attrs[0] = { name: "size", value: val };
        } else {
          attrs.push({ name: "size", value: val });
        }
        return { ...v, attributes: attrs };
      })
    );
    markDirty();
  };

  const removeVariant = (idx: number) => { setVariants((prev) => prev.filter((_, i) => i !== idx)); markDirty(); };

  const addVariant = () => {
    setVariants((prev) => [...prev, { sku: "", price: prev[0]?.price ?? 0, stock: 0, attributes: [{ name: "size", value: "" }], isActive: true }]);
    markDirty();
  };

  const addImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setNewImageUrl("");
    markDirty();
  };

  const removeImage = (idx: number) => { setImages((prev) => prev.filter((_, i) => i !== idx)); markDirty(); };

  const totalStock = variants.reduce((s, v) => s + (v.stock || 0), 0);
  const lowCount = variants.filter((v) => v.stock > 0 && v.stock <= 5).length;
  const outCount = variants.filter((v) => v.stock === 0).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Auto-include any pending image URL in the input box if user forgot to click Add
      const currentImages = [...images];
      const pendingUrl = newImageUrl.trim();
      if (pendingUrl && !currentImages.includes(pendingUrl)) {
        currentImages.push(pendingUrl);
        setImages(currentImages);
        setNewImageUrl("");
      }

      // Construct clean payload matching UpdateProductDto
      const payload: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim(),
        status,
        isCurated,
        images: currentImages,
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          attributes: (v.attributes || []).map((a) => ({
            name: a.name.trim(),
            value: a.value.trim(),
          })),
          images: v.images ?? [],
          isActive: v.isActive ?? true,
          ...(v.compareAtPrice !== undefined && v.compareAtPrice !== null && !isNaN(Number(v.compareAtPrice)) && Number(v.compareAtPrice) > 0
            ? { compareAtPrice: Number(v.compareAtPrice) }
            : {}),
        })),
      };

      if (summary && summary.trim()) {
        payload.summary = summary.trim();
      }

      if (brandId && typeof brandId === "string" && brandId.trim()) {
        payload.brand = brandId.trim();
      }

      if (categoryId && typeof categoryId === "string" && categoryId.trim()) {
        payload.category = categoryId.trim();
      }

      const res = await api.patch(`/api/v1/products/${product._id}`, payload);
      onSaved({ ...product, ...res.data });
      showToast({ message: "Product saved successfully.", type: "success" });
      setIsDirty(false);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save product:", err);
      const apiErr = err as { data?: { message?: string | string[] }; message?: string };
      const apiMsg = apiErr?.data?.message;
      const errMsg = Array.isArray(apiMsg)
        ? apiMsg.join(", ")
        : typeof apiMsg === "string"
        ? apiMsg
        : apiErr?.message || "Failed to save product. Please check the fields.";
      showToast({ message: String(errMsg), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== product.name) return;
    setSaving(true);
    try {
      await api.delete(`/api/v1/products/${product._id}`);
      onDeleted(product._id);
      showToast({ message: "Product deleted.", type: "success" });
      onClose();
    } catch { showToast({ message: "Failed to delete product.", type: "error" }); }
    finally { setSaving(false); setShowDeleteConfirm(false); }
  };

  const statusBadgeCls = status === "published"
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : status === "draft"
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-neutral-500 bg-neutral-100 border-neutral-200";

  const thumbnail = images.length > 0 ? images[0] : "/images/models/modules1.jpeg";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50"
        aria-hidden="true"
      />

      <motion.div
        ref={drawerRef}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col w-full sm:w-[80%] md:w-[560px] bg-[#FDFBF7] shadow-2xl shadow-black/10 border-l border-neutral-200"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-neutral-200/80 px-6 py-4 flex items-start gap-4">
          <div className="w-10 h-12 rounded overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-base font-light text-[#111111] leading-snug truncate">{name || "—"}</div>
            <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold mt-0.5">
              {typeof product.brand === "object" ? product.brand.name : "—"} · {typeof product.category === "object" ? product.category.name : "—"}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border rounded ${statusBadgeCls}`}>{status}</span>
              {isCurated && (
                <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border rounded text-[#B38F5F] bg-[#B38F5F]/10 border-[#B38F5F]/20">Curated</span>
              )}
            </div>
          </div>
          <button onClick={requestClose} className="shrink-0 text-neutral-400 hover:text-neutral-700 transition-colors mt-0.5 focus:outline-none" aria-label="Close drawer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Unsaved changes banner */}
        <AnimatePresence>
          {showDiscardBanner && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3 bg-amber-50 border-b border-amber-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">You have unsaved changes</span>
                <div className="flex gap-3">
                  <button onClick={() => { setShowDiscardBanner(false); onClose(); }} className="text-[10px] uppercase font-bold text-amber-700 hover:text-amber-900 transition-colors">Discard</button>
                  <button onClick={() => setShowDiscardBanner(false)} className="text-[10px] uppercase font-bold text-[#B38F5F] hover:text-[#9c7b50] transition-colors">Keep Editing</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6">
          {/* 1. Basic Info */}
          <Section title="Basic Information">
            <Field label="Product Name">
              <input className={inputCls} value={name} onChange={(e) => { setName(e.target.value); markDirty(); }} disabled={saving} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Brand">
                <select className={inputCls} value={brandId} onChange={(e) => { setBrandId(e.target.value); markDirty(); }} disabled={saving}>
                  <option value="">Select brand</option>
                  {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className={inputCls} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); markDirty(); }} disabled={saving}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Short Summary">
              <input className={inputCls} value={summary} onChange={(e) => { setSummary(e.target.value); markDirty(); }} placeholder="One-line product summary" disabled={saving} />
            </Field>
            <Field label="Full Description">
              <textarea className={`${inputCls} resize-none`} rows={4} value={description} onChange={(e) => { setDescription(e.target.value); markDirty(); }} placeholder="Detailed product description" disabled={saving} />
            </Field>
            <Field label="URL Slug (read-only)">
              <input className={`${inputCls} bg-neutral-50/50 text-neutral-400 cursor-not-allowed`} value={product.slug} readOnly />
            </Field>
          </Section>

          {/* 2. Pricing */}
          <Section title="Pricing">
            {variants.length > 0 ? (
              <div className="space-y-3">
                {variants.map((v, i) => {
                  const sizeLabel = getSizeLabel(v, i);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase w-10 shrink-0">{sizeLabel}</span>
                      <div className="flex items-center border border-neutral-200 rounded overflow-hidden flex-1 focus-within:border-[#B38F5F] transition-colors bg-white">
                        <span className="text-xs text-neutral-400 px-2.5 border-r border-neutral-200 select-none">₹</span>
                        <input type="number" min="0" className={prefixInputCls + " px-2.5 py-2.5"} value={v.price}
                          onChange={(e) => updateVariantPrice(i, Number(e.target.value))} disabled={saving} />
                      </div>
                      {v.compareAtPrice !== undefined && (
                        <span className="text-[10px] text-neutral-400 line-through">{inr(v.compareAtPrice)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">No variants — add variants below to set prices.</p>
            )}
          </Section>

          {/* 3. Media */}
          <Section title="Product Media" defaultOpen={false}>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-[3/4] rounded overflow-hidden border border-neutral-200 group bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 ? (
                      <span className="absolute top-1 left-1 bg-[#B38F5F] text-white text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">Primary</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [url, ...images.filter((_, idx) => idx !== i)];
                          setImages(updated);
                          markDirty();
                        }}
                        disabled={saving}
                        className="absolute top-1 left-1 bg-black/60 hover:bg-[#B38F5F] text-white text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                        Set Primary
                      </button>
                    )}
                    <button onClick={() => removeImage(i)} disabled={saving}
                      className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Remove image">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-neutral-200 rounded p-6 text-center">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">No images added</p>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <input className={`${inputCls} flex-1`} value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL…" onKeyDown={(e) => e.key === "Enter" && addImage()} disabled={saving} />
              <button onClick={addImage} disabled={saving || !newImageUrl.trim()}
                className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider border border-neutral-200 rounded text-neutral-600 hover:border-[#B38F5F] hover:text-[#B38F5F] transition-colors disabled:opacity-40">
                Add
              </button>
            </div>
          </Section>

          {/* 4. Variants & Stock */}
          <Section title="Variants & Stock">
            <div className="p-3 bg-neutral-50/80 border border-neutral-200/80 rounded flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#111111]">Total Inventory: <span className="font-bold">{totalStock} units</span></p>
                <p className="text-[9px] text-neutral-400 mt-0.5 uppercase tracking-wider font-semibold">
                  {variants.length} variant{variants.length !== 1 ? "s" : ""}
                  {lowCount > 0 && <span className="text-amber-600"> · {lowCount} low stock</span>}
                  {outCount > 0 && <span className="text-red-500"> · {outCount} out of stock</span>}
                </p>
              </div>
            </div>
            <div className="border border-neutral-200 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-[8px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
                    <th className="p-3 text-left">Size</th>
                    <th className="p-3 text-left">SKU</th>
                    <th className="p-3 text-left">Stock</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {variants.map((v, i) => {
                    const sizeLabel = getSizeLabel(v, i);
                    const { label, className } = stockStatus(v.stock);
                    return (
                      <tr key={i} className="hover:bg-neutral-50/30">
                        <td className="p-3">
                          <input className="w-12 text-[10px] font-bold text-neutral-700 uppercase bg-transparent outline-none border-b border-dashed border-neutral-200 focus:border-[#B38F5F] transition-colors"
                            value={sizeLabel} onChange={(e) => updateVariantSize(i, e.target.value)} disabled={saving} />
                        </td>
                        <td className="p-3">
                          <input className="w-28 text-[10px] font-mono text-neutral-500 bg-transparent outline-none border-b border-dashed border-neutral-200 focus:border-[#B38F5F] transition-colors"
                            value={v.sku} onChange={(e) => updateVariantSku(i, e.target.value)} disabled={saving} />
                        </td>
                        <td className="p-3">
                          <input type="number" min="0"
                            className="w-14 text-[11px] font-semibold text-[#111111] text-center bg-white border border-neutral-200 rounded px-1.5 py-1 outline-none focus:border-[#B38F5F] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={v.stock} onChange={(e) => updateVariantStock(i, Number(e.target.value))} disabled={saving} />
                        </td>
                        <td className="p-3">
                          <span className={`text-[8px] font-bold uppercase tracking-wider border rounded px-1.5 py-0.5 ${className}`}>{label}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => removeVariant(i)} disabled={saving}
                            className="text-neutral-300 hover:text-red-400 transition-colors disabled:opacity-40" aria-label="Remove variant">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {variants.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">No variants</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={addVariant} disabled={saving}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B38F5F] hover:text-[#9c7b50] transition-colors disabled:opacity-40 mt-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Size Variant
            </button>
          </Section>

          {/* 5. Visibility */}
          <Section title="Visibility & Publishing">
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value as "draft" | "published" | "archived"); markDirty(); }} disabled={saving}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded">
              <div>
                <p className="text-xs font-semibold text-[#111111]">Featured in Curated Releases</p>
                <p className="text-[9px] text-neutral-400 mt-0.5 uppercase tracking-wider font-semibold">Appears on the storefront homepage</p>
              </div>
              <button type="button" role="switch" aria-checked={isCurated}
                onClick={() => { setIsCurated((prev) => !prev); markDirty(); }} disabled={saving}
                className={`relative w-10 h-5 rounded-full border transition-all duration-300 focus:outline-none shrink-0 disabled:opacity-40 ${isCurated ? "bg-[#B38F5F] border-[#B38F5F]" : "bg-neutral-200 border-neutral-200"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${isCurated ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          </Section>

          {/* 6. Dangerous Actions */}
          <Section title="Dangerous Actions" defaultOpen={false}>
            <div className="space-y-3">
              <div className="p-4 border border-amber-200 rounded bg-amber-50/50 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-amber-800">Archive Product</p>
                  <p className="text-[9px] text-amber-600 mt-0.5 leading-relaxed">Hides from the storefront. Restore anytime by changing status to Published.</p>
                </div>
                <button onClick={() => { setStatus("archived"); markDirty(); }} disabled={saving || status === "archived"}
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-300 px-3 py-1.5 rounded hover:bg-amber-100 transition-colors disabled:opacity-40">
                  Archive
                </button>
              </div>
              <div className="p-4 border border-red-200 rounded bg-red-50/50 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-red-800">Delete Product</p>
                  <p className="text-[9px] text-red-500 mt-0.5 leading-relaxed">Permanently removes this product. This action cannot be undone.</p>
                </div>
                <button onClick={() => setShowDeleteConfirm(true)} disabled={saving}
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-100 transition-colors disabled:opacity-40">
                  Delete
                </button>
              </div>
            </div>
          </Section>

          <div className="h-6" />
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 border-t border-neutral-200/80 px-6 py-4 flex items-center justify-end gap-3 bg-[#FDFBF7]">
          <button onClick={requestClose} disabled={saving}
            className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 border border-neutral-200 rounded hover:border-neutral-300 hover:text-neutral-700 transition-all duration-200 disabled:opacity-40">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !isDirty}
            className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] bg-[#B38F5F] hover:bg-[#9c7b50] text-white rounded transition-all duration-200 disabled:opacity-40 flex items-center gap-2">
            {saving ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : "Save Changes"}
          </button>
        </div>
      </motion.div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/40" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] flex items-center justify-center px-4">
              <div className="bg-[#FDFBF7] border border-neutral-200 rounded-lg shadow-2xl w-full max-w-md p-6 space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-light text-[#111111]">Delete this product?</h3>
                  <p className="text-[10px] text-neutral-500 mt-1.5 leading-relaxed uppercase tracking-wider font-semibold">This action is permanent and cannot be reversed.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">Type the product name to confirm</label>
                  <input className={inputCls} placeholder={product.name} value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)} autoFocus />
                </div>
                <div className="flex gap-3 justify-end pt-1">
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 border border-neutral-200 rounded hover:border-neutral-300 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={deleteConfirmText !== product.name || saving}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-40">
                    {saving ? "Deleting…" : "Delete Product"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
