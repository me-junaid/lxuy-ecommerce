"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Invalid administrative credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs uppercase tracking-[0.25em] text-[#B38F5F] font-bold"
        >
          Verifying session...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-[#FDFBF7] relative overflow-hidden select-none">
      
      {/* Soft Ambient Gold Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#B38F5F]/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md space-y-8 bg-white border border-neutral-200/80 p-8 md:p-10 shadow-xl z-10 rounded-lg"
      >
        <div className="text-center space-y-2">
          <span className="font-serif text-3xl font-semibold tracking-[0.3em] text-[#111111] select-none block">
            LXUY
          </span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#B38F5F] font-bold block">
            Administrative Portal
          </span>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-400">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@lxuy.com"
              className="w-full bg-neutral-50/50 border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] focus:bg-white text-sm p-3 outline-none rounded transition-all duration-300"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-50/50 border border-neutral-200 text-[#111111] placeholder-neutral-400 focus:border-[#B38F5F] focus:bg-white text-sm p-3 outline-none rounded transition-all duration-300"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            className="w-full py-3 h-12 uppercase text-[10px] font-bold tracking-[0.25em] bg-[#B38F5F] hover:bg-[#9c7b50] text-white border-none rounded transition-all duration-300 mt-2"
          >
            {isSubmitting ? "Verifying..." : "Access Dashboard"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
