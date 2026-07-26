"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Input, Button, Header, Footer } from "@repo/ui";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const { register, login, user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only redirect once session restore has resolved.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/profile");
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Mandatory Fields Check
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    // 2. Name Character Policy Check (No numbers/emojis, letters only)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    if (!nameRegex.test(firstName.trim())) {
      setError("First name can only contain letters, spaces, hyphens, and apostrophes.");
      return;
    }
    if (!nameRegex.test(lastName.trim())) {
      setError("Last name can only contain letters, spaces, hyphens, and apostrophes.");
      return;
    }

    // 3. Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // 4. Password Policy & Complexity Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password.length > 72) {
      setError("Password must be at most 72 characters long.");
      return;
    }
    const passwordRegex = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
    if (!passwordRegex.test(password)) {
      setError("Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character.");
      return;
    }

    // 5. Password Confirmation Check
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // 6. Optional E.164 Phone Format Check
    if (phoneNumber.trim()) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        setError("Please enter a valid phone number in E.164 format (e.g., +1234567890).");
        return;
      }
    }

    // 7. Terms of Service Acceptance Check
    if (!acceptTerms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      // 1. Create the account.
      await register({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });

      // 2. Immediately sign the user in
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      router.replace("/profile");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string | string[] }; message?: string };
      const rawMsg = apiErr?.data?.message || apiErr?.message || "Registration failed. Please try again.";
      const displayMsg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
      setError(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading skeleton while session is being restored.
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
            src="/images/models/modules6.jpeg"
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
                &ldquo;The expression of modern tailoring.&rdquo;
              </h2>
              <p className="text-sm font-light text-neutral-300 tracking-wide">
                Join our universe of curated elegance. Create an account to receive
                tailored recommendations, manage orders, and enjoy faster checkouts.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="flex items-center justify-center p-8 md:p-16 bg-[#FDFBF7]">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-serif tracking-normal mb-2 text-luxury-dark">
                Create Account
              </h1>
              <p className="text-sm text-neutral-500 font-light tracking-wide">
                Join us to experience personal luxury shopping.
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
                <Input
                  label="Last Name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <Input
                label="Phone Number (Optional)"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
                placeholder="+1234567890"
              />

              <div className="flex items-start space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-luxury-gold cursor-pointer"
                  required
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-xs text-neutral-500 font-light tracking-wide leading-relaxed select-none cursor-pointer"
                >
                  I agree to the{" "}
                  <a href="#" className="underline text-neutral-700 hover:text-luxury-gold transition-colors">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline text-neutral-700 hover:text-luxury-gold transition-colors">
                    Privacy Policy
                  </a>.
                </label>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Account…" : "Create Account"}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center text-xs tracking-wider uppercase font-medium text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-luxury-dark hover:text-luxury-gold transition-colors font-bold underline underline-offset-4"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
