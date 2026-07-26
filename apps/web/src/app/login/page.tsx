"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import { Input, Button, Header, Footer } from "@repo/ui";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

function LoginPageContent() {
  const { login, user, isAuthenticated, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [infoType, setInfoType] = useState<"success" | "error" | "info" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set message based on verification query params or social login query params
  useEffect(() => {
    const verified = searchParams.get("verified");
    const reason = searchParams.get("reason");
    const socialLogin = searchParams.get("social_login");

    if (socialLogin === "success") {
      setInfoType("success");
      setInfoMessage("Signed in successfully. Redirecting you to your account...");
      if (typeof window !== "undefined") {
        localStorage.setItem("lxuy_logged_in", "true");
      }
      refreshUser().then(() => {
        router.replace("/profile");
      });
    } else if (socialLogin === "error") {
      setInfoType("error");
      if (reason === "missing_code") {
        setInfoMessage("Google authorization code was missing.");
      } else {
        setInfoMessage("Failed to authenticate with Google. Please try again.");
      }
    } else if (verified === "true") {
      setInfoType("success");
      setInfoMessage("Your email address has been verified successfully. Please sign in.");
    } else if (verified === "false") {
      if (reason === "expired") {
        setInfoType("error");
        setInfoMessage("This verification link has expired. Please sign in and request a new link.");
      } else if (reason === "already_verified") {
        setInfoType("info");
        setInfoMessage("Your email address is already verified. You can sign in.");
      } else if (reason === "missing_token") {
        setInfoType("error");
        setInfoMessage("The email verification link is missing the token.");
      } else {
        setInfoType("error");
        setInfoMessage("This verification link is invalid or unrecognized.");
      }
    } else if (searchParams.get("reset_status") === "success") {
      setInfoType("success");
      setInfoMessage("Your password has been successfully reset. Please sign in with your new password.");
    } else if (searchParams.get("reset_status") === "error") {
      const resetReason = searchParams.get("reason");
      setInfoType("error");
      if (resetReason === "expired" || resetReason === "invalid_token") {
        setInfoMessage("The password reset link is invalid or has expired. Please request a new one.");
      } else if (resetReason === "missing_token") {
        setInfoMessage("The password reset link is missing the required token.");
      } else {
        setInfoMessage("Failed to reset password. Please try requesting a new link.");
      }
    }
  }, [searchParams, router, refreshUser]);

  // Wait until session restore is done before deciding to redirect.
  // Without the !loading guard, isAuthenticated is briefly false on every
  // page load even for logged-in users, causing the form to flash.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/profile");
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace("/profile");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; message?: string };
      setError(
        apiErr?.data?.message ||
        apiErr?.message ||
        "Invalid credentials. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading skeleton while session is being restored so we don't flash
  // the form to a user who is already logged in.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header
        brandName="LXUY"
        cartCount={0}
        user={user}
        onLogoClick={() => router.push("/")}
        onCartClick={() => router.push("/cart")}
        onProfileClick={() => router.push(isAuthenticated ? "/profile" : "/login")}
        onSearchClick={() => { }}
      />

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-110px)]">
        {/* Left Side: Luxury Editorial Image (Hidden on Mobile) */}
        <div className="relative hidden md:block bg-luxury-charcoal overflow-hidden group">
          <Image
            src="/images/models/modules5.jpeg"
            alt="LXUY Editorial Model"
            fill
            priority
            sizes="50vw"
            className="object-cover object-center grayscale contrast-110 transition-transform duration-10000 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 transition-opacity duration-700" />
          <div className="absolute inset-0 flex flex-col justify-end p-16 z-10 text-[#FDFBF7]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-md"
            >
              <span className="text-xs uppercase tracking-[0.25em] text-luxury-gold mb-3 block">
                LXUY
              </span>
              <h2 className="text-4xl font-serif tracking-normal leading-tight mb-4">
                &ldquo;Simplicity is the ultimate sophistication.&rdquo;
              </h2>
              <p className="text-sm font-light text-neutral-300 tracking-wide">
                Welcome back to your personal sanctuary of style. Experience curated
                collections tailored to your lifestyle.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex items-center justify-center p-8 md:p-16 bg-[#FDFBF7]">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-serif tracking-normal mb-2 text-luxury-dark">
                Sign In
              </h1>
              <p className="text-sm text-neutral-500 font-light tracking-wide">
                Enter your details to access your account.
              </p>
            </div>

            {/* Google OAuth Quick Sign In */}
            <div className="mb-6">
              <a
                href="/api/v1/auth/google"
                className="flex items-center justify-center gap-3 w-full border border-neutral-200 bg-white hover:bg-neutral-50 px-4 py-3.5 text-xs uppercase tracking-[0.2em] font-medium text-neutral-700 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8.01 12.5a5.99 5.99 0 0 1 5.981-6.014c1.55 0 2.902.59 3.93 1.567l3.076-3.076C19.167 3.2 16.71 2 13.99 2 8.47 2 4 6.47 4 12s4.47 10 9.99 10c5.77 0 9.87-4.06 9.87-10 0-.68-.06-1.33-.17-1.715H12.24Z"
                  />
                </svg>
                Continue with Google
              </a>
            </div>

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-neutral-100"></div>
              <span className="px-3 text-[10px] uppercase tracking-[0.2em] text-neutral-400">or continue with email</span>
              <div className="flex-1 border-t border-neutral-100"></div>
            </div>

            <AnimatePresence mode="wait">
              {infoMessage && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mb-6 p-4 text-xs tracking-wider uppercase font-medium border-l ${
                    infoType === "success"
                      ? "bg-green-50 text-green-700 border-green-500"
                      : infoType === "info"
                      ? "bg-blue-50 text-blue-700 border-blue-500"
                      : "bg-red-50 text-red-600 border-red-500"
                  }`}
                >
                  {infoMessage}
                </motion.div>
              )}

              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 text-red-600 text-xs tracking-wider uppercase font-medium border-l border-red-500"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-between text-xs tracking-wider uppercase font-medium text-neutral-500 py-1">
                <Link
                  href="/forgot-password"
                  className="hover:text-luxury-gold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing In…" : "Sign In"}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center text-xs tracking-wider uppercase font-medium text-neutral-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-luxury-dark hover:text-luxury-gold transition-colors font-bold underline underline-offset-4"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
          <div className="text-sm uppercase tracking-[0.25em] text-luxury-gold">
            LXUY ...
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
