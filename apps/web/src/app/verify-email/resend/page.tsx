"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("submitting");
    setMessage("");

    try {
      const res = await api.post<{ message: string }>("/api/v1/auth/resend-verification", {
        email: email.trim().toLowerCase(),
      });
      setStatus("success");
      setMessage(res.message);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string | string[] }; message?: string };
      const raw = apiErr?.data?.message || apiErr?.message || "Something went wrong. Please try again.";
      setStatus("error");
      setMessage(Array.isArray(raw) ? raw[0] : raw);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-12 text-center">
          <Link href="/" className="inline-block">
            <p className="text-2xl tracking-[0.4em] text-luxury-dark font-serif uppercase">LXUY</p>
            <p className="text-[9px] tracking-[0.3em] text-neutral-400 uppercase mt-0.5">Maison</p>
          </Link>
        </div>

        <div className="bg-white border border-neutral-100 p-10 shadow-sm">
          {status === "success" ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-serif text-luxury-dark mb-3">Check your inbox</h1>
              <p className="text-sm text-neutral-500 font-light leading-relaxed mb-8">{message}</p>
              <Link
                href="/login"
                className="text-xs uppercase tracking-[0.25em] text-neutral-500 hover:text-luxury-dark transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-serif text-luxury-dark mb-2">Resend verification</h1>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Enter your email address and we will send you a new verification link.
                </p>
              </div>

              {status === "error" && message && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs tracking-wider uppercase font-medium border-l border-red-500">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <label
                    htmlFor="resend-email"
                    className="block text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="resend-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder-neutral-300 focus:outline-none focus:border-luxury-gold transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting" || !email.trim()}
                  className="w-full bg-luxury-dark text-white text-xs uppercase tracking-[0.25em] py-3.5 font-medium hover:bg-luxury-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Sending…" : "Send Verification Email"}
                </button>

                <p className="text-center text-xs text-neutral-400 tracking-wide">
                  <Link href="/login" className="hover:text-luxury-dark transition-colors">
                    Back to Sign In
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
