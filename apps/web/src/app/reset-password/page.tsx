"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Input, Button, Header, Footer } from "@repo/ui";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Reset token is missing. Please request a new link.");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Reset token is missing. Please request a new link.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Client-side complexity checks matching registration
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    const regex = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
    if (!regex.test(password)) {
      setError(
        "Password is too weak. Must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character."
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/api/v1/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      setSubmitted(true);
      
      // Auto redirect to login with query param after 3 seconds
      setTimeout(() => {
        router.push("/login?reset_status=success");
      }, 3000);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; message?: string };
      setError(
        apiErr?.data?.message ||
        apiErr?.message ||
        "Failed to reset password. The link may have expired or is invalid."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-md bg-white border border-neutral-100 p-8 md:p-12"
    >
      <div className="mb-10 text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-luxury-gold mb-3 block">
          LXUY SECURITY
        </span>
        <h1 className="text-3xl font-serif tracking-normal mb-2 text-luxury-dark">
          New Password
        </h1>
        <p className="text-xs text-neutral-500 font-light tracking-wide max-w-xs mx-auto">
          Create a new, strong password to secure your account.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-md font-serif text-luxury-dark mb-2">Password Reset Successful</h3>
            <p className="text-xs text-neutral-500 font-light leading-relaxed mb-4">
              Your password has been reset successfully. Redirecting you to sign in...
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs tracking-wider uppercase font-medium border-l border-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => {
                    const active = e.getModifierState("CapsLock");
                    setCapsLockActive(active);
                  }}
                  onKeyDown={(e) => {
                    const active = e.getModifierState("CapsLock");
                    setCapsLockActive(active);
                  }}
                  autoComplete="new-password"
                  className="pr-16"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-luxury-gold transition-colors font-semibold"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
                {capsLockActive && (
                  <p className="absolute bottom-[-16px] left-0.5 text-[9px] text-amber-600 uppercase tracking-widest font-semibold">
                    ⚠️ Caps Lock is active
                  </p>
                )}
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-16"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3.5"
                  disabled={isSubmitting || !token}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 text-luxury-gold" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Updating Password…
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
      <Header
        onLogoClick={() => router.push("/")}
        onCartClick={() => router.push("/cart")}
        onProfileClick={() => router.push("/profile")}
        onSearchClick={() => {}}
      />

      <main className="flex-1 flex items-center justify-center p-8 md:p-16">
        <Suspense
          fallback={
            <div className="text-sm uppercase tracking-[0.25em] text-luxury-gold">
              Loading...
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
