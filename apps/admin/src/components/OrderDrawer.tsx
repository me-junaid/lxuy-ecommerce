"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";

interface OrderItem {
  sku: string;
  name: string;
  brand?: string;
  image?: string;
  variantLabel?: string;
  price: number;
  discount: number;
  quantity: number;
}

interface OrderAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface OrderPricing {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
}

interface OrderPayment {
  method: string;
  status: string;
  transactionId?: string;
  paidAt?: string;
  refundAmount?: number;
  refundReason?: string;
  refundId?: string;
  refundedAt?: string;
}

interface OrderFulfillment {
  shippingProvider?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

interface StatusHistoryEntry {
  status: string;
  note?: string;
  updatedBy?: string;
  updatedAt: string;
}

interface OrderNote {
  content: string;
  createdBy?: string;
  createdAt: string;
}

interface CustomerSnapshot {
  name: string;
  email: string;
  phone?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerSnapshot?: CustomerSnapshot;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  items: OrderItem[];
  pricing: OrderPricing;
  payment: OrderPayment;
  couponCode?: string;
  fulfillment: OrderFulfillment;
  statusHistory: StatusHistoryEntry[];
  notes: OrderNote[];
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

interface OrderDrawerProps {
  orderId: string | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

const FULFILLMENT_STATUSES = [
  "pending","confirmed","processing","packed",
  "shipped","out_for_delivery","delivered","cancelled","returned",
] as const;

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

const formatPrice = (n: number) =>
  "Rs." + n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function StatusBadge({ status, type = "fulfillment" }: { status: string; type?: "fulfillment" | "payment" }) {
  const cfg = (type === "payment" ? PAYMENT_CONFIG : STATUS_CONFIG)[status] ?? { label: status, color: "#888", bg: "#F4F4F4" };
  return (
    <span style={{ color: cfg.color, background: cfg.bg }}
      className="text-[8px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 rounded">
      {cfg.label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-7 py-5">
      {title && <h3 className="text-[9px] uppercase tracking-[0.25em] font-bold text-neutral-400 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-bold">{label}</p>
      <div className="text-[12px] text-[#111] font-medium mt-0.5">{value ?? "—"}</div>
    </div>
  );
}

function PricingRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[11px] ${accent ? "text-[#B38F5F]" : "text-neutral-500"}`}>{label}</span>
      <span className={`text-[12px] font-medium ${accent ? "text-[#B38F5F]" : "text-[#111]"}`}>{value}</span>
    </div>
  );
}

export default function OrderDrawer({ orderId, onClose, onStatusUpdated }: OrderDrawerProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingProvider, setShippingProvider] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) {
      const timer = setTimeout(() => setOrder(null), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      api.get<Order>(`/api/v1/orders/admin/${orderId}`)
        .then((data) => {
          const o = (Array.isArray(data) ? data[0] : data) as Order;
          setOrder(o);
          setNewStatus(o.status);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;
    setStatusLoading(true);
    try {
      const updated = await api.patch<Order>(`/api/v1/orders/admin/${order._id}/status`, {
        status: newStatus,
        note: statusNote || undefined,
        trackingNumber: trackingNumber || undefined,
        shippingProvider: shippingProvider || undefined,
      });
      setOrder((Array.isArray(updated) ? updated[0] : updated) as Order);
      setStatusModal(false);
      setStatusNote(""); setTrackingNumber(""); setShippingProvider("");
      onStatusUpdated?.();
    } catch (e: unknown) { alert((e as Error).message); }
    finally { setStatusLoading(false); }
  };

  const handleAddNote = async () => {
    if (!order || !noteContent.trim()) return;
    setNoteLoading(true);
    try {
      const updated = await api.post<Order>(`/api/v1/orders/admin/${order._id}/notes`, { content: noteContent });
      setOrder((Array.isArray(updated) ? updated[0] : updated) as Order);
      setNoteContent("");
    } catch (e: unknown) { alert((e as Error).message); }
    finally { setNoteLoading(false); }
  };

  const handleCancel = async () => {
    if (!order || !cancelReason.trim()) return;
    setCancelLoading(true);
    try {
      const updated = await api.post<Order>(`/api/v1/orders/admin/${order._id}/cancel`, { reason: cancelReason });
      setOrder((Array.isArray(updated) ? updated[0] : updated) as Order);
      setCancelModal(false); setCancelReason("");
      onStatusUpdated?.();
    } catch (e: unknown) { alert((e as Error).message); }
    finally { setCancelLoading(false); }
  };

  const customerName = order?.customerSnapshot?.name
    ?? (order ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : "—");
  const customerEmail = order?.customerSnapshot?.email ?? order?.shippingAddress.email ?? "—";
  const customerPhone = order?.customerSnapshot?.phone ?? order?.shippingAddress.phone ?? "—";

  return (
    <AnimatePresence>
      {orderId && (
        <>
          <motion.div key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />
          <motion.div key="drawer" ref={drawerRef}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[#FDFBF7] shadow-2xl"
            style={{ width: "min(580px, 100vw)" }}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-neutral-200/70 px-7 py-5 flex items-start justify-between">
              <div>
                <p className="text-[8px] uppercase tracking-[0.25em] text-neutral-400 font-bold mb-1">Order Details</p>
                {loading ? (
                  <div className="h-5 w-32 bg-neutral-100 animate-pulse rounded" />
                ) : (
                  <h2 className="font-serif text-xl font-bold tracking-widest text-[#111]">{order?.orderNumber ?? "—"}</h2>
                )}
                {order && <p className="text-[10px] text-neutral-500 mt-1">Placed {formatDate(order.createdAt)}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {order && <><StatusBadge status={order.status} /><StatusBadge status={order.payment.status} type="payment" /></>}
                <button onClick={onClose}
                  className="ml-1 w-8 h-8 flex items-center justify-center rounded border border-neutral-200 text-neutral-400 hover:text-[#111] hover:border-neutral-400 transition-colors">
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="flex flex-col gap-4 p-7">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-neutral-100 animate-pulse rounded" />)}
                </div>
              )}
              {error && <div className="p-7 text-red-600 text-sm">Error: {error}</div>}
              {order && !loading && (
                <div className="divide-y divide-neutral-100">

                  {/* Status Timeline */}
                  <Section title="Status Timeline">
                    <div className="relative pl-4">
                      {[...order.statusHistory].reverse().map((entry, i) => {
                        const cfg = STATUS_CONFIG[entry.status] ?? { color: "#888", label: entry.status, bg: "#F4F4F4" };
                        return (
                          <div key={i} className="relative flex gap-4 pb-5">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: cfg.color }} />
                              {i < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-neutral-200 mt-1" />}
                            </div>
                            <div>
                              <span className="text-[9px] uppercase tracking-[0.15em] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                              <p className="text-[10px] text-neutral-500 mt-0.5">{formatDate(entry.updatedAt)}{entry.updatedBy && ` · ${entry.updatedBy}`}</p>
                              {entry.note && <p className="text-[11px] text-neutral-600 mt-0.5 italic">{entry.note}</p>}
                            </div>
                          </div>
                        );
                      })}
                      {order.statusHistory.length === 0 && <p className="text-[11px] text-neutral-400 italic">No status history.</p>}
                    </div>
                  </Section>

                  {/* Customer */}
                  <Section title="Customer">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Name" value={customerName} />
                      <InfoField label="Email" value={customerEmail} />
                      <InfoField label="Phone" value={customerPhone} />
                    </div>
                  </Section>

                  {/* Shipping Address */}
                  <Section title="Shipping Address">
                    <address className="not-italic text-[12px] text-neutral-600 leading-6">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                      {order.shippingAddress.street}{order.shippingAddress.apartment && `, ${order.shippingAddress.apartment}`}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.zip}<br />
                      {order.shippingAddress.country}
                    </address>
                  </Section>

                  {/* Items */}
                  <Section title={`Items (${order.items.length})`}>
                    <div className="space-y-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-neutral-50 rounded border border-neutral-100">
                          {item.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded shrink-0" />
                          ) : (
                            <div className="w-14 h-14 bg-neutral-200 rounded shrink-0 flex items-center justify-center text-neutral-400 text-[9px]">IMG</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{item.brand ?? item.sku}</p>
                            <p className="text-[13px] font-semibold text-[#111] leading-tight truncate">{item.name}</p>
                            {item.variantLabel && <p className="text-[10px] text-neutral-500 mt-0.5">{item.variantLabel}</p>}
                            <p className="text-[10px] text-neutral-400 mt-0.5">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[12px] font-bold text-[#111]">{formatPrice(item.price * item.quantity)}</p>
                            <p className="text-[10px] text-neutral-400">{formatPrice(item.price)} × {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* Pricing */}
                  <Section title="Pricing">
                    <div className="space-y-2">
                      <PricingRow label="Subtotal" value={formatPrice(order.pricing.subtotal)} />
                      {order.pricing.discount > 0 && (
                        <PricingRow label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                          value={`– ${formatPrice(order.pricing.discount)}`} accent />
                      )}
                      <PricingRow label="Shipping" value={order.pricing.shippingFee > 0 ? formatPrice(order.pricing.shippingFee) : "Free"} />
                      <PricingRow label="Tax (18% GST)" value={formatPrice(order.pricing.tax)} />
                      <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#111]">Total</span>
                        <span className="text-base font-bold text-[#111]">{formatPrice(order.pricing.total)}</span>
                      </div>
                    </div>
                  </Section>

                  {/* Payment */}
                  <Section title="Payment">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Method" value={order.payment.method.toUpperCase()} />
                      <InfoField label="Status" value={<StatusBadge status={order.payment.status} type="payment" />} />
                      {order.payment.transactionId && <InfoField label="Transaction ID" value={order.payment.transactionId} />}
                      {order.payment.paidAt && <InfoField label="Paid At" value={formatDate(order.payment.paidAt)} />}
                      {(order.payment.refundAmount ?? 0) > 0 && (
                        <>
                          <InfoField label="Refund Amount" value={formatPrice(order.payment.refundAmount!)} />
                          {order.payment.refundReason && <InfoField label="Refund Reason" value={order.payment.refundReason} />}
                          {order.payment.refundedAt && <InfoField label="Refunded At" value={formatDate(order.payment.refundedAt)} />}
                        </>
                      )}
                    </div>
                  </Section>

                  {/* Fulfillment */}
                  <Section title="Shipping & Tracking">
                    {(order.fulfillment?.trackingNumber || order.fulfillment?.shippingProvider) ? (
                      <div className="grid grid-cols-2 gap-3">
                        {order.fulfillment.shippingProvider && <InfoField label="Carrier" value={order.fulfillment.shippingProvider} />}
                        {order.fulfillment.trackingNumber && <InfoField label="Tracking #" value={order.fulfillment.trackingNumber} />}
                        {order.fulfillment.estimatedDelivery && (
                          <InfoField label="Est. Delivery" value={new Date(order.fulfillment.estimatedDelivery).toLocaleDateString("en-IN")} />
                        )}
                        {order.fulfillment.trackingUrl && (
                          <div className="col-span-2">
                            <a href={order.fulfillment.trackingUrl} target="_blank" rel="noreferrer"
                              className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#B38F5F] hover:underline">
                              Track Shipment →
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-400 italic">No tracking information yet.</p>
                    )}
                  </Section>

                  {/* Update Status */}
                  <Section title="Update Status">
                    {!statusModal ? (
                      <button onClick={() => setStatusModal(true)}
                        className="text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2.5 bg-[#111] text-white rounded hover:bg-neutral-800 transition-colors">
                        Change Status
                      </button>
                    ) : (
                      <div className="space-y-3 p-4 bg-neutral-50 rounded border border-neutral-200">
                        <div>
                          <label className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-1.5">New Status</label>
                          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]">
                            {FULFILLMENT_STATUSES.map((s) => (
                              <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                            ))}
                          </select>
                        </div>
                        {["shipped","out_for_delivery"].includes(newStatus) && (
                          <>
                            <div>
                              <label className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-1.5">Carrier</label>
                              <input type="text" value={shippingProvider} onChange={(e) => setShippingProvider(e.target.value)}
                                placeholder="e.g. Delhivery, BlueDart"
                                className="w-full text-xs px-3 py-2 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]" />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-1.5">Tracking Number</label>
                              <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="e.g. DL1234567890"
                                className="w-full text-xs px-3 py-2 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]" />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-1.5">Note (optional)</label>
                          <input type="text" value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Internal note about this status change"
                            className="w-full text-xs px-3 py-2 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleStatusUpdate} disabled={statusLoading || newStatus === order.status}
                            className="flex-1 text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-2 bg-[#111] text-white rounded hover:bg-neutral-800 transition-colors disabled:opacity-40">
                            {statusLoading ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setStatusModal(false)}
                            className="text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-2 border border-neutral-200 rounded text-neutral-600 hover:border-neutral-400 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </Section>

                  {/* Notes */}
                  <Section title="Internal Notes">
                    <div className="space-y-3">
                      {order.notes.length > 0 ? (
                        <div className="space-y-2">
                          {[...order.notes].reverse().map((note, i) => (
                            <div key={i} className="p-3 bg-amber-50/60 border border-amber-100 rounded">
                              <p className="text-[12px] text-neutral-700">{note.content}</p>
                              <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-wider">{note.createdBy} · {formatDate(note.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-neutral-400 italic">No notes yet.</p>
                      )}
                      <div className="flex gap-2">
                        <input type="text" value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !noteLoading && handleAddNote()}
                          placeholder="Add an internal note…"
                          className="flex-1 text-xs px-3 py-2 border border-neutral-200 bg-white rounded focus:outline-none focus:border-[#B38F5F]" />
                        <button onClick={handleAddNote} disabled={noteLoading || !noteContent.trim()}
                          className="text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-2 bg-[#111] text-white rounded hover:bg-neutral-800 transition-colors disabled:opacity-40">
                          {noteLoading ? "…" : "Add"}
                        </button>
                      </div>
                    </div>
                  </Section>

                  {/* Cancel */}
                  {!["delivered","cancelled","returned"].includes(order.status) && (
                    <Section title="">
                      {!cancelModal ? (
                        <button onClick={() => setCancelModal(true)}
                          className="text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2.5 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors">
                          Cancel Order
                        </button>
                      ) : (
                        <div className="space-y-3 p-4 bg-red-50/40 rounded border border-red-200">
                          <p className="text-[11px] text-red-700 font-semibold">Are you sure you want to cancel this order?</p>
                          <div>
                            <label className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-1.5">Cancellation Reason</label>
                            <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="e.g. Customer requested cancellation"
                              className="w-full text-xs px-3 py-2 border border-red-200 bg-white rounded focus:outline-none focus:border-red-400" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleCancel} disabled={cancelLoading || !cancelReason.trim()}
                              className="flex-1 text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-40">
                              {cancelLoading ? "Cancelling…" : "Yes, Cancel"}
                            </button>
                            <button onClick={() => { setCancelModal(false); setCancelReason(""); }}
                              className="text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-2 border border-neutral-200 rounded text-neutral-600 hover:border-neutral-400 transition-colors">
                              Keep Order
                            </button>
                          </div>
                        </div>
                      )}
                    </Section>
                  )}

                  <div className="h-16" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
