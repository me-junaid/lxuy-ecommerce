"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormVariant {
  size: string;
  sku: string;
  price: string;
  stock: string;
}

interface ProductPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productData: {
    name: string;
    brandName?: string;
    categoryName?: string;
    price: string;
    summary?: string;
    description: string;
    imageUrl?: string;
    images?: string[];
    variants: FormVariant[];
  };
}

export default function ProductPreviewModal({
  isOpen,
  onClose,
  productData,
}: ProductPreviewModalProps) {
  const { name, brandName, categoryName, price, summary, description, imageUrl, images, variants } =
    productData;

  const galleryImages = images && images.length > 0 ? images : imageUrl ? [imageUrl] : ["/images/models/modules1.jpeg"];
  const [activeImgIndex, setActiveImgIndex] = React.useState(0);

  const displayPrice = price ? Number(price) : 0;
  const imageSrc = galleryImages[activeImgIndex] || galleryImages[0] || "/images/models/modules1.jpeg";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[760px] bg-[#FAF7F2] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden border border-neutral-300"
          >
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[8px] uppercase tracking-[0.25em] text-[#8C693B] font-bold block">
                  Storefront Presentation Preview
                </span>
                <h3 className="font-serif text-lg text-[#111111] font-light mt-0.5">
                  Customer Result Preview
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded border border-neutral-200 text-neutral-400 hover:text-[#111111] flex items-center justify-center transition-colors"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Preview Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              
              {/* Part 1: Product Card Preview on Storefront Catalog */}
              <div className="space-y-3">
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
                  1. Catalog Grid Presentation Card
                </span>

                <div className="max-w-xs bg-white border border-neutral-200 rounded overflow-hidden shadow-sm mx-auto sm:mx-0">
                  <div className="aspect-[4/5] bg-neutral-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt={name || "Product preview"}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-black/70 text-white text-[7px] uppercase tracking-widest px-2 py-0.5 rounded font-bold">
                      New Arrival
                    </span>
                  </div>
                  <div className="p-4 space-y-1 text-left">
                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
                      {brandName || "LXUY SIGNATURE"}
                    </span>
                    <h4 className="font-serif text-base text-[#111111] font-medium leading-tight truncate">
                      {name || "Untitled Silhouette"}
                    </h4>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-[#111111]">
                        {displayPrice > 0 ? `₹${displayPrice.toLocaleString("en-IN")}` : "₹—"}
                      </span>
                      <span className="text-[8px] uppercase tracking-widest text-[#8C693B] font-bold">
                        {categoryName || "CATALOG"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part 2: Product Detail Page (PDP) Layout */}
              <div className="space-y-3">
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 block">
                  2. Product Detail Page (PDP) View
                </span>

                <div className="bg-white border border-neutral-200 rounded p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Image Column */}
                  <div className="space-y-2">
                    <div className="aspect-[4/5] bg-neutral-100 rounded overflow-hidden border border-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt={name || "Product preview"}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/images/models/modules1.jpeg";
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {galleryImages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {galleryImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImgIndex(idx)}
                            className={`w-10 h-12 rounded overflow-hidden border transition-all shrink-0 ${
                              activeImgIndex === idx
                                ? "border-[#8C693B] ring-1 ring-[#8C693B]"
                                : "border-neutral-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Editorial Info Column */}
                  <div className="space-y-4 text-left flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-[0.25em] text-[#8C693B] font-bold block">
                        {brandName || "LXUY SIGNATURE"}
                      </span>
                      <h2 className="font-serif text-2xl font-light text-[#111111] leading-tight">
                        {name || "Untitled Product Silhouette"}
                      </h2>
                      <div className="text-lg font-bold text-[#111111]">
                        {displayPrice > 0 ? `₹${displayPrice.toLocaleString("en-IN")}` : "₹—"}
                        <span className="text-[10px] font-normal text-neutral-400 ml-2">
                          (Inclusive of all taxes)
                        </span>
                      </div>
                    </div>

                    {summary && (
                      <p className="text-xs text-neutral-600 italic border-l-2 border-[#8C693B] pl-3 py-1">
                        &quot;{summary}&quot;
                      </p>
                    )}

                    {/* Size selector mockup */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">
                        Select Size
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {variants.length > 0 ? (
                          variants.map((v, i) => (
                            <span
                              key={i}
                              className={`px-3 py-1.5 rounded border text-xs font-semibold uppercase ${
                                i === 0
                                  ? "border-[#111111] bg-[#111111] text-white"
                                  : "border-neutral-200 bg-white text-neutral-700"
                              }`}
                            >
                              {v.size}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400">No sizes specified</span>
                        )}
                      </div>
                    </div>

                    {/* Add to Bag Button mockup */}
                    <button
                      disabled
                      className="w-full py-3 bg-[#111111] text-white text-[10px] uppercase tracking-[0.25em] font-bold rounded cursor-not-allowed opacity-90"
                    >
                      Add to Bag — {displayPrice > 0 ? `₹${displayPrice.toLocaleString("en-IN")}` : "₹—"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 3: Deep Description Preview */}
              {description && (
                <div className="space-y-2 bg-white border border-neutral-200 rounded p-6 text-left">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-[#8C693B] font-bold block">
                    Editorial Notes & Details
                  </span>
                  <div className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line font-sans">
                    {description}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="shrink-0 bg-white border-t border-neutral-200 px-6 py-4 flex justify-between items-center">
              <span className="text-[10px] text-neutral-400 font-semibold">
                Storefront preview mode
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2 text-[10px] uppercase tracking-widest font-bold bg-[#111111] text-white rounded hover:bg-neutral-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
