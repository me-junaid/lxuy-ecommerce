"use client";

import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if user is not authenticated and loading is complete
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-[10px] uppercase tracking-[0.25em] text-[#B38F5F] font-bold"
        >
          Authenticating Admin Access...
        </motion.div>
      </div>
    );
  }

  // Navigation link groups
  const navSections = [
    {
      title: null,
      items: [
        { label: "Overview", href: "/" },
      ],
    },
    {
      title: "Orders",
      items: [
        { label: "Orders", href: "/orders" },
      ],
    },
    {
      title: "Catalog Management",
      items: [
        { label: "Catalog Inventory", href: "/products" },
        { label: "Curate Releases", href: "/products/curate" },
        { label: "Add Product", href: "/products/create" },
        { label: "Brands", href: "/brands" },
        { label: "Categories", href: "/categories" },
      ],
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#FDFBF7] text-[#111111] font-sans selection:bg-[#B38F5F]/15 selection:text-[#B38F5F]">
      
      {/* 1. Sidebar Nav */}
      <aside className="w-full md:w-64 md:fixed md:top-0 md:bottom-0 md:left-0 bg-[#FDFBF7] border-b md:border-b-0 md:border-r border-neutral-200/80 p-6 flex flex-col justify-between shrink-0 z-40 overflow-y-auto">
        <div className="space-y-8 text-left">
          
          {/* Logo Branding */}
          <Link href="/" className="space-y-1 block group focus:outline-none">
            <span className="font-serif text-3xl font-bold tracking-[0.25em] text-[#111111] block transition-colors group-hover:text-[#B38F5F]">
              LXUY
            </span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#B38F5F] font-bold block">
              Management Portal
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-6 pt-4 border-t border-neutral-200/60">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2.5">
                {section.title && (
                  <span className="text-[8px] uppercase tracking-[0.25em] font-bold text-neutral-400 block px-3">
                    {section.title}
                  </span>
                )}
                <div className="flex flex-col space-y-1.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 py-1.5 border-l-2 pl-3 focus:outline-none ${
                          isActive
                            ? "text-[#B38F5F] border-[#B38F5F]"
                            : "text-neutral-500 border-transparent hover:text-[#111111] hover:border-neutral-300"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="pt-6 mt-8 md:mt-0 border-t border-neutral-200/60 text-left space-y-5">
          <div className="bg-neutral-50 p-4 rounded border border-neutral-200/60">
            <span className="text-[9px] uppercase tracking-widest text-neutral-400 block font-bold">
              Account
            </span>
            <span className="text-xs font-semibold text-neutral-700 capitalize truncate block mt-1">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-[9px] font-bold text-[#B38F5F] uppercase tracking-[0.15em] block mt-0.5">
              {user.role.replace("_", " ")}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full text-center py-2 bg-red-50 hover:bg-red-100/60 text-red-600 hover:text-red-700 text-[10px] uppercase tracking-luxury font-bold rounded border border-red-200/60 transition-all duration-300 focus:outline-none"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main content container */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 h-full overflow-y-auto bg-[#FDFBF7]">
        {children}
      </div>

    </div>
  );
}
