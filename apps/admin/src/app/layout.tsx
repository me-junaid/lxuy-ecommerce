import React from "react";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Store Management System — LXUY",
  description: "Administrative catalog panel for inventory tracking and product management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#FDFBF7] text-[#111111]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
