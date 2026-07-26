"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";

type Status = "loading" | "success" | "already_verified" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in this link. Please check your email.");
      return;
    }

    api
      .get<{ message: string }>("/api/v1/auth/verify-email?token=" + encodeURIComponent(token))
      .then((res) => {
        if (res.message.toLowerCase().includes("already")) {
          setStatus("already_verified");
        } else {
          setStatus("success");
        }
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus("error");
        const apiErr = err as { data?: { message?: string }; message?: string };
        setMessage(
          apiErr?.data?.message ||
            apiErr?.message ||
            "This verification link is invalid or has expired."
        );
      });
  }, [searchParams]);

  const iconMap: Record<Status, React.ReactNode> = {
    loading: (
      <div className="w-16 h-16 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto" />
    ),
    success: (
      <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    already_verified: (
      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
  };

  const titleMap: Record<Status, string> = {
    loading: "Verifying your email…",
    success: "Email verified",
    already_verified: "Already verified",
    error: "Verification failed",
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-12">
          <Link href="/" className="inline-block">
            <p className="text-2xl tracking-[0.4em] text-luxury-dark font-serif uppercase">LXUY</p>
            <p className="text-[9px] tracking-[0.3em] text-neutral-400 uppercase mt-0.5">Maison</p>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-neutral-100 p-10 shadow-sm">
          <div className="mb-6">{iconMap[status]}</div>

          <h1 className="text-2xl font-serif text-luxury-dark mb-3">{titleMap[status]}</h1>

          {status !== "loading" && (
            <p className="text-sm text-neutral-500 font-light leading-relaxed mb-8">{message}</p>
          )}
          {status === "loading" && (
            <p className="text-sm text-neutral-400 font-light tracking-wide mt-4">
              Please wait while we verify your email address…
            </p>
          )}

          {status === "success" && (
            <Link
              href="/login"
              className="inline-block text-xs uppercase tracking-[0.25em] font-medium bg-luxury-dark text-white px-8 py-3.5 hover:bg-luxury-gold transition-colors"
            >
              Sign In
            </Link>
          )}
          {status === "already_verified" && (
            <Link
              href="/login"
              className="inline-block text-xs uppercase tracking-[0.25em] font-medium bg-luxury-dark text-white px-8 py-3.5 hover:bg-luxury-gold transition-colors"
            >
              Sign In
            </Link>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center space-y-3">
              <Link
                href="/verify-email/resend"
                className="inline-block text-xs uppercase tracking-[0.25em] font-medium bg-luxury-dark text-white px-8 py-3.5 hover:bg-luxury-gold transition-colors"
              >
                Resend Verification Email
              </Link>
              <Link
                href="/"
                className="text-xs text-neutral-400 hover:text-luxury-dark transition-colors tracking-wide"
              >
                Return home
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
