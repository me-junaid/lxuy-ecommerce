"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "../../components/AdminLayout";
import OrderDrawer from "../../components/OrderDrawer";
import { api } from "../../lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
}

interface OrderPayment {
  method: string;
  status: string;
}

interface OrderPricing {
  total: number;
}

interface CustomerSnapshot {
  name: string;
  email: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  pricing: OrderPricing;
  payment: OrderPayment;
  shippingAddress: OrderAddress;
  customerSnapshot?: CustomerSnapshot;
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  packed: number;
  shipped: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  returned: number;
}

interface AdminOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:          { label: "Pending",         color: "#B38F5F", bg: "#FDF8F0" },
  confirmed:        { label: "Confirmed",        color: "#5A8F6A", bg: "#F0F8F2" },
  processing:       { label: "Processing",       color: "#4A7FA8", bg: "#F0F5FA" },
  packed:           { label: "Packed",           color: "#7B5EA7", bg: "#F5F0FA" },
  shipped:          { label: "Shipped",          color: "#2B7A52", bg: "#EDFAF4" },
  out_for_delivery: { label: "Out for Delivery", color: "#2962A0", bg: "#EEF5FF" },
  delivered:        { label: "Delivered",        color: "#1A6B3A", bg: "#E8F8EE" },
  cancelled:        { label: "Cancelled",        color: "#CC3333", bg: "#FFF0F0" },
  returned:         { label: "Returned",         color: "#996633", bg: "#FFF8EE" },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:            { label: "Pending",        color: "#B38F5F", bg: "#FDF8F0" },
  paid:               { label: "Paid",           color: "#1A6B3A", bg: "#E8F8EE" },
  failed:             { label: "Failed",         color: "#CC3333", bg: "#FFF0F0" },
  refunded:           { label: "Refunded",       color: "#7B5EA7", bg: "#F5F0FA" },
  partially_refunded: { label: "Partial Refund", color: "#996633", bg: "#FFF8EE" },
};

const FULFILLMENT_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatPrice = (n: number) =>
  "Rs." + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

