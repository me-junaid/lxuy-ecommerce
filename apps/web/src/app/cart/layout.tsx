import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description: "Your LXUY shopping bag.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
