"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { Button } from "@repo/ui";
import AdminLayout from "../../components/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import CategoryDrawer, { CategoryData } from "../../components/CategoryDrawer";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

const statusBadge = (s: string) => {
  if (s === "active") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (s === "inactive") return "text-neutral-600 bg-neutral-100 border-neutral-200";
  return "text-amber-700 bg-amber-50 border-amber-200";
};

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded border shadow-lg min-w-[240px] max-w-sm ${
              t.type === "success"
                ? "bg-[#FDFBF7] border-neutral-200 text-[#111111]"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {t.type === "success" ? (
              <svg className="w-4 h-4 text-[#B38F5F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            )}
            <span className="text-xs font-semibold flex-1">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Three-dot Menu ───────────────────────────────────────────────────────────

function RowMenu({
  category,
  isOpen,
  onToggle,
  onEdit,
  onToggleStatus,
  onArchive,
  onDelete,
}: {
  category: CategoryData;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle("");
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isOpen, onToggle]);

  const isArchived = category.status === "archived";
  const isActive = category.status === "active";

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onToggle(isOpen ? "" : (category._id || ""))}
        className="w-7 h-7 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus:outline-none"
        aria-label="Row actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-8 w-44 bg-[#FDFBF7] border border-neutral-200 rounded shadow-lg z-20 py-1 overflow-hidden"
          >
            <button
              onClick={() => { onEdit(); onToggle(""); }}
              className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Edit Details
            </button>
            {!isArchived && (
              <button
                onClick={() => { onToggleStatus(); onToggle(""); }}
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {isActive ? "Deactivate" : "Activate"}
              </button>
            )}
            {!isArchived ? (
              <button
                onClick={() => { onArchive(); onToggle(""); }}
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-50 transition-colors"
              >
                Archive Category
              </button>
            ) : (
              <button
                onClick={() => { onToggleStatus(); onToggle(""); }}
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                Restore to Active
              </button>
            )}
            <button
              onClick={() => { onDelete(); onToggle(""); }}
              className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete Category
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");

  const [drawerCategory, setDrawerCategory] = useState<CategoryData | null | undefined>(undefined);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/categories/admin");
      setCategories(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        loadCategories();
      }, 0);
    }
  }, [user, loadCategories]);

  const showToast = useCallback((payload: { message: string; type: "success" | "error" }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...payload }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Status toggle
  const handleToggleStatus = async (cat: CategoryData) => {
    if (!cat._id) return;
    const nextStatus = cat.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/api/v1/categories/${cat._id}`, { status: nextStatus, isActive: nextStatus === "active" });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, status: nextStatus, isActive: nextStatus === "active" } : c))
      );
      showToast({ message: `Category "${cat.name}" is now ${nextStatus}.`, type: "success" });
    } catch {
      showToast({ message: "Failed to update category status.", type: "error" });
    }
  };

  // Archive
  const handleArchive = async (cat: CategoryData) => {
    if (!cat._id) return;
    try {
      await api.patch(`/api/v1/categories/${cat._id}`, { status: "archived", isActive: false });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, status: "archived", isActive: false } : c))
      );
      showToast({ message: `Category "${cat.name}" archived.`, type: "success" });
    } catch {
      showToast({ message: "Failed to archive category.", type: "error" });
    }
  };

  // Permanent Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget?._id) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/categories/${deleteTarget._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      showToast({ message: `Category "${deleteTarget.name}" deleted.`, type: "success" });
      setDeleteTarget(null);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      showToast({ message: apiErr?.data?.message || "Failed to delete category.", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered list
  const filteredCategories = categories.filter((c) => {
    const q = searchVal.toLowerCase();
    const matchesQuery = c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const isDrawerOpen = drawerCategory !== undefined;

  return (
    <AdminLayout>
      <main className="flex-1 px-8 md:px-12 pb-8 md:pb-12 text-left overflow-x-hidden selection:bg-[#B38F5F]/15 selection:text-[#B38F5F]">
        
        {/* Sticky Header Section */}
        <div className="sticky top-0 bg-[#FDFBF7] z-30 -mx-8 px-8 md:-mx-12 md:px-12 pt-8 md:pt-12 pb-6 space-y-5 border-b border-neutral-200/60">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <h1 className="font-serif text-3xl font-light text-[#111111] leading-tight">
                Categories
              </h1>
              <p className="text-[11px] uppercase tracking-widest text-[#B38F5F] mt-1.5 font-bold">
                Organize products into categories, departments, and curated collections.
              </p>
            </div>
            <Button
              onClick={() => setDrawerCategory(null)}
              variant="primary"
              className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] bg-[#B38F5F] hover:bg-[#9c7b50] text-white border-none rounded transition-all duration-300 shrink-0"
            >
              + New Category
            </Button>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-md w-full relative">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search categories by name or slug…"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-white border border-neutral-200 focus:border-[#B38F5F] text-xs pl-10 pr-4 py-2.5 outline-none rounded text-[#111111] placeholder-neutral-400 transition-all duration-300 shadow-sm"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 bg-neutral-100/70 p-1 rounded border border-neutral-200/60 self-start sm:self-auto shrink-0">
              {(["all", "active", "inactive", "archived"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
                    statusFilter === st
                      ? "bg-white text-[#111111] shadow-xs"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="mt-6">
          {loading ? (
            <div className="py-32 text-center text-[10px] uppercase tracking-[0.25em] text-[#B38F5F] font-bold animate-pulse">
              Loading categories catalog…
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-32 text-center border border-dashed border-neutral-200 rounded-lg">
              <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-bold">
                {searchVal ? "No matching categories found" : "No categories added yet"}
              </p>
              {!searchVal && (
                <button
                  onClick={() => setDrawerCategory(null)}
                  className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#B38F5F] hover:text-[#9c7b50] transition-colors"
                >
                  + Create your first category
                </button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto border border-neutral-200/80 rounded-lg shadow-sm bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold bg-neutral-50/60">
                    <th className="p-4 pl-5">Category</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Hierarchy</th>
                    <th className="p-4">Products</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <AnimatePresence>
                    {filteredCategories.map((c) => {
                      const parentName =
                        c.parent && typeof c.parent === "object"
                          ? c.parent.name
                          : c.parent
                          ? String(c.parent)
                          : null;

                      return (
                        <motion.tr
                          key={c._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setDrawerCategory(c)}
                          className="cursor-pointer hover:bg-neutral-50/70 transition-colors group"
                        >
                          {/* Category Info */}
                          <td className="p-4 pl-5">
                            <div className="flex items-center gap-3.5">
                              {c.image ? (
                                <div className="w-10 h-12 rounded border border-neutral-200/80 overflow-hidden bg-white shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-12 rounded border border-neutral-200 bg-neutral-100 shrink-0 flex items-center justify-center font-serif text-sm font-bold text-neutral-400">
                                  {c.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-serif font-light text-[#111111] text-sm leading-snug group-hover:text-[#B38F5F] transition-colors">
                                  {c.name}
                                </div>
                                {c.description && (
                                  <p className="text-[10px] text-neutral-400 line-clamp-1 max-w-sm mt-0.5">
                                    {c.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="p-4 font-mono text-[11px] text-neutral-500">
                            {c.slug}
                          </td>

                          {/* Hierarchy */}
                          <td className="p-4 text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
                            {parentName ? (
                              <span className="text-[#B38F5F]">↳ {parentName}</span>
                            ) : (
                              <span className="text-neutral-400">Root Collection</span>
                            )}
                          </td>

                          {/* Products Count */}
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                              {c.productCount ?? 0} {c.productCount === 1 ? "Product" : "Products"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <span className={`text-[8px] font-bold uppercase tracking-widest border rounded px-2 py-1 ${statusBadge(c.status)}`}>
                              {c.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4 pr-5 text-right">
                            <RowMenu
                              category={c}
                              isOpen={openMenuId === c._id}
                              onToggle={(id) => setOpenMenuId(id || null)}
                              onEdit={() => setDrawerCategory(c)}
                              onToggleStatus={() => handleToggleStatus(c)}
                              onArchive={() => handleArchive(c)}
                              onDelete={() => setDeleteTarget(c)}
                            />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Category Create/Edit Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <CategoryDrawer
            category={drawerCategory}
            allCategories={categories}
            onClose={() => setDrawerCategory(undefined)}
            onSaved={() => {
              loadCategories();
            }}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation / Protection Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            >
              <div className="bg-[#FDFBF7] border border-neutral-200 rounded-lg shadow-2xl w-full max-w-md p-6 space-y-4">
                {(deleteTarget.productCount ?? 0) > 0 ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-light text-[#111111]">
                        Cannot delete assigned category
                      </h3>
                      <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                        This category is currently assigned to <strong className="font-semibold">{deleteTarget.productCount} product{deleteTarget.productCount !== 1 ? "s" : ""}</strong>.
                        To preserve product taxonomy and customer navigation, please archive the category or reassign its products first.
                      </p>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={() => setDeleteTarget(null)}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 border border-neutral-200 rounded hover:border-neutral-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleArchive(deleteTarget);
                          setDeleteTarget(null);
                        }}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
                      >
                        Archive Category Instead
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-serif text-lg font-light text-[#111111]">
                        Delete &ldquo;{deleteTarget.name}&rdquo;?
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                        This category has 0 assigned products. Permanent deletion cannot be undone.
                      </p>
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={() => setDeleteTarget(null)}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 border border-neutral-200 rounded hover:border-neutral-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-40"
                      >
                        {deleting ? "Deleting…" : "Delete Permanently"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AdminLayout>
  );
}
