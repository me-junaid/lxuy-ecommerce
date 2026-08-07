"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import Link from "next/link";
import { Button } from "@repo/ui";

export default function DashboardHome() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Metrics states
  const [metrics, setMetrics] = useState({
    products: 0,
    categories: 0,
    brands: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Authenticate session
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

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
      
      {/* 1. Sidebar Nav */}
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
              className="text-xs uppercase tracking-luxury font-bold text-luxury-gold"
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

      {/* 2. Main Dashboard Area */}
      <main className="flex-1 p-8 md:p-12 text-left space-y-8">
        
        {/* Banner Section */}
        <div className="border-b border-luxury-silver/30 pb-4">
          <h1 className="font-serif text-3xl font-light text-luxury-dark leading-tight">
            System Overview
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time catalog metrics and inventory tracking statistics.
          </p>
        </div>

        {/* Dashboard Grid Cards */}
        {metricsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-32 bg-neutral-100 animate-pulse rounded border border-luxury-silver/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Total Products Card */}
            <div className="bg-[#FDFBF7] border border-luxury-silver/30 p-6 shadow-sm space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">
                Total Catalog Products
              </span>
              <div className="font-serif text-4xl font-light text-luxury-dark">
                {metrics.products}
              </div>
              <Link
                href="/products"
                className="text-[9px] uppercase tracking-luxury text-luxury-gold font-bold hover:text-luxury-dark inline-block pt-2"
              >
                Manage Inventory &rarr;
              </Link>
            </div>

            {/* Total Categories Card */}
            <div className="bg-[#FDFBF7] border border-luxury-silver/30 p-6 shadow-sm space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">
                Categories Configured
              </span>
              <div className="font-serif text-4xl font-light text-luxury-dark">
                {metrics.categories}
              </div>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 block pt-3">
                Active catalog slices
              </span>
            </div>

            {/* Total Brands Card */}
            <div className="bg-[#FDFBF7] border border-luxury-silver/30 p-6 shadow-sm space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">
                Partner Brands
              </span>
              <div className="font-serif text-4xl font-light text-luxury-dark">
                {metrics.brands}
              </div>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 block pt-3">
                Curated designer labels
              </span>
            </div>

          </div>
        )}

        {/* Shortcuts / Quick Actions Section */}
        <div className="space-y-4 pt-4">
          <h2 className="font-serif text-xl font-light text-luxury-dark">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => router.push("/products")}
              variant="primary"
              className="px-6 py-2.5 text-xs font-semibold uppercase tracking-luxury"
            >
              View Inventory Table
            </Button>
            <Button
              onClick={() => router.push("/products/create")}
              variant="secondary"
              className="px-6 py-2.5 text-xs font-semibold uppercase tracking-luxury"
            >
              Add New Product Entry
            </Button>
          </div>
        </div>

      </main>

    </div>
  );
}
