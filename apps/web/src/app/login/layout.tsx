import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your LXUY account.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
