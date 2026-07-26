"use client";

import React, { useState } from "react";
import { Input, Button, Header, Footer } from "@repo/ui";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/api/v1/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; message?: string };
      setError(
        apiErr?.data?.message ||
        apiErr?.message ||
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7]">
      <Header
        onLogoClick={() => router.push("/")}
        onCartClick={() => router.push("/cart")}
        onProfileClick={() => router.push("/profile")}
        onSearchClick={() => {}}
      />

      <main className="flex-1 flex items-center justify-center p-8 md:p-16">
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
              Reset Password
            </h1>
            <p className="text-xs text-neutral-500 font-light tracking-wide max-w-xs mx-auto">
              Enter the email address associated with your account, and we will send you a secure link to reset your password.
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
                <p className="text-sm text-neutral-600 font-light leading-relaxed mb-8">
                  If this email is registered, we have sent a secure password reset link to your inbox. Please check your spam folder if it doesn&apos;t arrive shortly.
                </p>
                <Link
                  href="/login"
                  className="inline-block text-xs uppercase tracking-wider font-semibold text-luxury-gold hover:text-luxury-dark transition-colors"
                >
                  Return to Sign In
                </Link>
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
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-3.5"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending Link…" : "Send Reset Link"}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 text-center text-xs tracking-wider uppercase font-medium text-neutral-500">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="text-luxury-dark hover:text-luxury-gold transition-colors font-bold underline underline-offset-4"
                  >
                    Sign In
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
