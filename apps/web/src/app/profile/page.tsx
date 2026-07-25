"use client";

import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, Header, Footer } from "@repo/ui";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Don't redirect until we know for sure the session is gone.
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Show luxury loading state while session restore is in progress.
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm uppercase tracking-[0.25em] text-luxury-gold"
        >
          LXUY Maison...
        </motion.div>
      </div>
    );
  }

  // Not logged in — useEffect will redirect; render nothing to avoid a flash.
  if (!user) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header
        brandName="LXUY"
        cartCount={0}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => router.push("/cart")}
        onProfileClick={() => router.push("/profile")}
        onSearchClick={() => {}}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Page Header */}
          <div className="border-b border-luxury-silver pb-8 mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-luxury-gold mb-2 block">
                Maison Account
              </span>
              <h1 className="text-4xl font-serif tracking-normal text-luxury-dark">
                Welcome, {user.firstName}
              </h1>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={logout}
                className="px-6 py-2.5 text-xs"
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Left Sidebar: Navigation */}
            <div className="space-y-6">
              <nav className="flex flex-col space-y-4 text-xs tracking-wider uppercase font-medium text-neutral-500">
                <span className="text-luxury-dark border-l-2 border-luxury-gold pl-3">
                  Personal Details
                </span>
                <span className="hover:text-luxury-dark pl-3 cursor-not-allowed opacity-50">
                  Security
                </span>
                <span className="hover:text-luxury-dark pl-3 cursor-not-allowed opacity-50">
                  Order History
                </span>
                <span className="hover:text-luxury-dark pl-3 cursor-not-allowed opacity-50">
                  Addresses
                </span>
              </nav>
            </div>

            {/* Right Main Content */}
            <div className="md:col-span-2 space-y-12">
              {/* Account Information */}
              <section className="space-y-6">
                <h2 className="text-lg font-serif text-luxury-dark border-b border-luxury-silver pb-2">
                  Personal Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-widest block mb-1">
                      Full Name
                    </span>
                    <span className="text-luxury-dark font-light">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-widest block mb-1">
                      Email Address
                    </span>
                    <span className="text-luxury-dark font-light">
                      {user.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-widest block mb-1">
                      Role
                    </span>
                    <span className="text-luxury-dark font-light capitalize">
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-widest block mb-1">
                      Member Since
                    </span>
                    <span className="text-luxury-dark font-light">
                      {joinDate}
                    </span>
                  </div>
                </div>
              </section>

              {/* Recent Orders */}
              <section className="space-y-6">
                <h2 className="text-lg font-serif text-luxury-dark border-b border-luxury-silver pb-2">
                  Recent Orders
                </h2>
                <div className="border border-luxury-silver p-8 text-center text-sm font-light text-neutral-500">
                  <p className="mb-4">You haven&apos;t placed any orders yet.</p>
                  <Button
                    variant="primary"
                    onClick={() => router.push("/")}
                    className="text-xs px-6 py-2.5"
                  >
                    Start Shopping
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}