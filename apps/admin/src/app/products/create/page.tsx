"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import AdminLayout from "../../../components/AdminLayout";
import ProductPreviewModal from "../../../components/ProductPreviewModal";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Brand {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

interface FormVariant {
  id: string;
  size: string;
  sku: string;
  price: string;
  stock: string;
}

interface FieldErrors {
  name?: string;
  brand?: string;
  category?: string;
  sku?: string;
  price?: string;
  description?: string;
  variants?: Record<number, { sku?: string; price?: string; stock?: string }>;
}

const DEFAULT_IMAGE_PRESETS = [
  { label: "Lookbook 01", url: "/images/models/modules1.jpeg" },
  { label: "Lookbook 02", url: "/images/models/modules2.jpeg" },
  { label: "Lookbook 03", url: "/images/models/modules3.jpeg" },
  { label: "Lookbook 04", url: "/images/models/modules4.jpeg" },
];

const AUTOSAVE_KEY = "lxuy_admin_create_product_draft_v1";

// Helper: Format raw number string to Indian Rupees (e.g. 12500 -> 12,500)
function formatCurrency(val: string): string {
  if (!val || isNaN(Number(val))) return "";
  return Number(val).toLocaleString("en-IN");
}

export default function CreateProductPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Filter & metadata lists
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
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [basePriceFocused, setBasePriceFocused] = useState(false);
  const [comparePriceFocused, setComparePriceFocused] = useState(false);
  const [baseSku, setBaseSku] = useState("");
  const [images, setImages] = useState<string[]>(["/images/models/modules1.jpeg"]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  // Dynamic variants state
  const [variants, setVariants] = useState<FormVariant[]>([
    { id: "var-1", size: "S", sku: "", price: "", stock: "10" },
  ]);

  // Validation & Error states
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autosave & Announcement states
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");

  // UI state
  const [activeStep, setActiveStep] = useState("sec-basic");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statusTooltipOpen, setStatusTooltipOpen] = useState(false);
  const [variantToRemove, setVariantToRemove] = useState<{ index: number; size: string } | null>(null);

  // Individual Input Refs for Focus-and-Scroll Error Handling (Complies with React Compiler)
  const nameRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLSelectElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const announce = useCallback((msg: string) => {
    setAriaAnnouncement(msg);
  }, []);

  // Load filter categories and brands
  useEffect(() => {
    if (user) {
      async function loadMetadata() {
        try {
          const [resCats, resBrands] = await Promise.all([
            api.get("/api/v1/categories"),
            api.get("/api/v1/brands"),
          ]);
          const cats = Array.isArray(resCats) ? resCats : resCats?.data || [];
          const brs = Array.isArray(resBrands) ? resBrands : resBrands?.data || [];
          setCategories(cats);
          setBrands(brs);

          if (cats.length > 0) setSelectedCategory((prev) => prev || cats[0]._id);
          if (brs.length > 0) setSelectedBrand((prev) => prev || brs[0]._id);
        } catch (err) {
          console.error("Failed to load metadata:", err);
        } finally {
          setLoadingMetadata(false);
        }
      }
      void loadMetadata();
    }
  }, [user]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) setName(parsed.name);
          if (parsed.slug) setSlug(parsed.slug);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.summary) setSummary(parsed.summary);
          if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
          if (parsed.selectedBrand) setSelectedBrand(parsed.selectedBrand);
          if (parsed.basePrice) setBasePrice(parsed.basePrice);
          if (parsed.comparePrice) setComparePrice(parsed.comparePrice);
          if (parsed.baseSku) setBaseSku(parsed.baseSku);
          if (parsed.images && Array.isArray(parsed.images) && parsed.images.length > 0) {
            setImages(parsed.images);
          } else if (parsed.imageUrl) {
            setImages([parsed.imageUrl]);
          }
          if (parsed.status) setStatus(parsed.status);
          if (parsed.variants && Array.isArray(parsed.variants)) setVariants(parsed.variants);
          setLastSavedTime("Restored draft");
        }
      } catch {
        /* non-fatal */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Autosave timer (debounced 1.5s) with deferred setState
  useEffect(() => {
    if (!name && !baseSku && !description) return;
    const savingTimer = setTimeout(() => {
      setAutosaveStatus("saving");
    }, 0);

    const saveTimer = setTimeout(() => {
      try {
        const draftData = {
          name,
          slug,
          description,
          summary,
          selectedCategory,
          selectedBrand,
          basePrice,
          comparePrice,
          baseSku,
          images,
          status,
          variants,
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draftData));
        setAutosaveStatus("saved");
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSavedTime(`Saved at ${now}`);
        announce("Draft saved automatically");
      } catch {
        setAutosaveStatus("unsaved");
      }
    }, 1500);

    return () => {
      clearTimeout(savingTimer);
      clearTimeout(saveTimer);
    };
  }, [
    name,
    slug,
    description,
    summary,
    selectedCategory,
    selectedBrand,
    basePrice,
    comparePrice,
    baseSku,
    images,
    status,
    variants,
    announce,
  ]);

  // Handle section scroll observer for step nav
  useEffect(() => {
    if (loadingMetadata) return;

    const getScrollParent = () => {
      const el = document.getElementById("sec-basic");
      return el?.closest(".overflow-y-auto") || document.querySelector("div.overflow-y-auto") || window;
    };

    const handleScroll = () => {
      const parent = getScrollParent();
      if (parent && "scrollTop" in parent) {
        const p = parent as HTMLElement;
        if (p.scrollTop < 50) {
          setActiveStep("sec-basic");
          return;
        }
        if (p.scrollTop + p.clientHeight >= p.scrollHeight - 30) {
          setActiveStep("sec-visibility");
          return;
        }
      }

      const sections = ["sec-basic", "sec-description", "sec-media", "sec-pricing", "sec-variants", "sec-visibility"];
      for (const secId of sections) {
        const el = document.getElementById(secId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180 && rect.bottom >= 120) {
            setActiveStep(secId);
            break;
          }
        }
      }
    };

    const targetParent = getScrollParent();
    targetParent.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => targetParent.removeEventListener("scroll", handleScroll);
  }, [loadingMetadata]);

  // Auto-generate slug and base SKU from name
  const handleNameChange = (val: string) => {
    setName(val);
    const genSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(genSlug);

    if (!baseSku || baseSku.startsWith("LX-")) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      let skuCode = "LX-";
      if (words.length >= 2) {
        skuCode += (words[0].substring(0, 2) + "-" + words[1].substring(0, 2)).toUpperCase();
      } else if (words.length === 1 && words[0].length >= 3) {
        skuCode += words[0].substring(0, 4).toUpperCase();
      } else {
        skuCode += "ITEM-01";
      }
      setBaseSku(skuCode);
      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          sku: `${skuCode}-${v.size.replace(/\s+/g, "").toUpperCase()}`,
        }))
      );
    }
  };

  // Sync variant SKUs when base SKU changes
  const handleBaseSkuChange = (val: string) => {
    setBaseSku(val);
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sku: val ? `${val.trim()}-${v.size.replace(/\s+/g, "").toUpperCase()}` : "",
      }))
    );
  };

  // Sync variant prices when base price changes
  const handleBasePriceChange = (rawVal: string) => {
    setBasePrice(rawVal);
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        price: v.price === "" || v.price === basePrice ? rawVal : v.price,
      }))
    );
  };

  // Sync variant size change
  const handleVariantSizeChange = (index: number, newSize: string) => {
    const cleanSize = newSize.trim();
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i === index) {
          const generatedSku = baseSku ? `${baseSku.trim()}-${cleanSize.replace(/\s+/g, "").toUpperCase()}` : v.sku;
          return {
            ...v,
            size: cleanSize,
            sku: generatedSku,
          };
        }
        return v;
      })
    );
  };

  // Variant addition
  const handleAddVariant = () => {
    const defaultSizes = ["S", "M", "L", "XL", "XXL", "One Size"];
    const unusedSize = defaultSizes.find((s) => !variants.some((v) => v.size === s)) || "S";
    const newVariant: FormVariant = {
      id: `var-${Date.now()}`,
      size: unusedSize,
      sku: baseSku ? `${baseSku.trim()}-${unusedSize.replace(/\s+/g, "").toUpperCase()}` : "",
      price: basePrice || "",
      stock: "10",
    };
    setVariants((prev) => [...prev, newVariant]);
    announce(`Added size variant ${unusedSize}`);
  };

  // Variant removal with confirmation
  const requestRemoveVariant = (index: number) => {
    const target = variants[index];
    if (variants.length <= 1) {
      alert("At least one size variant is required.");
      return;
    }
    if (target.price || (target.stock && target.stock !== "0")) {
      setVariantToRemove({ index, size: target.size });
    } else {
      confirmRemoveVariant(index);
    }
  };

  const confirmRemoveVariant = (index: number) => {
    const removedSize = variants[index]?.size;
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantToRemove(null);
    if (removedSize) announce(`Removed size variant ${removedSize}`);
  };

  // Inventory total count
  const totalStockUnits = useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }, [variants]);

  // Validation function
  const validateForm = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = "Product name is required.";
    if (!selectedBrand) errs.brand = "Please select a designer brand.";
    if (!selectedCategory) errs.category = "Please select a catalog category.";
    if (!baseSku.trim()) errs.sku = "Base product SKU is required.";
    else if (!/^[A-Za-z0-9-_]+$/.test(baseSku.trim())) errs.sku = "SKU should only contain letters, numbers, hyphens, and underscores.";

    if (!basePrice || Number(basePrice) <= 0) errs.price = "Price must be greater than ₹0.";
    if (!description.trim()) errs.description = "Full editorial description is required.";

    const variantErrs: Record<number, { sku?: string; price?: string; stock?: string }> = {};
    variants.forEach((v, i) => {
      const vErr: { sku?: string; price?: string; stock?: string } = {};
      if (!v.sku.trim()) vErr.sku = "Variant SKU required.";
      if (!v.price || Number(v.price) <= 0) vErr.price = "Valid price required.";
      if (v.stock === "" || Number(v.stock) < 0) vErr.stock = "Valid stock required.";
      if (Object.keys(vErr).length > 0) variantErrs[i] = vErr;
    });

    if (Object.keys(variantErrs).length > 0) errs.variants = variantErrs;
    return errs;
  };

  // Focus and Scroll to First Error
  const focusFirstError = (errs: FieldErrors) => {
    if (errs.name && nameRef.current) {
      nameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      nameRef.current.focus();
      return;
    }
    if (errs.brand && brandRef.current) {
      brandRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      brandRef.current.focus();
      return;
    }
    if (errs.category && categoryRef.current) {
      categoryRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      categoryRef.current.focus();
      return;
    }
    if (errs.sku && skuRef.current) {
      skuRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      skuRef.current.focus();
      return;
    }
    if (errs.price && priceRef.current) {
      priceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      priceRef.current.focus();
      return;
    }
    if (errs.description && descriptionRef.current) {
      descriptionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      descriptionRef.current.focus();
      return;
    }
  };

  // Image Gallery Handlers
  const handleAddImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (images.includes(url)) {
      alert("This image URL is already in the gallery.");
      setNewImageUrl("");
      return;
    }
    setImages((prev) => [...prev, url]);
    setNewImageUrl("");
    announce("Added new image URL to gallery");
  };

  const handleAddPreset = (url: string) => {
    if (!images.includes(url)) {
      setImages((prev) => [...prev, url]);
      announce("Added preset image to gallery");
    }
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
    announce("Set primary cover image");
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      alert("At least one product image is required.");
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    announce("Removed image from gallery");
  };

  // Submit Handler
  const handleSave = async (targetStatus: "draft" | "published") => {
    setTouched({
      name: true,
      brand: true,
      category: true,
      sku: true,
      price: true,
      description: true,
    });

    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      focusFirstError(errs);
      announce("Form contains errors. Jumper focus applied to first invalid field.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const cleanImages = images.filter((img) => img.trim().length > 0);
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        summary: summary.trim() || undefined,
        category: selectedCategory,
        brand: selectedBrand,
        status: targetStatus,
        images: cleanImages.length > 0 ? cleanImages : ["/images/models/modules1.jpeg"],
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
          attributes: [{ name: "size", value: v.size }],
          isActive: true,
        })),
      };

      await api.post("/api/v1/products", payload);
      localStorage.removeItem(AUTOSAVE_KEY);
      announce(`Product created successfully as ${targetStatus}`);
      alert(`Product "${name}" saved as ${targetStatus.toUpperCase()}!`);
      router.push("/products");
    } catch (err) {
      const error = err as Error;
      alert(error.message || "Failed to create new product silhouette.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBrandObj = brands.find((b) => b._id === selectedBrand);
  const selectedCategoryObj = categories.find((c) => c._id === selectedCategory);

  const previewData = {
    name,
    brandName: selectedBrandObj?.name,
    categoryName: selectedCategoryObj?.name,
    price: basePrice,
    summary,
    description,
    imageUrl: images[0] || "/images/models/modules1.jpeg",
    images,
    variants,
  };

  return (
    <AdminLayout>
      <div className="flex flex-col w-full bg-[#FDFBF7] text-[#111111] selection:bg-[#8C693B]/15 selection:text-[#8C693B] relative">

        {/* ─── ARIA Live Region for Accessibility Announcements ─── */}
        <div role="status" aria-live="polite" className="sr-only">
          {ariaAnnouncement}
        </div>

        {/* ─── Sticky Header & Step Progress Bar Combined Container ─ */}
        <div className="sticky top-0 z-30 bg-[#FDFBF7] border-b border-neutral-200/80 shadow-xs">
          {/* Header Action Bar */}
          <header className="px-8 md:px-12 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-serif text-xl md:text-2xl font-light tracking-wide text-[#111111]">
                    Add Product Silhouette
                  </h1>
                  
                  {/* Draft / Published Status Pill with Tooltip */}
                  <div className="relative">
                    <span
                      onMouseEnter={() => setStatusTooltipOpen(true)}
                      onMouseLeave={() => setStatusTooltipOpen(false)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[8px] uppercase tracking-[0.2em] font-bold bg-amber-50 text-[#8C693B] border border-amber-200 cursor-help select-none"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C693B]" />
                      {status === "draft" ? "Draft Mode" : "Published"}
                    </span>

                    {statusTooltipOpen && (
                      <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-[#111111] text-white text-[10px] rounded shadow-xl z-50 leading-relaxed font-sans">
                        <p className="font-bold text-[#B38F5F] uppercase tracking-wider mb-1">
                          Operational Status
                        </p>
                        Draft items are saved internally in the admin catalog and hidden from public storefront customers until reviewed & published.
                      </div>
                    )}
                  </div>
                </div>

                {/* Autosave Status */}
                <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      autosaveStatus === "saving"
                        ? "bg-amber-400 animate-ping"
                        : autosaveStatus === "saved"
                        ? "bg-emerald-500"
                        : "bg-red-400"
                    }`}
                  />
                  <span>
                    {autosaveStatus === "saving"
                      ? "Autosaving draft..."
                      : lastSavedTime || "Draft autosave active"}
                  </span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold border border-neutral-300 text-neutral-700 hover:border-neutral-500 hover:text-[#111111] rounded transition-all bg-white"
              >
                👁 Preview
              </button>
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={isSubmitting}
                className="px-5 py-2 text-[9px] uppercase tracking-[0.2em] font-bold border border-[#8C693B] text-[#8C693B] hover:bg-[#8C693B]/10 rounded transition-all bg-transparent disabled:opacity-40"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave("published")}
                disabled={isSubmitting}
                className="px-6 py-2 text-[9px] uppercase tracking-[0.25em] font-bold bg-[#8C693B] hover:bg-[#73542E] text-white rounded transition-all shadow-xs disabled:opacity-40"
              >
                {isSubmitting ? "PUBLISHING..." : "PUBLISH ITEM"}
              </button>
            </div>
          </header>

          {/* Step Progress Anchor Navigation Bar */}
          <nav className="bg-white border-t border-neutral-200/70 px-8 md:px-12 py-2.5 overflow-x-auto">
            <div className="max-w-4xl mx-auto flex items-center gap-6 text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400">
              {[
                { id: "sec-basic", label: "1. Basic Info" },
                { id: "sec-description", label: "2. Description" },
                { id: "sec-media", label: "3. Cover Media" },
                { id: "sec-pricing", label: "4. Pricing" },
                { id: "sec-variants", label: "5. Variants" },
                { id: "sec-visibility", label: "6. Visibility" },
              ].map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <a
                    key={step.id}
                    href={`#${step.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(step.id)?.scrollIntoView({ behavior: "smooth" });
                      setActiveStep(step.id);
                    }}
                    className={`py-1 border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? "border-[#8C693B] text-[#8C693B]"
                        : "border-transparent hover:text-neutral-700"
                    }`}
                  >
                    {step.label}
                  </a>
                );
              })}
            </div>
          </nav>
        </div>

        <main className="flex-1 px-8 md:px-12 py-8 max-w-4xl w-full mx-auto space-y-8 pb-20">

          {loadingMetadata ? (
            <div className="py-24 text-center text-[10px] uppercase tracking-[0.25em] text-[#8C693B] font-bold animate-pulse">
              Loading workspace filters...
            </div>
          ) : (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">

              {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-semibold space-y-1">
                  <p className="uppercase tracking-wider text-[9px] font-bold text-red-800">
                    Form Validation Errors Found
                  </p>
                  <p>
                    Please review the highlighted fields below. Focus has been automatically moved to the first invalid input.
                  </p>
                </div>
              )}

              {/* ─── Section 1: Basic Information ───────────────────────── */}
              <section id="sec-basic" className="scroll-mt-36 bg-white border border-neutral-200 p-6 md:p-8 rounded-lg shadow-xs space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[8px] uppercase tracking-[0.3em] text-[#8C693B] font-bold block">
                    Step 01
                  </span>
                  <h2 className="font-serif text-xl text-[#111111] font-light mt-0.5">
                    Basic Information
                  </h2>
                  <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-semibold">
                    Core identity attributes for cataloging.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Product Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="product-name" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={nameRef}
                      id="product-name"
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                      placeholder="e.g. Double-Breasted Cashmere Trench Coat"
                      className={`w-full bg-white border text-[#111111] placeholder-neutral-400 focus:border-[#8C693B] text-sm p-3 outline-none rounded transition-colors ${
                        touched.name && !name.trim() ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                      }`}
                      required
                    />
                    {touched.name && !name.trim() && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">Product name is required.</p>
                    )}
                  </div>

                  {/* URL Slug (Auto-Generated / Editable) */}
                  <div className="space-y-1.5">
                    <label htmlFor="product-slug" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500 block">
                      URL Slug (Auto-Generated)
                    </label>
                    <input
                      id="product-slug"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="auto-generated-slug-path"
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs p-3 outline-none rounded font-mono"
                    />
                  </div>

                  {/* Base Product SKU */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="product-sku" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                        Base Product SKU <span className="text-red-500">*</span>
                      </label>
                      {baseSku && /^[A-Za-z0-9-_]+$/.test(baseSku.trim()) && (
                        <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">✓ Valid SKU Format</span>
                      )}
                    </div>
                    <input
                      ref={skuRef}
                      id="product-sku"
                      type="text"
                      value={baseSku}
                      onChange={(e) => handleBaseSkuChange(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, sku: true }))}
                      placeholder="e.g. LX-MN-SH-01"
                      className={`w-full bg-white border text-[#111111] placeholder-neutral-400 focus:border-[#8C693B] text-xs p-3 outline-none rounded font-mono uppercase transition-colors ${
                        touched.sku && !baseSku.trim() ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                      }`}
                      required
                    />
                    {touched.sku && !baseSku.trim() && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">Base Product SKU is required.</p>
                    )}
                  </div>

                  {/* Designer Brand Select */}
                  <div className="space-y-1.5">
                    <label htmlFor="product-brand" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                      Designer Brand <span className="text-red-500">*</span>
                    </label>
                    <select
                      ref={brandRef}
                      id="product-brand"
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full bg-white border border-neutral-200 text-[#111111] focus:border-[#8C693B] text-xs p-3 outline-none rounded cursor-pointer"
                      required
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Catalog Category Select */}
                  <div className="space-y-1.5">
                    <label htmlFor="product-category" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                      Catalog Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      ref={categoryRef}
                      id="product-category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-white border border-neutral-200 text-[#111111] focus:border-[#8C693B] text-xs p-3 outline-none rounded cursor-pointer"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </section>

              {/* ─── Section 2: Editorial Description ───────────────────── */}
              <section id="sec-description" className="scroll-mt-36 bg-white border border-neutral-200 p-6 md:p-8 rounded-lg shadow-xs space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[8px] uppercase tracking-[0.3em] text-[#8C693B] font-bold block">
                    Step 02
                  </span>
                  <h2 className="font-serif text-xl text-[#111111] font-light mt-0.5">
                    Editorial Description
                  </h2>
                  <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-semibold">
                    Luxury fashion editorial copy for PDP rendering.
                  </p>
                </div>

                <div className="space-y-6">
                  
                  {/* Brief Summary (Optional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="product-summary" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                        Brief Summary <span className="text-[9px] text-neutral-400 font-normal lowercase pl-1">(optional)</span>
                      </label>
                      <span className="text-[9px] text-neutral-400 font-mono">{summary.length} / 120</span>
                    </div>
                    <input
                      id="product-summary"
                      type="text"
                      maxLength={120}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="e.g. Meticulously tailored in Italy from double-faced cashmere."
                      className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#8C693B] text-xs p-3 outline-none rounded"
                    />
                  </div>

                  {/* Full Editorial Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="product-description" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                        Full Editorial Description <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[9px] text-neutral-400 font-mono">{description.length} chars</span>
                    </div>
                    <textarea
                      ref={descriptionRef}
                      id="product-description"
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, description: true }))}
                      placeholder="Detail materials, construction technique, silhouette drape, and care instructions..."
                      className={`w-full bg-white border text-[#111111] placeholder-neutral-400 focus:border-[#8C693B] text-xs p-3 outline-none rounded resize-y transition-colors ${
                        touched.description && !description.trim() ? "border-red-400 bg-red-50/20" : "border-neutral-200"
                      }`}
                      required
                    />
                    {touched.description && !description.trim() && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">Full editorial description is required.</p>
                    )}
                  </div>

                </div>
              </section>

              {/* ─── Section 3: Cover & Product Media ───────────────────── */}
              <section id="sec-media" className="scroll-mt-36 bg-white border border-neutral-200 p-6 md:p-8 rounded-lg shadow-xs space-y-6">
                <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[8px] uppercase tracking-[0.3em] text-[#8C693B] font-bold block">
                      Step 03
                    </span>
                    <h2 className="font-serif text-xl text-[#111111] font-light mt-0.5">
                      Cover & Product Media
                    </h2>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-semibold">
                      Add multiple editorial lookbook URLs. Image 01 is designated as the Primary Cover.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#8C693B] bg-amber-50 px-2.5 py-1 rounded border border-amber-200/60 self-start sm:self-auto">
                    {images.length} Image{images.length !== 1 ? "s" : ""} in Gallery
                  </span>
                </div>

                {/* Add New Image URL Bar */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="add-image-url" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                      Add Image URL (HTTPS / Local Path / Data URI)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="add-image-url"
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddImage();
                          }
                        }}
                        placeholder="Paste image URL (e.g. https://images.unsplash.com/... or /images/models/modules2.jpeg)"
                        className="flex-1 bg-white border border-neutral-200 text-[#111111] text-xs p-3 outline-none rounded font-mono focus:border-[#8C693B]"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="px-5 py-3 text-[9px] uppercase tracking-[0.2em] font-bold bg-[#8C693B] hover:bg-[#73542E] text-white rounded transition-colors shrink-0 shadow-2xs"
                      >
                        + Add Image URL
                      </button>
                    </div>
                  </div>

                  {/* Preset Lookbook Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-400 block">
                      Quick Add Sample Presets
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_IMAGE_PRESETS.map((preset) => {
                        const isAlreadyAdded = images.includes(preset.url);
                        return (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => handleAddPreset(preset.url)}
                            disabled={isAlreadyAdded}
                            className={`px-3 py-1.5 rounded border text-[10px] font-semibold transition-all ${
                              isAlreadyAdded
                                ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60"
                                : "bg-white border-neutral-200 text-neutral-700 hover:border-[#8C693B] hover:text-[#8C693B]"
                            }`}
                          >
                            {isAlreadyAdded ? `✓ ${preset.label}` : `+ ${preset.label}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Gallery Cards Grid */}
                <div className="space-y-2 pt-2">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-500 block">
                    Editorial Media Gallery ({images.length})
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((url, idx) => {
                      const isPrimary = idx === 0;
                      return (
                        <div
                          key={`${url}-${idx}`}
                          className={`group relative bg-neutral-50 border rounded-lg overflow-hidden flex flex-col transition-all shadow-2xs ${
                            isPrimary ? "border-[#8C693B] ring-1 ring-[#8C693B]" : "border-neutral-200 hover:border-neutral-400"
                          }`}
                        >
                          {/* Image Thumbnail Container */}
                          <div className="aspect-[4/5] bg-neutral-100 relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url || "/images/models/modules1.jpeg"}
                              alt={`Product image ${idx + 1}`}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = "/images/models/modules1.jpeg";
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Badge */}
                            <div className="absolute top-2 left-2 z-10">
                              {isPrimary ? (
                                <span className="bg-[#8C693B] text-white text-[7px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded shadow-xs">
                                  Primary Cover
                                </span>
                              ) : (
                                <span className="bg-black/60 backdrop-blur-xs text-white text-[7px] uppercase tracking-[0.2em] font-bold px-1.5 py-0.5 rounded">
                                  Img 0{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Delete Button */}
                            {images.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center transition-colors shadow-xs"
                                title="Remove image"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Card Controls Footer */}
                          <div className="p-2 bg-white border-t border-neutral-100 flex items-center justify-between gap-1 text-[9px]">
                            {!isPrimary ? (
                              <button
                                type="button"
                                onClick={() => handleMakeCover(idx)}
                                className="text-[#8C693B] font-bold hover:underline truncate"
                              >
                                ★ Make Cover
                              </button>
                            ) : (
                              <span className="text-neutral-400 font-semibold truncate">Cover Image</span>
                            )}

                            {/* Reorder arrows */}
                            <div className="flex items-center gap-1 shrink-0">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(idx, "left")}
                                  className="w-5 h-5 rounded border border-neutral-200 hover:border-neutral-400 flex items-center justify-center font-bold text-neutral-600 transition-colors"
                                  title="Move left"
                                >
                                  ←
                                </button>
                              )}
                              {idx < images.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(idx, "right")}
                                  className="w-5 h-5 rounded border border-neutral-200 hover:border-neutral-400 flex items-center justify-center font-bold text-neutral-600 transition-colors"
                                  title="Move right"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </section>

              {/* ─── Section 4: Pricing ──────────────────────────────────── */}
              <section id="sec-pricing" className="scroll-mt-36 bg-white border border-neutral-200 p-6 md:p-8 rounded-lg shadow-xs space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[8px] uppercase tracking-[0.3em] text-[#8C693B] font-bold block">
                    Step 04
                  </span>
                  <h2 className="font-serif text-xl text-[#111111] font-light mt-0.5">
                    Base Pricing
                  </h2>
                  <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-semibold">
                    Set retail price in Indian Rupees (INR).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Base Retail Price with ₹ Currency Affordance */}
                  <div className="space-y-1.5">
                    <label htmlFor="base-price" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                      Base Retail Price (INR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-neutral-500 font-bold text-sm pointer-events-none">
                        ₹
                      </span>
                      <input
                        ref={priceRef}
                        id="base-price"
                        type="text"
                        inputMode="numeric"
                        value={basePriceFocused ? basePrice : (basePrice ? formatCurrency(basePrice) : "")}
                        onFocus={() => setBasePriceFocused(true)}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/[^0-9]/g, "");
                          handleBasePriceChange(rawVal);
                        }}
                        onBlur={() => {
                          setBasePriceFocused(false);
                          setTouched((p) => ({ ...p, price: true }));
                        }}
                        placeholder="12,500"
                        className={`w-full bg-white border text-[#111111] placeholder-neutral-400 focus:border-[#8C693B] text-sm p-3 pl-8 outline-none rounded font-mono transition-colors ${
                          touched.price && (!basePrice || Number(basePrice) <= 0)
                            ? "border-red-400 bg-red-50/20"
                            : "border-neutral-200"
                        }`}
                        required
                      />
                    </div>
                    {touched.price && (!basePrice || Number(basePrice) <= 0) && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">
                        Price must be greater than ₹0.
                      </p>
                    )}
                  </div>

                  {/* Compare-At Original Price (Optional) */}
                  <div className="space-y-1.5">
                    <label htmlFor="compare-price" className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-600 block">
                      Compare-At Original Price <span className="text-[9px] text-neutral-400 font-normal lowercase pl-1">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-neutral-500 font-bold text-sm pointer-events-none">
                        ₹
                      </span>
                      <input
                        id="compare-price"
                        type="text"
                        inputMode="numeric"
                        value={comparePriceFocused ? comparePrice : (comparePrice ? formatCurrency(comparePrice) : "")}
                        onFocus={() => setComparePriceFocused(true)}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/[^0-9]/g, "");
                          setComparePrice(rawVal);
                        }}
                        onBlur={() => setComparePriceFocused(false)}
                        placeholder="18,000"
                        className="w-full bg-white border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#8C693B] text-sm p-3 pl-8 outline-none rounded font-mono"
                      />
                    </div>
                  </div>

                </div>
              </section>

              {/* ─── Section 5: Size & Stock Variants (Card Repeater) ──── */}
              <section id="sec-variants" className="scroll-mt-36 bg-white border border-neutral-200 p-6 md:p-8 rounded-lg shadow-xs space-y-6">
                <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[8px] uppercase tracking-[0.3em] text-[#8C693B] font-bold block">
                      Step 05
                    </span>
                    <h2 className="font-serif text-xl text-[#111111] font-light mt-0.5">
                      Size & Stock Variants
                    </h2>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-semibold">
                      Individual size specifications, variant SKUs, and inventory.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold bg-[#8C693B] hover:bg-[#73542E] text-white rounded transition-colors self-start sm:self-auto shadow-2xs"
                  >
                    + Add Size Variant
                  </button>
                </div>

                {/* Variant Cards List */}
                <div className="space-y-4">
                  {variants.map((v, index) => {
                    const posStr = index < 9 ? `0${index + 1}` : `${index + 1}`;
                    return (
                      <div
                        key={v.id}
                        className="p-5 bg-[#FDFBF7] border border-neutral-200/90 rounded-lg space-y-4 hover:border-[#8C693B]/60 transition-colors shadow-2xs"
                      >
                        {/* Variant Card Header */}
                        <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[9px] font-mono font-bold bg-[#8C693B] text-white px-2 py-0.5 rounded">
                              {posStr}
                            </span>
                            <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                              Variant — {v.size}
                            </span>
                          </div>

                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => requestRemoveVariant(index)}
                              className="text-neutral-400 hover:text-red-600 text-sm font-bold px-2 py-1 transition-colors"
                              title="Remove variant"
                              aria-label={`Remove variant ${v.size}`}
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Variant Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          
                          {/* Size Option */}
                          <div className="space-y-1">
                            <label htmlFor={`var-size-${index}`} className="text-[8px] uppercase tracking-[0.2em] font-semibold text-neutral-500 block">
                              Size Option
                            </label>
                            <select
                              id={`var-size-${index}`}
                              value={v.size}
                              onChange={(e) => handleVariantSizeChange(index, e.target.value)}
                              className="w-full bg-white border border-neutral-200 text-[#111111] text-xs p-2.5 outline-none rounded font-semibold cursor-pointer"
                            >
                              <option value="S">Small (S)</option>
                              <option value="M">Medium (M)</option>
                              <option value="L">Large (L)</option>
                              <option value="XL">Extra Large (XL)</option>
                              <option value="XXL">Double Extra Large (XXL)</option>
                              <option value="One Size">One Size</option>
                            </select>
                          </div>

                          {/* Variant SKU */}
                          <div className="space-y-1">
                            <label htmlFor={`var-sku-${index}`} className="text-[8px] uppercase tracking-[0.2em] font-semibold text-neutral-500 block">
                              Variant SKU <span className="text-red-500">*</span>
                            </label>
                            <input
                              id={`var-sku-${index}`}
                              type="text"
                              value={v.sku}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants((prev) =>
                                  prev.map((item, i) => (i === index ? { ...item, sku: val } : item))
                                );
                              }}
                              placeholder="e.g. LX-MN-SH-01-S"
                              className="w-full bg-white border border-neutral-200 text-[#111111] text-xs p-2.5 outline-none rounded font-mono uppercase"
                              required
                            />
                          </div>

                          {/* Variant Price */}
                          <div className="space-y-1">
                            <label htmlFor={`var-price-${index}`} className="text-[8px] uppercase tracking-[0.2em] font-semibold text-neutral-500 block">
                              Price (INR) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-serif text-neutral-400 text-xs font-bold pointer-events-none">
                                ₹
                              </span>
                              <input
                                id={`var-price-${index}`}
                                type="text"
                                inputMode="numeric"
                                value={v.price ? formatCurrency(v.price) : ""}
                                onChange={(e) => {
                                  const rawVal = e.target.value.replace(/[^0-9]/g, "");
                                  setVariants((prev) =>
                                    prev.map((item, i) => (i === index ? { ...item, price: rawVal } : item))
                                  );
                                }}
                                placeholder="12,500"
                                className="w-full bg-white border border-neutral-200 text-[#111111] text-xs p-2.5 pl-6 outline-none rounded font-mono"
                                required
                              />
                            </div>
                          </div>

                          {/* Variant Stock */}
                          <div className="space-y-1">
                            <label htmlFor={`var-stock-${index}`} className="text-[8px] uppercase tracking-[0.2em] font-semibold text-neutral-500 block">
                              Stock Units <span className="text-red-500">*</span>
                            </label>
                            <input
                              id={`var-stock-${index}`}
                              type="text"
                              inputMode="numeric"
                              value={v.stock}
                              onChange={(e) => {
                                const rawVal = e.target.value.replace(/[^0-9]/g, "");
                                setVariants((prev) =>
                                  prev.map((item, i) => (i === index ? { ...item, stock: rawVal } : item))
                                );
                              }}
                              placeholder="10"
                              className="w-full bg-white border border-neutral-200 text-[#111111] text-xs p-2.5 outline-none rounded font-mono"
                              required
                            />
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Inventory Summary Footer */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500">
                    Inventory Summary
                  </span>
                  <span className="text-xs font-bold text-[#111111] font-mono">
                    Total: {totalStockUnits} unit{totalStockUnits !== 1 ? "s" : ""} across {variants.length} size variant{variants.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </section>

              {/* ─── Section 6: Visibility & Operational Status ─────────── */}
              <section id="sec-visibility" className="scroll-mt-36 bg-white border border-neutral-200 p-6 md:p-8 rounded-lg shadow-xs space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[8px] uppercase tracking-[0.3em] text-[#8C693B] font-bold block">
                    Step 06
                  </span>
                  <h2 className="font-serif text-xl text-[#111111] font-light mt-0.5">
                    Visibility & Publishing Status
                  </h2>
                  <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-semibold">
                    Set catalog publication status.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Option 1: Draft */}
                  <div
                    onClick={() => setStatus("draft")}
                    className={`p-5 rounded-lg border cursor-pointer transition-all ${
                      status === "draft"
                        ? "bg-amber-50/50 border-[#8C693B] shadow-xs"
                        : "bg-white border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8C693B]">
                        Draft Status
                      </span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        status === "draft" ? "border-[#8C693B] bg-[#8C693B] text-white" : "border-neutral-300"
                      }`}>
                        {status === "draft" && <span className="text-[8px]">✓</span>}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Saved internally in management portal. Hidden from storefront search & category pages.
                    </p>
                  </div>

                  {/* Option 2: Published */}
                  <div
                    onClick={() => setStatus("published")}
                    className={`p-5 rounded-lg border cursor-pointer transition-all ${
                      status === "published"
                        ? "bg-emerald-50/50 border-emerald-600 shadow-xs"
                        : "bg-white border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Published Status
                      </span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        status === "published" ? "border-emerald-600 bg-emerald-600 text-white" : "border-neutral-300"
                      }`}>
                        {status === "published" && <span className="text-[8px]">✓</span>}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Instantly visible to public customers on storefront homepage, catalog search, and PDPs.
                    </p>
                  </div>

                </div>
              </section>

              {/* Bottom Action Footer */}
              <div className="pt-4 flex items-center justify-between border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => router.push("/products")}
                  className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500 hover:text-[#111111] transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSave("draft")}
                    disabled={isSubmitting}
                    className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] border border-[#8C693B] text-[#8C693B] hover:bg-[#8C693B]/10 rounded transition-all bg-transparent disabled:opacity-40"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave("published")}
                    disabled={isSubmitting}
                    className="px-8 py-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-[#8C693B] hover:bg-[#73542E] text-white rounded transition-all shadow-xs disabled:opacity-40"
                  >
                    {isSubmitting ? "Saving..." : "Publish Item"}
                  </button>
                </div>
              </div>

            </form>
          )}

        </main>

        {/* ─── Remove Variant Confirmation Modal ───────────────────── */}
        <AnimatePresence>
          {variantToRemove && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white border border-neutral-200 rounded-lg p-6 max-w-sm w-full space-y-4 shadow-2xl text-left"
              >
                <div>
                  <h4 className="font-serif text-lg text-[#111111] font-light">
                    Remove Variant ({variantToRemove.size})?
                  </h4>
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                    This size variant has price or inventory data entered. Are you sure you want to remove it?
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setVariantToRemove(null)}
                    className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold border border-neutral-200 rounded text-neutral-600 hover:border-neutral-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmRemoveVariant(variantToRemove.index)}
                    className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Yes, Remove
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Customer Preview Modal ───────────────────────────────── */}
        <ProductPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          productData={previewData}
        />

      </div>
    </AdminLayout>
  );
}