function StatusBadge({ status, type = "fulfillment" }: { status: string; type?: "fulfillment" | "payment" }) {
  const cfg = (type === "payment" ? PAYMENT_CONFIG : STATUS_CONFIG)[status] ?? { label: status, color: "#888", bg: "#F4F4F4" };
  return (
    <span style={{ color: cfg.color, background: cfg.bg }}
      className="text-[7px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 rounded whitespace-nowrap">
      {cfg.label}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await api.get<OrderStats>("/api/v1/orders/admin/stats");
      setStats((Array.isArray(data) ? data[0] : data) as OrderStats);
    } catch { /* non-fatal */ }
    finally { setStatsLoading(false); }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), sort });
      if (statusFilter) params.set("status", statusFilter);
      if (paymentStatusFilter) params.set("paymentStatus", paymentStatusFilter);
      if (search) params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const data = await api.get<AdminOrdersResult>(`/api/v1/orders/admin?${params}`);
      const result = (Array.isArray(data) ? { orders: data, total: data.length, page: 1, limit: LIMIT, totalPages: 1 } : data) as AdminOrdersResult;
      setOrders(result.orders ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, sort, statusFilter, paymentStatusFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadStats(); }, 0);
    return () => clearTimeout(timer);
  }, [loadStats]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadOrders(); }, 0);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handleExport = async () => {
    const params = new URLSearchParams({ sort });
    if (statusFilter) params.set("status", statusFilter);
    if (paymentStatusFilter) params.set("paymentStatus", paymentStatusFilter);
    if (search) params.set("search", search);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    window.open(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/v1/orders/admin/export?${params}`, "_blank");
  };

  const handleStatusUpdated = () => {
    void loadOrders();
    void loadStats();
  };

  // Summary stat cards
  const statCards = [
    { label: "Total", value: stats?.total ?? 0, color: "#111" },
    { label: "Pending", value: stats?.pending ?? 0, color: "#B38F5F" },
    { label: "Processing", value: stats?.processing ?? 0, color: "#4A7FA8" },
    { label: "Shipped", value: stats?.shipped ?? 0, color: "#2B7A52" },
    { label: "Delivered", value: stats?.delivered ?? 0, color: "#1A6B3A" },
    { label: "Cancelled", value: stats?.cancelled ?? 0, color: "#CC3333" },
  ];

  const from = (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">

        {/* ─── Sticky Page Header ─────────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-[#FDFBF7] border-b border-neutral-200/70 px-8 py-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-[#B38F5F] font-bold mb-1.5">
              Order Management
            </p>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-widest text-[#111111]">
              Orders
            </h1>
            <p className="text-[11px] text-neutral-500 mt-1 tracking-wide">
              Track, manage, and fulfill customer orders.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="shrink-0 text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2.5 border border-neutral-300 text-neutral-600 rounded hover:border-neutral-500 hover:text-[#111] transition-all"
          >
            Export CSV ↓
          </button>
        </div>

        <div className="flex-1 px-8 py-6 space-y-6">

          {/* ─── Summary Cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {statCards.map((card) => (
              <div key={card.label}
                onClick={() => { setStatusFilter(card.label === "Total" ? "" : card.label.toLowerCase().replace(" ", "_")); setPage(1); }}
                className="bg-white border border-neutral-100 rounded p-4 cursor-pointer hover:border-neutral-300 transition-colors text-center group">
                {statsLoading ? (
                  <div className="h-6 w-10 mx-auto bg-neutral-100 animate-pulse rounded mb-1" />
                ) : (
                  <p className="font-serif text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
                )}
                <p className="text-[8px] uppercase tracking-[0.2em] text-neutral-400 font-bold mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* ─── Filters Row ──────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex-1 min-w-48 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search order #, customer, email…"
                className="w-full text-xs px-3 py-2.5 pl-8 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F] transition-colors"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">⌕</span>
            </div>

            {/* Payment Status */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
              className="text-xs px-3 py-2.5 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]"
            >
              <option value="">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="text-xs px-3 py-2.5 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="total_desc">Total: High → Low</option>
              <option value="total_asc">Total: Low → High</option>
            </select>

            {/* Date From */}
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="text-xs px-3 py-2.5 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]" />
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="text-xs px-3 py-2.5 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]" />

            {/* Clear */}
            {(search || statusFilter || paymentStatusFilter || dateFrom || dateTo) && (
              <button onClick={() => {
                setSearch(""); setSearchInput(""); setStatusFilter(""); setPaymentStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(1);
              }} className="text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-400 hover:text-[#111] transition-colors px-2">
                Clear ✕
              </button>
            )}
          </div>

          {/* ─── Status Tabs ──────────────────────────────────────────── */}
          <div className="flex gap-0.5 overflow-x-auto pb-1 border-b border-neutral-100">
            {FULFILLMENT_TABS.map((tab) => (
              <button key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                className={`shrink-0 text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-2 rounded-t transition-all ${
                  statusFilter === tab.key
                    ? "text-[#B38F5F] border-b-2 border-[#B38F5F]"
                    : "text-neutral-400 hover:text-[#111]"
                }`}>
                {tab.label}
                {tab.key && stats && stats[tab.key as keyof OrderStats] !== undefined && (
                  <span className="ml-1 opacity-60">({stats[tab.key as keyof OrderStats]})</span>
                )}
              </button>
            ))}
          </div>

          {/* ─── Orders Table ─────────────────────────────────────────── */}
          <div className="bg-white border border-neutral-100 rounded overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_0.7fr_0.8fr_0.8fr_0.8fr] gap-4 px-5 py-3 border-b border-neutral-100 bg-neutral-50">
              {["Customer", "Order #", "Date", "Items / Total", "Payment", "Status"].map((h) => (
                <span key={h} className="text-[8px] uppercase tracking-[0.2em] text-neutral-400 font-bold">{h}</span>
              ))}
            </div>

            {/* Loading */}
            {loading && (
              <div className="space-y-px">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-16 bg-neutral-50 animate-pulse border-b border-neutral-100" />
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="p-8 text-center">
                <p className="text-red-600 text-sm">{error}</p>
                <button onClick={() => void loadOrders()} className="mt-3 text-[9px] uppercase tracking-[0.2em] font-bold text-neutral-500 hover:text-[#111]">
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && orders.length === 0 && (
              <div className="p-12 text-center">
                <p className="font-serif text-lg text-neutral-300 tracking-widest">No orders found</p>
                <p className="text-[10px] text-neutral-400 mt-2">Try adjusting your filters</p>
              </div>
            )}

            {/* Rows */}
            {!loading && !error && orders.map((order) => {
              const name = order.customerSnapshot?.name
                ?? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
              const email = order.customerSnapshot?.email ?? order.shippingAddress.email;

              return (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrderId(order._id)}
                  className="grid md:grid-cols-[1.5fr_1fr_0.7fr_0.8fr_0.8fr_0.8fr] grid-cols-1 gap-4 px-5 py-4 border-b border-neutral-50 hover:bg-neutral-50/60 cursor-pointer transition-colors group"
                >
                  {/* Customer */}
                  <div>
                    <p className="text-[12px] font-semibold text-[#111] truncate">{name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{email}</p>
                  </div>

                  {/* Order # */}
                  <div className="flex items-center">
                    <span className="font-mono text-[11px] text-[#B38F5F] font-bold">{order.orderNumber ?? "—"}</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center">
                    <span className="text-[10px] text-neutral-500">{formatDate(order.createdAt)}</span>
                  </div>

                  {/* Items / Total */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[12px] font-bold text-[#111]">{formatPrice(order.pricing.total)}</span>
                    <span className="text-[10px] text-neutral-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Payment */}
                  <div className="flex items-center">
                    <StatusBadge status={order.payment.status} type="payment" />
                  </div>

                  {/* Fulfillment */}
                  <div className="flex items-center">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Pagination ───────────────────────────────────────────── */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-neutral-400">
                Showing {from}–{to} of {total} orders
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 border border-neutral-200 rounded hover:border-neutral-400 disabled:opacity-30 transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 7) { p = i + 1; }
                  else if (page <= 4) { p = i + 1; }
                  else if (page >= totalPages - 3) { p = totalPages - 6 + i; }
                  else { p = page - 3 + i; }
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`text-[9px] w-7 h-7 rounded border transition-colors font-bold ${
                        p === page ? "bg-[#111] text-white border-[#111]" : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                      }`}>
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 border border-neutral-200 rounded hover:border-neutral-400 disabled:opacity-30 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── Order Drawer ─────────────────────────────────────────────────── */}
      <OrderDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onStatusUpdated={handleStatusUpdated}
      />
    </AdminLayout>
  );
}
