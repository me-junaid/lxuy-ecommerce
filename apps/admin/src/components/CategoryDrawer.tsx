"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";

export interface CategoryData {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: { _id: string; name: string } | string | null;
  status: "active" | "inactive" | "archived";
  productCount?: number;
}

interface ToastPayload {
  message: string;
  type: "success" | "error";
}

interface CategoryDrawerProps {
  category: CategoryData | null; // null means create new category
  allCategories: CategoryData[];
  onClose: () => void;
  onSaved: (category: CategoryData) => void;
  showToast: (toast: ToastPayload) => void;
}

const inputCls =
  "w-full bg-white border border-neutral-200 text-[#111111] text-xs p-2.5 outline-none rounded focus:border-[#B38F5F] transition-colors placeholder-neutral-300";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoryDrawer({
  category,
  allCategories,
  onClose,
  onSaved,
  showToast,
}: CategoryDrawerProps) {
  const isEditing = Boolean(category && category._id);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [parentId, setParentId] = useState<string>(() => {
    if (!category?.parent) return "";
    return typeof category.parent === "object" ? category.parent._id : category.parent;
  });
  const [status, setStatus] = useState<"active" | "inactive" | "archived">(
    category?.status ?? "active"
  );

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiscardBanner, setShowDiscardBanner] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
    markDirty();
  };

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardBanner(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        requestClose();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [requestClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [requestClose]);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast({ message: "Category name is required.", type: "error" });
      return;
    }
    const cleanSlug = slugify(slug || name);
    if (!cleanSlug) {
      showToast({ message: "Valid slug is required.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: cleanSlug,
        status,
        isActive: status === "active",
      };

      if (description.trim()) payload.description = description.trim();
      if (image.trim()) payload.image = image.trim();
      payload.parent = parentId.trim() ? parentId.trim() : null;

      let res;
      if (isEditing && category?._id) {
        res = await api.patch(`/api/v1/categories/${category._id}`, payload);
        showToast({ message: `Category "${name}" updated successfully.`, type: "success" });
      } else {
        res = await api.post("/api/v1/categories", payload);
        showToast({ message: `Category "${name}" created successfully.`, type: "success" });
      }

      onSaved(res?.data || res || { ...payload, _id: category?._id });
      setIsDirty(false);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save category:", err);
      const apiErr = err as { data?: { message?: string | string[] }; message?: string };
      const apiMsg = apiErr?.data?.message;
      const errMsg = Array.isArray(apiMsg)
        ? apiMsg.join(", ")
        : typeof apiMsg === "string"
        ? apiMsg
        : apiErr?.message || "Failed to save category.";
      showToast({ message: String(errMsg), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Filter out self as parent option to avoid cyclic parent
  const parentOptions = allCategories.filter((c) => !isEditing || c._id !== category?._id);

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50"
        aria-hidden="true"
      />

      {/* Drawer */}
      <motion.div
        ref={drawerRef}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col w-full sm:w-[80%] md:w-[500px] bg-[#FDFBF7] shadow-2xl shadow-black/10 border-l border-neutral-200"
      >
        {/* Sticky Header */}
        <div className="shrink-0 border-b border-neutral-200/80 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {image ? (
              <div className="w-10 h-10 rounded border border-neutral-200 overflow-hidden bg-white shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded border border-neutral-200 bg-neutral-100 shrink-0 flex items-center justify-center font-serif text-sm font-bold text-neutral-400">
                {name ? name.slice(0, 2).toUpperCase() : "CT"}
              </div>
            )}
            <div>
              <h2 className="font-serif text-lg font-light text-[#111111] leading-snug">
                {isEditing ? name || "Edit Category" : "New Category"}
              </h2>
              <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold mt-0.5">
                {isEditing ? "Update category details & taxonomy" : "Add category or collection to catalog"}
              </p>
            </div>
          </div>
          <button
            onClick={requestClose}
            className="text-neutral-400 hover:text-neutral-700 transition-colors focus:outline-none"
            aria-label="Close drawer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Unsaved Changes Banner */}
        <AnimatePresence>
          {showDiscardBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-3 bg-amber-50 border-b border-amber-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
                  You have unsaved changes
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDiscardBanner(false);
                      onClose();
                    }}
                    className="text-[10px] uppercase font-bold text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => setShowDiscardBanner(false)}
                    className="text-[10px] uppercase font-bold text-[#B38F5F] hover:text-[#9c7b50] transition-colors"
                  >
                    Keep Editing
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Category Name */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Footwear, Accessories, Men, Women"
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-neutral-200 rounded overflow-hidden bg-white focus-within:border-[#B38F5F] transition-colors">
              <span className="text-[11px] text-neutral-400 px-3 bg-neutral-50/70 border-r border-neutral-200 select-none py-2.5 font-mono">
                /collections/
              </span>
              <input
                className="flex-1 bg-transparent text-xs p-2.5 outline-none text-[#111111] font-mono"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  markDirty();
                }}
                placeholder="accessories"
                disabled={saving}
              />
            </div>
          </div>

          {/* Parent Category (Optional Hierarchy) */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
              Parent Category (Optional Hierarchy)
            </label>
            <select
              className={inputCls}
              value={parentId}
              onChange={(e) => {
                setParentId(e.target.value);
                markDirty();
              }}
              disabled={saving}
            >
              <option value="">None (Top-level Collection)</option>
              {parentOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Image URL */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
              Cover Image URL (Optional)
            </label>
            <input
              className={inputCls}
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
                markDirty();
              }}
              placeholder="https://..."
              disabled={saving}
            />
            {image && (
              <div className="mt-2 p-3 border border-neutral-200 rounded bg-white flex items-center gap-3">
                <div className="w-12 h-14 border border-neutral-100 rounded overflow-hidden bg-neutral-50 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Category preview" className="w-full h-full object-cover" />
                </div>
                <div className="text-[10px] text-neutral-400 font-semibold truncate">Cover preview</div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
              Visibility Status
            </label>
            <select
              className={inputCls}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "active" | "inactive" | "archived");
                markDirty();
              }}
              disabled={saving}
            >
              <option value="active">Active (Visible on storefront navigation & filters)</option>
              <option value="inactive">Inactive (Hidden from storefront)</option>
              <option value="archived">Archived (Retired)</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
              Collection Description
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markDirty();
              }}
              placeholder="A brief summary describing the curation of products in this category..."
              disabled={saving}
            />
          </div>

          {isEditing && category?.productCount !== undefined && (
            <div className="p-3 bg-neutral-50/80 border border-neutral-200/80 rounded flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
                Assigned Products
              </span>
              <span className="text-xs font-bold text-[#111111]">
                {category.productCount} product{category.productCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 border-t border-neutral-200/80 px-6 py-4 flex items-center justify-end gap-3 bg-[#FDFBF7]">
          <button
            onClick={requestClose}
            disabled={saving}
            className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 border border-neutral-200 rounded hover:border-neutral-300 hover:text-neutral-700 transition-all duration-200 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!isDirty && isEditing)}
            className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] bg-[#B38F5F] hover:bg-[#9c7b50] text-white rounded transition-all duration-200 disabled:opacity-40 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Category"
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
