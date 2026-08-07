"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { Button, Header, Footer } from "@repo/ui";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../lib/api";

interface OrderItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    images?: string[];
  };
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  id?: string;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    discount: number;
    shippingFee: number;
    tax: number;
    total: number;
  };
  payment: {
    method: string;
    status: string;
  };
  status: string;
  createdAt: string;
}

function OrderCard({ order, formatPrice }: { order: Order; formatPrice: (a: number) => string }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <div className="border border-luxury-silver/30 bg-[#FDFBF7] p-6 md:p-8 space-y-6 text-left">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-luxury-silver/20 pb-4">
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-0.5">Order Number</span>
          <span className="text-xs font-semibold text-luxury-dark uppercase">#{order._id || order.id}</span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-0.5">Date Placed</span>
          <span className="text-xs font-semibold text-neutral-700">{date}</span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-0.5">Delivery Status</span>
          <span className={`text-[10px] uppercase font-bold tracking-luxury px-3 py-1 border rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-0.5">Amount Paid</span>
          <span className="text-sm font-semibold text-luxury-gold">{formatPrice(order.pricing.total)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Items ({order.items.reduce((sum, i) => sum + i.quantity, 0)})</span>
        <div className="divide-y divide-luxury-silver/10">
          {order.items.map((item) => (
            <div key={`${item.product?._id || item.product}-${item.sku}`} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 text-xs">
              <div className="flex items-center space-x-4">
                <div className="w-10 aspect-[3/4] bg-neutral-100 relative overflow-hidden flex-shrink-0">
                  <img src={item.product?.images?.[0] || "/images/models/modules1.jpeg"} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-serif text-luxury-dark font-medium">{item.name}</h4>
                  <p className="text-[10px] text-neutral-400 font-light mt-0.5">SKU: {item.sku} | Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-semibold text-neutral-700">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, isAuthenticated, logout, logoutAllDevices } = useAuth();
  const { items: cartItems, setIsCartOpen } = useCart();
  const { items: wishlistItems } = useWishlist();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<"details" | "orders">("details");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Don't redirect until we know for sure the session is gone.
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Fetch orders from API
  useEffect(() => {
    if (isAuthenticated) {
      setOrdersLoading(true);
      api.get("/api/v1/orders")
        .then((data) => {
          setOrders(data);
          setOrdersLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load orders:", err);
          setOrdersLoading(false);
        });
    }
  }, [isAuthenticated]);

  // Show luxury loading state while session restore is in progress.
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm uppercase tracking-[0.25em] text-luxury-gold"
        >
          LXUY ...
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

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header
        brandName="LXUY"
        cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
        wishlistCount={wishlistItems.length}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => router.push("/wishlist")}
        onProfileClick={() => router.push("/profile")}
        onSearchClick={() => { }}
      />

      {/* Email verification banner — shown until the user verifies their address */}
      {!user.isEmailVerified && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <p className="text-center text-xs text-amber-800 tracking-wide font-medium">
            Your email address is not verified.{" "}
            <a
              href="/verify-email/resend"
              className="underline underline-offset-2 hover:text-amber-900 font-semibold transition-colors"
            >
              Resend verification email
            </a>
          </p>
        </div>
      )}

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
                Account
              </span>
              <h1 className="text-4xl font-serif tracking-normal text-luxury-dark">
                Welcome, {user.firstName}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={logoutAllDevices}
                className="px-5 py-2.5 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                Sign Out of All Devices
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="px-5 py-2.5 text-xs"
              >
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Left Sidebar: Navigation */}
            <div className="space-y-6">
              <nav className="flex flex-col space-y-4 text-xs tracking-wider uppercase font-medium text-neutral-500">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`text-left bg-transparent border-none cursor-pointer pl-3 transition-colors ${
                    activeTab === "details" ? "text-luxury-dark border-l-2 border-luxury-gold" : "hover:text-luxury-dark"
                  }`}
                >
                  Personal Details
                </button>
                <span className="pl-3 cursor-not-allowed opacity-50 select-none">
                  Security
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`text-left bg-transparent border-none cursor-pointer pl-3 transition-colors ${
                    activeTab === "orders" ? "text-luxury-dark border-l-2 border-luxury-gold" : "hover:text-luxury-dark"
                  }`}
                >
                  Order History
                </button>
                <span className="pl-3 cursor-not-allowed opacity-50 select-none">
                  Addresses
                </span>
              </nav>
            </div>

            {/* Right Main Content */}
            <div className="md:col-span-2 space-y-12">
              {activeTab === "details" && (
                <>
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

                  {/* Recent Orders Preview */}
                  <section className="space-y-6">
                    <h2 className="text-lg font-serif text-luxury-dark border-b border-luxury-silver pb-2">
                      Recent Orders
                    </h2>
                    {ordersLoading ? (
                      <div className="py-12 text-center text-xs tracking-luxury text-neutral-400">Loading orders...</div>
                    ) : orders.length === 0 ? (
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
                    ) : (
                      <div className="space-y-4">
                        {orders.slice(0, 2).map((order) => (
                          <OrderCard key={order._id || order.id} order={order} formatPrice={formatPrice} />
                        ))}
                        {orders.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("orders")}
                            className="text-xs font-bold text-luxury-gold uppercase tracking-luxury hover:text-luxury-dark transition-colors bg-transparent border-none cursor-pointer mt-2"
                          >
                            View All Orders ({orders.length}) →
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === "orders" && (
                <section className="space-y-6">
                  <h2 className="text-lg font-serif text-luxury-dark border-b border-luxury-silver pb-2">
                    Order History
                  </h2>
                  {ordersLoading ? (
                    <div className="py-12 text-center text-xs tracking-luxury text-neutral-400">Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="border border-luxury-silver p-8 text-center text-sm font-light text-[#888]">
                      <p className="mb-4">No order records found in your account.</p>
                      <Button
                        variant="primary"
                        onClick={() => router.push("/")}
                        className="text-xs px-6 py-2.5"
                      >
                        Browse Catalog
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <OrderCard key={order._id || order.id} order={order} formatPrice={formatPrice} />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}