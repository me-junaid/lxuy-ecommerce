import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your LXUY account password.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
