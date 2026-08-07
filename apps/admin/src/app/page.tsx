"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import Link from "next/link";
import { Button } from "@repo/ui";
import AdminLayout from "../components/AdminLayout";
import { motion } from "framer-motion";

export default function DashboardHome() {
  const { user } = useAuth();
  const router = useRouter();

  // Metrics states
  const [metrics, setMetrics] = useState({
    products: 0,
    categories: 0,
    brands: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Fetch quick database summary statistics
  useEffect(() => {
    if (user) {
      async function loadMetrics() {
        try {
          const [resProducts, resCats, resBrands] = await Promise.all([
            api.get("/api/v1/products?limit=1"),
            api.get("/api/v1/categories"),
            api.get("/api/v1/brands"),
          ]);
          setMetrics({
            products: resProducts.total || 0,
            categories: resCats.length || 0,
            brands: resBrands.length || 0,
          });
        } catch (err) {
          console.error("Failed to load dashboard metrics:", err);
        } finally {
          setMetricsLoading(false);
        }
      }
      loadMetrics();
    }
  }, [user]);

  return (
    <AdminLayout>
      <main className="flex-1 p-8 md:p-12 text-left space-y-8 select-none">
        
        {/* Banner Section */}
        <div className="border-b border-neutral-200/80 pb-5">
          <motion.h1 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-serif text-3xl font-light text-[#111111] leading-tight"
          >
            System Overview
          </motion.h1>
          <p className="text-[11px] uppercase tracking-widest text-[#B38F5F] mt-1.5 font-bold">
            Real-time catalog metrics and inventory tracking statistics.
          </p>
        </div>

        {/* Dashboard Grid Cards */}
        {metricsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-32 bg-neutral-100 animate-pulse rounded border border-neutral-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Total Products Card */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "#B38F5F/60" }}
              className="bg-white border border-neutral-200/80 p-6 rounded-lg shadow-sm space-y-3 transition-colors duration-300 relative group"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B38F5F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
              <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-bold block">
                Total Catalog Products
              </span>
              <div className="font-serif text-4xl font-light text-[#111111] group-hover:text-[#B38F5F] transition-colors duration-300">
                {metrics.products}
              </div>
              <Link
                href="/products"
                className="text-[9px] uppercase tracking-luxury text-[#B38F5F] font-bold hover:text-[#111111] inline-block pt-1 transition-colors duration-300"
              >
                Manage Inventory &rarr;
              </Link>
            </motion.div>

            {/* Total Categories Card */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "#B38F5F/60" }}
              className="bg-white border border-neutral-200/80 p-6 rounded-lg shadow-sm space-y-3 transition-colors duration-300 relative group"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B38F5F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
              <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-bold block">
                Categories Configured
              </span>
              <div className="font-serif text-4xl font-light text-[#111111] group-hover:text-[#B38F5F] transition-colors duration-300">
                {metrics.categories}
              </div>
              <span className="text-[9px] uppercase tracking-widest text-neutral-500 block pt-1.5 font-bold">
                Active catalog slices
              </span>
            </motion.div>

            {/* Total Brands Card */}
            <motion.div 
              whileHover={{ y: -4, borderColor: "#B38F5F/60" }}
              className="bg-white border border-neutral-200/80 p-6 rounded-lg shadow-sm space-y-3 transition-colors duration-300 relative group"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B38F5F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
              <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-bold block">
                Partner Brands
              </span>
              <div className="font-serif text-4xl font-light text-[#111111] group-hover:text-[#B38F5F] transition-colors duration-300">
                {metrics.brands}
              </div>
              <span className="text-[9px] uppercase tracking-widest text-neutral-500 block pt-1.5 font-bold">
                Curated designer labels
              </span>
            </motion.div>

          </div>
        )}

        {/* Shortcuts / Quick Actions Section */}
        <div className="space-y-5 pt-4">
          <h2 className="font-serif text-xl font-light text-[#111111]">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => router.push("/products")}
              variant="primary"
              className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-[#B38F5F] hover:bg-[#9c7b50] text-white border-none rounded transition-all duration-300"
            >
              View Inventory Table
            </Button>
            <Button
              onClick={() => router.push("/products/create")}
              variant="secondary"
              className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-transparent hover:bg-neutral-50 text-[#B38F5F] hover:text-[#9c7b50] border border-[#B38F5F]/30 hover:border-[#B38F5F] rounded transition-all duration-300"
            >
              Add New Product Entry
            </Button>
          </div>
        </div>

      </main>
    </AdminLayout>
  );
}
