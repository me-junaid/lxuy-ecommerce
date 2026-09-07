import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your LXUY account.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
