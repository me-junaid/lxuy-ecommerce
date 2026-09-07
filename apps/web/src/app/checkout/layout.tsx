import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your LXUY order securely.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
