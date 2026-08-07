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
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs uppercase tracking-luxury text-neutral-400 font-semibold"
        >
          Verifying session...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-[#FDFBF7] relative select-none">
      <div className="w-full max-w-md space-y-8 bg-[#FDFBF7] border border-luxury-silver/30 p-8 md:p-10 shadow-xl">
        <div className="text-center space-y-2">
          <span className="font-serif text-3xl font-semibold tracking-[0.3em] text-luxury-dark select-none block">
            LXUY
          </span>
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">
            Administrative Portal
          </span>
        </div>

        {error && (
          <div className="p-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. manager@lxuy.com"
              className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-sm p-3 outline-none transition-colors duration-300"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-luxury font-semibold text-neutral-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border border-neutral-300 focus:border-luxury-dark text-sm p-3 outline-none transition-colors duration-300"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            className="w-full py-3 h-12 uppercase text-xs font-bold tracking-widest"
          >
            {isSubmitting ? "Verifying..." : "Access Dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}
